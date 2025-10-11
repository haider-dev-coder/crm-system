import { KanbanBoard } from "@/components/KanbanBoard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Lead } from "@shared/schema";
import { useState } from "react";

export default function Leads() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: leads = [], isLoading } = useQuery<Lead[]>({ 
    queryKey: ["/api/leads"] 
  });

  const filteredLeads = leads.filter(lead => {
    const query = searchQuery.toLowerCase();
    const name = lead.name?.toLowerCase() ?? "";
    const email = lead.email?.toLowerCase() ?? "";
    return name.includes(query) || email.includes(query);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Leads & Contacts</h1>
          <p className="text-muted-foreground">Manage your sales pipeline</p>
        </div>
        <Button data-testid="button-add-lead">
          <Plus className="h-4 w-4 mr-2" />
          Add Lead
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-leads"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading leads...</div>
      ) : (
        <KanbanBoard leads={filteredLeads} />
      )}
    </div>
  );
}
