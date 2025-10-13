import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Upload, Download, Edit, Trash2, Check, X } from "lucide-react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import * as XLSX from "xlsx";

export default function Leads() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<InsertLead>>({
    name: "",
    email: "",
    phone: "",
    propertyInterest: "",
    budget: "",
    status: "new",
    tags: [],
    notes: "",
  });
  const { toast } = useToast();

  const { data: leads = [], isLoading } = useQuery<Lead[]>({ 
    queryKey: ["/api/leads"] 
  });

  const createLeadMutation = useMutation({
    mutationFn: async (data: InsertLead) => {
      return await apiRequest("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Lead created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create lead",
        variant: "destructive",
      });
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertLead> }) => {
      return await apiRequest(`/api/leads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/leads"] });
      
      // Snapshot previous value
      const previousLeads = queryClient.getQueryData<Lead[]>(["/api/leads"]);
      
      // Optimistically update
      queryClient.setQueryData<Lead[]>(["/api/leads"], (old = []) => {
        return old.map(lead => 
          lead.id === id ? { ...lead, ...data } : lead
        );
      });
      
      return { previousLeads };
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Lead updated successfully",
      });
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousLeads) {
        queryClient.setQueryData(["/api/leads"], context.previousLeads);
      }
      setEditingCell(null);
      toast({
        title: "Error",
        description: error.message || "Failed to update lead",
        variant: "destructive",
      });
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/leads/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setIsDeleteDialogOpen(false);
      setSelectedLead(null);
      toast({
        title: "Success",
        description: "Lead deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete lead",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      toast({
        title: "Validation Error",
        description: "Name, email, and phone are required",
        variant: "destructive",
      });
      return;
    }
    createLeadMutation.mutate(formData as InsertLead);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      propertyInterest: "",
      budget: "",
      status: "new",
      tags: [],
      notes: "",
    });
  };

  const handleCellEdit = (lead: Lead, field: keyof Lead) => {
    setEditingCell({ id: lead.id, field });
    setEditValue(String(lead[field] || ""));
  };

  const handleCellSave = async (lead: Lead, field: keyof Lead) => {
    const currentValue = String(lead[field] || "");
    if (editValue.trim() !== currentValue.trim()) {
      await updateLeadMutation.mutateAsync({
        id: lead.id,
        data: { [field]: editValue.trim() },
      });
    }
    setEditingCell(null);
    setEditValue("");
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const handleStatusChange = (lead: Lead, newStatus: string) => {
    updateLeadMutation.mutate({
      id: lead.id,
      data: { status: newStatus },
    });
  };

  const handleDelete = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDeleteDialogOpen(true);
  };

  const handleExport = () => {
    const exportData = leads.map(lead => ({
      Name: lead.name,
      Email: lead.email,
      Phone: lead.phone,
      "Property Interest": lead.propertyInterest || "",
      Budget: lead.budget || "",
      Status: lead.status,
      Notes: lead.notes || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
    XLSX.writeFile(workbook, `leads_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: "Success",
      description: "Leads exported to Excel",
    });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        // Create leads from imported data
        jsonData.forEach((row) => {
          const leadData: Partial<InsertLead> = {
            name: row.Name || row.name || "",
            email: row.Email || row.email || "",
            phone: row.Phone || row.phone || "",
            propertyInterest: row["Property Interest"] || row.propertyInterest || "",
            budget: row.Budget || row.budget || "",
            status: (row.Status || row.status || "new").toLowerCase(),
            notes: row.Notes || row.notes || "",
            tags: [],
          };

          if (leadData.name && leadData.email && leadData.phone) {
            createLeadMutation.mutate(leadData as InsertLead);
          }
        });

        toast({
          title: "Success",
          description: `Imported ${jsonData.length} leads from Excel`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to import Excel file",
          variant: "destructive",
        });
      }
    };
    reader.readAsBinaryString(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const filteredLeads = leads.filter(lead => {
    const query = searchQuery.toLowerCase();
    const name = lead.name?.toLowerCase() ?? "";
    const email = lead.email?.toLowerCase() ?? "";
    const phone = lead.phone?.toLowerCase() ?? "";
    return name.includes(query) || email.includes(query) || phone.includes(query);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Leads & Contacts</h1>
          <p className="text-muted-foreground">Manage your sales pipeline</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            data-testid="button-import-leads"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImport}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={leads.length === 0}
            data-testid="button-export-leads"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button data-testid="button-add-lead" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads by name, email, or phone..."
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
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Name</TableHead>
                  <TableHead className="w-[200px]">Email</TableHead>
                  <TableHead className="w-[130px]">Phone</TableHead>
                  <TableHead className="w-[150px]">Property Type</TableHead>
                  <TableHead className="w-[130px]">Budget (AED)</TableHead>
                  <TableHead className="w-[130px]">Stage</TableHead>
                  <TableHead className="w-[200px]">Notes</TableHead>
                  <TableHead className="w-[100px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      No leads found. Add your first lead or import from Excel.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead) => (
                    <TableRow key={lead.id} data-testid={`row-lead-${lead.id}`}>
                      {/* Name */}
                      <TableCell>
                        {editingCell?.id === lead.id && editingCell?.field === "name" ? (
                          <div className="flex items-center gap-1">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => handleCellSave(lead, "name")}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleCellSave(lead, "name");
                                if (e.key === "Escape") handleCellCancel();
                              }}
                              className="h-8"
                              autoFocus
                              data-testid={`input-edit-name-${lead.id}`}
                            />
                          </div>
                        ) : (
                          <div
                            onClick={() => handleCellEdit(lead, "name")}
                            className="cursor-pointer hover-elevate p-1 rounded min-h-[32px] flex items-center"
                            data-testid={`cell-name-${lead.id}`}
                          >
                            {lead.name}
                          </div>
                        )}
                      </TableCell>

                      {/* Email with tooltip */}
                      <TableCell>
                        {editingCell?.id === lead.id && editingCell?.field === "email" ? (
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleCellSave(lead, "email")}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCellSave(lead, "email");
                              if (e.key === "Escape") handleCellCancel();
                            }}
                            className="h-8"
                            autoFocus
                            data-testid={`input-edit-email-${lead.id}`}
                          />
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                onClick={() => handleCellEdit(lead, "email")}
                                className="cursor-pointer hover-elevate p-1 rounded min-h-[32px] flex items-center truncate"
                                data-testid={`cell-email-${lead.id}`}
                              >
                                {lead.email}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{lead.email}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </TableCell>

                      {/* Phone */}
                      <TableCell>
                        {editingCell?.id === lead.id && editingCell?.field === "phone" ? (
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleCellSave(lead, "phone")}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCellSave(lead, "phone");
                              if (e.key === "Escape") handleCellCancel();
                            }}
                            className="h-8"
                            autoFocus
                            data-testid={`input-edit-phone-${lead.id}`}
                          />
                        ) : (
                          <div
                            onClick={() => handleCellEdit(lead, "phone")}
                            className="cursor-pointer hover-elevate p-1 rounded min-h-[32px] flex items-center"
                            data-testid={`cell-phone-${lead.id}`}
                          >
                            {lead.phone}
                          </div>
                        )}
                      </TableCell>

                      {/* Property Interest */}
                      <TableCell>
                        {editingCell?.id === lead.id && editingCell?.field === "propertyInterest" ? (
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleCellSave(lead, "propertyInterest")}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCellSave(lead, "propertyInterest");
                              if (e.key === "Escape") handleCellCancel();
                            }}
                            className="h-8"
                            autoFocus
                            data-testid={`input-edit-property-${lead.id}`}
                          />
                        ) : (
                          <div
                            onClick={() => handleCellEdit(lead, "propertyInterest")}
                            className="cursor-pointer hover-elevate p-1 rounded min-h-[32px] flex items-center"
                            data-testid={`cell-property-${lead.id}`}
                          >
                            {lead.propertyInterest || "-"}
                          </div>
                        )}
                      </TableCell>

                      {/* Budget */}
                      <TableCell>
                        {editingCell?.id === lead.id && editingCell?.field === "budget" ? (
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleCellSave(lead, "budget")}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCellSave(lead, "budget");
                              if (e.key === "Escape") handleCellCancel();
                            }}
                            className="h-8"
                            autoFocus
                            data-testid={`input-edit-budget-${lead.id}`}
                          />
                        ) : (
                          <div
                            onClick={() => handleCellEdit(lead, "budget")}
                            className="cursor-pointer hover-elevate p-1 rounded min-h-[32px] flex items-center"
                            data-testid={`cell-budget-${lead.id}`}
                          >
                            {lead.budget || "-"}
                          </div>
                        )}
                      </TableCell>

                      {/* Status/Stage */}
                      <TableCell>
                        <Select
                          value={lead.status}
                          onValueChange={(value) => handleStatusChange(lead, value)}
                        >
                          <SelectTrigger className="h-8" data-testid={`select-status-${lead.id}`}>
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
                      </TableCell>

                      {/* Notes */}
                      <TableCell>
                        {editingCell?.id === lead.id && editingCell?.field === "notes" ? (
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleCellSave(lead, "notes")}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCellSave(lead, "notes");
                              if (e.key === "Escape") handleCellCancel();
                            }}
                            className="h-8"
                            autoFocus
                            data-testid={`input-edit-notes-${lead.id}`}
                          />
                        ) : (
                          <div
                            onClick={() => handleCellEdit(lead, "notes")}
                            className="cursor-pointer hover-elevate p-1 rounded min-h-[32px] flex items-center truncate"
                            data-testid={`cell-notes-${lead.id}`}
                          >
                            {lead.notes || "-"}
                          </div>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(lead)}
                          data-testid={`button-delete-${lead.id}`}
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
        </div>
      )}

      {/* Add Lead Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>
              Create a new lead for your sales pipeline
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  data-testid="input-lead-name"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  data-testid="input-lead-email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  data-testid="input-lead-phone"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+971 50 123 4567"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="propertyInterest">Property Interest</Label>
                <Input
                  id="propertyInterest"
                  data-testid="input-lead-property"
                  value={formData.propertyInterest || ""}
                  onChange={(e) => setFormData({ ...formData, propertyInterest: e.target.value })}
                  placeholder="Luxury Villa, Downtown Condo, etc."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="budget">Budget (AED)</Label>
                <Input
                  id="budget"
                  data-testid="input-lead-budget"
                  value={formData.budget || ""}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="500,000 - 750,000"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status || "new"}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger data-testid="select-lead-status">
                    <SelectValue placeholder="Select status" />
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
              <div className="grid gap-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  data-testid="input-lead-tags"
                  value={formData.tags?.join(", ") || ""}
                  onChange={(e) => {
                    const tagsArray = e.target.value
                      .split(",")
                      .map(tag => tag.trim())
                      .filter(tag => tag.length > 0);
                    setFormData({ ...formData, tags: tagsArray });
                  }}
                  placeholder="Hot Lead, Urgent, VIP (comma-separated)"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  data-testid="input-lead-notes"
                  value={formData.notes || ""}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional information about the lead..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  resetForm();
                }}
                data-testid="button-cancel-lead"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createLeadMutation.isPending}
                data-testid="button-submit-lead"
              >
                {createLeadMutation.isPending ? "Creating..." : "Create Lead"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedLead?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedLead && deleteLeadMutation.mutate(selectedLead.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
