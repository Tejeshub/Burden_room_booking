# Room Booking System

A robust, full-stack room booking platform built with Next.js, Bun, GraphQL, and PostgreSQL. It features real-time conflict detection, concurrency handling via database constraints, and dynamic frontend updates through React Query.

## Live Demo

- **Live Frontend (Vercel):** [https://burden-room-booking.vercel.app/](https://burden-room-booking.vercel.app/)
- **Backend GraphQL API (Render):** [https://room-booking-api-7xgj.onrender.com/graphql](https://room-booking-api-7xgj.onrender.com/graphql)
- **Backend Health Check:** [https://room-booking-api-7xgj.onrender.com/health](https://room-booking-api-7xgj.onrender.com/health)

## Features

- **Create resources/rooms:** Define new bookable entities with specific capacities.
- **View all resources:** Browse available spaces and their properties.
- **Create bookings:** Schedule reservations dynamically.
- **View bookings:** List and filter through all existing reservations.
- **Check resource availability:** Determine availability within a chosen time frame before attempting to book.
- **Prevent overlapping bookings:** Complete database-level guarantee against scheduling conflicts.
- **Cancel bookings:** Cancel reservations and automatically free up blocks of time.
- **Delete bookings:** Completely remove bookings from the database.
- **Dynamic dashboard:** Displays real-time database statistics (total resources, live availability, confirmed bookings, etc.).
- **Persistent storage:** All data is reliably persisted in a PostgreSQL database hosted on Supabase.
- **Real-time synchronization:** The frontend stays synchronized immediately utilizing GraphQL queries, mutations, and React Query cache invalidation.

## Technology Stack

- **Frontend:** React, Next.js, Tailwind CSS
- **Backend:** Bun, TypeScript
- **API:** GraphQL (via GraphQL Yoga)
- **Database:** PostgreSQL (hosted on Supabase)
- **ORM:** Prisma
- **Data Fetching (Frontend):** TanStack React Query, `graphql-request`
- **Testing:** Bun's native testing module
- **Deployment:** Vercel (Frontend), Render (Backend)

## System Architecture

```mermaid
graph TD;
    User([User]) -->|HTTP / GraphQL| Frontend[Vercel: Next.js Frontend]
    Frontend -->|GraphQL Queries/Mutations| Backend[Render: Bun Backend API]
    Backend -->|Prisma Client| Database[(Supabase: PostgreSQL)]
```

## Project Folder Structure

```text
Burden_Aissg/
├── frontend/             # Next.js Application
│   ├── app/              # Next.js Pages & Layouts
│   ├── components/       # Shared UI Components
│   ├── lib/              # API Utilities and GraphQL Definitions
│   └── package.json      # Frontend Dependencies
└── room-booking-api/     # Bun & GraphQL Backend
    ├── prisma/           # Schema & PostgreSQL Migrations
    ├── src/
    │   ├── graphql/      # GraphQL Type Definitions and Resolvers
    │   ├── services/     # Core Business Logic Services
    │   └── index.ts      # Server Entry Point
    ├── tests/            # Automated Integration Tests
    └── package.json      # Backend Dependencies
```

## How the System Works

The system operates strictly on a connected graph layer. The Next.js frontend sends GraphQL operation requests using `graphql-request`. These mutations and queries are processed by the backend GraphQL Yoga server running on Bun. The backend's service layer executes database operations safely using the Prisma ORM, resolving the frontend's request cleanly via PostgreSQL. 

## Resource Management Workflow

1. A user attempts to create a room. 
2. The UI collects the Name and Capacity.
3. The frontend dispatches `CREATE_RESOURCE`. 
4. The backend validates and inserts the new resource into the PostgreSQL `Resource` table. 
5. React Query invalidates the local resource cache, instantly repainting the dashboard and dropdown fields.

## Booking Workflow

1. A user attempts to create a booking for a specific date and time block. 
2. The frontend triggers the `CREATE_BOOKING` GraphQL mutation.
3. The backend structures a native ISO timestamp representation and instructs Prisma to create a `CONFIRMED` booking. 
4. If successful, the booking registers and updates the global calendar.

## Availability Checking Workflow

1. The frontend invokes `CHECK_AVAILABILITY` given a targeted `resourceId` and `[startTime, endTime)`. 
2. The backend queries Prisma to identify any `CONFIRMED` bookings overlapping the requested interval. 
3. Based on the return payload, the UI actively prevents or allows the user to proceed with booking confirmation.

## Double-Booking Prevention and Concurrency Handling

Preventing double-booking relies on strict atomic database operations. Even if multiple users attempt to schedule the same room at the precise same millisecond, the application is protected by a PostgreSQL `EXCLUDE` constraint utilizing `GiST` index bounds. 

```sql
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_no_overlap_excl"
EXCLUDE USING gist (
  "resourceId" WITH =,
  tsrange("startTime", "endTime", '[)') WITH &&
)
WHERE (status = 'CONFIRMED');
```

This enforces half-open intervals `[)`. For example: a booking from `09:00-10:00` seamlessly allows a follow-up booking from `10:00-11:00`, but entirely halts an attempt for `09:30-10:30`. 

### Validation Flow Diagram

```mermaid
graph TD;
    A[Create Booking Request] --> B[GraphQL Resolver]
    B --> C[Attempt Database Insert via Prisma]
    C --> D{PostgreSQL EXCLUDE Constraint}
    D -- Pass --> E[Booking Confirmed & Saved]
    D -- Fail --> F[Booking Conflict Error Thrown]
    F --> G[Frontend Formats User-Friendly Message]
```

## GraphQL API Overview

The backend fully utilizes Schema-first architecture. 

**Key Queries:**
- `resources`: Fetch all rooms.
- `bookings(filter, first, after)`: Paginated fetch of global bookings. 
- `checkAvailability(resourceId, startTime, endTime)`: Calculates overlap dynamically.

**Key Mutations:**
- `createResource(input)`: Generates a new room block.
- `createBooking(input)`: Generates a new schedule block.
- `cancelBooking(id)`: Changes booking status to `CANCELLED`, freeing up the time. 
- `deleteBooking(id)`: Removes the entity from the database completely.

## Database Design

The PostgreSQL schema centers around two core tables dynamically related:
- **Resource**: Contains `id`, `name`, `capacity`.
- **Booking**: Contains `id`, `title`, `resourceId` (FK), `startTime`, `endTime`, `status`. 
- **TestResource / TestBooking**: Strictly isolated identical clones of the primary tables for executing robust backend tests without mutating real production data. 

## API Deployment Architecture

The API operates on a bare metal Bun runtime hosted in Render's web services. The build process guarantees generation of the Prisma client strictly using native `bun run db:generate`. It binds effectively to host `0.0.0.0` allowing persistent connectivity, monitored constantly by the `/health` REST endpoint. 

## Automated Testing

The backend suite is strictly validated using Bun's native test runner against live Postgres data. However, tests actively utilize a Javascript **Proxy** layer over Prisma. When the `BookingService` targets `prisma.booking`, the proxy seamlessly intercepts the query and routes it to `prisma.testBooking`. 

This guarantees:
- **Zero Mocking:** Tests evaluate real database constraints against the real service logic.
- **Zero Pollution:** Your active production tables are never accessed nor deleted during teardowns. 

Test Scenarios included:
- Creating and retrieving a booking.
- Back-to-back bookings succeeding.
- Overlapping bookings natively failing via database rejection.
- Concurrent double-booking prevention correctly returning rejection arrays.

## Local Installation and Setup

**1. Clone the repository:**
```bash
git clone https://github.com/Tejeshub/Burden_room_booking.git
cd Burden_room_booking
```

**2. Install Frontend Dependencies:**
```bash
cd frontend
npm install
# or bun install
```

**3. Install Backend Dependencies:**
```bash
cd ../room-booking-api
bun install
```

## Environment Variables

You will need to create `.env` files in both directories. 

**Backend (`room-booking-api/.env`)**:
```env
# Do not expose real database credentials.
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
PORT=4000
```

**Frontend (`frontend/.env.local`)**:
```env
# Point this to the local backend during development, or the Render URL for production
NEXT_PUBLIC_GRAPHQL_API_URL="http://localhost:4000/graphql"
```

## Backend Commands

Navigate to `room-booking-api/` and run:
- **Start Development Server**: `bun run dev`
- **Start Production Server**: `bun run start`
- **Run Tests**: `bun run test`
- **Database Migrations**: `bun run db:migrate`
- **Generate Prisma Client**: `bun run db:generate`

## Frontend Commands

Navigate to `frontend/` and run:
- **Start Development Server**: `npm run dev` (or `bun run dev`)
- **Build Production**: `npm run build`
- **Start Production Server**: `npm run start`

## Deployment Information

**Frontend (Vercel)**
- Connect the Vercel app to the GitHub repository.
- Root directory set to `frontend/`.
- Ensure `NEXT_PUBLIC_GRAPHQL_API_URL` environment variable is mapped to the Render endpoint.

**Backend (Render)**
- Connect a new Web Service to the GitHub repository.
- Root directory set to `room-booking-api/`.
- Runtime set to `Bun`.
- Build Command: `bun run db:generate`
- Start Command: `bun run start`
- Supply the production Supabase `DATABASE_URL` safely inside the Render Environment variable vault. 

## Key Technical Highlights

1. **Database-Level Conflict Protection**: Completely eliminating race conditions where frontend overlap checks succeed but milliseconds alter the database state. 
2. **Javascript Proxy Test Redirection**: Flawlessly isolating integration testing pipelines on production-grade schema layouts without deleting actual user data. 
3. **Optimistic React UI State**: Highly resilient UI interactions tied deeply to `queryClient.invalidateQueries` that forces the DOM into synchronicity with the backend upon mutation success. 
4. **Clean Error Parsing**: Granular GraphQL abstraction to parse backend runtime faults and constraint violations into perfectly legible human formats (`"This resource is already booked"` vs `"Error: 500 P3006"`). 

## Screenshots


| ![Dashboard Overview] | ![Resource Creation] |
|--------------------|-------------------|
|  (./Screenshots/dashboardOverview.png) | (./Screenshots/ResourceCreation.png)|

| ![Availability Check] | ![Booking Conflicts]
|--------------------|-------------------|
| (./Screenshots/availabilityCheck.png)   | (./Screenshots/bookingConflict.png) |  |

## Future Improvements

- Add robust User Authentication/Authorization (Role-based booking permissions).
- Expand calendar visualization with a month/week-based grid view.
- Enable complex booking structures (Recurring meetings).
- Enable "Reschedule" UI bindings to efficiently drag-and-drop bookings between time gaps.

## Conclusion

The Room Booking System exemplifies modern full-stack implementation balancing speed, safety, and scale. With Next.js providing reactive elegance on the client, Bun maximizing API throughput, and PostgreSQL aggressively preventing structural inaccuracies, the application is both beautiful and bulletproof.
