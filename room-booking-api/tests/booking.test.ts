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

test('Should create and retrieve a booking in isolated test tables', async () => {
  const resource = await testPrisma.resource.create({
    data: { name: 'Isolated Test Room', capacity: 10 },
  });

  const startTime = new Date('2026-08-26T10:00:00.000Z');
  const endTime = new Date('2026-08-26T11:00:00.000Z');

  const booking = await testBookingService.createBooking({
    title: 'Isolated Meeting',
    resourceId: resource.id,
    startTime,
    endTime,
  });

  expect(booking).toBeDefined();
  expect(booking.title).toBe('Isolated Meeting');
});

test('Back-to-back bookings should succeed in isolated test tables', async () => {
  const resource = await testPrisma.resource.findFirst();
  
  const startTime = new Date('2026-08-26T11:00:00.000Z');
  const endTime = new Date('2026-08-26T12:00:00.000Z');

  const booking = await testBookingService.createBooking({
    title: 'Next Isolated Meeting',
    resourceId: resource!.id,
    startTime,
    endTime,
  });

  expect(booking).toBeDefined();
});

test('Overlapping bookings should fail in isolated test tables', async () => {
  const resource = await testPrisma.resource.findFirst();
  
  const startTime = new Date('2026-08-26T10:30:00.000Z');
  const endTime = new Date('2026-08-26T11:30:00.000Z');

  expect(testBookingService.createBooking({
    title: 'Conflict Isolated Meeting',
    resourceId: resource!.id,
    startTime,
    endTime,
  })).rejects.toThrow('The resource already has a confirmed booking during the requested time.');
});
