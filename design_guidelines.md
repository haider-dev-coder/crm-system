# Real Estate CRM Design Guidelines

## Design Approach: Ant Design System + Real Estate Industry Standards

**Selected Framework:** Ant Design (enterprise-grade UI system optimized for data-rich applications)

**Industry Reference:** Inspired by modern CRM platforms (Salesforce, HubSpot, Pipedrive) with Real Estate-specific adaptations for property visualization and location-based data.

**Core Principle:** Professional efficiency meets visual clarity - every pixel serves the user's workflow while maintaining credibility expected in real estate transactions.

---

## Color Palette

### Light Mode
- **Primary Brand:** 217 91% 60% (Professional blue - trust and reliability)
- **Success/Active Deals:** 142 76% 36% (Closing green)
- **Warning/Pending:** 38 92% 50% (Attention amber)
- **Error/Declined:** 0 84% 60% (Clear red)
- **Neutral Base:** 220 13% 91% (Background)
- **Text Primary:** 220 13% 18%
- **Text Secondary:** 220 9% 46%

### Dark Mode
- **Primary Brand:** 217 91% 65%
- **Background:** 220 13% 13%
- **Surface:** 220 13% 18%
- **Text Primary:** 220 13% 91%
- **Text Secondary:** 220 9% 65%

### Role-Specific Accent Colors
- **Admin:** 271 81% 56% (Purple - authority)
- **Agent:** 217 91% 60% (Blue - primary)
- **Owner:** 24 90% 50% (Orange - ownership)

---

## Typography

**Font Family:** 
- Primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
- Monospace (data/IDs): 'JetBrains Mono', 'Courier New', monospace

**Scale & Usage:**
- **Display/Dashboard Headers:** 2xl (24px), font-bold, tracking-tight
- **Section Headers:** xl (20px), font-semibold
- **Card Titles:** lg (18px), font-medium
- **Body Text:** base (16px), font-normal
- **Table/List Data:** sm (14px), font-normal
- **Metadata/Timestamps:** xs (12px), text-secondary

---

## Layout System

**Spacing Primitives:** Tailwind units of 1, 2, 4, 6, 8, 12, 16
- Component padding: p-4 to p-6
- Section margins: my-8 to my-12
- Card gaps: gap-4 to gap-6
- Dashboard grid gaps: gap-6

**Grid Structure:**
- Dashboard metrics: 4-column grid (lg:grid-cols-4)
- Property cards: 3-column grid (lg:grid-cols-3)
- Kanban columns: Flexible width with min-w-80
- Forms: 2-column layout (lg:grid-cols-2) with full-width for complex inputs

**Container Strategy:**
- Max-width: max-w-7xl for main content areas
- Sidebar: Fixed 256px (w-64) collapsible to 64px icon-only
- Full-bleed for maps and data tables

---

## Core Component Library

### Navigation & Layout
- **Top Navigation:** Fixed header with company logo, global search, notifications bell, user profile dropdown
- **Sidebar Navigation:** Icon + text menu with active state highlighting, role-based menu items, collapsible sections for sub-menus
- **Breadcrumbs:** Always visible for deep navigation (Dashboard > Leads > Contact Details)

### Dashboard Components
- **Metric Cards:** Gradient background cards with large numbers, trend indicators (↑↓), sparkline charts, icon badges
- **Quick Actions:** Floating action button (+ New) with dropdown for Lead/Property/Task/Deal
- **Chart Widgets:** Bar charts for monthly performance, pie charts for deal status distribution, line charts for revenue trends using recharts library
- **Activity Feed:** Timeline component with avatar, action type, timestamp, "Load more" pagination

### Data Display
- **Kanban Board:** Draggable cards with color-coded status headers, card counts, progress bars, inline quick-edit
- **Data Tables:** Ant Design Table with sortable columns, inline filters, row selection, bulk actions toolbar, pagination with page size selector
- **Property Cards:** Image thumbnail, address, price (prominent), key specs (bed/bath/sqft), status badge, quick action buttons
- **Contact Cards:** Avatar with initials fallback, name/role, contact methods (phone/email), tags, last activity indicator

