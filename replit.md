# CICO Rent - Vehicle Rental Management System

## Overview

CICO Rent is a full-stack vehicle rental management system built for FGS Gas in Rome, Italy. The application provides a modern web interface for customers to browse and book rental vehicles (cars and vans) with real-time pricing calculation. It includes an admin dashboard for employees to manage bookings, pricing, blackout dates, and generate rental contracts.

The system features a customer-facing website with vehicle listings, detailed product pages with pricing calculators, and dual booking flows (online booking and phone-based booking). The admin panel allows staff to manage the entire rental operation including inventory, pricing, availability, and customer communications.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client application is built with React 18 and TypeScript using a modern component-based architecture. The UI leverages shadcn/ui components built on Radix UI primitives for accessibility and consistency. State management is handled through React Query (TanStack Query) for server state and React's built-in state management for local component state.

The routing system uses Wouter for lightweight client-side routing. The application supports responsive design with Tailwind CSS for styling and includes mobile-specific features like direct phone dialing on mobile devices.

### Backend Architecture
The server is built with Express.js and TypeScript, following a RESTful API design pattern. The application uses session-based authentication with express-session for admin users, employing bcrypt for password hashing.

The database layer uses Drizzle ORM with PostgreSQL for type-safe database operations. The schema includes tables for vehicles, bookings, blackout dates, employees, and a booking sequence counter for generating progressive booking codes.

### Database Design
PostgreSQL database with the following core entities:
- **Vehicles**: Store vehicle information, pricing, availability quantities, and color options
- **Bookings**: Customer booking details with comprehensive pricing breakdown and status tracking
- **Blackout Dates**: Date-specific availability restrictions per vehicle
- **Employees**: Staff authentication and role management
- **Booking Sequence**: Progressive booking code generation (format: 08XXXX)

The schema uses enum types for controlled values (vehicle types, package types, coverage options, booking status) and includes proper foreign key relationships with cascade deletes.

### Pricing Engine
Complex pricing calculation system that handles:
- Multi-day rental discounts with tiered pricing
- Different package types (standard 24h, hourly for vans, weekly/monthly)
- Kilometer plans and coverage options
- Additional driver fees with age-based pricing
- Home delivery/pickup services
- Real-time quote generation with detailed breakdowns

### Authentication & Authorization
Session-based authentication for admin users with role-based access control (STAFF/ADMIN roles). The system uses secure session configuration with httpOnly cookies and CSRF protection.

### Email Integration
Automated email system using Nodemailer with SMTP configuration for:
- Customer booking confirmations with detailed booking information
- Admin notifications for new bookings
- Email templates with booking codes and pricing details

### PDF Generation
Contract generation system using HTML templates with placeholder replacement. The system is designed to integrate with Puppeteer for PDF generation from HTML templates.

### File Structure
The application follows a monorepo structure with shared types and schemas:
- `/client` - React frontend application
- `/server` - Express.js backend
- `/shared` - Shared TypeScript types and Drizzle schemas
- Clear separation of concerns with dedicated service layers

## External Dependencies

### Database
- **Neon Database**: PostgreSQL hosting with connection pooling via `@neondatabase/serverless`
- **Drizzle ORM**: Type-safe database queries and migrations

### UI Components
- **Radix UI**: Headless UI component primitives for accessibility
- **shadcn/ui**: Pre-built component library built on Radix UI
- **Tailwind CSS**: Utility-first CSS framework for styling

### Authentication
- **bcrypt**: Password hashing for admin users
- **express-session**: Session management with configurable storage

### Email Services
- **Nodemailer**: Email sending via SMTP (configured for Aruba hosting)
- SMTP configuration: `smtps.aruba.it:465` with SSL

### State Management
- **TanStack React Query**: Server state management, caching, and synchronization
- **React Hook Form**: Form state management with validation
- **Zod**: Runtime type validation and schema validation

### Development Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety across the entire application
- **ESBuild**: Fast JavaScript bundler for production builds

### Styling & Icons
- **Font Awesome**: Icon library for UI elements
- **Google Fonts**: Inter font family for typography
- **CSS Variables**: Theme-based color system with brand colors

### Utilities
- **date-fns**: Date manipulation and formatting
- **clsx**: Conditional className utility
- **nanoid**: Unique ID generation

The system is designed to run on Replit with specific plugins and configurations for the development environment, including runtime error overlays and cartographer integration for debugging.