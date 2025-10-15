
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Lead } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Contacts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Lead | null>(null);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const CONTACTS_PER_PAGE = 10;
  const { toast } = useToast();

  // Log component mount
  useEffect(() => {
    console.log('[Contacts] Component mounted');
    return () => console.log('[Contacts] Component unmounted');
  }, []);

  const { data: allLeads = [], isLoading, error, isError } = useQuery<Lead[]>({ 
    queryKey: ["/api/leads"],
    retry: 1,
  });

  // Log query state for debugging
  useEffect(() => {
    console.log('[Contacts] Query State:', {
      isLoading,
      isError,
      error: error?.message || error,
      totalLeads: allLeads.length,
      allLeadsData: allLeads,
    });
  }, [isLoading, isError, error, allLeads]);

  // Filter to show only closed leads (contacts)
  const contacts = allLeads.filter(lead => lead.status === "closed");

  // Log filtered contacts for debugging
  useEffect(() => {
    console.log('[Contacts] Filtered Contacts:', {
      totalContacts: contacts.length,
      totalLeads: allLeads.length,
      contacts: contacts,
      leadStatuses: allLeads.map(l => ({ id: l.id, status: l.status })),
    });
  }, [contacts.length, allLeads.length]);

  const deleteContactMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('[Contacts] Deleting contact:', id);
      return await apiRequest(`/api/leads/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: (data) => {
      console.log('[Contacts] Delete success:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setIsDeleteDialogOpen(false);
      setSelectedContact(null);
      toast({
        title: "Success",
        description: "Contact deleted successfully",
      });
    },
    onError: (error: any) => {
      console.error('[Contacts] Delete error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete contact",
        variant: "destructive",
      });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (contactIds: string[]) => {
      console.log('[Contacts] Bulk deleting contacts:', contactIds);
      return await apiRequest("/api/leads/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds: contactIds }),
      });
    },
    onSuccess: (data: any) => {
      console.log('[Contacts] Bulk delete success:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setIsBulkDeleteDialogOpen(false);
      setSelectedContactIds(new Set());
      toast({
        title: "Success",
        description: `${data.deletedCount} contact(s) deleted successfully`,
      });
    },
    onError: (error: any) => {
      console.error('[Contacts] Bulk delete error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete contacts",
        variant: "destructive",
      });
    },
  });

  const filteredContacts = contacts.filter(contact => {
    const query = searchQuery.toLowerCase();
    const senderName = contact.senderName?.toLowerCase() ?? "";
    const senderNumber = contact.senderNumber?.toLowerCase() ?? "";
    const location = contact.location?.toLowerCase() ?? "";
    
    return senderName.includes(query) || senderNumber.includes(query) || location.includes(query);
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredContacts.length / CONTACTS_PER_PAGE);
  const startIndex = (currentPage - 1) * CONTACTS_PER_PAGE;
  const endIndex = startIndex + CONTACTS_PER_PAGE;
  const paginatedContacts = filteredContacts.slice(startIndex, endIndex);

  // Clamp currentPage when filteredContacts changes
  useEffect(() => {
    if (totalPages === 0) {
      setCurrentPage(1);
    } else if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredContacts.length, totalPages, currentPage]);

  // Selection handlers
  const toggleSelectAll = () => {
    const allCurrentPageSelected = paginatedContacts.every(contact => selectedContactIds.has(contact.id));
    if (allCurrentPageSelected) {
      const newSet = new Set(selectedContactIds);
      paginatedContacts.forEach(contact => newSet.delete(contact.id));
      setSelectedContactIds(newSet);
    } else {
      const newSet = new Set(selectedContactIds);
      paginatedContacts.forEach(contact => newSet.add(contact.id));
      setSelectedContactIds(newSet);
    }
  };

  const toggleSelectContact = (contactId: string) => {
    const newSet = new Set(selectedContactIds);
    if (newSet.has(contactId)) {
      newSet.delete(contactId);
    } else {
      newSet.add(contactId);
    }
    setSelectedContactIds(newSet);
  };

  const handleDelete = (contact: Lead) => {
    setSelectedContact(contact);
    setIsDeleteDialogOpen(true);
  };

  const handleBulkDelete = () => {
    if (selectedContactIds.size === 0) return;
    setIsBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = () => {
    bulkDeleteMutation.mutate(Array.from(selectedContactIds));
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

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
            placeholder="Search contacts by name, number, or location..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-contacts"
          />
        </div>
        {selectedContactIds.size > 0 && (
          <Button
            variant="destructive"
            onClick={handleBulkDelete}
            data-testid="button-bulk-delete-contacts"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected ({selectedContactIds.size})
          </Button>
        )}
      </div>

      {isError ? (
        <div className="text-center py-12">
          <div className="text-destructive font-semibold mb-2">Error Loading Contacts</div>
          <div className="text-muted-foreground text-sm">
            {error instanceof Error ? error.message : 'Failed to fetch contacts'}
          </div>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/leads"] })}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      ) : isLoading ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading contacts...</div>
          <div className="text-xs text-muted-foreground mt-2">Fetching leads from server...</div>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={paginatedContacts.length > 0 && paginatedContacts.every(contact => selectedContactIds.has(contact.id))}
                      onCheckedChange={toggleSelectAll}
                      data-testid="checkbox-select-all-contacts"
                    />
                  </TableHead>
                  <TableHead className="w-[120px]">Date</TableHead>
                  <TableHead className="w-[140px]">Sender Name</TableHead>
                  <TableHead className="w-[130px]">Sender Number</TableHead>
                  <TableHead className="w-[130px]">Location</TableHead>
                  <TableHead className="w-[130px]">Property Type</TableHead>
                  <TableHead className="w-[120px]">Price (AED)</TableHead>
                  <TableHead className="w-[200px]">Pinned Notes</TableHead>
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      {contacts.length === 0 ? (
                        <div>
                          <div>No contacts yet. Contacts will appear here when leads are marked as "Closed".</div>
                          <div className="text-xs mt-2 opacity-60">
                            Total leads in system: {allLeads.length} | 
                            Closed leads: {contacts.length} |
                            Check browser console for details
                          </div>
                        </div>
                      ) : (
                        "No contacts found matching your search."
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedContacts.map((contact) => (
                    <TableRow key={contact.id} data-testid={`row-contact-${contact.id}`}>
                      <TableCell>
                        <Checkbox
                          checked={selectedContactIds.has(contact.id)}
                          onCheckedChange={() => toggleSelectContact(contact.id)}
                          data-testid={`checkbox-contact-${contact.id}`}
                        />
                      </TableCell>
                      <TableCell data-testid={`cell-date-${contact.id}`}>
                        <div className="text-muted-foreground">
                          {contact.date ? new Date(contact.date).toLocaleDateString() : "-"}
                        </div>
                      </TableCell>
                      <TableCell data-testid={`cell-senderName-${contact.id}`}>
                        {contact.senderName}
                      </TableCell>
                      <TableCell data-testid={`cell-senderNumber-${contact.id}`}>
                        {contact.senderNumber}
                      </TableCell>
                      <TableCell data-testid={`cell-location-${contact.id}`}>
                        {contact.location || "-"}
                      </TableCell>
                      <TableCell data-testid={`cell-propertyType-${contact.id}`}>
                        {contact.propertyType || "-"}
                      </TableCell>
                      <TableCell data-testid={`cell-price-${contact.id}`}>
                        {contact.price || "-"}
                      </TableCell>
                      <TableCell data-testid={`cell-pinnedNotes-${contact.id}`}>
                        <div className="truncate max-w-[200px]">
                          {contact.pinnedNotes || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(contact)}
                          data-testid={`button-delete-contact-${contact.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination Controls */}
          {filteredContacts.length > 0 && totalPages > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredContacts.length)} of {filteredContacts.length} contacts
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  data-testid="button-previous-page-contacts"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {(() => {
                    const WINDOW_SIZE = 5;
                    let startPage = Math.max(1, currentPage - Math.floor(WINDOW_SIZE / 2));
                    let endPage = Math.min(totalPages, startPage + WINDOW_SIZE - 1);
                    
                    if (endPage - startPage + 1 < WINDOW_SIZE) {
                      startPage = Math.max(1, endPage - WINDOW_SIZE + 1);
                    }
                    
                    const pageNumbers = [];
                    for (let i = startPage; i <= endPage; i++) {
                      pageNumbers.push(i);
                    }
                    
                    return pageNumbers.map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        data-testid={`button-page-${page}-contacts`}
                        className="min-w-[36px]"
                      >
                        {page}
                      </Button>
                    ));
                  })()}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  data-testid="button-next-page-contacts"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedContact?.senderName}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedContact && deleteContactMutation.mutate(selectedContact.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Contacts</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedContactIds.size} contact(s)? This action cannot be undone and will also delete all related deals, tasks, and documents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-bulk-delete-contacts"
            >
              Delete {selectedContactIds.size} Contact(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
