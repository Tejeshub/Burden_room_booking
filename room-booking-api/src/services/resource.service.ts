import prisma from '../lib/prisma';
import { NotFoundError, ValidationError } from '../lib/errors';

export class ResourceService {
  async getResources() {
    return prisma.resource.findMany({
      include: {
        bookings: true,
      },
    });
  }

  async getResourceById(id: string) {
    const resource = await prisma.resource.findUnique({
      where: { id },
      include: {
        bookings: true,
      },
    });

    if (!resource) {
      throw new NotFoundError('Resource with the specified ID was not found.');
    }

    return resource;
  }

  async createResource(input: { name: string; capacity: number }) {
    const name = input.name.trim();
    if (!name) {
      throw new ValidationError('Resource name is required.');
    }

    if (!Number.isInteger(input.capacity) || input.capacity < 0) {
      throw new ValidationError('Capacity must be a non-negative integer.');
    }

    return prisma.resource.create({
      data: {
        name,
        capacity: input.capacity,
      },
      include: {
        bookings: true,
      }
    });
  }
}

export const resourceService = new ResourceService();
