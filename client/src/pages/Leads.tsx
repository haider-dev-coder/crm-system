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
    if (!formData.senderName || !formData.senderNumber) {
      toast({
        title: "Validation Error",
        description: "Sender name and sender number are required",
        variant: "destructive",
      });
      return;
    }
    createLeadMutation.mutate(formData as InsertLead);
  };

  const resetForm = () => {
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
      Date: lead.date ? new Date(lead.date).toLocaleDateString() : "",
      "Lead Type": lead.leadType || "",
      "Sender Name": lead.senderName,
      "Sender Number": lead.senderNumber,
      "Property Type": lead.propertyType || "",
      Purpose: lead.purpose || "",
      "Price (AED)": lead.price || "",
      Location: lead.location || "",
      "Sub Location": lead.subLocation || "",
      "Agent Name": lead.agentName || "",
      "Bayut/Dubizzle": lead.source || "",
      Status: lead.status,
      "Pinned Notes": lead.pinnedNotes || "",
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
            leadType: row["Lead Type"] || row.leadType || "",
            senderName: row["Sender Name"] || row.senderName || "",
            senderNumber: row["Sender Number"] || row.senderNumber || "",
            propertyType: row["Property Type"] || row.propertyType || "",
            purpose: row.Purpose || row.purpose || "",
            price: row["Price (AED)"] || row.price || "",
            location: row.Location || row.location || "",
            subLocation: row["Sub Location"] || row.subLocation || "",
            agentName: row["Agent Name"] || row.agentName || "",
            source: row["Bayut/Dubizzle"] || row.source || "",
            pinnedNotes: row["Pinned Notes"] || row.pinnedNotes || "",
            status: (row.Status || row.status || "new").toLowerCase(),
          };

          if (leadData.senderName && leadData.senderNumber) {
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
    const senderName = lead.senderName?.toLowerCase() ?? "";
    const senderNumber = lead.senderNumber?.toLowerCase() ?? "";
    const location = lead.location?.toLowerCase() ?? "";
    const agentName = lead.agentName?.toLowerCase() ?? "";
    return senderName.includes(query) || senderNumber.includes(query) || location.includes(query) || agentName.includes(query);
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
            placeholder="Search leads by sender name, number, location, or agent..."
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
                  <TableHead className="w-[120px]">Date</TableHead>
                  <TableHead className="w-[120px]">Lead Type</TableHead>
                  <TableHead className="w-[140px]">Sender Name</TableHead>
                  <TableHead className="w-[130px]">Sender Number</TableHead>
                  <TableHead className="w-[130px]">Property Type</TableHead>
                  <TableHead className="w-[120px]">Purpose</TableHead>
                  <TableHead className="w-[120px]">Price (AED)</TableHead>
                  <TableHead className="w-[130px]">Location</TableHead>
                  <TableHead className="w-[130px]">Sub Location</TableHead>
                  <TableHead className="w-[130px]">Agent Name</TableHead>
                  <TableHead className="w-[150px]">Source/Bayut/Dubizzle</TableHead>
                  <TableHead className="w-[130px]">Status</TableHead>
                  <TableHead className="w-[200px]">Pinned Notes</TableHead>
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center py-12 text-muted-foreground">
                      No leads found. Add your first lead or import from Excel.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead) => (
                    <TableRow key={lead.id} data-testid={`row-lead-${lead.id}`}>
                      {/* Date (read-only) */}
                      <TableCell>
                        <div className="p-1 min-h-[32px] flex items-center text-muted-foreground" data-testid={`cell-date-${lead.id}`}>
                          {lead.date ? new Date(lead.date).toLocaleDateString() : "-"}
                        </div>
                      </TableCell>

                      {/* Lead Type */}
                      <TableCell>
                        {editingCell?.id === lead.id && editingCell?.field === "leadType" ? (
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleCellSave(lead, "leadType")}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCellSave(lead, "leadType");
                              if (e.key === "Escape") handleCellCancel();
                            }}
                            className="h-8"
                            autoFocus
                            data-testid={`input-edit-leadType-${lead.id}`}
                          />
                        ) : (
                          <div
                            onClick={() => handleCellEdit(lead, "leadType")}
                            className="cursor-pointer hover-elevate p-1 rounded min-h-[32px] flex items-center"
                            data-testid={`cell-leadType-${lead.id}`}
                          >
                            {lead.leadType || "-"}
                          </div>
                        )}
                      </TableCell>

                      {/* Sender Name */}
                      <TableCell>
                        {editingCell?.id === lead.id && editingCell?.field === "senderName" ? (
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleCellSave(lead, "senderName")}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCellSave(lead, "senderName");
                              if (e.key === "Escape") handleCellCancel();
                            }}
                            className="h-8"
                            autoFocus
                            data-testid={`input-edit-senderName-${lead.id}`}
                          />
                        ) : (
                          <div
                            onClick={() => handleCellEdit(lead, "senderName")}
                            className="cursor-pointer hover-elevate p-1 rounded min-h-[32px] flex items-center"
                            data-testid={`cell-senderName-${lead.id}`}
                          >
                            {lead.senderName}
                          </div>
                        )}
                      </TableCell>

                      {/* Sender Number */}
                      <TableCell>
                        {editingCell?.id === lead.id && editingCell?.field === "senderNumber" ? (
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleCellSave(lead, "senderNumber")}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCellSave(lead, "senderNumber");
                              if (e.key === "Escape") handleCellCancel();
                            }}
                            className="h-8"
                            autoFocus
                            data-testid={`input-edit-senderNumber-${lead.id}`}
                          />
                        ) : (
                          <div
                            onClick={() => handleCellEdit(lead, "senderNumber")}
                            className="cursor-pointer hover-elevate p-1 rounded min-h-[32px] flex items-center"
                            data-testid={`cell-senderNumber-${lead.id}`}
                          >
                            {lead.senderNumber}
                          </div>
                        )}
                      </TableCell>

                      {/* Property Type */}
                      <TableCell>
                        {editingCell?.id === lead.id && editingCell?.field === "propertyType" ? (
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleCellSave(lead, "propertyType")}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCellSave(lead, "propertyType");
                              if (e.key === "Escape") handleCellCancel();
                            }}
                            className="h-8"
                            autoFocus
                            data-testid={`input-edit-propertyType-${lead.id}`}
                          />
                        ) : (
                          <div
                            onClick={() => handleCellEdit(lead, "propertyType")}
                            className="cursor-pointer hover-elevate p-1 rounded min-h-[32px] flex items-center"
                            data-testid={`cell-propertyType-${lead.id}`}
                          >
                            {lead.propertyType || "-"}
                          </div>
                        )}
                      </TableCell>

                      {/* Purpose */}
                      <TableCell>
                        {editingCell?.id === lead.id && editingCell?.field === "purpose" ? (
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleCellSave(lead, "purpose")}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCellSave(lead, "purpose");
                              if (e.key === "Escape") handleCellCancel();
                            }}
                            className="h-8"
                            autoFocus
                            data-testid={`input-edit-purpose-${lead.id}`}
                          />
                        ) : (
                          <div
                            onClick={() => handleCellEdit(lead, "purpose")}
                            className="cursor-pointer hover-elevate p-1 rounded min-h-[32px] flex items-center"
                            data-testid={`cell-purpose-${lead.id}`}
                          >
                            {lead.purpose || "-"}
                          </div>
                        )}
                      </TableCell>

                      {/* Price (AED) */}
                      <TableCell>
                        {editingCell?.id === lead.id && editingCell?.field === "price" ? (
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleCellSave(lead, "price")}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCellSave(lead, "price");
                              if (e.key === "Escape") handleCellCancel();
                            }}
                            className="h-8"
                            autoFocus
                            data-testid={`input-edit-price-${lead.id}`}
                          />
                        ) : (
                          <div
                            onClick={() => handleCellEdit(lead, "price")}
                            className="cursor-pointer hover-elevate p-1 rounded min-h-[32px] flex items-center"
                            data-testid={`cell-price-${lead.id}`}
                          >
                            {lead.price || "-"}
                          </div>
                        )}
                      </TableCell>

                      {/* Location */}
                      <TableCell>
                        {editingCell?.id === lead.id && editingCell?.field === "location" ? (
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleCellSave(lead, "location")}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCellSave(lead, "location");
                              if (e.key === "Escape") handleCellCancel();
                            }}
                            className="h-8"
                            autoFocus
                            data-testid={`input-edit-location-${lead.id}`}
                          />
                        ) : (
                          <div
                            onClick={() => handleCellEdit(lead, "location")}
                            className="cursor-pointer hover-elevate p-1 rounded min-h-[32px] flex items-center"
                            data-testid={`cell-location-${lead.id}`}
                          >
                            {lead.location || "-"}
                          </div>
                        )}
                      </TableCell>

                      {/* Sub Location */}
                      <TableCell>
                        {editingCell?.id === lead.id && editingCell?.field === "subLocation" ? (
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleCellSave(lead, "subLocation")}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCellSave(lead, "subLocation");
                              if (e.key === "Escape") handleCellCancel();
                            }}
                            className="h-8"
                            autoFocus
                            data-testid={`input-edit-subLocation-${lead.id}`}
                          />
                        ) : (
                          <div
                            onClick={() => handleCellEdit(lead, "subLocation")}
                            className="cursor-pointer hover-elevate p-1 rounded min-h-[32px] flex items-center"
                            data-testid={`cell-subLocation-${lead.id}`}
                          >
                            {lead.subLocation || "-"}
                          </div>
                        )}
                      </TableCell>

                      {/* Agent Name */}
                      <TableCell>
                        {editingCell?.id === lead.id && editingCell?.field === "agentName" ? (
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleCellSave(lead, "agentName")}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCellSave(lead, "agentName");
                              if (e.key === "Escape") handleCellCancel();
                            }}
                            className="h-8"
                            autoFocus
                            data-testid={`input-edit-agentName-${lead.id}`}
                          />
                        ) : (
                          <div
                            onClick={() => handleCellEdit(lead, "agentName")}
                            className="cursor-pointer hover-elevate p-1 rounded min-h-[32px] flex items-center"
                            data-testid={`cell-agentName-${lead.id}`}
                          >
                            {lead.agentName || "-"}
                          </div>
                        )}
                      </TableCell>

                      {/* Source/Bayut/Dubizzle */}
                      <TableCell>
                        {editingCell?.id === lead.id && editingCell?.field === "source" ? (
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleCellSave(lead, "source")}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCellSave(lead, "source");
                              if (e.key === "Escape") handleCellCancel();
                            }}
                            className="h-8"
                            autoFocus
                            data-testid={`input-edit-source-${lead.id}`}
                          />
                        ) : (
                          <div
                            onClick={() => handleCellEdit(lead, "source")}
                            className="cursor-pointer hover-elevate p-1 rounded min-h-[32px] flex items-center"
                            data-testid={`cell-source-${lead.id}`}
                          >
                            {lead.source || "-"}
                          </div>
                        )}
                      </TableCell>

                      {/* Status */}
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

                      {/* Pinned Notes */}
                      <TableCell>
                        {editingCell?.id === lead.id && editingCell?.field === "pinnedNotes" ? (
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleCellSave(lead, "pinnedNotes")}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCellSave(lead, "pinnedNotes");
                              if (e.key === "Escape") handleCellCancel();
                            }}
                            className="h-8"
                            autoFocus
                            data-testid={`input-edit-pinnedNotes-${lead.id}`}
                          />
                        ) : (
                          <div
                            onClick={() => handleCellEdit(lead, "pinnedNotes")}
                            className="cursor-pointer hover-elevate p-1 rounded min-h-[32px] flex items-center truncate"
                            data-testid={`cell-pinnedNotes-${lead.id}`}
                          >
                            {lead.pinnedNotes || "-"}
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
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="senderName">Sender Name *</Label>
                  <Input
                    id="senderName"
                    data-testid="input-lead-senderName"
                    value={formData.senderName || ""}
                    onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="senderNumber">Sender Number *</Label>
                  <Input
                    id="senderNumber"
                    data-testid="input-lead-senderNumber"
                    value={formData.senderNumber || ""}
                    onChange={(e) => setFormData({ ...formData, senderNumber: e.target.value })}
                    placeholder="+971 50 123 4567"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="leadType">Lead Type</Label>
                  <Input
                    id="leadType"
                    data-testid="input-lead-leadType"
                    value={formData.leadType || ""}
                    onChange={(e) => setFormData({ ...formData, leadType: e.target.value })}
                    placeholder="e.g., Buyer, Seller, Tenant"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="propertyType">Property Type</Label>
                  <Input
                    id="propertyType"
                    data-testid="input-lead-propertyType"
                    value={formData.propertyType || ""}
                    onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                    placeholder="Villa, Apartment, etc."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="purpose">Purpose</Label>
                  <Input
                    id="purpose"
                    data-testid="input-lead-purpose"
                    value={formData.purpose || ""}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    placeholder="Buy, Rent, Sell"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="price">Price (AED)</Label>
                  <Input
                    id="price"
                    data-testid="input-lead-price"
                    value={formData.price || ""}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="500,000 - 750,000"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    data-testid="input-lead-location"
                    value={formData.location || ""}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Dubai Marina"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="subLocation">Sub Location</Label>
                  <Input
                    id="subLocation"
                    data-testid="input-lead-subLocation"
                    value={formData.subLocation || ""}
                    onChange={(e) => setFormData({ ...formData, subLocation: e.target.value })}
                    placeholder="Tower A, Building 5"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="agentName">Agent Name</Label>
                  <Input
                    id="agentName"
                    data-testid="input-lead-agentName"
                    value={formData.agentName || ""}
                    onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                    placeholder="Agent's name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="source">Source/Bayut/Dubizzle</Label>
                  <Input
                    id="source"
                    data-testid="input-lead-source"
                    value={formData.source || ""}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    placeholder="Bayut, Dubizzle, Website"
                  />
                </div>
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
                <Label htmlFor="pinnedNotes">Pinned Notes</Label>
                <Textarea
                  id="pinnedNotes"
                  data-testid="input-lead-pinnedNotes"
                  value={formData.pinnedNotes || ""}
                  onChange={(e) => setFormData({ ...formData, pinnedNotes: e.target.value })}
                  placeholder="Important notes about this lead..."
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
              Are you sure you want to delete {selectedLead?.senderName}? This action cannot be undone.
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
