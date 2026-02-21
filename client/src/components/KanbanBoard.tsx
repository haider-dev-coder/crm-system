import { useQuery } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Phone, Mail } from "lucide-react";

import type { Lead, PipelineStage } from "@shared/schema";

// ========= Interface for the main component ==========
interface KanbanBoardProps {
  leads: Lead[];
  onLeadStatusChange: (leadId: string, newStatus: string) => void;
}

// ========= 1. SortableCard (Draggable Item) ==========
// This component represents a single draggable lead card.
function SortableCard({ lead, renderLeadCard }: { lead: Lead; renderLeadCard: (lead: Lead) => JSX.Element }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: lead.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: 'none', // Recommended for better mobile experience
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {renderLeadCard(lead)}
    </div>
  );
}

// ========= 2. KanbanColumn (Droppable Area) - NEW! ==========
// This component represents a single vertical stage/column.
// It is registered as a droppable area. This is the key fix.
interface KanbanColumnProps {
  id: string; // Must be the stage name, e.g., "Prospect"
  title: string;
  leads: Lead[];
  funnelWidth: string;
  renderLeadCard: (lead: Lead) => JSX.Element;
}

function KanbanColumn({ id, title, leads, funnelWidth, renderLeadCard }: KanbanColumnProps) {
  // Make the entire column a droppable area
  const { setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef} // This ref makes the whole div a drop zone
      className={`${funnelWidth} flex-shrink-0 bg-gray-50 dark:bg-gray-900 p-2 rounded`}
    >
      <h3 className="font-semibold flex items-center gap-2 mb-3">
        {title} <Badge variant="secondary">{leads.length}</Badge>
      </h3>

      {/* This context tells dnd-kit which items are sortable inside this column */}
      <SortableContext id={id} items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 min-h-[50px]">
          {leads.length > 0 ? (
            leads.map((lead) => (
              <SortableCard key={lead.id} lead={lead} renderLeadCard={renderLeadCard} />
            ))
          ) : (
            // This placeholder is now correctly placed inside the droppable area,
            // so empty columns will now accept drops.
            <div className="flex items-center justify-center text-sm text-gray-400 p-4">
              Drop here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}


// ========= 3. KanbanBoard (Main Component) - REFACTORED ==========
export function KanbanBoard({ leads, onLeadStatusChange }: KanbanBoardProps) {
  const stages = [
    "Lead",
    "No Answer",
    "Prospect",
    "Other Option",
    "Visiting",
    "Follow Up",
    "Negotiation",
  ];

  const stageToStatus: Record<string, string> = {
    Lead: "new",
    "No Answer": "no_answer",
    Prospect: "prospect",
    "Other Option": "other_option",
    Visiting: "visiting",
    "Follow Up": "follow_up",
    Negotiation: "negotiation",
  };
  
  // A reverse mapping to easily find a stage from a status
  const statusToStage = Object.fromEntries(Object.entries(stageToStatus).map(([key, val]) => [val, key]));

  const funnelWidths: Record<string, string> = {
    Lead: "w-full",
    "No Answer": "w-11/12",
    Prospect: "w-10/12",
    "Other Option": "w-9/12",
    Visiting: "w-8/12",
    "Follow Up": "w-7/12",
    Negotiation: "w-6/12",
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require pointer to move by 8px before initiating a drag
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // ========= CORRECTED handleDragEnd LOGIC ==========
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // A card was dropped, but not over a valid column
    if (!over) {
      return;
    }

    const activeLeadId = active.id as string;
    const overColumnId = over.id as string; // This is the ID of the KanbanColumn (e.g., "Prospect")
    
    const activeLead = leads.find(l => l.id === activeLeadId);
    if (!activeLead) return;

    const originalStage = statusToStage[activeLead.status];

    // If the card is dropped in a different column
    if (originalStage !== overColumnId) {
      const newStatus = stageToStatus[overColumnId] as PipelineStage;
      
      // Call the callback function passed from the parent.
      // The parent component is now responsible for updating state and making the API call.
      onLeadStatusChange(activeLeadId, newStatus);
    }
  };

  // ========= Render Lead Card Function ==========
  const renderLeadCard = (lead: Lead) => {
    const initials =
      lead.senderName
        ?.split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "??";

    return (
      <Card key={lead.id} className="p-4 mb-3 hover-elevate cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{lead.senderName}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {lead.senderNumber && (
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              <span className="truncate">{lead.senderNumber}</span>
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

  // Group leads by stage using the 'leads' prop directly
  const columns = stages.reduce((acc, stage) => {
    const status = stageToStatus[stage];
    acc[stage] = leads.filter((l) => l.status === status);
    return acc;
  }, {} as Record<string, Lead[]>);


// Get current logged-in user
const { data: currentUser } = useQuery<any>({
  queryKey: ["/api/auth/me"]
});




  // ========= Main Render Output ==========
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto p-2">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage}
            id={stage} // The ID for dnd-kit must be the stage name
            title={stage}
            leads={columns[stage]}
            funnelWidth={funnelWidths[stage]}
            renderLeadCard={renderLeadCard}
          />
        ))}
      </div>
    </DndContext>
  );
}