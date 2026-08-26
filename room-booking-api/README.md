# Room Booking API - Phase 1 & 2

## Overview
This is the backend of the BurdenOff Room Booking GraphQL API. It provides a foundation using Bun, TypeScript, Prisma, and GraphQL Yoga with schema-first GraphQL definitions.
Phase 2 features complete Core Booking System logic including overlap detection, cursor-based pagination, check availability, reschedule, and cancellation.

## Tech Stack
- Bun
- TypeScript (Strict Mode)
- GraphQL Yoga
- Prisma (PostgreSQL via Supabase)

## Installation
```sh
bun install
```

## Environment Setup
Copy `.env.example` to `.env` and configure your Supabase PostgreSQL URL:
```sh
cp .env.example .env
```

## Database Setup
Ensure your `.env` is configured with the actual credentials, then run:
```sh
bun run db:generate
bun run db:migrate
```

## Running the Server
```sh
bun run dev
```
The GraphQL endpoint will be available at `http://localhost:4000/graphql`.

## Booking Logic Rules
- **Overlap Detection:** Two CONFIRMED bookings for the same resource must never overlap.
- **Half-Open Intervals:** `[startTime, endTime)`. Back-to-back bookings (e.g., 10:00 → 11:00 and 11:00 → 12:00) are explicitly allowed.
- **Cancelled Bookings:** Bookings with `CANCELLED` status no longer block availability and don't participate in conflict detection.
- **Pagination:** Uses opaque base64-encoded cursors based on `startTime + id` ensuring deterministic ordering (`startTime ASC`, `id ASC`).

## Example Queries

**Create Resource:**
```graphql
mutation {
  createResource(input: {
    name: "Conference Room A",
    capacity: 10
  }) {
    id
    name
  }
}
```

**Create Booking:**
```graphql
mutation {
  createBooking(
    input: {
      title: "Team Meeting"
      resourceId: "RESOURCE_ID"
      startTime: "2026-08-26T10:00:00.000Z"
      endTime: "2026-08-26T11:00:00.000Z"
    }
  ) {
    id
    title
    status
  }
}
```

**Check Availability:**
```graphql
query {
  checkAvailability(
    resourceId: "RESOURCE_ID"
    startTime: "2026-08-26T10:00:00.000Z"
    endTime: "2026-08-26T11:00:00.000Z"
  ) {
    available
    conflictingBookings {
      id
    }
  }
}
```

**Paginated Bookings:**
```graphql
query {
  bookings(first: 10) {
    edges {
      cursor
      node {
        id
        title
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```
