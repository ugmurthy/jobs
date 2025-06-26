import pkg from '@prisma/client';
const { PrismaClient } = pkg;

// Create a singleton instance of PrismaClient
const prisma = new PrismaClient();

export default prisma;