import { request, gql } from 'graphql-request'

const API_URL = process.env.NEXT_PUBLIC_GRAPHQL_API_URL || 'http://localhost:4000/graphql'

export const GET_RESOURCES = gql`
  query GetResources {
    resources {
      id
      name
      capacity
      createdAt
      bookings {
        id
        title
        startTime
        endTime
        status
      }
    }
  }
`

export const GET_BOOKINGS = gql`
  query GetBookings($filter: BookingFilterInput) {
    bookings(filter: $filter) {
      edges {
        node {
          id
          title
          startTime
          endTime
          status
          resourceId
          resource {
            id
            name
          }
        }
      }
    }
  }
`

export const CREATE_RESOURCE = gql`
  mutation CreateResource($input: CreateResourceInput!) {
    createResource(input: $input) {
      id
      name
      capacity
    }
  }
`

export const CREATE_BOOKING = gql`
  mutation CreateBooking($input: CreateBookingInput!) {
    createBooking(input: $input) {
      id
      title
      status
    }
  }
`

export const CANCEL_BOOKING = gql`
  mutation CancelBooking($id: ID!) {
    cancelBooking(id: $id) {
      id
      status
    }
  }
`

export const DELETE_BOOKING = gql`
  mutation DeleteBooking($id: ID!) {
    deleteBooking(id: $id) {
      id
    }
  }
`

export const CHECK_AVAILABILITY = gql`
  query CheckAvailability($resourceId: ID!, $startTime: DateTime!, $endTime: DateTime!) {
    checkAvailability(resourceId: $resourceId, startTime: $startTime, endTime: $endTime) {
      available
      conflictingBookings {
        id
        title
        startTime
        endTime
      }
    }
  }
`

export const fetcher = (query: string, variables?: any) => request(API_URL, query, variables)

export function parseGraphQLError(error: any): string {
  try {
    const errorString = typeof error === 'string' ? error : JSON.stringify(error)
    if (
      errorString.includes('BOOKING_CONFLICT') || 
      errorString.includes('already has a confirmed booking') || 
      errorString.includes('conflict') || 
      errorString.includes('overlap') ||
      errorString.includes('Booking_no_overlap_excl') // Database constraint failure fallback
    ) {
      return 'This resource is already booked for the selected time. Please choose another time or resource.'
    }

    if (error?.response?.errors && error.response.errors.length > 0) {
      return error.response.errors[0].message || 'An unexpected error occurred.'
    }
  } catch (e) {}

  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred.'
}
