import { useState } from "react";
import { PropertyCard } from "@/components/PropertyCard";
import { PropertyMap } from "@/components/PropertyMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Map, Grid } from "lucide-react";

const properties = [
  {
    id: "1",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400",
    title: "Modern Villa",
    price: "$850,000",
    address: "123 Palm Avenue, Miami FL",
    beds: 4,
    baths: 3,
    sqft: 3200,
    status: "available" as const,
  },
  {
    id: "2",
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400",
    title: "Downtown Condo",
    price: "$450,000",
    address: "456 City Center, New York NY",
    beds: 2,
    baths: 2,
    sqft: 1500,
    status: "pending" as const,
  },
  {
    id: "3",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400",
    title: "Suburban House",
    price: "$625,000",
    address: "789 Oak Street, Austin TX",
    beds: 3,
    baths: 2,
    sqft: 2400,
    status: "sold" as const,
  },
];

export default function Properties() {
  const [view, setView] = useState<"grid" | "map">("grid");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Properties</h1>
          <p className="text-muted-foreground">Browse and manage listings</p>
        </div>
        <Button data-testid="button-add-property">
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

      {view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              {...property}
              onView={() => console.log('View property', property.id)}
              onEdit={() => console.log('Edit property', property.id)}
            />
          ))}
        </div>
      ) : (
        <PropertyMap />
      )}
    </div>
  );
}
