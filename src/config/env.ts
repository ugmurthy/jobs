import dotenv from 'dotenv';
import {logger} from '@ugm/logger';

// Load environment variables
dotenv.config();

// Set logger level
logger.level = 'debug';

// Environment variables
export const PORT = process.env.PORT || 4000;
export const TOKEN_SECRET = process.env.TOKEN_SECRET as string;

// Validate required environment variables
if (!TOKEN_SECRET) {
  logger.error('TOKEN_SECRET environment variable is required');
  process.exit(1);
}

export default {
  PORT,
  TOKEN_SECRET
};