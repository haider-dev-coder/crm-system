import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Upload, Trash2 } from "lucide-react";

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
          <TabsTrigger value="api" data-testid="tab-api">API Config</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-start gap-6 mb-6">
              <Avatar className="h-20 w-20">
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Profile Picture</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" data-testid="button-upload-avatar">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                  <Button variant="outline" size="sm" data-testid="button-remove-avatar">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" defaultValue="John" data-testid="input-first-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" defaultValue="Doe" data-testid="input-last-name" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="john.doe@realestate.com" data-testid="input-email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" defaultValue="+1 234 567 8900" data-testid="input-phone" />
              </div>
              <Button data-testid="button-save-profile">Save Changes</Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Manage team members and permissions</p>
            <Button data-testid="button-add-user">Add User</Button>
          </div>
          <Card className="p-6">
            <div className="space-y-4">
              {[
                { id: "1", name: "John Doe", email: "john@realestate.com", role: "ADMIN" },
                { id: "2", name: "Sarah Miller", email: "sarah@realestate.com", role: "AGENT" },
                { id: "3", name: "Mike Wilson", email: "mike@realestate.com", role: "AGENT" },
              ].map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-md" data-testid={`user-row-${user.id}`}>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                      {user.role}
                    </Badge>
                    <Button variant="ghost" size="sm" data-testid={`button-edit-${user.id}`}>Edit</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">WhatsApp Business API</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="whatsappPhone">Phone Number ID</Label>
                <Input id="whatsappPhone" placeholder="Enter WhatsApp Business phone number ID" data-testid="input-whatsapp-phone" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsappToken">Access Token</Label>
                <Input id="whatsappToken" type="password" placeholder="Enter access token" data-testid="input-whatsapp-token" />
              </div>
              <div className="flex gap-2">
                <Button data-testid="button-test-connection">Test Connection</Button>
                <Button variant="outline" data-testid="button-save-api">Save</Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
