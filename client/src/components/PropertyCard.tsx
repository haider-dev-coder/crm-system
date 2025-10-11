import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Bed, Bath, Maximize, MapPin, Eye, Edit, Trash2, Image as ImageIcon } from "lucide-react";

interface PropertyCardProps {
  id: string;
  images?: string[];
  title: string;
  price: string;
  address: string;
  beds: number;
  baths: number;
  sqft: number;
  status: "available" | "sold" | "pending";
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function PropertyCard({
  id,
  images = [],
  title,
  price,
  address,
  beds,
  baths,
  sqft,
  status,
  onView,
  onEdit,
  onDelete,
}: PropertyCardProps) {
  const statusVariants = {
    available: "default",
    sold: "destructive",
    pending: "secondary",
  } as const;

  const displayImages = images.length > 0 ? images : ["/placeholder-property.jpg"];

  return (
    <Card className="overflow-hidden hover-elevate" data-testid={`card-property-${id}`}>
      <div className="relative h-48 bg-muted">
        {displayImages.length === 1 ? (
          <img src={displayImages[0]} alt={title} className="w-full h-full object-cover" />
        ) : (
          <Carousel className="w-full h-full">
            <CarouselContent>
              {displayImages.map((img, index) => (
                <CarouselItem key={index}>
                  <img src={img} alt={`${title} ${index + 1}`} className="w-full h-full object-cover" />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </Carousel>
        )}
        <Badge
          variant={statusVariants[status]}
          className="absolute top-3 right-3 z-10"
          data-testid={`badge-status-${id}`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
        {displayImages.length > 1 && (
          <div className="absolute bottom-3 left-3 bg-black/60 text-white px-2 py-1 rounded-md text-xs flex items-center gap-1 z-10">
            <ImageIcon className="h-3 w-3" />
            {displayImages.length} photos
          </div>
        )}
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
        <div className="flex flex-col gap-2">
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
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={onDelete}
            data-testid={`button-delete-${id}`}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Property
          </Button>
        </div>
      </div>
    </Card>
  );
}
