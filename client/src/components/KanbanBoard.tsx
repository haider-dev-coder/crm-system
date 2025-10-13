import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Phone, Mail } from "lucide-react";
import type { Lead } from "@shared/schema";

interface KanbanBoardProps {
  leads: Lead[];
}

export function KanbanBoard({ leads }: KanbanBoardProps) {
  const columns = {
    new: leads.filter(l => l.status === 'new'),
    contacted: leads.filter(l => l.status === 'contacted'),
    qualified: leads.filter(l => l.status === 'qualified'),
    negotiation: leads.filter(l => l.status === 'negotiation'),
    closed: leads.filter(l => l.status === 'closed'),
  };

  const renderLeadCard = (lead: Lead) => {
    const initials = lead.name?.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
    
    return (
      <Card key={lead.id} className="p-4 mb-3 hover-elevate cursor-pointer" data-testid={`card-lead-${lead.id}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{lead.name || 'Unknown'}</p>
              {lead.propertyInterest && (
                <p className="text-xs text-muted-foreground">{lead.propertyInterest}</p>
              )}
            </div>
          </div>
          {lead.budget && (
            <span className="font-semibold text-sm text-primary">AED {lead.budget}</span>
          )}
        </div>
        {lead.tags && lead.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {lead.tags.map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {lead.phone && (
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              <span className="truncate">{lead.phone}</span>
            </div>
          )}
          {lead.email && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 min-w-0">
                  <Mail className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{lead.email}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{lead.email}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            New
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
            Contacted
            <Badge variant="secondary">{columns.contacted.length}</Badge>
          </h3>
        </div>
        <div className="space-y-3">
          {columns.contacted.map(renderLeadCard)}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            Qualified
            <Badge variant="secondary">{columns.qualified.length}</Badge>
          </h3>
        </div>
        <div className="space-y-3">
          {columns.qualified.map(renderLeadCard)}
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
