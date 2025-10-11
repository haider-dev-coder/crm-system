import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, Mail, MapPin } from "lucide-react";
import { useState } from "react";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  property: string;
  budget: string;
  avatar?: string;
  assignedTo: string;
  tags: string[];
}

interface KanbanBoardProps {
  leads?: Lead[];
}

const defaultLeads: Lead[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.j@email.com",
    phone: "+1 234 567 8901",
    property: "Luxury Villa",
    budget: "$850K",
    assignedTo: "JD",
    tags: ["Hot Lead", "Urgent"],
  },
  {
    id: "2",
    name: "Michael Chen",
    email: "m.chen@email.com",
    phone: "+1 234 567 8902",
    property: "Downtown Condo",
    budget: "$450K",
    assignedTo: "SM",
    tags: ["Interested"],
  },
];

export function KanbanBoard({ leads = defaultLeads }: KanbanBoardProps) {
  const [columns] = useState({
    new: leads.filter((_, i) => i % 3 === 0),
    negotiation: leads.filter((_, i) => i % 3 === 1),
    closed: leads.filter((_, i) => i % 3 === 2),
  });

  const renderLeadCard = (lead: Lead) => (
    <Card key={lead.id} className="p-4 mb-3 hover-elevate cursor-pointer" data-testid={`card-lead-${lead.id}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={lead.avatar} />
            <AvatarFallback className="text-xs">{lead.assignedTo}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{lead.name}</p>
            <p className="text-xs text-muted-foreground">{lead.property}</p>
          </div>
        </div>
        <span className="font-semibold text-sm text-primary">{lead.budget}</span>
      </div>
      <div className="flex flex-wrap gap-1 mb-3">
        {lead.tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Phone className="h-3 w-3" />
          <span className="truncate">{lead.phone}</span>
        </div>
        <div className="flex items-center gap-1">
          <Mail className="h-3 w-3" />
          <span className="truncate">{lead.email}</span>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            New Leads
            <Badge variant="secondary">{columns.new.length}</Badge>
          </h3>
        </div>
        <div className="space-y-3">
          {columns.new.map(renderLeadCard)}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            Negotiation
            <Badge variant="secondary">{columns.negotiation.length}</Badge>
          </h3>
        </div>
        <div className="space-y-3">
          {columns.negotiation.map(renderLeadCard)}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            Closed
            <Badge variant="secondary">{columns.closed.length}</Badge>
          </h3>
        </div>
        <div className="space-y-3">
          {columns.closed.map(renderLeadCard)}
        </div>
      </div>
    </div>
  );
}
