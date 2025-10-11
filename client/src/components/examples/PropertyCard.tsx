import { PropertyCard } from '../PropertyCard';

export default function PropertyCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      <PropertyCard
        id="1"
        image="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400"
        title="Modern Villa"
        price="$850,000"
        address="123 Palm Avenue, Miami FL"
        beds={4}
        baths={3}
        sqft={3200}
        status="available"
        onView={() => console.log('View property 1')}
        onEdit={() => console.log('Edit property 1')}
      />
      <PropertyCard
        id="2"
        image="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400"
        title="Downtown Condo"
        price="$450,000"
        address="456 City Center, New York NY"
        beds={2}
        baths={2}
        sqft={1500}
        status="pending"
        onView={() => console.log('View property 2')}
        onEdit={() => console.log('Edit property 2')}
      />
      <PropertyCard
        id="3"
        image="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400"
        title="Suburban House"
        price="$625,000"
        address="789 Oak Street, Austin TX"
        beds={3}
        baths={2}
        sqft={2400}
        status="sold"
        onView={() => console.log('View property 3')}
        onEdit={() => console.log('Edit property 3')}
      />
    </div>
  );
}
