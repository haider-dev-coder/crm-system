import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Phone, MapPin, DollarSign } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Lead, InsertLead } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type PipelineStage = "new" | "contacted" | "qualified" | "negotiation" | "closed";

const STAGE_LABELS: Record<PipelineStage, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  negotiation: "Negotiation",
  closed: "Closed",
};

const STAGE_COLORS: Record<PipelineStage, string> = {
  new: "bg-blue-50 dark:bg-blue-950",
  contacted: "bg-yellow-50 dark:bg-yellow-950",
  qualified: "bg-green-50 dark:bg-green-950",
  negotiation: "bg-orange-50 dark:bg-orange-950",
  closed: "bg-purple-50 dark:bg-purple-950",
};

function ContactCard({ contact }: { contact: Lead }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: contact.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      data-testid={`card-contact-${contact.id}`}
    >
      <Card className="p-4 mb-3 hover-elevate cursor-grab active:cursor-grabbing">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-base mb-1">{contact.senderName}</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{contact.senderNumber}</span>
            </div>
          </div>
          
          {contact.location && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{contact.location}</span>
            </div>
          )}
          
          {contact.propertyType && (
            <div>
              <Badge variant="secondary" className="text-xs">
                {contact.propertyType}
              </Badge>
            </div>
          )}
          
          {contact.price && (
            <div className="flex items-center gap-1 text-sm font-semibold text-primary">
              <DollarSign className="h-3 w-3" />
              <span>AED {contact.price}</span>
            </div>
          )}
          
          {contact.pinnedNotes && (
            <p className="text-xs text-muted-foreground truncate">{contact.pinnedNotes}</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function DroppableColumn({ stage, contacts }: { stage: PipelineStage; contacts: Lead[] }) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  });

  return (
    <div className="flex flex-col h-full">
      <div className={`p-3 rounded-t-lg ${STAGE_COLORS[stage]}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{STAGE_LABELS[stage]}</h3>
          <Badge variant="secondary">{contacts.length}</Badge>
        </div>
      </div>
      
      <div 
        ref={setNodeRef}
        className={`flex-1 border-x border-b rounded-b-lg transition-colors ${
          isOver ? "bg-accent/50" : ""
        }`}
      >
        <ScrollArea className="h-full">
          <div className="p-3 min-h-[400px]">
            <SortableContext
              items={contacts.map(c => c.id)}
              strategy={verticalListSortingStrategy}
            >
              {contacts.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No contacts yet
                </div>
              ) : (
                contacts.map((contact) => (
                  <ContactCard key={contact.id} contact={contact} />
                ))
              )}
            </SortableContext>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

export default function Contacts() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<InsertLead>>({
    senderName: "",
    senderNumber: "",
    leadType: "",
    propertyType: "",
    purpose: "",
    price: "",
    location: "",
    subLocation: "",
    agentName: "",
    source: "",
    pinnedNotes: "",
    status: "new",
  });
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const { data: allLeads = [], isLoading } = useQuery<Lead[]>({ 
    queryKey: ["/api/leads"] 
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return await apiRequest(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Success",
        description: `Moved to ${STAGE_LABELS[variables.status as PipelineStage]}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update contact",
        variant: "destructive",
      });
    },
  });

  const addContactMutation = useMutation({
    mutationFn: async (data: Partial<InsertLead>) => {
      return await apiRequest("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setIsAddDialogOpen(false);
      setFormData({
        senderName: "",
        senderNumber: "",
        leadType: "",
        propertyType: "",
        purpose: "",
        price: "",
        location: "",
        subLocation: "",
        agentName: "",
        source: "",
        pinnedNotes: "",
        status: "new",
      });
      toast({
        title: "Success",
        description: "Contact added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add contact",
        variant: "destructive",
      });
    },
  });

  const groupedContacts: Record<PipelineStage, Lead[]> = {
    new: allLeads.filter(lead => lead.status === "new"),
    contacted: allLeads.filter(lead => lead.status === "contacted"),
    qualified: allLeads.filter(lead => lead.status === "qualified"),
    negotiation: allLeads.filter(lead => lead.status === "negotiation"),
    closed: allLeads.filter(lead => lead.status === "closed"),
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const activeContact = allLeads.find(lead => lead.id === active.id);
    if (!activeContact) {
      setActiveId(null);
      return;
    }

    // Determine the target stage - could be a column ID or a card ID
    let targetStage: PipelineStage | null = null;
    const validStages: PipelineStage[] = ["new", "contacted", "qualified", "negotiation", "closed"];
    
    // Check if dropped directly on a column
    if (validStages.includes(over.id as PipelineStage)) {
      targetStage = over.id as PipelineStage;
    } else {
      // Dropped on a card - find the card's column by looking up its status
      const overContact = allLeads.find(lead => lead.id === over.id);
      if (overContact) {
        targetStage = overContact.status as PipelineStage;
      }
    }
    
    // Update if the stage has changed
    if (targetStage && activeContact.status !== targetStage) {
      updateLeadMutation.mutate({ id: activeContact.id, status: targetStage });
    }

    setActiveId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.senderName || !formData.senderNumber) {
      toast({
        title: "Error",
        description: "Name and phone number are required",
        variant: "destructive",
      });
      return;
    }

    addContactMutation.mutate(formData);
  };

  const activeContact = activeId ? allLeads.find(lead => lead.id === activeId) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Pipeline</h1>
          <p className="text-muted-foreground">Manage your customer pipeline and contacts</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-contact">
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading contacts...</div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {(Object.keys(groupedContacts) as PipelineStage[]).map((stage) => (
              <div key={stage} data-testid={`column-${stage}`}>
                <DroppableColumn stage={stage} contacts={groupedContacts[stage]} />
              </div>
            ))}
          </div>

          <DragOverlay>
            {activeContact ? <ContactCard contact={activeContact} /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Add Contact Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
            <DialogDescription>
              Add a new contact to your pipeline
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="senderName">Name *</Label>
                  <Input
                    id="senderName"
                    value={formData.senderName || ""}
                    onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                    data-testid="input-contact-name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senderNumber">Phone *</Label>
                  <Input
                    id="senderNumber"
                    value={formData.senderNumber || ""}
                    onChange={(e) => setFormData({ ...formData, senderNumber: e.target.value })}
                    data-testid="input-contact-phone"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="propertyType">Property Type</Label>
                <Input
                  id="propertyType"
                  value={formData.propertyType || ""}
                  onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                  placeholder="e.g., Villa, Apartment"
                  data-testid="input-contact-property"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Budget (AED)</Label>
                  <Input
                    id="price"
                    value={formData.price || ""}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="e.g., 2,500,000"
                    data-testid="input-contact-budget"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location || ""}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Dubai Marina"
                    data-testid="input-contact-location"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agentName">Assigned Agent</Label>
                <Input
                  id="agentName"
                  value={formData.agentName || ""}
                  onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                  data-testid="input-contact-agent"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Stage</Label>
                <Select
                  value={formData.status || "new"}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger data-testid="select-contact-stage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="negotiation">Negotiation</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pinnedNotes">Notes</Label>
                <Textarea
                  id="pinnedNotes"
                  value={formData.pinnedNotes || ""}
                  onChange={(e) => setFormData({ ...formData, pinnedNotes: e.target.value })}
                  placeholder="Add any notes..."
                  rows={3}
                  data-testid="input-contact-notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" data-testid="button-submit-contact">
                Add Contact
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
