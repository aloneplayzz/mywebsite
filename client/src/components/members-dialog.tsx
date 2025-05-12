import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { ChatroomMember, User } from "@shared/schema";
import { 
  Loader2, 
  UserPlus, 
  Shield, 
  Crown, 
  X, 
  UserMinus, 
  Clock, 
  CalendarDays, 
  Activity,
  CircleUser
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface MembersDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  chatroomId: number;
}

export function MembersDialog({ isOpen, onOpenChange, chatroomId }: MembersDialogProps) {
  const [newMemberId, setNewMemberId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("member");
  const { toast } = useToast();
  const { user } = useAuth();
  const userId = user?.id;
  
  // Fetch chatroom members
  const { data: members, isLoading: isMembersLoading } = useQuery({
    queryKey: [`/api/chatrooms/${chatroomId}/members`],
    enabled: isOpen
  });
  
  // Fetch all users for the dropdown
  const { data: users, isLoading: isUsersLoading } = useQuery({
    queryKey: ["/api/auth/users"],
    enabled: isOpen
  });
  
  // Check user permissions
  const { data: userMember } = useQuery<ChatroomMember | undefined>({
    queryKey: [`/api/chatrooms/${chatroomId}/members/${userId}`],
    enabled: !!userId && isOpen
  });
  
  const isOwner = userMember && userMember.role === "owner";
  const isModerator = isOwner || (userMember && userMember.role === "moderator");
  
  // Add a member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (data: { userId: string; role: string }) => {
      const res = await apiRequest("POST", `/api/chatrooms/${chatroomId}/members`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Member added",
        description: "The member has been added to the chatroom",
      });
      setNewMemberId("");
      queryClient.invalidateQueries({ queryKey: [`/api/chatrooms/${chatroomId}/members`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add member",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update member role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await apiRequest("PATCH", `/api/chatrooms/${chatroomId}/members/${userId}`, { role });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Role updated",
        description: "The member role has been updated",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/chatrooms/${chatroomId}/members`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update role",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/chatrooms/${chatroomId}/members/${userId}`);
    },
    onSuccess: () => {
      toast({
        title: "Member removed",
        description: "The member has been removed from the chatroom",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/chatrooms/${chatroomId}/members`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove member",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const handleAddMember = () => {
    if (!newMemberId) {
      toast({
        title: "Select a user",
        description: "Please select a user to add",
        variant: "destructive",
      });
      return;
    }
    
    addMemberMutation.mutate({
      userId: newMemberId,
      role: newMemberRole
    });
  };
  
  const handleRoleChange = (userId: string, role: string) => {
    updateRoleMutation.mutate({ userId, role });
  };
  
  const handleRemoveMember = (userId: string) => {
    removeMemberMutation.mutate(userId);
  };
  
  // Get username from userId
  const getUserName = (userId: string) => {
    if (!Array.isArray(users)) return 'Unknown User';
    const user = users.find(u => u.id === userId);
    return user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Unknown User';
  };

  const isLoading = isMembersLoading || isUsersLoading;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Chatroom Members</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="members">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="members">Members</TabsTrigger>
            {isModerator && <TabsTrigger value="add">Add Members</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="members" className="space-y-4 mt-4">
            {isLoading ? (
              <div className="flex justify-center p-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto px-1">
                {Array.isArray(members) && members.map((member: ChatroomMember) => {
                  const user = Array.isArray(users) ? users.find(u => u.id === member.userId) : undefined;
                  const initials = user?.firstName ? 
                    `${user.firstName.charAt(0)}${user.lastName ? user.lastName.charAt(0) : ''}` : 
                    member.userId.substring(0, 2).toUpperCase();
                  const joinDate = member.joinedAt ? new Date(member.joinedAt) : new Date();
                  
                  return (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-md bg-card shadow-sm">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border">
                          {user?.profileImageUrl ? (
                            <AvatarImage src={user.profileImageUrl} alt={getUserName(member.userId)} />
                          ) : (
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {initials}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div>
                                    {member.role === "owner" ? (
                                      <Crown className="h-4 w-4 text-yellow-500" />
                                    ) : member.role === "moderator" ? (
                                      <Shield className="h-4 w-4 text-blue-500" />
                                    ) : (
                                      <CircleUser className="h-4 w-4 text-gray-500" />
                                    )}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {member.role === "owner" ? "Owner" : 
                                   member.role === "moderator" ? "Moderator" : "Member"}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <span className="font-medium">{getUserName(member.userId)}</span>
                            {member.userId === userId && (
                              <Badge variant="outline" className="ml-1 text-xs py-0 h-5">You</Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1">
                                    <CalendarDays className="h-3 w-3" />
                                    <span>Joined {formatDistanceToNow(joinDate, { addSuffix: true })}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {joinDate.toLocaleString()}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      </div>
                    
                      <div className="flex items-center gap-2">
                        {isModerator && member.userId !== userId && (
                          <>
                            {isOwner && (
                              <Select
                                value={member.role}
                                onValueChange={(value) => handleRoleChange(member.userId, value)}
                              >
                                <SelectTrigger className="w-[110px]">
                                  <SelectValue placeholder="Role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="member">Member</SelectItem>
                                  <SelectItem value="moderator">Moderator</SelectItem>
                                  <SelectItem value="owner">Owner</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                            
                            {(!isOwner && isModerator) && member.role !== "owner" && (
                              <Select
                                value={member.role}
                                onValueChange={(value) => handleRoleChange(member.userId, value)}
                              >
                                <SelectTrigger className="w-[110px]">
                                  <SelectValue placeholder="Role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="member">Member</SelectItem>
                                  <SelectItem value="moderator">Moderator</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMember(member.userId)}
                            >
                              <UserMinus className="h-4 w-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {Array.isArray(members) && members.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No members found
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          {isModerator && (
            <TabsContent value="add" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="user">Select User</Label>
                  <Select value={newMemberId} onValueChange={setNewMemberId}>
                    <SelectTrigger id="user">
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(users) && Array.isArray(members) && users
                        .filter(u => !members.some(m => m.userId === u.id))
                        .map((user: User) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="role">Role</Label>
                  <Select value={newMemberRole} onValueChange={setNewMemberRole}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      {isOwner && <SelectItem value="owner">Owner</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button 
                  onClick={handleAddMember}
                  disabled={addMemberMutation.isPending || !newMemberId}
                >
                  {addMemberMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>Add Member</>
                  )}
                </Button>
              </DialogFooter>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}