### Forms & Inputs
- **Property Form:** Multi-step wizard with progress indicator, image upload grid (4-6 images), map pin selector, address autocomplete, price input with currency formatting
- **Lead Form:** Two-column layout, categorized sections (Personal Info, Property Interest, Source), tags input, notes textarea
- **Offer Builder:** Side-by-side comparison (property details | offer terms), commission calculator, document attachment zone

### Messaging Center
- **Unified Inbox:** Left sidebar with channel tabs (WhatsApp/Email/SMS), middle panel with conversation list (avatar, preview, timestamp, unread badge), right panel with full conversation thread
- **Message Composer:** Rich text editor, attachment button, template dropdown, send button
- **Quick Templates:** Modal with searchable template library, preview pane, insert/customize buttons

### Document Management
- **Upload Zone:** Dashed border drag-drop area, file type icons, progress bars, preview thumbnails in grid
- **Document List:** Table view with filename, type icon, size, upload date, attached to (lead/deal/property link), actions (download, delete, share)

### Calendar & Tasks
- **Calendar View:** Month/week/day toggle, drag-to-create events, color-coded by task type, agent filter dropdown
- **Task List:** Checkbox, priority flag, task title, assignee avatar, due date, edit icon
- **Task Detail:** Full-screen modal with description, subtasks checklist, comments section, file attachments

### Reports & Analytics
- **Filter Panel:** Date range picker, agent multi-select, property type checkboxes, apply/reset buttons
- **Performance Charts:** Agent comparison bar chart, revenue trend line, conversion funnel, top properties table
- **Leaderboard:** Ranked list with medals for top 3, profile pictures, metrics (deals closed, revenue, response time)

### Settings
- **User Management Table:** Avatar, name, role badge, email, status toggle (active/inactive), edit/delete actions
- **Profile Editor:** Avatar upload with crop, form fields, password change section, two-factor authentication toggle
- **Theme Selector:** Color picker for primary brand color, preset swatches, live preview
- **API Configuration:** Input fields for WhatsApp Business API, Twilio credentials, test connection button, status indicator

---

## Interaction Patterns

- **Hover States:** Subtle elevation (shadow-md to shadow-lg), scale(1.02) transform for cards
- **Loading States:** Ant Design Skeleton screens for tables/cards, spinner for buttons
- **Empty States:** Centered illustration + message + primary action button
- **Notifications:** Toast messages (top-right) for success/error, 4-second auto-dismiss
- **Modals:** Centered overlay with backdrop blur, close icon, primary/secondary action buttons
- **Animations:** Smooth 200ms transitions, slide-in for drawers, fade for tooltips (use sparingly)

---

## Images & Visual Assets

**Hero Image Strategy:** No traditional hero - dashboard is immediate focal point

**Image Usage:**
1. **Property Listings:** High-quality real estate photos in 16:9 ratio, primary image prominent with thumbnail gallery
2. **Profile Avatars:** Circular crop, fallback to initials with role-based background color
3. **Empty States:** Custom illustrations for "No leads yet", "No properties", "No messages" using simple line art style
4. **Map Integration:** Leaflet map with custom property markers (house icon with status color dot)
5. **Background Patterns:** Subtle dot grid or line pattern on dashboard header only

**Icon Strategy:** Ant Design Icons throughout - use outlined style for inactive states, filled for active/selected states

---

## Responsive Behavior

- **Desktop (1280px+):** Full sidebar, 4-column dashboard, side-by-side forms
- **Tablet (768px-1279px):** Collapsible sidebar, 2-column dashboard, stacked forms
- **Mobile (<768px):** Hidden sidebar with hamburger menu, single column layout, bottom navigation for primary actions, swipeable Kanban columns