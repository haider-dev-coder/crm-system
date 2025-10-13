import { useState } from "react";
import { KanbanBoard } from "@/components/KanbanBoard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Lead } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Contacts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");

  const { data: allLeads = [], isLoading } = useQuery<Lead[]>({ 
    queryKey: ["/api/leads"] 
  });

  // Filter to show only closed leads (contacts)
  const contacts = allLeads.filter(lead => lead.status === "closed");

  const filteredContacts = contacts.filter(contact => {
    const query = searchQuery.toLowerCase();
    const name = contact.name?.toLowerCase() ?? "";
    const email = contact.email?.toLowerCase() ?? "";
    const phone = contact.phone?.toLowerCase() ?? "";
    
    const matchesSearch = name.includes(query) || email.includes(query) || phone.includes(query);
    
    // Note: For future enhancement, you could add contact-specific stages here
    // For now, we're showing all closed leads as contacts
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Contacts</h1>
          <p className="text-muted-foreground">Manage your closed leads and contacts</p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts by name, email, or phone..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-contacts"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading contacts...</div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No contacts yet.</p>
          <p className="text-sm text-muted-foreground">
            Contacts will appear here when leads are marked as "Closed"
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContacts.map((contact) => {
              const initials = contact.name?.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
              
              return (
                <div
                  key={contact.id}
                  className="p-6 border rounded-lg hover-elevate cursor-pointer"
                  data-testid={`card-contact-${contact.id}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg mb-1">{contact.name}</h3>
                      {contact.email && (
                        <p className="text-sm text-muted-foreground truncate mb-1">{contact.email}</p>
                      )}
                      {contact.phone && (
                        <p className="text-sm text-muted-foreground mb-2">{contact.phone}</p>
                      )}
                      {contact.propertyInterest && (
                        <p className="text-sm text-muted-foreground mb-2">
                          <span className="font-medium">Interest:</span> {contact.propertyInterest}
                        </p>
                      )}
                      {contact.budget && (
                        <p className="text-sm font-semibold text-primary">
                          Budget: AED {contact.budget}
                        </p>
                      )}
                      {contact.notes && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {contact.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
