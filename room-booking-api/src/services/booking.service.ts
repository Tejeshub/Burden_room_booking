import prisma from '../lib/prisma';
import {
  BookingNotFoundError,
  BookingConflictError,
  InvalidTimeRangeError,
  InvalidCursorError,
  ValidationError,
  NotFoundError,
} from '../lib/errors';
import { AvailabilityService, availabilityService as defaultAvailabilityService } from './availability.service';
import defaultPrisma from '../lib/prisma';
import { PrismaClient, Prisma } from '@prisma/client';

export interface BookingFilterInput {
  resourceId?: string;
  status?: 'CONFIRMED' | 'CANCELLED';
  startTimeFrom?: Date;
  startTimeTo?: Date;
}

export class BookingService {
  constructor(
    private prisma: PrismaClient = defaultPrisma,
    private availabilityService: AvailabilityService = defaultAvailabilityService
  ) {}

  private encodeCursor(startTime: Date, id: string): string {
    return Buffer.from(`${startTime.toISOString()}_${id}`).toString('base64');
  }

  private decodeCursor(cursor: string): { startTime: Date; id: string } {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('ascii');
      const [startTimeStr, id] = decoded.split('_');
      if (!startTimeStr || !id) throw new Error();
      const startTime = new Date(startTimeStr);
      if (isNaN(startTime.getTime())) throw new Error();
      return { startTime, id };
    } catch {
      throw new InvalidCursorError('The provided pagination cursor is invalid.');
    }
  }

  async getBookingById(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { resource: true },
    });

    if (!booking) {
      throw new BookingNotFoundError();
    }

    return booking;
  }

  async getBookings(filter?: BookingFilterInput, first?: number, after?: string) {
    const take = first ?? 10;
    const where: Prisma.BookingWhereInput = {};

    if (filter) {
      if (filter.resourceId) where.resourceId = filter.resourceId;
      if (filter.status) where.status = filter.status;
      if (filter.startTimeFrom || filter.startTimeTo) {
        where.startTime = {};
        if (filter.startTimeFrom) where.startTime.gte = filter.startTimeFrom;
        if (filter.startTimeTo) where.startTime.lte = filter.startTimeTo;
      }
    }

    let cursorOptions: Prisma.BookingWhereInput = {};
    if (after) {
      const { startTime, id } = this.decodeCursor(after);
      // We need to implement cursor-based pagination using startTime and id
      // Since prisma's cursor requires a unique identifier, and we are sorting by startTime ASC then id ASC
      cursorOptions = {
        OR: [
          { startTime: { gt: startTime } },
          { startTime, id: { gt: id } },
        ],
      };
    }

    const bookings = await this.prisma.booking.findMany({
      where: {
        AND: [where, cursorOptions].filter(Boolean),
      },
      orderBy: [
        { startTime: 'asc' },
        { id: 'asc' },
      ],
      take: take + 1, // Fetch one extra to determine hasNextPage
      include: { resource: true },
    });

    const hasNextPage = bookings.length > take;
    const edges = bookings.slice(0, take).map((booking) => ({
      cursor: this.encodeCursor(booking.startTime, booking.id),
      node: booking,
    }));

    const endCursor = edges.length > 0 ? edges[edges.length - 1].cursor : null;

    return {
      edges,
      pageInfo: {
        hasNextPage,
        endCursor,
      },
    };
  }

  async createBooking(input: { title: string; resourceId: string; startTime: Date; endTime: Date }) {
    const title = input.title.trim();
    if (!title) {
      throw new ValidationError('Booking title is required.');
    }

    if (input.startTime >= input.endTime) {
      throw new InvalidTimeRangeError('startTime must be earlier than endTime.');
    }

    const resource = await this.prisma.resource.findUnique({ where: { id: input.resourceId } });
    if (!resource) {
      throw new NotFoundError('Resource with the specified ID was not found.');
    }

    const { available } = await this.availabilityService.checkAvailability(
      input.resourceId,
      input.startTime,
      input.endTime
    );

    if (!available) {
      throw new BookingConflictError();
    }

    return this.prisma.booking.create({
      data: {
        title,
        resourceId: input.resourceId,
        startTime: input.startTime,
        endTime: input.endTime,
        status: 'CONFIRMED',
      },
      include: { resource: true },
    });
  }

  async cancelBooking(id: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      throw new BookingNotFoundError();
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { resource: true },
    });
  }

  async deleteBooking(id: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      throw new BookingNotFoundError();
    }

    return this.prisma.booking.delete({
      where: { id },
      include: { resource: true },
    });
  }

  async rescheduleBooking(input: { bookingId: string; startTime: Date; endTime: Date }) {
    if (input.startTime >= input.endTime) {
      throw new InvalidTimeRangeError('startTime must be earlier than endTime.');
    }

    const booking = await this.prisma.booking.findUnique({ where: { id: input.bookingId } });
    if (!booking) {
      throw new BookingNotFoundError();
    }

    const conflicts = await this.availabilityService.findConflictingBookings(
      booking.resourceId,
      input.startTime,
      input.endTime,
      booking.id
    );

    if (conflicts.length > 0) {
      throw new BookingConflictError();
    }

    return this.prisma.booking.update({
      where: { id: input.bookingId },
      data: {
        startTime: input.startTime,
        endTime: input.endTime,
      },
      include: { resource: true },
    });
  }
}

export const bookingService = new BookingService();
