import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bed, Bath, Maximize, MapPin, Eye, Edit } from "lucide-react";

interface PropertyCardProps {
  id: string;
  image: string;
  title: string;
  price: string;
  address: string;
  beds: number;
  baths: number;
  sqft: number;
  status: "available" | "sold" | "pending";
  onView?: () => void;
  onEdit?: () => void;
}

export function PropertyCard({
  id,
  image,
  title,
  price,
  address,
  beds,
  baths,
  sqft,
  status,
  onView,
  onEdit,
}: PropertyCardProps) {
  const statusColors = {
    available: "success",
    sold: "destructive",
    pending: "warning",
  };

  return (
    <Card className="overflow-hidden hover-elevate" data-testid={`card-property-${id}`}>
      <div className="relative h-48 bg-muted">
        <img src={image} alt={title} className="w-full h-full object-cover" />
        <Badge
          className={`absolute top-3 right-3 bg-${statusColors[status]}`}
          data-testid={`badge-status-${id}`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-lg mb-1" data-testid={`text-title-${id}`}>{title}</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{address}</span>
            </div>
          </div>
          <p className="text-xl font-bold text-primary" data-testid={`text-price-${id}`}>{price}</p>
        </div>
        <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Bed className="h-4 w-4" />
            <span>{beds}</span>
          </div>
          <div className="flex items-center gap-1">
            <Bath className="h-4 w-4" />
            <span>{baths}</span>
          </div>
          <div className="flex items-center gap-1">
            <Maximize className="h-4 w-4" />
            <span>{sqft.toLocaleString()} sqft</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onView}
            data-testid={`button-view-${id}`}
          >
            <Eye className="h-4 w-4 mr-2" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onEdit}
            data-testid={`button-edit-${id}`}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>
    </Card>
  );
}
