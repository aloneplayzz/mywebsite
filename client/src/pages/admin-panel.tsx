import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, RefreshCw, Trash2, UserPlus, Users, Lock as LockIcon } from "lucide-react";

export function AdminPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allPersonas, setAllPersonas] = useState<any[]>([]);
  const [allChatrooms, setAllChatrooms] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("users");
  const [userRole, setUserRole] = useState<string>("user");

  // Check if user is admin and fetch role
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Fetch user's role from the server
    const fetchUserRole = async () => {
      try {
        const response = await apiRequest("GET", "/api/admin/role");
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.role);
          console.log("User role:", data.role);
        } else {
          // If the request fails, the user doesn't have admin access
          toast({
            title: "Access Denied",
            description: "You don't have permission to access the admin panel.",
            variant: "destructive",
          });
          navigate("/");
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        toast({
          title: "Access Denied",
          description: "You don't have permission to access the admin panel.",
          variant: "destructive",
        });
        navigate("/");
      }
    };

    fetchUserRole();
  }, [user, navigate, toast]);

  // Load data
  useEffect(() => {
    if (!user) return;
    
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load users
        const usersRes = await apiRequest("GET", "/api/auth/users");
        const users = await usersRes.json();
        setAllUsers(users);
        
        // Load personas
        const personasRes = await apiRequest("GET", "/api/personas?includeDefault=true");
        const personas = await personasRes.json();
        setAllPersonas(personas);
        
        // Load chatrooms
        const chatroomsRes = await apiRequest("GET", "/api/admin/chatrooms");
        const chatrooms = await chatroomsRes.json();
        setAllChatrooms(chatrooms);
      } catch (error) {
        console.error("Error loading admin data:", error);
        toast({
          title: "Error",
          description: "Failed to load admin data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user, toast]);

  // Handle user deletion
  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }
    
    try {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
      setAllUsers(allUsers.filter(u => u.id !== userId));
      toast({
        title: "Success",
        description: "User deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle persona deletion
  const handleDeletePersona = async (personaId: number) => {
    if (!confirm("Are you sure you want to delete this persona? This action cannot be undone.")) {
      return;
    }
    
    try {
      await apiRequest("DELETE", `/api/admin/personas/${personaId}`);
      setAllPersonas(allPersonas.filter(p => p.id !== personaId));
      toast({
        title: "Success",
        description: "Persona deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting persona:", error);
      toast({
        title: "Error",
        description: "Failed to delete persona. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle chatroom deletion
  const handleDeleteChatroom = async (chatroomId: number) => {
    if (!confirm("Are you sure you want to delete this chatroom? This action cannot be undone.")) {
      return;
    }
    
    try {
      await apiRequest("DELETE", `/api/admin/chatrooms/${chatroomId}`);
      setAllChatrooms(allChatrooms.filter(c => c.id !== chatroomId));
      toast({
        title: "Success",
        description: "Chatroom deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting chatroom:", error);
      toast({
        title: "Error",
        description: "Failed to delete chatroom. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle database reset
  const handleResetDatabase = async () => {
    if (!confirm("Are you sure you want to reset the database? This will delete all user data except admin accounts. This action cannot be undone.")) {
      return;
    }
    
    try {
      await apiRequest("POST", "/api/admin/reset-database");
      toast({
        title: "Success",
        description: "Database reset successfully. Redirecting to login...",
      });
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      console.error("Error resetting database:", error);
      toast({
        title: "Error",
        description: "Failed to reset database. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return <div className="container py-8">Loading...</div>;
  }

  // State for admin management
  const [adminEmails, setAdminEmails] = useState<{[role: string]: string[]}>({});
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("mod");

  // Load admin emails
  useEffect(() => {
    if (userRole === "creator") {
      const fetchAdminEmails = async () => {
        try {
          const response = await apiRequest("GET", "/api/admin/roles");
          const data = await response.json();
          setAdminEmails(data);
        } catch (error) {
          console.error("Error fetching admin emails:", error);
          toast({
            title: "Error",
            description: "Failed to fetch admin emails.",
            variant: "destructive",
          });
        }
      };
      
      fetchAdminEmails();
    }
  }, [userRole, toast]);

  // Handle adding a new admin
  const handleAddAdmin = async () => {
    if (!newAdminEmail) {
      toast({
        title: "Error",
        description: "Email cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    try {
      await apiRequest("POST", "/api/admin/roles", { email: newAdminEmail, role: selectedRole });
      toast({
        title: "Success",
        description: `User ${newAdminEmail} with role ${selectedRole} added successfully.`,
      });
      setNewAdminEmail("");
      // Refresh admin emails
      if (userRole === "creator") {
        const response = await apiRequest("GET", "/api/admin/roles");
        const data = await response.json();
        setAdminEmails(data);
      }
    } catch (error) {
      console.error("Error adding admin:", error);
      toast({
        title: "Error",
        description: "Failed to add admin. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle removing an admin
  const handleRemoveAdmin = async (email: string, role: string) => {
    if (!confirm(`Are you sure you want to remove ${email} as ${role}?`)) {
      return;
    }
    try {
      await apiRequest("DELETE", "/api/admin/roles", { email, role });
      toast({
        title: "Success",
        description: `User with role ${role} removed successfully.`,
      });
      // Refresh admin emails
      if (userRole === "creator") {
        const response = await apiRequest("GET", "/api/admin/roles");
        const data = await response.json();
        setAdminEmails(data);
      }
    } catch (error) {
      console.error("Error removing admin:", error);
      toast({
        title: "Error",
        description: "Failed to remove admin. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Admin Sidebar */}
      <div className="w-64 bg-muted/30 border-r border-border h-full overflow-y-auto p-4">
        <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>
        
        <nav className="space-y-2">
          <button
            onClick={() => setActiveTab("users")}
            className={`w-full flex items-center p-2 rounded-md transition-colors ${
              activeTab === "users" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            <Users className="h-4 w-4 inline-block mr-2" />
            Users
          </button>
          
          <button
            onClick={() => setActiveTab("personas")}
            className={`w-full flex items-center p-2 rounded-md transition-colors ${
              activeTab === "personas" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            <Users className="h-4 w-4 inline-block mr-2" />
            Personas
          </button>
          
          <button
            onClick={() => setActiveTab("chatrooms")}
            className={`w-full flex items-center p-2 rounded-md transition-colors ${
              activeTab === "chatrooms" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            <Users className="h-4 w-4 inline-block mr-2" />
            Chatrooms
          </button>
          
          {userRole === "creator" && (
            <button
              onClick={() => setActiveTab("manageAdmins")}
              className={`w-full flex items-center p-2 rounded-md transition-colors ${
                activeTab === "manageAdmins" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              }`}
            >
              <UserPlus className="h-4 w-4 inline-block mr-2" />
              Manage Admins
            </button>
          )}
          
          <button
            onClick={() => setActiveTab("system")}
            className={`w-full flex items-center p-2 rounded-md transition-colors ${
              activeTab === "system" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            <RefreshCw className="h-4 w-4 inline-block mr-2" />
            System
          </button>
        </nav>

        <div className="mt-auto pt-6">
          <Button variant="outline" className="w-full" onClick={() => navigate("/")}>
            Back to App
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-5xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Removed TabsList as navigation is handled by sidebar buttons */}
            <TabsContent value="manageAdmins">
            <Card>
              <CardHeader>
                <CardTitle>Manage Admins & Moderators</CardTitle>
                <CardDescription>Add or remove admin users and moderators. Only creators can perform this action.</CardDescription>
              </CardHeader>
              <CardContent>
                {userRole === "creator" ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Add New Admin or Moderator</h3>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <Label htmlFor="newAdminEmail">Email</Label>
                          <Input 
                            id="newAdminEmail"
                            type="email" 
                            value={newAdminEmail} 
                            onChange={(e) => setNewAdminEmail(e.target.value)} 
                            placeholder="admin@example.com"
                          />
                        </div>
                        <div className="w-40">
                          <Label htmlFor="adminRole">Role</Label>
                          <Select value={selectedRole} onValueChange={setSelectedRole}>
                            <SelectTrigger id="adminRole">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mod">Moderator</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="creator">Creator</SelectItem> { /* Technically, creators are also admins */}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-end">
                          <Button onClick={handleAddAdmin}><UserPlus className="h-4 w-4 mr-2" /> Add User</Button>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />

                    <div>
                      <h3 className="text-lg font-medium mb-2">Current Admins</h3>
                      {Object.keys(adminEmails).length > 0 ? (
                        <div className="space-y-6">
                          {Object.entries(adminEmails).map(([role, emails]) => (
                            <div key={role} className="space-y-2">
                              <h4 className="text-md font-medium">{role.charAt(0).toUpperCase() + role.slice(1)}s</h4>
                              {emails.length > 0 ? (
                                <div className="border rounded-md divide-y">
                                  {emails.map((email) => (
                                    <div key={email} className="flex justify-between items-center p-3">
                                      <span>{email}</span>
                                      <Button 
                                        variant="destructive" 
                                        size="sm" 
                                        onClick={() => handleRemoveAdmin(email, role)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">No users with the {role} role.</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No admin users found.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 border rounded-lg">
                    <div className="text-center">
                      <LockIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="mt-4 text-lg font-medium">Access Restricted</p>
                      <p className="text-sm text-muted-foreground">Only users with the 'Creator' role can manage admins.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            </TabsContent>
            
            <TabsContent value="users" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>View and manage all users</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : (
                    <div>
                      <div className="rounded-md border">
                        <table className="min-w-full divide-y divide-border">
                          <thead>
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {allUsers.map((user) => (
                              <tr key={user.id}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">{user.id.substring(0, 8)}...</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">{user.name || "N/A"}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">{user.email || "N/A"}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                  {userRole === "creator" ? (
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDeleteUser(user.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled
                                      title="Creator role required"
                                    >
                                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="personas" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Persona Management</CardTitle>
                  <CardDescription>View and manage all personas</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : (
                    <div>
                      <div className="rounded-md border">
                        <table className="min-w-full divide-y divide-border">
                          <thead>
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {allPersonas.map((persona) => (
                              <tr key={persona.id}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">{persona.id}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">{persona.name}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">{persona.isAnime ? "Anime" : "Regular"}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                  {userRole === "creator" || userRole === "admin" ? (
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDeletePersona(persona.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled
                                      title="Admin role or higher required"
                                    >
                                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="chatrooms" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Chatroom Management</CardTitle>
                  <CardDescription>View and manage all chatrooms</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : (
                    <div>
                      <div className="rounded-md border">
                        <table className="min-w-full divide-y divide-border">
                          <thead>
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Persona</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {allChatrooms.map((chatroom) => (
                              <tr key={chatroom.id}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">{chatroom.id}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">{chatroom.name}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">{chatroom.userId.substring(0, 8)}...</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">{chatroom.personaId}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                  {userRole === "creator" || userRole === "admin" ? (
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDeleteChatroom(chatroom.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled
                                      title="Admin role or higher required"
                                    >
                                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="system" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Management</CardTitle>
                  <CardDescription>Perform system-wide operations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium">Database Reset</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        This will delete all user data except admin accounts. This action cannot be undone.
                      </p>
                      {userRole === "creator" ? (
                        <Button 
                          variant="destructive"
                          onClick={handleResetDatabase}
                        >
                          Reset Database
                        </Button>
                      ) : (
                        <Button 
                          variant="outline"
                          disabled
                          title="Creator role required"
                        >
                          Reset Database (Creator Only)
                        </Button>
                      )}
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-lg font-medium">System Information</h3>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <Label>Total Users</Label>
                          <Input readOnly value={allUsers.length} />
                        </div>
                        <div>
                          <Label>Total Personas</Label>
                          <Input readOnly value={allPersonas.length} />
                        </div>
                        <div>
                          <Label>Total Chatrooms</Label>
                          <Input readOnly value={allChatrooms.length} />
                        </div>
                        <div>
                          <Label>Server Time</Label>
                          <Input readOnly value={new Date().toLocaleString()} />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div> {/* Closing div for max-w-5xl mx-auto */}
      </div> {/* Closing div for flex-1 overflow-y-auto p-6 */}
    </div> // Closing div for flex h-screen overflow-hidden
  );
}

export default AdminPanel;
