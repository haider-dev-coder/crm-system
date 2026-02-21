export type PipelineStage =
  | "Lead"
  | "No Answer"
  | "Prospect"
  | "Other Options"
  | "Visiting"
  | "Followup"
  | "Negotiation"
  | "Won"
  | "Lost";

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  role: text("role").notNull().default("AGENT"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
// Locations table
export const locations = pgTable("locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sub-Locations table
export const subLocations = pgTable("sub_locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  locationId: varchar("location_id").references(() => locations.id).notNull(),
  name: text("name").notNull(),
  isCustom: boolean("is_custom").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Leads
export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").defaultNow().notNull(),
  owner: text("owner"),
  minPrice: decimal("min_price", { precision: 12, scale: 2 }),
  maxPrice: decimal("max_price", { precision: 12, scale: 2 }),
  leadType: text("lead_type"),
  senderName: text("sender_name").notNull(),
  senderNumber: text("sender_number").notNull(),
  customerType: text("customer_type"),
  email: text("email"),
  phone2: text("phone2"),
  whatsapp: text("whatsapp"),
  idCardNumber: text("id_card_number"),
  passportNumber: text("passport_number"),
  emiratesId: text("emirates_id"),
  visaStatus: text("visa_status"),
  preferredLanguage: text("preferred_language"),
  propertyType: text("property_type"),
  purpose: text("purpose"),
  price: text("price"),
  location: text("location"),
  subLocation: text("sub_location"),
  agentName: text("agent_name"),
  source: text("source"),
  assignedTo: varchar("assigned_to").references(() => users.id),
  pinnedNotes: text("pinned_notes"),
  status: text("status").$type<PipelineStage>().notNull().default("Lead"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Properties
export const properties = pgTable("properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  beds: integer("beds").notNull(),
  baths: integer("baths").notNull(),
  sqft: integer("sqft").notNull(),
  propertyType: text("property_type").notNull(),
  status: text("status").notNull().default("available"),
  images: text("images").array(),
  features: text("features").array(),
  addedBy: varchar("added_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Deals
export const deals = pgTable("deals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").references(() => leads.id).notNull(),
  propertyId: varchar("property_id").references(() => properties.id).notNull(),
  offerAmount: decimal("offer_amount", { precision: 12, scale: 2 }).notNull(),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull(),
  commissionAmount: decimal("commission_amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  closingDate: timestamp("closing_date"),
  agentId: varchar("agent_id").references(() => users.id).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tasks
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("pending"),
  assignedTo: varchar("assigned_to").references(() => users.id),
  createdBy: varchar("created_by").references(() => users.id).notNull(),
  relatedLeadId: varchar("related_lead_id").references(() => leads.id),
  relatedPropertyId: varchar("related_property_id").references(() => properties.id),
  attachments: text("attachments").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Messages
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(),
  channel: text("channel").notNull(),
  senderId: varchar("sender_id").references(() => users.id),
  recipientId: varchar("recipient_id"),
  recipientName: text("recipient_name"),
  content: text("content").notNull(),
  isOwn: boolean("is_own").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Documents
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fileName: text("file_name").notNull(),
  fileSize: text("file_size").notNull(),
  fileType: text("file_type").notNull(),
  fileUrl: text("file_url").notNull(),
  uploadedBy: varchar("uploaded_by").references(() => users.id).notNull(),
  relatedLeadId: varchar("related_lead_id").references(() => leads.id),
  relatedPropertyId: varchar("related_property_id").references(() => properties.id),
  relatedDealId: varchar("related_deal_id").references(() => deals.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Activities
export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  action: text("action").notNull(),
  target: text("target").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });

export const insertLeadSchema = createInsertSchema(leads)
  .omit({ id: true, date: true, createdAt: true, updatedAt: true })
  .partial({
    owner: true,        // ADD THIS
    minPrice: true,     // ADD THIS
    maxPrice: true,
    leadType: true,
    customerType: true,
    email: true,
    phone2: true,
    whatsapp: true,
    idCardNumber: true,
    passportNumber: true,
    emiratesId: true,
    visaStatus: true,
    preferredLanguage: true,
    propertyType: true,
    purpose: true,
    price: true,
    location: true,
    subLocation: true,
    agentName: true,
    source: true,
    assignedTo: true,
    pinnedNotes: true,
  });

export const insertPropertySchema = createInsertSchema(properties)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial({ description: true, latitude: true, longitude: true, images: true, features: true, addedBy: true });

export const insertDealSchema = createInsertSchema(deals)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial({ closingDate: true, notes: true });

export const insertTaskSchema = createInsertSchema(tasks)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial({ description: true, dueDate: true, assignedTo: true, relatedLeadId: true, relatedPropertyId: true, attachments: true });

export const insertMessageSchema = createInsertSchema(messages)
  .omit({ id: true, createdAt: true })
  .partial({ senderId: true, recipientId: true, recipientName: true, isOwn: true });

export const insertDocumentSchema = createInsertSchema(documents)
  .omit({ id: true, createdAt: true })
  .partial({ relatedLeadId: true, relatedPropertyId: true, relatedDealId: true });

export const insertActivitySchema = createInsertSchema(activities)
  .omit({ id: true, createdAt: true })
  .partial({ metadata: true });
  export const insertLocationSchema = createInsertSchema(locations)
  .omit({ id: true, createdAt: true });

export const insertSubLocationSchema = createInsertSchema(subLocations)
  .omit({ id: true, createdAt: true });

// Select types
export type User = typeof users.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Property = typeof properties.$inferSelect;
export type Deal = typeof deals.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Location = typeof locations.$inferSelect;
export type SubLocation = typeof subLocations.$inferSelect;

// Insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type InsertDeal = z.infer<typeof insertDealSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type InsertSubLocation = z.infer<typeof insertSubLocationSchema>;