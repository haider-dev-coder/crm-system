# Real Estate CRM

## Overview

A comprehensive Real Estate CRM platform built for managing leads, properties, deals, tasks, and communications. The system provides a unified interface for real estate agents and administrators to streamline their workflow, track sales pipelines, manage property listings, and communicate with clients across multiple channels (WhatsApp, Email, SMS).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool

**UI Component System**: Hybrid approach combining shadcn/ui (Radix UI primitives) with Ant Design influences
- shadcn/ui components provide the base UI primitives with full customization
- Design system follows Ant Design enterprise patterns for data-rich applications
- Custom Tailwind CSS configuration with role-specific color schemes and theme support

**Routing**: wouter for client-side routing

**State Management**: 
- TanStack React Query for server state and API data caching
- React Context for authentication state
- Local component state for UI interactions

**Design System Features**:
- Light/dark theme support with persistent user preference
- Professional color palette optimized for real estate workflows
- Role-based accent colors (Admin: purple, Agent: blue, Owner: orange)
- Inter font family for UI, JetBrains Mono for data/IDs

### Backend Architecture

**Runtime**: Node.js with Express.js server

**API Pattern**: RESTful API with JWT-based authentication
- Token-based auth with bcrypt password hashing
- Authentication middleware protecting routes
- Role-based access control (ADMIN, AGENT, OWNER roles)

**File Upload**: Multer middleware for document and image uploads

**Development Setup**: 
- Vite dev server with HMR in development mode
- Express serves static files in production
- Middleware logging for API requests

### Data Storage

**Database**: PostgreSQL (via Neon serverless)

**ORM**: Drizzle ORM with type-safe schema definitions

**Schema Design**:
- `users` - User accounts with role-based access
- `leads` - Sales leads with assignment and status tracking
- `properties` - Property listings with geolocation data (latitude/longitude)
- `deals` - Sales transactions linked to leads and properties
- `tasks` - Calendar tasks with priority and assignment
- `messages` - Multi-channel communication history
- `documents` - File attachments with metadata
- `activities` - Activity feed/audit trail

**Key Data Patterns**:
- UUID primary keys for all entities
- Foreign key relationships between users, leads, properties, and deals
- Array fields for tags, images, and features
- Timestamp tracking (createdAt, updatedAt)
- Geospatial data support for property mapping

### Authentication & Authorization

**Authentication Flow**:
- JWT tokens stored in localStorage
- Token passed via Authorization header
- Automatic token validation and refresh
- 401 responses trigger logout and redirect to login

**Session Management**:
- AuthContext provider wraps the application
- User data fetched on mount if token exists
- Persistent authentication across page reloads

### External Dependencies

**UI & Visualization**:
- Radix UI primitives (@radix-ui/*) for accessible component foundation
- Recharts for data visualization (revenue charts, performance metrics)
- Leaflet with react-leaflet for property mapping and geolocation
- Ant Design (antd) for additional enterprise UI patterns

**Form & Validation**:
- React Hook Form with @hookform/resolvers
- Zod for schema validation (drizzle-zod integration)

**Styling**:
- Tailwind CSS for utility-first styling
- class-variance-authority for component variants
- Custom CSS variables for theming

**Development Tools**:
- TypeScript for type safety
- ESBuild for production bundling
- Drizzle Kit for database migrations
- Replit-specific plugins for development environment

**Third-Party Integrations** (UI Components):
- WhatsApp messaging interface (react-icons/si for icon)
- Email and SMS communication channels
- Document upload and management system
- Map-based property visualization with OpenStreetMap tiles

**Database Infrastructure**:
- Neon serverless PostgreSQL with WebSocket support
- Connection pooling via @neondatabase/serverless
- Drizzle ORM migrations in `./migrations` directory