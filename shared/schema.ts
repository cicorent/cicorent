import { sql, relations } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  decimal, 
  integer, 
  boolean, 
  timestamp, 
  date,
  pgEnum,
  serial
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const vehicleTypeEnum = pgEnum("vehicle_type", ["VAN", "CAR"]);
export const packageTypeEnum = pgEnum("package_type", ["STANDARD_24H", "THREE_DAYS", "FIVE_DAYS", "WEEKLY", "MONTHLY"]);
export const kmPlanEnum = pgEnum("km_plan", ["KM_100", "KM_200", "UNLIMITED"]);
export const coverageEnum = pgEnum("coverage", ["BASE", "PARTIAL"]);
export const bookingStatusEnum = pgEnum("booking_status", ["PENDING", "CONFIRMED", "CANCELLED"]);
export const roleEnum = pgEnum("role", ["STAFF", "ADMIN"]);

// Booking sequence table for progressive codes
export const bookingSequence = pgTable("booking_sequence", {
  id: serial("id").primaryKey(),
  lastValue: integer("last_value").default(0).notNull(),
});

// Vehicles table
export const vehicles = pgTable("vehicles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: varchar("slug").unique().notNull(),
  type: vehicleTypeEnum("type").notNull(),
  basePriceDay: decimal("base_price_day", { precision: 10, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  availableQuantity: integer("available_quantity").notNull(),
  colorOptions: text("color_options").array().notNull(),
  seats: integer("seats").notNull(),
  transmission: varchar("transmission", { length: 10 }).notNull(),
  fuelType: varchar("fuel_type", { length: 10 }).notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Blackout dates table
export const blackoutDates = pgTable("blackout_dates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vehicleId: varchar("vehicle_id").notNull().references(() => vehicles.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
}, (table) => ({
  uniqueVehicleDate: sql`UNIQUE(${table.vehicleId}, ${table.date})`,
}));

// Bookings table
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingCode: varchar("booking_code").unique().notNull(),
  vehicleId: varchar("vehicle_id").notNull().references(() => vehicles.id),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  daysCount: integer("days_count").notNull(),
  packageType: packageTypeEnum("package_type").notNull(),
  kmPlan: kmPlanEnum("km_plan").notNull(),
  coverage: coverageEnum("coverage").notNull(),
  extraDriver: boolean("extra_driver").default(false).notNull(),
  extraDriverUnder25: boolean("extra_driver_under25").default(false).notNull(),
  homeDelivery: boolean("home_delivery").default(false).notNull(),
  homePickup: boolean("home_pickup").default(false).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  discountEuroShown: decimal("discount_euro_shown", { precision: 10, scale: 2 }).notNull(),
  discountPctShown: decimal("discount_pct_shown", { precision: 5, scale: 2 }).notNull(),
  customerFirstName: text("customer_first_name").notNull(),
  customerLastName: text("customer_last_name").notNull(),
  customerBirthDate: date("customer_birth_date").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email").notNull(),
  driverLicenseNo: text("driver_license_no").notNull(),
  addFirstName: text("add_first_name"),
  addLastName: text("add_last_name"),
  addBirthDate: date("add_birth_date"),
  addDriverLicenseNo: text("add_driver_license_no"),
  notes: text("notes"),
  status: bookingStatusEnum("status").default("PENDING").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Employees table
export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  role: roleEnum("role").default("STAFF").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const vehiclesRelations = relations(vehicles, ({ many }) => ({
  bookings: many(bookings),
  blackoutDates: many(blackoutDates),
}));

export const blackoutDatesRelations = relations(blackoutDates, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [blackoutDates.vehicleId],
    references: [vehicles.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [bookings.vehicleId],
    references: [vehicles.id],
  }),
}));

// Schemas
export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  bookingCode: true,
  totalPrice: true,
  discountEuroShown: true,
  discountPctShown: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBlackoutDateSchema = createInsertSchema(blackoutDates).omit({
  id: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateVehicleSchema = insertVehicleSchema.partial();
export const updateBookingSchema = insertBookingSchema.partial();

// Types
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type UpdateVehicle = z.infer<typeof updateVehicleSchema>;

export type BlackoutDate = typeof blackoutDates.$inferSelect;
export type InsertBlackoutDate = z.infer<typeof insertBlackoutDateSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type UpdateBooking = z.infer<typeof updateBookingSchema>;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

// Quote calculation input type
export const quoteInputSchema = z.object({
  vehicleId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  packageType: z.enum(["STANDARD_24H", "VAN_4H", "VAN_10H", "WEEKLY", "MONTHLY"]),
  kmPlan: z.enum(["KM_100", "KM_200", "UNLIMITED"]),
  coverage: z.enum(["BASE", "PARTIAL"]),
  extraDriver: z.boolean().default(false),
  extraDriverUnder25: z.boolean().default(false),
  homeDelivery: z.boolean().default(false),
  homePickup: z.boolean().default(false),
});

export type QuoteInput = z.infer<typeof quoteInputSchema>;

export interface QuoteResult {
  total: number;
  breakdown: {
    baseWithDiscount: number;
    km: number;
    extra: number;
    delivery: number;
  };
  discountEuroShown: number;
  discountPctShown: number;
  daysCount: number;
}
