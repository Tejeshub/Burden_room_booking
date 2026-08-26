import { bookingService } from '../../services/booking.service';
import { availabilityService } from '../../services/availability.service';
import { NotFoundError } from '../../lib/errors';
import prisma from '../../lib/prisma';

export const bookingResolvers = {
  Query: {
    booking: (_: any, { id }: { id: string }) => bookingService.getBookingById(id),
    bookings: (_: any, args: any) => bookingService.getBookings(args.filter, args.first, args.after),
    checkAvailability: async (_: any, { resourceId, startTime, endTime }: any) => {
      const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
      if (!resource) throw new NotFoundError('Resource with the specified ID was not found.');
      if (startTime >= endTime) throw new Error('startTime must be earlier than endTime.');
      return availabilityService.checkAvailability(resourceId, startTime, endTime);
    },
  },
  Mutation: {
    createBooking: (_: any, { input }: any) => bookingService.createBooking(input),
    cancelBooking: (_: any, { id }: { id: string }) => bookingService.cancelBooking(id),
    deleteBooking: (_: any, { id }: { id: string }) => bookingService.deleteBooking(id),
    rescheduleBooking: (_: any, { input }: any) => bookingService.rescheduleBooking(input),
  },
};
