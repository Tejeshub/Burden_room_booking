import prisma from '../lib/prisma';
import { PrismaClient } from '@prisma/client';

export interface GraphQLContext {
  prisma: PrismaClient;
}

export async function createContext(): Promise<GraphQLContext> {
  return {
    prisma,
  };
}
