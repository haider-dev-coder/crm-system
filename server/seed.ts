import { storage } from "./storage";
import bcrypt from "bcrypt";

async function seed() {
  try {
    console.log("Seeding database...");

    // Create demo users
    const password = await bcrypt.hash("demo123", 10);
    
    const admin = await storage.createUser({
      email: "admin@realestate.com",
      password,
      firstName: "Admin",
      lastName: "User",
      phone: "+1 234 567 8900",
      role: "ADMIN",
    });

    const agent = await storage.createUser({
      email: "agent@realestate.com",
      password,
      firstName: "John",
      lastName: "Doe",
      phone: "+1 234 567 8901",
      role: "AGENT",
    });

    const agent2 = await storage.createUser({
      email: "sarah@realestate.com",
      password,
      firstName: "Sarah",
      lastName: "Miller",
      phone: "+1 234 567 8902",
      role: "AGENT",
    });

    console.log("✓ Created demo users");

    // Create demo leads
    const lead1 = await storage.createLead({
      name: "Sarah Johnson",
      email: "sarah.j@email.com",
      phone: "+1 234 567 8901",
      propertyInterest: "Luxury Villa",
      budget: "$850K",
      status: "new",
      assignedTo: agent.id,
      tags: ["Hot Lead", "Urgent"],
      notes: "Interested in waterfront properties",
    });

    const lead2 = await storage.createLead({
      name: "Michael Chen",
      email: "m.chen@email.com",
      phone: "+1 234 567 8902",
      propertyInterest: "Downtown Condo",
      budget: "$450K",
      status: "negotiation",
      assignedTo: agent.id,
      tags: ["Interested"],
      notes: "Looking for move-in ready property",
    });

    const lead3 = await storage.createLead({
      name: "Emma Wilson",
      email: "emma.w@email.com",
      phone: "+1 234 567 8903",
      propertyInterest: "Suburban House",
      budget: "$625K",
      status: "closed",
      assignedTo: agent2.id,
      tags: ["Closed Won"],
      notes: "Successfully closed deal",
    });

    console.log("✓ Created demo leads");

    // Create demo properties
    const property1 = await storage.createProperty({
      title: "Modern Villa",
      description: "Stunning modern villa with ocean views",
      price: "850000",
      address: "123 Palm Avenue",
      city: "Miami",
      state: "FL",
      zipCode: "33139",
      latitude: "25.7617",
      longitude: "-80.1918",
      beds: 4,
      baths: 3,
      sqft: 3200,
      propertyType: "Villa",
      status: "available",
      images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400"],
      features: ["Pool", "Ocean View", "Modern Kitchen"],
      addedBy: agent.id,
    });

    const property2 = await storage.createProperty({
      title: "Downtown Condo",
      description: "Luxury condo in the heart of the city",
      price: "450000",
      address: "456 City Center",
      city: "New York",
      state: "NY",
      zipCode: "10001",
      latitude: "40.7128",
      longitude: "-74.0060",
      beds: 2,
      baths: 2,
      sqft: 1500,
      propertyType: "Condo",
      status: "pending",
      images: ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400"],
      features: ["Gym", "Concierge", "City View"],
      addedBy: agent.id,
    });

    const property3 = await storage.createProperty({
      title: "Suburban House",
      description: "Beautiful family home in quiet neighborhood",
      price: "625000",
      address: "789 Oak Street",
      city: "Austin",
      state: "TX",
      zipCode: "78701",
      latitude: "30.2672",
      longitude: "-97.7431",
      beds: 3,
      baths: 2,
      sqft: 2400,
      propertyType: "House",
      status: "sold",
      images: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400"],
      features: ["Garden", "Garage", "Updated Kitchen"],
      addedBy: agent2.id,
    });

    console.log("✓ Created demo properties");

    // Create demo deals
    await storage.createDeal({
      leadId: lead3.id,
      propertyId: property3.id,
      offerAmount: "625000",
      commissionRate: "3",
      commissionAmount: "18750",
      status: "closed",
      closingDate: new Date(),
      agentId: agent2.id,
      notes: "Successfully negotiated and closed",
    });

    console.log("✓ Created demo deal");

    // Create demo tasks
    await storage.createTask({
      title: "Property viewing with Sarah",
      description: "Show the luxury villa to Sarah Johnson",
      dueDate: new Date(Date.now() + 86400000), // Tomorrow
      priority: "high",
      status: "pending",
      assignedTo: agent.id,
      createdBy: admin.id,
      relatedLeadId: lead1.id,
      relatedPropertyId: property1.id,
    });

    await storage.createTask({
      title: "Follow-up call with Michael",
      description: "Discuss financing options",
      dueDate: new Date(Date.now() + 172800000), // 2 days
      priority: "medium",
      status: "pending",
      assignedTo: agent.id,
      createdBy: admin.id,
      relatedLeadId: lead2.id,
    });

    console.log("✓ Created demo tasks");

    // Create demo messages
    await storage.createMessage({
      conversationId: "conv-1",
      channel: "whatsapp",
      senderId: null,
      recipientId: null,
      recipientName: "Sarah Johnson",
      content: "Hi, I'm interested in the villa",
      isOwn: false,
    });

    await storage.createMessage({
      conversationId: "conv-1",
      channel: "whatsapp",
      senderId: agent.id,
      recipientId: null,
      recipientName: "Sarah Johnson",
      content: "Great! Let me share the details",
      isOwn: true,
    });

    console.log("✓ Created demo messages");

    // Create demo activities
    await storage.createActivity({
      type: "lead",
      userId: agent.id,
      action: "created lead",
      target: "Sarah Johnson",
      metadata: { leadId: lead1.id },
    });

    await storage.createActivity({
      type: "deal",
      userId: agent2.id,
      action: "closed deal with",
      target: "Emma Wilson",
      metadata: { leadId: lead3.id },
    });

    console.log("✓ Created demo activities");

    console.log("\n✅ Database seeded successfully!");
    console.log("\nDemo credentials:");
    console.log("Admin: admin@realestate.com / demo123");
    console.log("Agent: agent@realestate.com / demo123");
    console.log("Agent 2: sarah@realestate.com / demo123");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

seed();
