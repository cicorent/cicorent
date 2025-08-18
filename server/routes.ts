import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { computeQuote } from "./services/pricingService";
import { sendBookingConfirmationToCustomer, sendBookingNotificationToAdmin } from "./services/emailService";
import { generateContract } from "./services/pdfService";
import { authenticateEmployee, requireAdmin, loginEmployee } from "./middleware/auth";
import { quoteInputSchema, insertBookingSchema } from "@shared/schema";
import session from "express-session";
import bcrypt from "bcrypt";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'cico-rent-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Public API routes

  // Get all vehicles
  app.get('/api/vehicles', async (req, res) => {
    try {
      const vehicles = await storage.getVehicles();
      res.json(vehicles);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      res.status(500).json({ message: 'Errore nel recupero dei veicoli' });
    }
  });

  // Get vehicle by ID
  app.get('/api/vehicles/:id', async (req, res) => {
    try {
      const vehicle = await storage.getVehicle(req.params.id);
      if (!vehicle) {
        return res.status(404).json({ message: 'Veicolo non trovato' });
      }
      res.json(vehicle);
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      res.status(500).json({ message: 'Errore nel recupero del veicolo' });
    }
  });

  // Check vehicle availability
  app.get('/api/vehicles/:vehicleId/availability', async (req, res) => {
    try {
      const { vehicleId } = req.params;
      const { from, to } = req.query;

      if (!from || !to) {
        return res.status(400).json({ message: 'Parametri from e to richiesti' });
      }

      const availability = await storage.getVehicleAvailability(
        vehicleId,
        from as string,
        to as string
      );

      res.json(availability);
    } catch (error) {
      console.error('Error checking availability:', error);
      res.status(500).json({ message: 'Errore nel controllo disponibilità' });
    }
  });

  // Get vehicle availability with specific date range (for legacy compatibility)
  app.get('/api/vehicles/:id/availability/:startDate/:endDate', async (req, res) => {
    try {
      const { id, startDate, endDate } = req.params;
      const availability = await storage.getVehicleAvailability(id, startDate, endDate);
      res.json(availability);
    } catch (error) {
      console.error('Error getting vehicle availability:', error);
      res.status(500).json({ message: 'Errore nel recupero della disponibilità' });
    }
  });

  // Get fully booked dates for a vehicle
  app.get('/api/vehicles/:id/fully-booked', async (req, res) => {
    try {
      const { id } = req.params;
      const fullyBookedDates = await storage.getFullyBookedDates(id);
      res.json(fullyBookedDates);
    } catch (error) {
      console.error('Error getting fully booked dates:', error);
      res.status(500).json({ message: 'Errore nel recupero delle date non disponibili' });
    }
  });

  // Calculate quote
  app.get('/api/quote', async (req, res) => {
    try {
      const quote = await storage.calculateQuote(req.query);
      res.json(quote);
    } catch (error) {
      console.error('Error calculating quote:', error);
      res.status(500).json({ message: 'Errore nel calcolo del preventivo' });
    }
  });

  // Create booking
  app.post('/api/bookings', async (req, res) => {
    try {
      // Validate input
      const bookingData = insertBookingSchema.parse(req.body);
      
      // Get vehicle
      const vehicle = await storage.getVehicle(bookingData.vehicleId);
      if (!vehicle) {
        return res.status(404).json({ message: 'Veicolo non trovato' });
      }

      // Check availability
      const availability = await storage.getVehicleAvailability(
        bookingData.vehicleId,
        bookingData.startDate,
        bookingData.endDate
      );

      if (availability.availableQuantity <= 0) {
        return res.status(400).json({ message: 'Veicolo non disponibile nel periodo selezionato' });
      }

      if (availability.blackoutDates.length > 0) {
        return res.status(400).json({ 
          message: 'Il periodo selezionato include date non disponibili',
          blackoutDates: availability.blackoutDates
        });
      }

      // Calculate pricing
      const quoteInput = {
        vehicleId: bookingData.vehicleId,
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        packageType: bookingData.packageType,
        kmPlan: bookingData.kmPlan,
        coverage: bookingData.coverage,
        extraDriver: bookingData.extraDriver || false,
        extraDriverUnder25: bookingData.extraDriverUnder25 || false,
        homeDelivery: bookingData.homeDelivery || false,
        homePickup: bookingData.homePickup || false,
      };

      const quote = computeQuote(quoteInput, Number(vehicle.basePriceDay), vehicle.type);

      // Generate booking code
      const bookingCode = await storage.getNextBookingCode();

      // Create booking
      const booking = await storage.createBooking({
        ...bookingData,
        bookingCode,
        totalPrice: quote.total,
        discountEuroShown: quote.discountEuroShown,
        discountPctShown: quote.discountPctShown,
      });

      // Send emails (skip if SMTP credentials not configured)
      const fullBooking = { ...booking, vehicle };
      try {
        await Promise.all([
          sendBookingConfirmationToCustomer(fullBooking),
          sendBookingNotificationToAdmin(fullBooking)
        ]);
      } catch (emailError) {
        console.warn('Email sending failed, but booking was created successfully:', emailError);
        // Continue with booking creation even if emails fail
      }

      res.json({ 
        booking,
        message: 'Prenotazione creata con successo. Riceverai una chiamata da una nostra operatrice in giornata.' 
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Dati non validi', errors: error.errors });
      }
      res.status(500).json({ message: 'Errore nella creazione della prenotazione' });
    }
  });

  // Admin authentication routes

  // Login
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: 'Username e password richiesti' });
      }

      const employee = await loginEmployee(username, password);
      if (!employee) {
        return res.status(401).json({ message: 'Credenziali non valide' });
      }

      (req.session as any).employeeId = employee.id;
      (req.session as any).role = employee.role;

      res.json({
        id: employee.id,
        username: employee.username,
        role: employee.role,
      });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ message: 'Errore durante il login' });
    }
  });

  // Logout
  app.post('/api/admin/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Errore durante il logout' });
      }
      res.json({ message: 'Logout effettuato' });
    });
  });

  // Check auth status
  app.get('/api/admin/me', authenticateEmployee, (req, res) => {
    res.json({
      id: req.user!.id,
      username: req.user!.username,
      role: req.user!.role,
    });
  });

  // Protected admin routes

  // Get all bookings
  app.get('/api/admin/bookings', authenticateEmployee, async (req, res) => {
    try {
      const bookings = await storage.getBookings();
      res.json(bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      res.status(500).json({ message: 'Errore nel recupero delle prenotazioni' });
    }
  });

  // Update booking
  app.patch('/api/admin/bookings/:id', authenticateEmployee, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // If price-related fields are updated, recalculate pricing
      if (updates.packageType || updates.kmPlan || updates.coverage || 
          updates.extraDriver !== undefined || updates.extraDriverUnder25 !== undefined ||
          updates.homeDelivery !== undefined || updates.homePickup !== undefined) {
        
        const booking = await storage.getBooking(id);
        if (!booking) {
          return res.status(404).json({ message: 'Prenotazione non trovata' });
        }

        const quoteInput = {
          vehicleId: booking.vehicleId,
          startDate: updates.startDate || booking.startDate,
          endDate: updates.endDate || booking.endDate,
          packageType: updates.packageType || booking.packageType,
          kmPlan: updates.kmPlan || booking.kmPlan,
          coverage: updates.coverage || booking.coverage,
          extraDriver: updates.extraDriver ?? booking.extraDriver,
          extraDriverUnder25: updates.extraDriverUnder25 ?? booking.extraDriverUnder25,
          homeDelivery: updates.homeDelivery ?? booking.homeDelivery,
          homePickup: updates.homePickup ?? booking.homePickup,
        };

        const quote = computeQuote(quoteInput, Number(booking.vehicle.basePriceDay), booking.vehicle.type);
        
        updates.totalPrice = quote.total;
        updates.discountEuroShown = quote.discountEuroShown;
        updates.discountPctShown = quote.discountPctShown;
      }

      const updatedBooking = await storage.updateBooking(id, updates);
      res.json(updatedBooking);
    } catch (error) {
      console.error('Error updating booking:', error);
      res.status(500).json({ message: 'Errore nell\'aggiornamento della prenotazione' });
    }
  });

  // Delete booking
  app.delete('/api/admin/bookings/:id', authenticateEmployee, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteBooking(id);
      res.json({ message: 'Prenotazione cancellata' });
    } catch (error) {
      console.error('Error deleting booking:', error);
      res.status(500).json({ message: 'Errore nella cancellazione della prenotazione' });
    }
  });

  // Generate contract PDF
  app.get('/api/admin/bookings/:id/contract', authenticateEmployee, async (req, res) => {
    try {
      const { id } = req.params;
      const booking = await storage.getBooking(id);
      
      if (!booking) {
        return res.status(404).json({ message: 'Prenotazione non trovata' });
      }

      const pdf = await generateContract(booking);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="Contratto-${booking.bookingCode}.pdf"`);
      res.send(pdf);
    } catch (error) {
      console.error('Error generating contract:', error);
      res.status(500).json({ message: 'Errore nella generazione del contratto' });
    }
  });

  // Blackout dates routes
  app.get('/api/blackout-dates/:vehicleId', async (req, res) => {
    try {
      const { vehicleId } = req.params;
      const blackoutDates = await storage.getBlackoutDates(vehicleId);
      res.json(blackoutDates);
    } catch (error) {
      console.error('Error fetching blackout dates:', error);
      res.status(500).json({ message: 'Errore nel recupero delle date bloccate' });
    }
  });

  app.post('/api/blackout-dates', authenticateEmployee, async (req, res) => {
    try {
      const blackoutData = req.body;
      const blackout = await storage.createBlackoutDate(blackoutData);
      res.json(blackout);
    } catch (error) {
      console.error('Error creating blackout date:', error);
      res.status(500).json({ message: 'Errore nella creazione della data bloccata' });
    }
  });

  app.delete('/api/blackout-dates/:id', authenticateEmployee, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteBlackoutDate(id);
      res.json({ message: 'Data bloccata rimossa' });
    } catch (error) {
      console.error('Error deleting blackout date:', error);
      res.status(500).json({ message: 'Errore nella rimozione della data bloccata' });
    }
  });

  // Admin-only routes

  // Update vehicle prices
  app.patch('/api/admin/vehicles/:id', authenticateEmployee, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const vehicle = await storage.updateVehicle(id, updates);
      res.json(vehicle);
    } catch (error) {
      console.error('Error updating vehicle:', error);
      res.status(500).json({ message: 'Errore nell\'aggiornamento del veicolo' });
    }
  });

  // Blackout date management
  app.get('/api/admin/vehicles/:vehicleId/blackout', authenticateEmployee, async (req, res) => {
    try {
      const { vehicleId } = req.params;
      const blackouts = await storage.getBlackoutDates(vehicleId);
      res.json(blackouts);
    } catch (error) {
      console.error('Error fetching blackout dates:', error);
      res.status(500).json({ message: 'Errore nel recupero delle date di blackout' });
    }
  });

  app.post('/api/admin/vehicles/:vehicleId/blackout', authenticateEmployee, requireAdmin, async (req, res) => {
    try {
      const { vehicleId } = req.params;
      const { date } = req.body;
      
      if (!date) {
        return res.status(400).json({ message: 'Data richiesta' });
      }

      const blackout = await storage.createBlackoutDate({ vehicleId, date });
      res.json(blackout);
    } catch (error) {
      console.error('Error creating blackout date:', error);
      res.status(500).json({ message: 'Errore nella creazione della data di blackout' });
    }
  });

  app.delete('/api/admin/blackout/:id', authenticateEmployee, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteBlackoutDate(id);
      res.json({ message: 'Data di blackout rimossa' });
    } catch (error) {
      console.error('Error deleting blackout date:', error);
      res.status(500).json({ message: 'Errore nella rimozione della data di blackout' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
