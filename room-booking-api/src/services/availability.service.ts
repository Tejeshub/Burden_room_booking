import defaultPrisma from '../lib/prisma';
import { PrismaClient } from '@prisma/client';

export class AvailabilityService {
  constructor(private prisma: PrismaClient = defaultPrisma) {}

  async findConflictingBookings(resourceId: string, startTime: Date, endTime: Date, excludeBookingId?: string) {
    const whereClause: any = {
      resourceId,
      status: 'CONFIRMED',
      startTime: {
        lt: endTime,
      },
      endTime: {
        gt: startTime,
      },
    };

    if (excludeBookingId) {
      whereClause.id = {
        not: excludeBookingId,
      };
    }

    return this.prisma.booking.findMany({
      where: whereClause,
      include: {
        resource: true,
      },
    });
  }

  async checkAvailability(resourceId: string, startTime: Date, endTime: Date) {
    const conflictingBookings = await this.findConflictingBookings(resourceId, startTime, endTime);

    return {
      available: conflictingBookings.length === 0,
      conflictingBookings,
    };
  }
}

export const availabilityService = new AvailabilityService();
