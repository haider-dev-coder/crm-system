import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Upload, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function Settings() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth(); // ← Get current user
  const isAdmin = currentUser?.role?.toUpperCase() === "ADMIN"; // ← Check if admin
  
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "AGENT",
    phone: "",
    avatar: "",
  });

  // Fetch users
  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.get("/users");
      return res.data;
    },
  });

  // Create
  const addUser = useMutation({
    mutationFn: async (newUser: any) => await api.post("/users", newUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast?.success?.("User added");
      setOpen(false);
    },
    onError: (err: any) => {
      console.error("Add user error:", err?.response?.data || err);
      toast?.error?.("Failed to add user");
    },
  });

  // Update
  const updateUser = useMutation({
    mutationFn: async (updated: any) => await api.put(`/users/${updated.id}`, updated),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast?.success?.("User updated");
      setOpen(false);
    },
    onError: (err: any) => {
      console.error("Update user error:", err?.response?.data || err);
      toast?.error?.("Failed to update user");
    },
  });

  // Delete
  const deleteUser = useMutation({
    mutationFn: async (id: string) => await api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast?.success?.("User deleted");
    },
    onError: (err: any) => {
      console.error("Delete user error:", err?.response?.data || err);
      toast?.error?.("Failed to delete user");
    },
  });

  function handleEdit(user: any) {
    setEditingUser(user);
    setForm({
      name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
      email: user.email || "",
      password: "",
      role: (user.role || "AGENT").toUpperCase(),
      phone: user.phone || "",
      avatar: user.avatar || "",
    });
    setOpen(true);
  }

  function handleSave() {
    if (!form.name || !form.email || (!editingUser && !form.password)) {
      toast?.error?.("Name, email, and password are required");
      return;
    }

    // split into firstName / lastName
    const [firstName, ...rest] = form.name.trim().split(/\s+/);
    const lastName = rest.join(" ");

    const payload: any = {
      firstName,
      lastName,
      email: form.email,
      // include password only for new or when provided
      ...(form.password ? { password: form.password } : {}),
      role: (form.role || "AGENT").toUpperCase(),
      phone: form.phone || undefined,
      avatar: form.avatar || undefined,
    };

    if (editingUser) {
      updateUser.mutate({ ...payload, id: editingUser.id });
    } else {
      addUser.mutate(payload);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="api">API Config</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="p-6">
            <div className="flex items-start gap-6 mb-6">
              <Avatar className="h-20 w-20">
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Profile Picture</h3>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" /> Upload
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" /> Remove
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">Manage team members and permissions</p>
            <Button onClick={() => { setEditingUser(null); setForm({ name: "", email: "", password: "", role: "AGENT", phone: "", avatar: "" }); setOpen(true); }}>Add User</Button>
          </div>

          <Card className="p-6">
            {isLoading ? (
              <p>Loading users...</p>
            ) : (
              users?.map((user: any) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-md mb-2">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {(user.first_name?.[0] || "U")}{(user.last_name?.[0] || "")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.first_name} {user.last_name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={user.role?.toLowerCase?.() === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>Edit</Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => deleteUser.mutate(user.id)}
                      disabled={!isAdmin}
                      title={!isAdmin ? "Only admins can delete users" : "Delete user"}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </Card>

          {/* Add/Edit Dialog */}
          <Dialog
            open={open}
            onOpenChange={(isOpen) => {
              setOpen(isOpen);
              if (!isOpen) {
                setForm({ name: "", email: "", password: "", role: "AGENT", phone: "", avatar: "" });
                setEditingUser(null);
              }
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingUser ? "Edit User" : "Add User"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>

                <div>
                  <Label>Email</Label>
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>

                <div>
                  <Label>Phone</Label>
                  <Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>

                <div>
                  <Label>Avatar URL</Label>
                  <Input value={form.avatar || ""} onChange={(e) => setForm({ ...form, avatar: e.target.value })} />
                </div>

                <div>
                  <Label>Password</Label>
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editingUser ? "Leave blank to keep password" : ""} />
                </div>

                <div>
                  <Label>Role</Label>
                  <select value={form.role || "AGENT"} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full border rounded-md p-2">
                    <option value="AGENT">Agent</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSave}>{editingUser ? "Update" : "Save"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* API Tab */}
        <TabsContent value="api">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">WhatsApp Business API</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="whatsappPhone">Phone Number ID</Label>
                <Input id="whatsappPhone" placeholder="Enter WhatsApp Business phone number ID" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsappToken">Access Token</Label>
                <Input id="whatsappToken" type="password" placeholder="Enter access token" />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}