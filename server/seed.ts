import { storage } from "./storage";
import bcrypt from "bcrypt";

async function upsertUser(email: string, data: any) {
  const existing = await storage.getUserByEmail(email);
  if (existing) {
    console.log(`↻ Updating existing user: ${email}`);
    return storage.updateUser(existing.id, data);
  } else {
    console.log(`➕ Creating new user: ${email}`);
    return storage.createUser(data);
  }
}

async function seed() {
  try {
    console.log("Seeding database...");

    const hashedPassword = await bcrypt.hash("Admin@2025", 10);

    await upsertUser("admin@goldmile.ae", {
      name: "Admin",
      email: "admin@goldmile.ae",
      password: hashedPassword,
      role: "ADMIN",
    });

    console.log("✅ Admin user seeded or updated successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
}

seed();
