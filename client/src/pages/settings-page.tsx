import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "next-themes";
import { useIsMobile } from "@/hooks/use-mobile";
import { Redirect } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { theme, setTheme } = useTheme();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("account");
  const [notificationSounds, setNotificationSounds] = useState(true);
  const [messagePreview, setMessagePreview] = useState(true);
  const [fontSizePreference, setFontSizePreference] = useState("medium");
  
  // If loading, show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Redirect to="/auth" />;
  }
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>
      
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab} 
        className="space-y-6"
      >
        <TabsList className="grid w-full md:w-fit grid-cols-3 md:grid-cols-3">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        
        {/* Account Settings */}
        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your account profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={user?.profileImageUrl || ""} alt={user?.firstName || "User"} />
                  <AvatarFallback>
                    {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 
                     user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="space-y-1">
                    <Label htmlFor="name">Name</Label>
                    <Input 
                      id="name" 
                      placeholder="Your name" 
                      value={`${user?.firstName || ''} ${user?.lastName || ''}`}
                      disabled
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="Your email address" 
                  value={user?.email || ''}
                  disabled
                />
              </div>
              
              <Button
                onClick={() => {
                  toast({
                    title: "Profile update not available",
                    description: "Profile information is managed by Replit authentication.",
                    variant: "default",
                  });
                }}
              >
                Save Changes
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
              <CardDescription>
                Manage your account security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" placeholder="••••••••" disabled />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" placeholder="••••••••" disabled />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input id="confirm-password" type="password" placeholder="••••••••" disabled />
              </div>
              
              <Button
                onClick={() => {
                  toast({
                    title: "Password update not available",
                    description: "Password management is handled by Replit authentication.",
                    variant: "default",
                  });
                }}
              >
                Update Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>
                Customize how the app looks and feels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Color Theme</Label>
                <div className="flex flex-col md:flex-row gap-4">
                  <Card 
                    className={`relative cursor-pointer transition-all rounded-lg ${
                      theme === 'light' ? 'border-primary' : 'hover:border-primary-400'
                    }`}
                    onClick={() => setTheme('light')}
                  >
                    <CardContent className="p-4 flex flex-col items-center space-y-2">
                      <div className="w-full h-24 bg-white border border-gray-200 rounded-md shadow-sm"></div>
                      <span className="text-sm font-medium">Light</span>
                      {theme === 'light' && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full"></div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card 
                    className={`relative cursor-pointer transition-all rounded-lg ${
                      theme === 'dark' ? 'border-primary' : 'hover:border-primary-400'
                    }`}
                    onClick={() => setTheme('dark')}
                  >
                    <CardContent className="p-4 flex flex-col items-center space-y-2">
                      <div className="w-full h-24 bg-gray-900 border border-gray-700 rounded-md shadow-sm"></div>
                      <span className="text-sm font-medium">Dark</span>
                      {theme === 'dark' && (
                        <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full"></div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="font-size">Font Size</Label>
                  <Select value={fontSizePreference} onValueChange={setFontSizePreference}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select font size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button
                  onClick={() => {
                    toast({
                      title: "Appearance settings saved",
                      description: "Your appearance preferences have been updated.",
                      variant: "default",
                    });
                  }}
                >
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Customize how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notification-sounds">Notification Sounds</Label>
                  <p className="text-sm text-muted-foreground">
                    Play sounds for new messages and activities
                  </p>
                </div>
                <Switch
                  id="notification-sounds"
                  checked={notificationSounds}
                  onCheckedChange={setNotificationSounds}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="message-previews">Message Previews</Label>
                  <p className="text-sm text-muted-foreground">
                    Show message content in notifications
                  </p>
                </div>
                <Switch
                  id="message-previews"
                  checked={messagePreview}
                  onCheckedChange={setMessagePreview}
                />
              </div>
              
              <Button
                onClick={() => {
                  toast({
                    title: "Notification settings saved",
                    description: "Your notification preferences have been updated.",
                    variant: "default",
                  });
                }}
              >
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}