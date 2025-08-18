import { 
  vehicles, 
  bookings, 
  blackoutDates, 
  employees,
  bookingSequence,
  type Vehicle, 
  type InsertVehicle,
  type UpdateVehicle,
  type Booking, 
  type InsertBooking,
  type UpdateBooking,
  type BlackoutDate,
  type InsertBlackoutDate,
  type Employee,
  type InsertEmployee
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, sql, between } from "drizzle-orm";

export interface IStorage {
  // Vehicle operations
  getVehicles(): Promise<Vehicle[]>;
  getVehicle(id: string): Promise<Vehicle | undefined>;
  getVehicleBySlug(slug: string): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: string, vehicle: UpdateVehicle): Promise<Vehicle>;
  
  // Booking operations
  getBookings(): Promise<(Booking & { vehicle: Vehicle })[]>;
  getBooking(id: string): Promise<(Booking & { vehicle: Vehicle }) | undefined>;
  createBooking(booking: InsertBooking & { bookingCode: string; totalPrice: number; discountEuroShown: number; discountPctShown: number }): Promise<Booking>;
  updateBooking(id: string, booking: UpdateBooking): Promise<Booking>;
  deleteBooking(id: string): Promise<void>;
  getNextBookingCode(): Promise<string>;
  
  // Availability operations
  getVehicleAvailability(vehicleId: string, startDate?: string, endDate?: string): Promise<{ availableQuantity: number; blackoutDates: string[] }>;
  calculateQuote(queryParams: any): Promise<any>;
  
  // Blackout operations
  getBlackoutDates(vehicleId: string): Promise<BlackoutDate[]>;
  createBlackoutDate(blackout: InsertBlackoutDate): Promise<BlackoutDate>;
  deleteBlackoutDate(id: string): Promise<void>;
  
  // Employee operations
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployeeByUsername(username: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
}

export class DatabaseStorage implements IStorage {
  async getVehicles(): Promise<Vehicle[]> {
    return await db.select().from(vehicles).orderBy(vehicles.name);
  }

