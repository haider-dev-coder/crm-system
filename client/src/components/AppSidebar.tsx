import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Home, Users, UserCheck, Building2, MessageSquare, FileText, Calendar, BarChart3, Settings, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Leads", url: "/leads", icon: Users },
  { title: "Contacts", url: "/contacts", icon: UserCheck },
  { title: "Properties", url: "/properties", icon: Building2 },
  { title: "Messages", url: "/messages", icon: MessageSquare, badge: 3 },
  { title: "Tasks", url: "/tasks", icon: Calendar },
  { title: "Documents", url: "/documents", icon: FileText },
  { title: "Reports", url: "/reports", icon: BarChart3 },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-md">
            <Home className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Real Estate CRM</h2>
            <p className="text-xs text-muted-foreground">Professional Edition</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-${item.title.toLowerCase()}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <Badge className="ml-auto">{item.badge}</Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild data-testid="nav-settings">
                  <Link href="/settings">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div 
          className="flex items-center gap-3 p-3 rounded-md bg-sidebar-accent hover-elevate cursor-pointer" 
          onClick={logout}
          data-testid="button-logout"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground">{user?.role}</p>
          </div>
          <LogOut className="h-4 w-4 text-muted-foreground" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
