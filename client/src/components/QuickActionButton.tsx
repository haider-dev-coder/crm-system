import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Users, Home, FileText, Handshake } from "lucide-react";

export function QuickActionButton() {
  const [open, setOpen] = useState(false);

  const actions = [
    { icon: Users, label: "New Lead", action: () => console.log("New Lead") },
    { icon: Home, label: "New Property", action: () => console.log("New Property") },
    { icon: Handshake, label: "New Deal", action: () => console.log("New Deal") },
    { icon: FileText, label: "New Task", action: () => console.log("New Task") },
  ];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg" size="icon" data-testid="button-quick-action">
          <Plus className="h-6 w-6" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {actions.map((action) => (
          <DropdownMenuItem
            key={action.label}
            onClick={() => {
              action.action();
              setOpen(false);
            }}
            data-testid={`menu-item-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <action.icon className="mr-2 h-4 w-4" />
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