  async getVehicle(id: string): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle;
  }

  async getVehicleBySlug(slug: string): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.slug, slug));
    return vehicle;
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const [newVehicle] = await db.insert(vehicles).values(vehicle).returning();
    return newVehicle;
  }

  async updateVehicle(id: string, vehicle: UpdateVehicle): Promise<Vehicle> {
    const [updatedVehicle] = await db
      .update(vehicles)
      .set({ ...vehicle, updatedAt: new Date() })
      .where(eq(vehicles.id, id))
      .returning();
    return updatedVehicle;
  }

  async getBookings(): Promise<(Booking & { vehicle: Vehicle })[]> {
    return await db
      .select()
      .from(bookings)
      .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .orderBy(desc(bookings.createdAt))
      .then(rows => rows.map(row => ({ ...row.bookings, vehicle: row.vehicles! })));
  }

  async getBooking(id: string): Promise<(Booking & { vehicle: Vehicle }) | undefined> {
    const [result] = await db
      .select()
      .from(bookings)
      .leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .where(eq(bookings.id, id));
    
    if (!result) return undefined;
    return { ...result.bookings, vehicle: result.vehicles! };
  }

  async createBooking(booking: InsertBooking & { bookingCode: string; totalPrice: number; discountEuroShown: number; discountPctShown: number }): Promise<Booking> {
    const bookingData = {
      ...booking,
      totalPrice: booking.totalPrice.toString(),
      discountEuroShown: booking.discountEuroShown.toString(),
      discountPctShown: booking.discountPctShown.toString()
    };
    const [newBooking] = await db.insert(bookings).values(bookingData).returning();
    return newBooking;
  }

  async updateBooking(id: string, booking: UpdateBooking): Promise<Booking> {
    const [updatedBooking] = await db
      .update(bookings)
      .set({ ...booking, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return updatedBooking;
  }

  async deleteBooking(id: string): Promise<void> {
    await db.delete(bookings).where(eq(bookings.id, id));
  }

  async getNextBookingCode(): Promise<string> {
    return await db.transaction(async (tx) => {
      // Get or create the sequence
      let [sequence] = await tx.select().from(bookingSequence).limit(1);
      
      if (!sequence) {
        [sequence] = await tx.insert(bookingSequence).values({ lastValue: 1 }).returning();
      } else {
        [sequence] = await tx
          .update(bookingSequence)
          .set({ lastValue: sequence.lastValue + 1 })
          .where(eq(bookingSequence.id, sequence.id))
          .returning();
      }
      
      return `08${sequence.lastValue.toString().padStart(4, '0')}`;
    });
  }

  async getVehicleAvailability(vehicleId: string, startDate?: string, endDate?: string): Promise<{ availableQuantity: number; blackoutDates: string[] }> {
    const vehicle = await this.getVehicle(vehicleId);
    if (!vehicle) {
      return { availableQuantity: 0, blackoutDates: [] };
    }

    // Get blackout dates in the date range
    const blackoutConditions = [eq(blackoutDates.vehicleId, vehicleId)];
    if (startDate && endDate) {
      blackoutConditions.push(between(blackoutDates.date, startDate, endDate));
    }
    
    const blackouts = await db
      .select()
      .from(blackoutDates)
      .where(and(...blackoutConditions));

    // Get overlapping bookings
    let overlappingBookings: any[] = [];
    if (startDate && endDate) {
      overlappingBookings = await db
        .select()
        .from(bookings)
        .where(
          and(
            eq(bookings.vehicleId, vehicleId),
            sql`${bookings.startDate} <= ${endDate}`,
            sql`${bookings.endDate} >= ${startDate}`,
            sql`${bookings.status} IN ('PENDING', 'CONFIRMED')`
          )
        );
    }

    const bookedQuantity = overlappingBookings.length;
    const availableQuantity = Math.max(0, vehicle.quantity - bookedQuantity);

    return {
      availableQuantity,
      blackoutDates: blackouts.map(b => b.date)
    };
  }

  // New method to get fully booked dates for a specific vehicle model
  async getFullyBookedDates(vehicleId: string): Promise<string[]> {
    const vehicle = await this.getVehicle(vehicleId);
    if (!vehicle) return [];

    // Get all bookings for this vehicle for the next 3 months
    const today = new Date();
    const threeMonthsFromNow = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
    
    const allBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.vehicleId, vehicleId),
          sql`${bookings.status} IN ('PENDING', 'CONFIRMED')`,
          sql`${bookings.startDate} <= ${threeMonthsFromNow.toISOString().split('T')[0]}`,
          sql`${bookings.endDate} >= ${today.toISOString().split('T')[0]}`
        )
      );

    // Group bookings by date and count them
    const dateBookingCounts: { [key: string]: number } = {};
    
    for (const booking of allBookings) {
      const startDate = new Date(booking.startDate);
      const endDate = new Date(booking.endDate);
      
      // Count each day in the booking period
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        dateBookingCounts[dateStr] = (dateBookingCounts[dateStr] || 0) + 1;
      }
    }

    // Return dates where bookings >= vehicle quantity
    return Object.keys(dateBookingCounts).filter(date => 
      dateBookingCounts[date] >= vehicle.quantity
    );
  }

  async getBlackoutDates(vehicleId: string): Promise<BlackoutDate[]> {
    return await db
      .select()
      .from(blackoutDates)
      .where(eq(blackoutDates.vehicleId, vehicleId))
      .orderBy(blackoutDates.date);
  }

  async createBlackoutDate(blackout: InsertBlackoutDate): Promise<BlackoutDate> {
    const [newBlackout] = await db.insert(blackoutDates).values(blackout).returning();
    return newBlackout;
  }

  async deleteBlackoutDate(id: string): Promise<void> {
    await db.delete(blackoutDates).where(eq(blackoutDates.id, id));
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee;
  }

  async getEmployeeByUsername(username: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.username, username));
    return employee;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db.insert(employees).values(employee).returning();
    return newEmployee;
  }

  async calculateQuote(queryParams: any): Promise<any> {
    const { vehicleId, startDate, endDate, packageType = 'STANDARD_24H', kmPlan = 'KM_100', coverage = 'BASE', extraDriver = false, extraDriverUnder25 = false, homeDelivery = false, homePickup = false } = queryParams;
    
    const vehicle = await this.getVehicle(vehicleId);
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    const days = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
    const basePrice = parseFloat(vehicle.basePriceDay);
    
    let baseTotal = basePrice * days;
    
    // Apply multi-day discounts
    let discountPct = 0;
    if (days >= 7 && days < 15) discountPct = 10;
    else if (days >= 15 && days < 30) discountPct = 15;
    else if (days >= 30) discountPct = 20;
    
    const discountEuro = Math.round((baseTotal * discountPct) / 100);
    baseTotal = baseTotal - discountEuro;
    
    // Calculate extras
    const extras: Array<{ name: string; price: number }> = [];
    
    if (coverage === 'PARTIAL') {
      extras.push({ name: 'Copertura Parziale', price: 15 * days });
    }
    
    if (extraDriver) {
      const extraDriverCost = extraDriverUnder25 ? 15 * days : 5 * days;
      extras.push({ name: extraDriverUnder25 ? 'Guidatore Aggiuntivo Under 25' : 'Guidatore Aggiuntivo', price: extraDriverCost });
    }
    
    if (homeDelivery) {
      extras.push({ name: 'Consegna a Domicilio', price: 25 });
    }
    
    if (homePickup) {
      extras.push({ name: 'Ritiro a Domicilio', price: 25 });
    }
    
    const extrasTotal = extras.reduce((sum, extra) => sum + extra.price, 0);
    const total = baseTotal + extrasTotal;
    
    return {
      days,
      baseTotal: baseTotal.toFixed(2),
      discountPct,
      discountEuro: discountEuro.toFixed(2),
      extras,
      total: total.toFixed(2),
      packageType,
      kmPlan,
      coverage,
      extraDriver,
      extraDriverUnder25,
      homeDelivery,
      homePickup
    };
  }
}

export const storage = new DatabaseStorage();
