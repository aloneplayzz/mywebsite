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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { ChatroomMember, User } from "@shared/schema";
import { Loader2, UserPlus, Shield, Crown, X, UserMinus } from "lucide-react";

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
  const { data: members, isLoading } = useQuery({
    queryKey: [`/api/chatrooms/${chatroomId}/members`],
    enabled: isOpen,
    select: (data) => data || [], // Ensure we always have an array
  });

  // Fetch users to add
  const { data: users } = useQuery({
    queryKey: ["/api/auth/users"],
    enabled: isOpen,
    select: (data) => data || [], // Ensure we always have an array
  });

  // Check if current user is owner or moderator
  const isOwner = Array.isArray(members) && members.some(member => 
    member.userId === userId && member.role === "owner"
  );
  
  const isModerator = Array.isArray(members) && members.some(member => 
    member.userId === userId && (member.role === "moderator" || member.role === "owner")
  );

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await apiRequest("POST", `/api/chatrooms/${chatroomId}/members`, { 
        userId, 
        role 
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Member added",
        description: "The user has been added to the chatroom",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/chatrooms/${chatroomId}/members`] });
      setNewMemberId("");
      setNewMemberRole("member");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add member",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update member role mutation
  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await apiRequest("PUT", `/api/chatrooms/${chatroomId}/members/${userId}`, { 
        role 
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Role updated",
        description: "The member's role has been updated",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/chatrooms/${chatroomId}/members`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update role",
        description: error.message,
        variant: "destructive",
      });
    },
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
    },
  });

  // Handle add member
  const handleAddMember = () => {
    if (!newMemberId) {
      toast({
        title: "No user selected",
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

  // Handle role change
  const handleRoleChange = (userId: string, newRole: string) => {
    updateMemberRoleMutation.mutate({ userId, role: newRole });
  };

  // Handle remove member
  const handleRemoveMember = (userId: string) => {
    removeMemberMutation.mutate(userId);
  };

  // Get username from userId
  const getUserName = (userId: string) => {
    if (!Array.isArray(users)) return 'Unknown User';
    const user = users.find(u => u.id === userId);
    return user?.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Unknown User';
  };

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
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {Array.isArray(members) && members.map((member: ChatroomMember) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center gap-2">
                      {member.role === "owner" ? (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      ) : member.role === "moderator" ? (
                        <Shield className="h-4 w-4 text-blue-500" />
                      ) : (
                        <UserPlus className="h-4 w-4 text-gray-500" />
                      )}
                      <span className="font-medium">{getUserName(member.userId)}</span>
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
                            size="icon"
                            onClick={() => handleRemoveMember(member.userId)}
                            disabled={member.role === "owner" && !isOwner}
                          >
                            <UserMinus className="h-4 w-4 text-red-500" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                
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
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      {isOwner && <SelectItem value="owner">Owner</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={handleAddMember} 
                  className="w-full"
                  disabled={addMemberMutation.isPending}
                >
                  {addMemberMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-2" />
                  )}
                  Add Member
                </Button>
              </div>
            </TabsContent>
          )}
        </Tabs>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}