import { useState } from "react";
import { PropertyCard } from "@/components/PropertyCard";
import { PropertyMap } from "@/components/PropertyMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Map, Grid, Upload, X } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Property, InsertProperty } from "@shared/schema";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Properties() {
  const [view, setView] = useState<"grid" | "map">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [formData, setFormData] = useState<Partial<InsertProperty>>({
    title: "",
    description: "",
    price: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    beds: 1,
    baths: 1,
    sqft: 1000,
    propertyType: "house",
    status: "available",
  });
  const { toast } = useToast();

  const { data: properties = [], isLoading } = useQuery<Property[]>({ 
    queryKey: ["/api/properties"] 
  });

  const createPropertyMutation = useMutation({
    mutationFn: async (data: InsertProperty) => {
      return await apiRequest("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Property created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create property",
        variant: "destructive",
      });
    },
  });

  const updatePropertyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertProperty> }) => {
      return await apiRequest(`/api/properties/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      setIsEditDialogOpen(false);
      setSelectedProperty(null);
      resetForm();
      toast({
        title: "Success",
        description: "Property updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update property",
        variant: "destructive",
      });
    },
  });

  const deletePropertyMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/properties/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      setIsDeleteDialogOpen(false);
      setSelectedProperty(null);
      toast({
        title: "Success",
        description: "Property deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete property",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      price: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      beds: 1,
      baths: 1,
      sqft: 1000,
      propertyType: "house",
      status: "available",
    });
    setSelectedImages([]);
    setImageUrls([]);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedImages(filesArray);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (selectedImages.length === 0) return [];

    setIsUploadingImages(true);
    try {
      const formData = new FormData();
      selectedImages.forEach((file) => {
        formData.append('images', file);
      });

      // Use fetch directly for file upload (don't use apiRequest which sets JSON headers)
      const token = localStorage.getItem("token");
      const response = await fetch("/api/properties/upload-images", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload images");
      }

      const data = await response.json();
      return data.imageUrls || [];
    } catch (error) {
      console.error("Image upload error:", error);
      toast({
        title: "Error",
        description: "Failed to upload images",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.price || !formData.address) {
      toast({
        title: "Validation Error",
        description: "Title, price, and address are required",
        variant: "destructive",
      });
      return;
    }

    // Upload images first if any selected
    const uploadedImageUrls = await uploadImages();
    
    // Create property with image URLs
    const propertyData = {
      ...formData,
      images: uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined,
    };
    
    createPropertyMutation.mutate(propertyData as InsertProperty);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty) return;

    // Upload new images if any selected
    const newImageUrls = await uploadImages();
    
    // Combine existing images with newly uploaded images
    const allImageUrls = [...imageUrls, ...newImageUrls];
    
    // Update property with all images (including empty array to allow deletion of all images)
    const propertyData = {
      ...formData,
      images: allImageUrls,
    };
    
    updatePropertyMutation.mutate({ id: selectedProperty.id, data: propertyData });
  };

  const removeExistingImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleView = (property: Property) => {
    setSelectedProperty(property);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (property: Property) => {
    setSelectedProperty(property);
    setFormData({
      title: property.title,
      description: property.description || "",
      price: property.price,
      address: property.address,
      city: property.city,
      state: property.state,
      zipCode: property.zipCode,
      beds: property.beds,
      baths: property.baths,
      sqft: property.sqft,
      propertyType: property.propertyType,
      status: property.status,
    });
    // Load existing images
    setImageUrls(property.images || []);
    setSelectedImages([]);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (property: Property) => {
    setSelectedProperty(property);
    setIsDeleteDialogOpen(true);
  };

  const filteredProperties = properties.filter(property => {
    const query = searchQuery.toLowerCase();
    const title = property.title?.toLowerCase() ?? "";
    const address = property.address?.toLowerCase() ?? "";
    const city = property.city?.toLowerCase() ?? "";
    return title.includes(query) || address.includes(query) || city.includes(query);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Properties</h1>
          <p className="text-muted-foreground">Browse and manage listings</p>
        </div>
        <Button data-testid="button-add-property" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search properties..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-properties"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setView("grid")}
            data-testid="button-view-grid"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "map" ? "default" : "outline"}
            size="icon"
            onClick={() => setView("map")}
            data-testid="button-view-map"
          >
            <Map className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading properties...</div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <PropertyCard
              key={property.id}
              id={property.id}
              images={property.images || undefined}
              title={property.title}
              price={`$${parseFloat(property.price).toLocaleString()}`}
              address={`${property.address}, ${property.city} ${property.state}`}
              beds={property.beds}
              baths={property.baths}
              sqft={property.sqft}
              status={property.status as "available" | "pending" | "sold"}
              onView={() => handleView(property)}
              onEdit={() => handleEdit(property)}
              onDelete={() => handleDelete(property)}
            />
          ))}
        </div>
      ) : (
        <PropertyMap />
      )}

      {/* Add Property Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Property</DialogTitle>
            <DialogDescription>
              Create a new property listing
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  data-testid="input-property-title"
                  value={formData.title || ""}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Modern Villa"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  data-testid="input-property-price"
                  value={formData.price || ""}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="850000"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  data-testid="input-property-address"
                  value={formData.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main Street"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    data-testid="input-property-city"
                    value={formData.city || ""}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Miami"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    data-testid="input-property-state"
                    value={formData.state || ""}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="FL"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="zipCode">Zip Code *</Label>
                <Input
                  id="zipCode"
                  data-testid="input-property-zipcode"
                  value={formData.zipCode || ""}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  placeholder="33101"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="beds">Beds *</Label>
                  <Input
                    id="beds"
                    type="number"
                    data-testid="input-property-beds"
                    value={formData.beds || 1}
                    onChange={(e) => setFormData({ ...formData, beds: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="baths">Baths *</Label>
                  <Input
                    id="baths"
                    type="number"
                    data-testid="input-property-baths"
                    value={formData.baths || 1}
                    onChange={(e) => setFormData({ ...formData, baths: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sqft">Sqft *</Label>
                  <Input
                    id="sqft"
                    type="number"
                    data-testid="input-property-sqft"
                    value={formData.sqft || 1000}
                    onChange={(e) => setFormData({ ...formData, sqft: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="propertyType">Property Type *</Label>
                <Select
                  value={formData.propertyType || "house"}
                  onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
                >
                  <SelectTrigger data-testid="select-property-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="condo">Condo</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="townhouse">Townhouse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status || "available"}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger data-testid="select-property-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  data-testid="input-property-description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Beautiful property with stunning views..."
                  rows={3}
                />
              </div>
              
              {/* Image Upload Section */}
              <div className="grid gap-2">
                <Label htmlFor="images">Property Images</Label>
                <div className="border-2 border-dashed rounded-md p-4">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <div className="text-sm text-center">
                      <label htmlFor="images" className="cursor-pointer text-primary hover:underline">
                        Click to upload images
                      </label>
                      <p className="text-muted-foreground">or drag and drop</p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB (max 10 images)</p>
                    </div>
                    <Input
                      id="images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                      data-testid="input-property-images"
                    />
                  </div>
                  
                  {selectedImages.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium">{selectedImages.length} image(s) selected:</p>
                      <div className="space-y-1">
                        {selectedImages.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                            <span className="text-sm truncate">{file.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeImage(index)}
                              data-testid={`button-remove-image-${index}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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
                data-testid="button-cancel-property"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createPropertyMutation.isPending || isUploadingImages}
                data-testid="button-submit-property"
              >
                {isUploadingImages ? "Uploading images..." : createPropertyMutation.isPending ? "Creating..." : "Create Property"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Property Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProperty?.title}</DialogTitle>
            <DialogDescription>Property Details</DialogDescription>
          </DialogHeader>
          {selectedProperty && (
            <div className="grid gap-4 py-4">
              {/* Property Images */}
              {selectedProperty.images && selectedProperty.images.length > 0 && (
                <div className="grid gap-2">
                  <Label className="text-muted-foreground">Property Images</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedProperty.images.map((imageUrl, index) => (
                      <div key={index} className="relative aspect-video rounded-lg overflow-hidden border">
                        <img
                          src={imageUrl}
                          alt={`Property image ${index + 1}`}
                          className="w-full h-full object-cover"
                          data-testid={`img-property-${index}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Price</Label>
                  <p className="text-lg font-semibold">${parseFloat(selectedProperty.price).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p className="text-lg capitalize">{selectedProperty.status}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Address</Label>
                <p>{selectedProperty.address}</p>
                <p>{selectedProperty.city}, {selectedProperty.state} {selectedProperty.zipCode}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground">Beds</Label>
                  <p className="text-lg">{selectedProperty.beds}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Baths</Label>
                  <p className="text-lg">{selectedProperty.baths}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Sqft</Label>
                  <p className="text-lg">{selectedProperty.sqft.toLocaleString()}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Property Type</Label>
                <p className="capitalize">{selectedProperty.propertyType}</p>
              </div>
              {selectedProperty.description && (
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p>{selectedProperty.description}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewDialogOpen(false)} data-testid="button-close-view">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Property Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Property</DialogTitle>
            <DialogDescription>
              Update property information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Title *</Label>
                <Input
                  id="edit-title"
                  data-testid="input-edit-title"
                  value={formData.title || ""}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-price">Price *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  data-testid="input-edit-price"
                  value={formData.price || ""}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-address">Address *</Label>
                <Input
                  id="edit-address"
                  data-testid="input-edit-address"
                  value={formData.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-city">City *</Label>
                  <Input
                    id="edit-city"
                    data-testid="input-edit-city"
                    value={formData.city || ""}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-state">State *</Label>
                  <Input
                    id="edit-state"
                    data-testid="input-edit-state"
                    value={formData.state || ""}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-zipCode">Zip Code *</Label>
                <Input
                  id="edit-zipCode"
                  data-testid="input-edit-zipcode"
                  value={formData.zipCode || ""}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-beds">Beds *</Label>
                  <Input
                    id="edit-beds"
                    type="number"
                    data-testid="input-edit-beds"
                    value={formData.beds || 1}
                    onChange={(e) => setFormData({ ...formData, beds: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-baths">Baths *</Label>
                  <Input
                    id="edit-baths"
                    type="number"
                    data-testid="input-edit-baths"
                    value={formData.baths || 1}
                    onChange={(e) => setFormData({ ...formData, baths: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-sqft">Sqft *</Label>
                  <Input
                    id="edit-sqft"
                    type="number"
                    data-testid="input-edit-sqft"
                    value={formData.sqft || 1000}
                    onChange={(e) => setFormData({ ...formData, sqft: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-propertyType">Property Type *</Label>
                <Select
                  value={formData.propertyType || "house"}
                  onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
                >
                  <SelectTrigger data-testid="select-edit-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="condo">Condo</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="townhouse">Townhouse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status || "available"}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger data-testid="select-edit-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  data-testid="input-edit-description"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Existing Images */}
              {imageUrls.length > 0 && (
                <div className="grid gap-2">
                  <Label>Current Images</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {imageUrls.map((url, index) => (
                      <div key={index} className="relative aspect-video rounded-lg overflow-hidden border">
                        <img src={url} alt={`Property ${index + 1}`} className="w-full h-full object-cover" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() => removeExistingImage(index)}
                          data-testid={`button-remove-existing-${index}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Images */}
              <div className="grid gap-2">
                <Label htmlFor="edit-images">Add More Images</Label>
                <div className="border-2 border-dashed rounded-md p-4">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <div className="text-sm text-center">
                      <label htmlFor="edit-images" className="cursor-pointer text-primary hover:underline">
                        Click to upload additional images
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
                    </div>
                    <Input
                      id="edit-images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                      data-testid="input-edit-images"
                    />
                  </div>
                  
                  {selectedImages.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium">{selectedImages.length} new image(s) selected:</p>
                      <div className="space-y-1">
                        {selectedImages.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                            <span className="text-sm truncate">{file.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeImage(index)}
                              data-testid={`button-remove-new-image-${index}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedProperty(null);
                  resetForm();
                }}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updatePropertyMutation.isPending || isUploadingImages}
                data-testid="button-submit-edit"
              >
                {isUploadingImages ? "Uploading images..." : updatePropertyMutation.isPending ? "Updating..." : "Update Property"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{selectedProperty?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedProperty && deletePropertyMutation.mutate(selectedProperty.id)}
              disabled={deletePropertyMutation.isPending}
              data-testid="button-confirm-delete"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePropertyMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
