import { GraphQLError } from 'graphql';

export class AppError extends GraphQLError {
  constructor(message: string, code: string) {
    super(message, {
      extensions: {
        code,
      },
    });
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 'RESOURCE_NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
  }
}

export class BookingNotFoundError extends AppError {
  constructor(message = 'Booking with the specified ID was not found.') {
    super(message, 'BOOKING_NOT_FOUND');
  }
}

export class BookingConflictError extends AppError {
  constructor(message = 'The resource already has a confirmed booking during the requested time.') {
    super(message, 'BOOKING_CONFLICT');
  }
}

export class InvalidTimeRangeError extends AppError {
  constructor(message = 'startTime must be earlier than endTime.') {
    super(message, 'INVALID_TIME_RANGE');
  }
}

export class InvalidCursorError extends AppError {
  constructor(message = 'The provided pagination cursor is invalid.') {
    super(message, 'INVALID_CURSOR');
  }
}
