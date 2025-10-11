import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Property {
  id: string;
  title: string;
  price: string;
  position: [number, number];
}

const properties: Property[] = [
  { id: "1", title: "Modern Villa", price: "$850,000", position: [25.7617, -80.1918] },
  { id: "2", title: "Downtown Condo", price: "$450,000", position: [40.7128, -74.0060] },
  { id: "3", title: "Suburban House", price: "$625,000", position: [30.2672, -97.7431] },
];

export function PropertyMap() {
  return (
    <div className="h-[500px] w-full rounded-md overflow-hidden border" data-testid="map-container">
      <MapContainer
        center={[37.0902, -95.7129]}
        zoom={4}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {properties.map((property) => (
          <Marker key={property.id} position={property.position}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{property.title}</p>
                <p className="text-primary font-medium">{property.price}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
