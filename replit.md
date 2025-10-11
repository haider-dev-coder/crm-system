# Real Estate CRM Application

## Overview
A comprehensive full-stack Real Estate CRM system built with Node.js, Express, PostgreSQL (Drizzle ORM), React, and Ant Design. The application supports multi-role authentication and complete CRM workflows including lead management, property listings, deals tracking, task management, messaging, and analytics.

## Project Status
✅ **Fully Functional MVP** - Backend APIs complete, Frontend connected to real data, Authentication working

## Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT with bcrypt password hashing
- **File Storage**: Replit Object Storage
- **API**: RESTful JSON APIs

### Frontend
- **Framework**: React with TypeScript
- **UI Library**: Ant Design + shadcn/ui components
- **Routing**: Wouter
- **State Management**: TanStack Query (React Query)
- **Styling**: Tailwind CSS
- **Maps**: Leaflet for property location mapping
- **Charts**: Recharts for analytics visualization

## Architecture

### Database Schema (`shared/schema.ts`)
- **users**: User accounts with role-based access (ADMIN, AGENT, OWNER)
- **leads**: Sales leads with pipeline status tracking
- **properties**: Property listings with location data
- **deals**: Offers and transactions with commission tracking
- **tasks**: Task management with assignments and due dates
- **messages**: Unified messaging center (WhatsApp/Email/SMS simulation)
- **documents**: Document management with object storage
- **activities**: Activity feed for tracking user actions

### Backend Routes (`server/routes.ts`)
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `GET /api/analytics` - Dashboard metrics and charts data
- `GET /api/activities` - Recent activity feed
- `GET /api/leads` - Get all leads
- `POST /api/leads` - Create new lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead
- `GET /api/properties` - Get all properties
- `POST /api/properties` - Create property
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property
- `GET /api/deals` - Get all deals
- `POST /api/deals` - Create deal
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `POST /api/tasks/:id/file` - Upload task attachment
- `GET /api/messages` - Get messages
- `POST /api/messages` - Send message
- `GET /api/documents` - Get documents
- `POST /api/documents/upload` - Upload document
- `GET /api/users` - Get all users (admin only)

### Frontend Pages
- **Login** (`/login`): JWT-based authentication
- **Dashboard** (`/`): Metrics, charts, activity feed
- **Leads** (`/leads`): Kanban board pipeline management
- **Properties** (`/properties`): Property listings with map view
- **Messages** (`/messages`): Unified messaging center
- **Tasks** (`/tasks`): Calendar and task management
- **Documents** (`/documents`): Document library
- **Reports** (`/reports`): Performance analytics
- **Settings** (`/settings`): User and system settings

## Key Features

### Authentication & Security
- JWT token-based authentication
- Role-based access control (ADMIN, AGENT, OWNER)
- Password hashing with bcrypt
- Protected API routes
- Auto-logout on token expiration

### Lead Management
- Kanban board with drag-and-drop (5 stages: New, Contacted, Qualified, Negotiation, Closed)
- Lead search and filtering
- Tag and categorization system
- Lead assignment to agents
- Activity tracking

### Property Management
- Property listings with images
- Interactive map view with Leaflet
- Status tracking (available, pending, sold)
- Property details (beds, baths, sqft, price)
- Image uploads via object storage

### Deal Workflow
- Offer management
- Commission calculation (automatic)
- Deal status tracking
- Link deals to leads and properties

### Task & Calendar
- Task creation and assignment
- Due date tracking
- Priority levels
- File attachments
- Calendar view

### Messaging
- Conversation threads
- Multi-channel support (WhatsApp, Email, SMS simulation)
- Message templates
- Real-time-style interface

### Analytics & Reports
- Dashboard metrics (leads, properties, revenue, conversion)
- Performance charts
- Activity feed
- Revenue tracking

## Demo Credentials

```
Admin:  admin@realestate.com / demo123
Agent:  agent@realestate.com / demo123
Agent:  sarah@realestate.com / demo123
```

## Database Seed Data

The database is pre-populated with:
- 3 demo users (1 admin, 2 agents)
- 3 sample leads (various pipeline stages)
- 3 properties (different types and locations)
- 1 completed deal
- 2 active tasks
- Sample messages and activities

To reseed the database:
```bash
npx tsx server/seed.ts
```

## Development

### Running the Application
```bash
npm run dev
```
This starts both backend (Express on port 5000) and frontend (Vite dev server).

### Database Management
```bash
# Push schema changes to database
npm run db:push

# Generate database types
npm run db:generate
```

### File Structure
```
├── client/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/       # Page components
│   │   ├── lib/         # Auth, API client
│   │   └── App.tsx      # Main app component
├── server/
│   ├── index.ts         # Express server
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Database interface
│   └── seed.ts          # Seed script
├── shared/
│   └── schema.ts        # Drizzle schema & types
└── db/
    └── index.ts         # Database connection
```

## API Integration Status

### ✅ Completed Integrations
- Authentication (login, logout, user state)
- Dashboard (analytics, metrics)
- Leads (fetch, display on Kanban, create new leads)
  - Add Lead dialog with complete form (name, email, phone, property interest, budget, status, tags, notes)
  - Form validation and error handling
  - Success/error toast notifications
  - Automatic cache invalidation and refresh

### 🚧 In Progress
- Lead update and delete operations
- Properties page API integration
- Tasks page API integration
- Messages page API integration
- Documents page API integration

## Known Limitations

1. **Security**: JWT tokens stored in localStorage (XSS vulnerability) - should migrate to httpOnly cookies
2. **File Upload**: Currently configured but needs frontend form integration
3. **Real-time Features**: Messaging is simulated, not real-time WebSocket
4. **Role Permissions**: Backend has role checks, frontend UI doesn't fully restrict based on roles

## User Preferences
- Professional color scheme: Primary blue (#3b82f6)
- Role-specific accents: Admin (purple), Agent (blue), Owner (orange)
- Clean, modern design inspired by witei.com
- Sidebar navigation with collapsible menu
- Dark mode support

## Recent Changes
- **2025-10-11**: Connected frontend pages to backend APIs and implemented Add Lead functionality
  - Dashboard now fetches real analytics data
  - Leads page displays actual leads from database
  - Kanban board organized by real lead status
  - Authentication flow fully functional with JWT
  - Fixed auth state management issues
  - **Add Lead Dialog**: Complete form with all fields (name, email, phone, property interest, budget, status, tags, notes)
    - Tags field uses comma-separated input that converts to array
    - Form validation with required field checks
    - POST mutation with success/error handling
    - Automatic cache invalidation to refresh Kanban board
    - Toast notifications for user feedback
    - Tested end-to-end successfully

## Next Steps
1. Complete API integration for remaining pages (Properties, Tasks, Messages, Documents)
2. Implement CRUD mutations for all entities
3. Add form dialogs for creating/editing leads, properties, tasks
4. Migrate JWT to httpOnly cookies for better security
5. Add real-time messaging with WebSocket
6. Implement comprehensive role-based UI restrictions
