# Real Estate CRM Application

## Overview
A comprehensive full-stack Real Estate CRM system designed to streamline real estate operations. It supports multi-role authentication and complete CRM workflows including lead management, property listings, deals tracking, task management, messaging, and analytics. The project aims to provide a robust platform for real estate professionals.

## User Preferences
- Professional color scheme: Primary blue (#3b82f6)
- Role-specific accents: Admin (purple), Agent (blue), Owner (orange)
- Clean, modern design inspired by witei.com
- Sidebar navigation with collapsible menu
- Dark mode support

## System Architecture

### Core Technologies
- **Backend**: Node.js with TypeScript, Express.js
- **Frontend**: React with TypeScript, Ant Design, shadcn/ui, Tailwind CSS
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT
- **State Management**: TanStack Query (React Query)
- **Mapping**: Leaflet
- **Charting**: Recharts

### Key Features
- **Authentication & Security**: JWT token-based, Role-based Access Control (ADMIN, AGENT, OWNER), password hashing.
- **Lead Management**: 14-column table with inline editing, status pipeline (New, Contacted, Qualified, Negotiation, Closed), Excel import/export with exact column matching (Date, Lead Type, Sender Name, Sender Number, Property Type, Purpose, Price AED, Location, Sub Location, Agent Name, Bayut/Dubizzle, Assigned To, Status, Pinned Notes), cascade deletion, search by sender/location/agent, optimistic updates.
- **Property Management**: Listings with images, interactive map view, status tracking, detailed property attributes, image uploads via object storage.
- **Deal Workflow**: Offer management, automatic commission calculation, deal status tracking, linking to leads and properties.
- **Task & Calendar**: Task creation, assignment, due date tracking, priority levels, file attachments, calendar view.
- **Messaging**: Conversation threads, multi-channel support simulation (WhatsApp, Email, SMS), message templates.
- **Analytics & Reports**: Dashboard metrics (leads, properties, revenue, conversion), performance charts, activity feed.
- **UI/UX**: Responsive design for all pages, Excel-like tables with inline editing and optimistic updates, property cards with image carousels, AED currency formatting.

### Database Schema
- `users`: User accounts with role-based access (firstName, lastName, email, role, phone, avatar).
- `leads`: Sales leads restructured to match Excel import format with fields: id (serial PK), date (auto-generated timestamp), leadType, senderName (required), senderNumber (required), propertyType, purpose, price, location, subLocation, agentName, source (Bayut/Dubizzle), assignedTo (FK to users), pinnedNotes, status (new/contacted/qualified/negotiation/closed). Cascade deletion removes related deals, tasks, and documents.
- `properties`: Property listings with location data.
- `deals`: Offers and transactions with commission tracking.
- `tasks`: Task management with assignments and due dates.
- `messages`: Unified messaging center.
- `documents`: Document management.
- `activities`: Activity feed for tracking user actions.

## External Dependencies
- **Replit Object Storage**: For storing property images and documents.
- **Leaflet**: For interactive property location mapping.
- **Recharts**: For data visualization and analytics charts.
- **xlsx library**: For Excel import/export functionality in lead management.