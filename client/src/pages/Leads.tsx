import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Upload, Download, Edit, Trash2, Check, X, ChevronLeft, ChevronRight } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import * as XLSX from "xlsx";

export default function Leads() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const LEADS_PER_PAGE = 10;

  // Form data with new fields
  const [formData, setFormData] = useState<Partial<InsertLead>>({
    senderName: "",
    senderNumber: "",
    leadType: "",
    propertyType: "",
    purpose: "",
    minPrice: "",
    maxPrice: "",
    owner: "",
    location: "",
    subLocation: "",
    agentName: "",
    source: "",
    pinnedNotes: "",
    status: "Lead",
  });

  // Location management with Dubai areas
  const [availableSubLocations, setAvailableSubLocations] = useState<string[]>([]);
  const [isAddSubLocationOpen, setIsAddSubLocationOpen] = useState(false);
  const [newSubLocationName, setNewSubLocationName] = useState("");

  // Dubai locations and their sub-locations
  const locationData: Record<string, string[]> = {
    "Jumeirah Village Circle (JVC)": ["Circle 1", "Circle 2", "Circle 3", "Circle 4", "Circle 5"],
    "Jumeirah Lake Towers (JLT)": ["Cluster A", "Cluster B", "Cluster C", "Cluster D", "Cluster E"],
    "Dubai Marina": ["Marina Walk", "Marina Promenade", "Marina Gate", "Marina Heights"],
    "Downtown Dubai": ["Burj Khalifa District", "Business Bay", "DIFC", "Old Town"],
    "Palm Jumeirah": ["Golden Mile", "Frond A", "Frond B", "Frond C", "Trunk"],
    "Dubai Hills Estate": ["Park Heights", "Golf Place", "Maple", "Sidra"],
    "Arabian Ranches": ["Ranches 1", "Ranches 2", "Ranches 3"],
    "Business Bay": ["Executive Towers", "Bay Avenue", "Canal District"],
    "Mirdif": ["Mirdif Hills", "Uptown Mirdif", "Shorooq"],
    "Al Barsha": ["Al Barsha 1", "Al Barsha 2", "Al Barsha 3"],
  };

  const mainLocations = Object.keys(locationData);

  const { toast } = useToast();

  const { data: leads = [], isLoading } = useQuery<Lead[]>({ 
    queryKey: ["/api/leads"],
    select: (data) => {
      // Debug: Log the first lead to check the data structure
      if (data.length > 0) {
        console.log("Sample lead data:", data[0]);
        console.log("minPrice:", data[0].minPrice, "type:", typeof data[0].minPrice);
        console.log("maxPrice:", data[0].maxPrice, "type:", typeof data[0].maxPrice);
      }
      return data;
    }
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"]
  });

  // Get current logged-in user
  const { data: currentUser } = useQuery<any>({
    queryKey: ["/api/auth/me"]
  });

  // Filter users who are agents (from settings)
  const agentUsers = users.filter(user => user.role === "agent" || user.role === "AGENT");

  // Filter leads based on user role
  const filteredLeadsByRole = leads.filter(lead => {
    // If user is admin, show all leads
    if (currentUser?.role === "admin" || currentUser?.role === "ADMIN") {
      return true;
    }
    
    // If user is broker/agent, show only their leads
    if (currentUser?.role === "agent" || currentUser?.role === "AGENT") {
      const currentUserFullName = `${currentUser.firstName} ${currentUser.lastName}`.trim();
      return lead.agentName === currentUserFullName;
    }
    
    // Default: show all (fallback for other roles)
    return true;
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
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/leads"] });
      const previousLeads = queryClient.getQueryData<Lead[]>(["/api/leads"]);
      
      queryClient.setQueryData<Lead[]>(["/api/leads"], (old = []) => {
        return old.map((lead) => {
          if (lead.id !== id) return lead;
          const updatedData = {
            ...data,
            status: data.status ? (data.status as typeof lead.status) : lead.status,
          };
          return { ...lead, ...updatedData };
        });
      });
      
      return { previousLeads };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Success",
        description: "Lead updated successfully",
      });
    },
    onError: (error: any, variables, context) => {
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

  const bulkDeleteMutation = useMutation({
    mutationFn: async (leadIds: string[]) => {
      return await apiRequest("/api/leads/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds }),
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      setIsBulkDeleteDialogOpen(false);
      setSelectedLeadIds(new Set());
      toast({
        title: "Success",
        description: `${data.deletedCount} lead(s) deleted successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete leads",
        variant: "destructive",
      });
    },
  });

  // Handle location change - loads sub-locations
  const handleLocationChange = (location: string) => {
    setFormData({ ...formData, location, subLocation: "" });
    setAvailableSubLocations(locationData[location] || []);
  };

  // Handle adding custom sub-location
  const handleAddCustomSubLocation = () => {
    if (!formData.location) {
      toast({
        title: "Error",
        description: "Please select a main location first",
        variant: "destructive",
      });
      return;
    }
    setIsAddSubLocationOpen(true);
  };

  const handleSaveCustomSubLocation = () => {
    if (!newSubLocationName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a sub-location name",
        variant: "destructive",
      });
      return;
    }

    const updatedSubLocations = [...availableSubLocations, newSubLocationName.trim()];
    setAvailableSubLocations(updatedSubLocations);
    
    // Update the location data for future use
    if (formData.location) {
      locationData[formData.location] = updatedSubLocations;
    }
    
    // Auto-select the newly added sub-location
    setFormData({ ...formData, subLocation: newSubLocationName.trim() });
    
    setNewSubLocationName("");
    setIsAddSubLocationOpen(false);
    
    toast({
      title: "Success",
      description: "Custom sub-location added successfully",
    });
  };

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
    
    // Auto-assign agent name to current user if they're a broker/agent
    let finalFormData = { ...formData };
    if (currentUser?.role === "agent" || currentUser?.role === "AGENT") {
      const currentUserFullName = `${currentUser.firstName} ${currentUser.lastName}`.trim();
      finalFormData.agentName = currentUserFullName;
    }
    
    createLeadMutation.mutate(finalFormData as InsertLead);
  };

  const resetForm = () => {
    setFormData({
      senderName: "",
      senderNumber: "",
      leadType: "",
      propertyType: "",
      purpose: "",
      minPrice: "",
      maxPrice: "",
      owner: "",
      location: "",
      subLocation: "",
      agentName: "",
      source: "",
      pinnedNotes: "",
      status: "Lead",
    });
    setAvailableSubLocations([]);
  };

  const handleCellEdit = (lead: Lead, field: keyof Lead) => {
    setEditingCell({ id: lead.id, field });
    setEditValue(String(lead[field] || ""));
  };

  const handleCellSave = async (lead: Lead, field: keyof Lead) => {
    const currentValue = String(lead[field] || "");
    if (editValue.trim() !== currentValue.trim()) {
      // Convert to proper type for price fields
      let valueToSave: any = editValue.trim();
      if (field === "minPrice" || field === "maxPrice") {
        // Ensure it's a valid number or empty string
        valueToSave = editValue.trim() === "" ? null : editValue.trim();
      }
      
      await updateLeadMutation.mutateAsync({
        id: lead.id,
        data: { [field]: valueToSave },
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
    const exportData = filteredLeadsByRole.map(lead => {
      const assignedUser = users.find(u => u.id === lead.assignedTo);
      const assignedToName = assignedUser ? `${assignedUser.firstName} ${assignedUser.lastName}` : "";
      const dateStr = lead.date ? new Date(lead.date).toISOString().split('T')[0] : "";
      
      return {
        Date: dateStr,
        "Lead Type": lead.leadType || "",
        "Sender Name": lead.senderName,
        "Sender Number": lead.senderNumber,
        "Property Type": lead.propertyType || "",
        Purpose: lead.purpose || "",
        "Min Price (AED)": lead.minPrice || "",
        "Max Price (AED)": lead.maxPrice || "",
        Location: lead.location || "",
        "Sub Location": lead.subLocation || "",
        "Agent Name": lead.agentName || "",
        Source: lead.source || "",
        "Assigned To": assignedToName,
        Status: lead.status,
        "Pinned Notes": lead.pinnedNotes || "",
      };
    });

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

        jsonData.forEach((row) => {
          const toString = (val: any): string => {
            if (val === null || val === undefined) return "";
            return String(val);
          };

          const assignedToName = toString(row["Assigned To"]);
          const matchedUser = assignedToName
            ? users.find(u => 
                `${u.firstName} ${u.lastName}`.toLowerCase() === assignedToName.toLowerCase() ||
                (u.email?.toLowerCase() ?? '') === assignedToName.toLowerCase()
              )
            : null;

          const leadData: Partial<InsertLead> = {
            owner: toString(row.Owner || row.owner),
            leadType: toString(row["Lead Type"] || row.leadType),
            senderName: toString(row["Sender Name"] || row.senderName),
            senderNumber: toString(row["Sender Number"] || row.senderNumber),
            propertyType: toString(row["Property Type"] || row.propertyType),
            purpose: toString(row.Purpose || row.purpose),
            minPrice: toString(row["Min Price (AED)"] || row.minPrice),
            maxPrice: toString(row["Max Price (AED)"] || row.maxPrice),
            location: toString(row.Location || row.location),
            subLocation: toString(row["Sub Location"] || row.subLocation),
            agentName: toString(row["Agent Name"] || row.agentName),
            source: toString(row.Source || row.source),
            assignedTo: matchedUser?.id,
            pinnedNotes: toString(row["Pinned Notes"] || row.pinnedNotes),
            status: toString(row.Status || row.status || "Lead").toLowerCase(),
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
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const filteredLeads = filteredLeadsByRole.filter(lead => {
    const query = searchQuery.toLowerCase();
    return (
      lead.senderName?.toLowerCase().includes(query) ||
      lead.senderNumber?.toLowerCase().includes(query) ||
      lead.location?.toLowerCase().includes(query) ||
      lead.agentName?.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(filteredLeads.length / LEADS_PER_PAGE);
  const startIndex = (currentPage - 1) * LEADS_PER_PAGE;
  const endIndex = startIndex + LEADS_PER_PAGE;
  const paginatedLeads = filteredLeads.slice(startIndex, endIndex);

  useEffect(() => {
    if (totalPages === 0) {
      setCurrentPage(1);
    } else if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredLeads.length, totalPages, currentPage]);

  const toggleSelectAll = () => {
    const allCurrentPageSelected = paginatedLeads.every(lead => selectedLeadIds.has(lead.id));
    if (allCurrentPageSelected) {
      const newSet = new Set(selectedLeadIds);
      paginatedLeads.forEach(lead => newSet.delete(lead.id));
      setSelectedLeadIds(newSet);
    } else {
      const newSet = new Set(selectedLeadIds);
      paginatedLeads.forEach(lead => newSet.add(lead.id));
      setSelectedLeadIds(newSet);
    }
  };

  const toggleSelectLead = (leadId: string) => {
    const newSet = new Set(selectedLeadIds);
    if (newSet.has(leadId)) {
      newSet.delete(leadId);
    } else {
      newSet.add(leadId);
    }
    setSelectedLeadIds(newSet);
  };

  const handleBulkDelete = () => {
    if (selectedLeadIds.size === 0) return;
    setIsBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = () => {
    bulkDeleteMutation.mutate(Array.from(selectedLeadIds));
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Leads</h1>
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
            disabled={filteredLeadsByRole.length === 0}
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
        {selectedLeadIds.size > 0 && (
          <Button
            variant="destructive"
            onClick={handleBulkDelete}
            data-testid="button-bulk-delete"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected ({selectedLeadIds.size})
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading leads...</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={paginatedLeads.length > 0 && paginatedLeads.every(lead => selectedLeadIds.has(lead.id))}
                      onCheckedChange={toggleSelectAll}
                      data-testid="checkbox-select-all"
                    />
                  </TableHead>
                  <TableHead className="w-[120px]">Date</TableHead>
                  <TableHead className="w-[120px]">Lead Type</TableHead>
                  <TableHead className="w-[140px]">Sender Name</TableHead>
                  <TableHead className="w-[130px]">Sender Number</TableHead>
                  <TableHead className="w-[130px]">Property Type</TableHead>
                  <TableHead className="w-[120px]">Purpose</TableHead>
                  <TableHead className="w-[130px]">Owner</TableHead>
                  <TableHead className="w-[120px]">Min Price</TableHead>
                  <TableHead className="w-[120px]">Max Price</TableHead>
                  <TableHead className="w-[130px]">Location</TableHead>
                  <TableHead className="w-[130px]">Sub Location</TableHead>
                  <TableHead className="w-[130px]">Agent Name</TableHead>
                  <TableHead className="w-[150px]">Source</TableHead>
                  <TableHead className="w-[130px]">Status</TableHead>
                  <TableHead className="w-[200px]">Pinned Notes</TableHead>
                  <TableHead className="w-[80px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={16} className="text-center py-12 text-muted-foreground">
                      No leads found. Add your first lead or import from Excel.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLeads.map((lead) => (
                    <TableRow key={lead.id} data-testid={`row-lead-${lead.id}`}>
                      <TableCell>
                        <Checkbox
                          checked={selectedLeadIds.has(lead.id)}
                          onCheckedChange={() => toggleSelectLead(lead.id)}
                          data-testid={`checkbox-lead-${lead.id}`}
                        />
                      </TableCell>
                      
                      <TableCell>
                        <div className="p-1 min-h-[32px] flex items-center text-muted-foreground">
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
                          />
                        ) : (
                          <div
                            onClick={() => handleCellEdit(lead, "leadType")}
                            className="cursor-pointer hover-elevate p-1 rounded min-h-[32px] flex items-center"
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
                          />
                        ) : (
                          <div
                            onClick={() => handleCellEdit(lead, "senderName")}
                            className="cursor-pointer hover-elevate p-1 rounded min-h-[32px] flex items-center"
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
                          />
                        ) : (
                          <div
                            onClick={() => handleCellEdit(lead, "senderNumber")}
                            className="cursor-pointer hover-elevate p-1 rounded min-h-[32px] flex items-center"
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
                          />
                        ) : (
                          <div
                            onClick={() => handleCellEdit(lead, "propertyType")}
                            className="cursor-pointer hover-elevate p-1 rounded min-h-[32px] flex items-center"
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
                          />
                        ) : (
                          <div
                            onClick={() => handleCellEdit(lead, "purpose")}
                            className="cursor-pointer hover-elevate p-1 rounded min-h-[32px] flex items-center"
                          >
                            {lead.purpose || "-"}
                          </div>
                        )}
                      </TableCell>

                      {/* Owner */}
                      <TableCell>
                        {editingCell?.id === lead.id && editingCell?.field === "owner" ? (
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleCellSave(lead, "owner")}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCellSave(lead, "owner");
                              if (e.key === "Escape") handleCellCancel();
                            }}
                            className="h-8"
                            autoFocus
                          />
                        ) : (
                          <div
                            onClick={() => handleCellEdit(lead, "owner")}
                            className="cursor-pointer hover-elevate p-1 rounded min-h-[32px] flex items-center"
                          >
                            {lead.owner || "-"}
                          </div>
                        )}
                      </TableCell>

                      {/* Min Price */}
                      <TableCell>
                        {editingCell?.id === lead.id && editingCell?.field === "minPrice" ? (
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleCellSave(lead, "minPrice")}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCellSave(lead, "minPrice");
                              if (e.key === "Escape") handleCellCancel();
                            }}
                            className="h-8"
                            autoFocus
                            placeholder="Enter price"
                          />
                        ) : (
                          <div
                            onClick={() => handleCellEdit(lead, "minPrice")}
                            className="cursor-pointer hover-elevate p-1 rounded min-h-[32px] flex items-center"
                          >
                            {lead.minPrice ? Number(lead.minPrice).toLocaleString() : "-"}
                          </div>
                        )}
                      </TableCell>

                      {/* Max Price */}
                      <TableCell>
                        {editingCell?.id === lead.id && editingCell?.field === "maxPrice" ? (
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={() => handleCellSave(lead, "maxPrice")}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCellSave(lead, "maxPrice");
                              if (e.key === "Escape") handleCellCancel();
                            }}
                            className="h-8"
                            autoFocus
                            placeholder="Enter price"
                          />
                        ) : (
                          <div
                            onClick={() => handleCellEdit(lead, "maxPrice")}
                            className="cursor-pointer hover-elevate p-1 rounded min-h-[32px] flex items-center"
                          >
                            {lead.maxPrice ? Number(lead.maxPrice).toLocaleString() : "-"}
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
                          />
                        ) : (
                          <div
                            onClick={() => handleCellEdit(lead, "location")}
                            className="cursor-pointer hover-elevate p-1 rounded min-h-[32px] flex items-center"
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
                          />
                        ) : (
                          <div
                            onClick={() => handleCellEdit(lead, "subLocation")}
                            className="cursor-pointer hover-elevate p-1 rounded min-h-[32px] flex items-center"
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
                          />
                        ) : (
                          <div
                            onClick={() => handleCellEdit(lead, "agentName")}
                            className="cursor-pointer hover-elevate p-1 rounded min-h-[32px] flex items-center"
                          >
                            {lead.agentName || "-"}
                          </div>
                        )}
                      </TableCell>

                      {/* Source */}
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
                          />
                        ) : (
                          <div
                            onClick={() => handleCellEdit(lead, "source")}
                            className="cursor-pointer hover-elevate p-1 rounded min-h-[32px] flex items-center"
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
                          <SelectTrigger className="h-8">
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
                          />
                        ) : (
                          <div
                            onClick={() => handleCellEdit(lead, "pinnedNotes")}
                            className="cursor-pointer hover-elevate p-1 rounded min-h-[32px] flex items-center truncate"
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
          {filteredLeads.length > 0 && totalPages > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredLeads.length)} of {filteredLeads.length} leads
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
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
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Lead Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>
              Create a new lead for your sales pipeline
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {/* Row 1: Sender Name & Number */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="senderName">Sender Name *</Label>
                  <Input
                    id="senderName"
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
                    type="tel"
                    value={formData.senderNumber || ""}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9+\s-]/g, '');
                      setFormData({ ...formData, senderNumber: value });
                    }}
                    placeholder="+971 50 123 4567"
                    required
                  />
                </div>
              </div>

              {/* Row 2: Lead Type */}
              <div className="grid gap-2">
                <Label htmlFor="leadType">Lead Type</Label>
                <Select
                  value={formData.leadType || ""}
                  onValueChange={(value) => setFormData({ ...formData, leadType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Phone Call">Phone Call</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="Walking">Walking</SelectItem>
                    <SelectItem value="Others">Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Row 3: Property Type & Purpose */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="propertyType">Property Type</Label>
                  <Select
                    value={formData.propertyType || ""}
                    onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Villa">Villa</SelectItem>
                      <SelectItem value="Apartment">Apartment</SelectItem>
                      <SelectItem value="Plot">Plot</SelectItem>
                      <SelectItem value="Shop">Shop</SelectItem>
                      <SelectItem value="Office">Office</SelectItem>
                      <SelectItem value="Warehouse">Warehouse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="purpose">Purpose</Label>
                  <Select
                    value={formData.purpose || ""}
                    onValueChange={(value) => setFormData({ ...formData, purpose: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Buyer">Buyer</SelectItem>
                      <SelectItem value="Seller">Seller</SelectItem>
                      <SelectItem value="Tenant">Tenant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 4: Price Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="minPrice">Min Price (AED)</Label>
                  <Input
                    id="minPrice"
                    type="number"
                    value={formData.minPrice || ""}
                    onChange={(e) => setFormData({ ...formData, minPrice: e.target.value })}
                    placeholder="500000"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="maxPrice">Max Price (AED)</Label>
                  <Input
                    id="maxPrice"
                    type="number"
                    value={formData.maxPrice || ""}
                    onChange={(e) => setFormData({ ...formData, maxPrice: e.target.value })}
                    placeholder="750000"
                  />
                </div>
              </div>

              {/* Row 5: Location & Sub-Location */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Select
                    value={formData.location || ""}
                    onValueChange={handleLocationChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {mainLocations.map((loc) => (
                        <SelectItem key={loc} value={loc}>
                          {loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Sub Location</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.subLocation || ""}
                      onValueChange={(value) => setFormData({ ...formData, subLocation: value })}
                      disabled={!formData.location}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select sub-location" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSubLocations.map((subLoc) => (
                          <SelectItem key={subLoc} value={subLoc}>
                            {subLoc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleAddCustomSubLocation}
                      disabled={!formData.location}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Row 6: Agent Name & Source */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="agentName">Agent Name</Label>
                  {currentUser?.role === "admin" || currentUser?.role === "ADMIN" ? (
                    <Select
                      value={formData.agentName || ""}
                      onValueChange={(value) => setFormData({ ...formData, agentName: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select agent" />
                      </SelectTrigger>
                      <SelectContent>
                        {agentUsers.map((user) => (
                          <SelectItem key={user.id} value={`${user.firstName} ${user.lastName}`}>
                            {user.firstName} {user.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="agentName"
                      value={`${currentUser?.firstName || ""} ${currentUser?.lastName || ""}`.trim()}
                      disabled
                      className="bg-muted"
                    />
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="source">Source</Label>
                  <Select
                    value={formData.source || ""}
                    onValueChange={(value) => setFormData({ ...formData, source: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bayut">Bayut</SelectItem>
                      <SelectItem value="Dubizzle">Dubizzle</SelectItem>
                      <SelectItem value="Website">Website</SelectItem>
                      <SelectItem value="WhatsApp Campaign">WhatsApp Campaign</SelectItem>
                      <SelectItem value="SMS Campaign">SMS Campaign</SelectItem>
                      <SelectItem value="Direct Call">Direct Call</SelectItem>
                      <SelectItem value="Walk-in">Walk-in</SelectItem>
                      <SelectItem value="Referral">Referral</SelectItem>
                      <SelectItem value="Paid Ads">Paid Ads</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 7: Status */}
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status || "Lead"}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
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

              {/* Row 8: Pinned Notes */}
              <div className="grid gap-2">
                <Label htmlFor="pinnedNotes">Pinned Notes</Label>
                <Textarea
                  id="pinnedNotes"
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
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createLeadMutation.isPending}
              >
                {createLeadMutation.isPending ? "Creating..." : "Create Lead"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Custom Sub-Location Dialog */}
      <Dialog open={isAddSubLocationOpen} onOpenChange={setIsAddSubLocationOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add Custom Sub-Location</DialogTitle>
            <DialogDescription>
              Add a new sub-location for {formData.location}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="newSubLocation">Sub-Location Name</Label>
              <Input
                id="newSubLocation"
                value={newSubLocationName}
                onChange={(e) => setNewSubLocationName(e.target.value)}
                placeholder="Enter area name"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSaveCustomSubLocation();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddSubLocationOpen(false);
                setNewSubLocationName("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveCustomSubLocation}>
              Save
            </Button>
          </DialogFooter>
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

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multiple Leads</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedLeadIds.size} lead(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete {selectedLeadIds.size} Lead(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}