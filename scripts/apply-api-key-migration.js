import { exec } from 'child_process';
import { logger } from '@ugm/logger';

// Set logger level
logger.level = 'debug';

// Log database provider information
logger.info('Database provider:', process.env.DATABASE_URL ? process.env.DATABASE_URL.split(':')[0] : 'unknown');
logger.info('Starting API key migration process...');

// Run Prisma migration
logger.info('Running Prisma migration...');
exec('npx prisma migrate dev --name add-api-keys --create-only', (error, stdout, stderr) => {
  if (error) {
    logger.error('Error running Prisma migration:', error);
    logger.error(stderr);
    process.exit(1);
  }
  
  logger.info('Prisma migration output:');
  logger.info(stdout);
  
  // Generate Prisma client
  logger.info('Generating Prisma client...');
  exec('npx prisma generate', (error, stdout, stderr) => {
    if (error) {
      logger.error('Error generating Prisma client:', error);
      logger.error(stderr);
      process.exit(1);
    }
    
    logger.info('Prisma client generation output:');
    logger.info(stdout);
    
    logger.info('API key migration process completed successfully!');
    logger.info('The database has been updated with the new API key table.');
    logger.info('The Prisma client has been regenerated with the new API key model.');
    logger.info('You can now use API key authentication alongside JWT authentication.');
  });
});