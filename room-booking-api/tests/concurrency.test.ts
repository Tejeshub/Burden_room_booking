import { expect, test, beforeAll, afterAll } from 'bun:test';
import { PrismaClient } from '@prisma/client';
import prisma from '../src/lib/prisma';
import { BookingService } from '../src/services/booking.service';
import { AvailabilityService } from '../src/services/availability.service';

const testPrisma = new Proxy(prisma, {
  get(target: any, prop: string) {
    if (prop === 'booking') return target.testBooking;
    if (prop === 'resource') return target.testResource;
    return target[prop];
  }
}) as PrismaClient;

const testAvailabilityService = new AvailabilityService(testPrisma);
const testBookingService = new BookingService(testPrisma, testAvailabilityService);

beforeAll(async () => {
  await testPrisma.booking.deleteMany();
  await testPrisma.resource.deleteMany();
});

afterAll(async () => {
  await testPrisma.booking.deleteMany();
  await testPrisma.resource.deleteMany();
  await prisma.$disconnect();
});

test('Database EXCLUDE constraint should prevent concurrent double booking in isolated test tables', async () => {
  const resource = await testPrisma.resource.create({
    data: { name: 'Isolated Concurrency Room', capacity: 5 },
  });

  const startTime = new Date('2026-09-01T10:00:00.000Z');
  const endTime = new Date('2026-09-01T11:00:00.000Z');

  const results = await Promise.allSettled([
    testBookingService.createBooking({
      title: 'Isolated Meeting 1',
      resourceId: resource.id,
      startTime,
      endTime,
    }),
    testBookingService.createBooking({
      title: 'Isolated Meeting 2',
      resourceId: resource.id,
      startTime,
      endTime,
    })
  ]);

  const fulfilled = results.filter(r => r.status === 'fulfilled');
  const rejected = results.filter(r => r.status === 'rejected');

  expect(fulfilled.length).toBe(1);
  expect(rejected.length).toBe(1);

  const bookings = await testPrisma.booking.findMany({
    where: { resourceId: resource.id }
  });

  expect(bookings.length).toBe(1);
});
