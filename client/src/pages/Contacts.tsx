import type { Lead, InsertLead, PipelineStage } from "@shared/schema";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Phone, MapPin, DollarSign } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
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



  // Update your labels to display nicely
  const STAGE_LABELS: Record<PipelineStage, string> = {
    Lead: "Lead",
    "No Answer": "No Answer",
    Prospect: "Prospect",
    "Other Options": "Other Options",
    Visiting: "Visiting",
    Followup: "Followup",
    Negotiation: "Negotiation",
    Won: "Won",
    Lost: "Lost",
  };

  const STAGE_COLORS: Record<PipelineStage, string> = {
    Lead: "bg-blue-50 dark:bg-blue-950",
    "No Answer": "bg-gray-50 dark:bg-gray-900",
    Prospect: "bg-teal-50 dark:bg-teal-950",
    "Other Options": "bg-purple-50 dark:bg-purple-950",
    Visiting: "bg-indigo-50 dark:bg-indigo-950",
    Followup: "bg-pink-50 dark:bg-pink-950",
    Negotiation: "bg-orange-50 dark:bg-orange-950",
    Won: "bg-green-50 dark:bg-green-950",
    Lost: "bg-red-50 dark:bg-red-950",
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
      
      {/* CRITICAL: The ref must be on the scrollable content area, not the outer border */}
      <ScrollArea className="flex-1 border-x border-b rounded-b-lg">
        <div 
          ref={setNodeRef}
          className={`p-3 min-h-[400px] transition-colors ${
            isOver ? "bg-accent/50" : ""
          }`}
        >
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
  const { data: currentUser } = useQuery<any>({
    queryKey: ["/api/auth/me"]
  });
  useEffect(() => {
    if (allLeads.length > 0) {
      const uniqueStatuses = Array.from(new Set(allLeads.map(lead => lead.status)));
      console.log("🔍 Database status values:", uniqueStatuses);
      
      // Show which leads have which status
      uniqueStatuses.forEach(status => {
        const count = allLeads.filter(l => l.status === status).length;
        console.log(`   "${status}": ${count} leads`);
      });
    }
  }, [allLeads]);





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

// Filter leads based on user role
const userFilteredLeads = currentUser?.role === "admin" || currentUser?.role === "ADMIN"
  ? allLeads // Admins see all leads
  : allLeads.filter(lead => {
      const currentUserFullName = `${currentUser?.firstName} ${currentUser?.lastName}`.trim();
      return lead.agentName === currentUserFullName;
    });

// Update groupedContacts to use filtered leads
const groupedContacts: Record<PipelineStage, Lead[]> = {
  Lead: userFilteredLeads.filter(l => l.status === "Lead"),
  "No Answer": userFilteredLeads.filter(l => l.status === "No Answer"),
  Prospect: userFilteredLeads.filter(l => l.status === "Prospect"),
  "Other Options": userFilteredLeads.filter(l => l.status === "Other Options"),
  Visiting: userFilteredLeads.filter(l => l.status === "Visiting"),
  Followup: userFilteredLeads.filter(l => l.status === "Followup"),
  Negotiation: userFilteredLeads.filter(l => l.status === "Negotiation"),
  Won: userFilteredLeads.filter(l => l.status === "Won"),
  Lost: userFilteredLeads.filter(l => l.status === "Lost"),
};

  

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    console.log("🎯 DRAG END - Active ID:", active.id);
    console.log("🎯 DRAG END - Over ID:", over?.id);
    
    if (!over) {
      console.log("❌ No drop target");
      setActiveId(null);
      return;
    }
  
    const activeContact = allLeads.find(lead => lead.id === active.id);
    console.log("🎯 Active Contact:", activeContact?.senderName, "Status:", activeContact?.status);
    
    if (!activeContact) {
      console.log("❌ Active contact not found");
      setActiveId(null);
      return;
    }
  
    // Determine the target stage - could be a column ID or a card ID
    let targetStage: PipelineStage | null = null;
    
    // Define valid stages as an array of strings (not typed as PipelineStage[])
    const validStages = [
      "Lead",
      "No Answer",
      "Prospect",
      "Other Options",
      "Visiting",
      "Followup",
      "Negotiation",
      "Won",
      "Lost",
    ];
    
    // Convert over.id to string for comparison
    const overId = String(over.id);
    console.log("🎯 Over ID (converted):", overId);
    console.log("🎯 Is valid stage?", validStages.includes(overId));
    
    // Check if dropped directly on a column
    if (validStages.includes(overId)) {
      targetStage = overId as PipelineStage;
      console.log("✅ Dropped on column:", targetStage);
    } else {
      // Dropped on a card - find the card's column by looking up its status
      const overContact = allLeads.find(lead => lead.id === over.id);
      console.log("🎯 Over Contact:", overContact?.senderName, "Status:", overContact?.status);
      if (overContact) {
        targetStage = overContact.status as PipelineStage;
        console.log("✅ Dropped on card, target stage:", targetStage);
      }
    }
    
    console.log("🎯 Final target stage:", targetStage);
    console.log("🎯 Current status:", activeContact.status);
    console.log("🎯 Will update?", targetStage && activeContact.status !== targetStage);
    
    // Update if the stage has changed
    if (targetStage && activeContact.status !== targetStage) {
      console.log("🚀 UPDATING LEAD - ID:", activeContact.id, "New Status:", targetStage);
      updateLeadMutation.mutate({ id: activeContact.id, status: targetStage });
    } else {
      console.log("⏭️ No update needed");
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
         <div className="flex space-x-4 overflow-x-auto py-2">
  {(Object.keys(groupedContacts) as PipelineStage[]).map((stage) => (
    <div key={stage} className="flex-shrink-0 w-[300px]">
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
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
            <DialogDescription>
              Add a new contact to your pipeline
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto pr-2">
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
  <Label htmlFor="customerType">Customer Type</Label>
  <Select
    value={formData.customerType || ""}
    onValueChange={(value) => setFormData({ ...formData, customerType: value })}
  >
    <SelectTrigger>
      <SelectValue placeholder="Select type" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="owner">Owner</SelectItem>
      <SelectItem value="buyer">Buyer</SelectItem>
      <SelectItem value="tenant">Tenant</SelectItem>
      <SelectItem value="investor">Investor</SelectItem>
    </SelectContent>
  </Select>
</div>

              {/* ----Changes--- */}
              <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
           id="email"
           value={formData.email || ""}
           onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      placeholder="Enter email"
    />
  </div>
  <div className="space-y-2">
    <Label htmlFor="phone2">Phone Number 2</Label>
    <Input
      id="phone2"
      value={formData.phone2 || ""}
      onChange={(e) => {
        const val = e.target.value;
        setFormData({
          ...formData,
          phone2: val,
          whatsapp: val, // Auto-fill WhatsApp from Phone 2
        });
      }}
      placeholder="Enter alternate number"
    />
  </div>
</div>

<div className="space-y-2">
  <Label htmlFor="whatsapp">WhatsApp</Label>
  <Input
    id="whatsapp"
    value={formData.whatsapp || ""}
    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
    placeholder="WhatsApp number"
  />
</div>

<div className="grid grid-cols-2 gap-4">
  <div className="space-y-2">
    <Label htmlFor="idCardNumber">ID Card Number</Label>
    <Input
      id="idCardNumber"
      value={formData.idCardNumber || ""}
      onChange={(e) => setFormData({ ...formData, idCardNumber: e.target.value })}
      placeholder="Enter ID card number"
    />
  </div>
  <div className="space-y-2">
    <Label htmlFor="passportNumber">Passport Number</Label>
    <Input
      id="passportNumber"
      value={formData.passportNumber || ""}
      onChange={(e) => setFormData({ ...formData, passportNumber: e.target.value })}
      placeholder="Enter passport number"
    />
  </div>
</div>

<div className="grid grid-cols-2 gap-4">
  <div className="space-y-2">
    <Label htmlFor="emiratesId">Emirates ID</Label>
    <Input
      id="emiratesId"
      value={formData.emiratesId || ""}
      onChange={(e) => setFormData({ ...formData, emiratesId: e.target.value })}
      placeholder="Enter Emirates ID"
    />
  </div>

  <div className="space-y-2">
    <Label htmlFor="visaStatus">Visa Status</Label>
    <Select
      value={formData.visaStatus || ""}
      onValueChange={(value) => setFormData({ ...formData, visaStatus: value })}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select visa status" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="resident">Resident</SelectItem>
        <SelectItem value="visit">Visit Visa</SelectItem>
        <SelectItem value="work">Work Visa</SelectItem>
        <SelectItem value="other">Other</SelectItem>
      </SelectContent>
    </Select>
  </div>
</div>

<div className="space-y-2">
  <Label htmlFor="preferredLanguage">Preferred Language</Label>
  <Select
    value={formData.preferredLanguage || ""}
    onValueChange={(value) => setFormData({ ...formData, preferredLanguage: value })}
  >
    <SelectTrigger>
      <SelectValue placeholder="Select language" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="english">English</SelectItem>
      <SelectItem value="arabic">Arabic</SelectItem>
      <SelectItem value="urdu">Urdu</SelectItem>
      <SelectItem value="hindi">Hindi</SelectItem>
    </SelectContent>
  </Select>
</div>
          
              {/* ----Changes--- */}

              
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
    value={formData.status || "Lead"}
    onValueChange={(value) => setFormData({ ...formData, status: value })}
  >
    <SelectTrigger data-testid="select-contact-stage">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="Lead">Lead</SelectItem>
      <SelectItem value="No Answer">No Answer</SelectItem>
      <SelectItem value="Prospect">Prospect</SelectItem>
      <SelectItem value="Other Options">Other Options</SelectItem>
      <SelectItem value="Visiting">Visiting</SelectItem>
      <SelectItem value="Followup">Followup</SelectItem>
      <SelectItem value="Negotiation">Negotiation</SelectItem>
      <SelectItem value="Won">Won</SelectItem>
      <SelectItem value="Lost">Lost</SelectItem>
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
