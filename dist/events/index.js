import { logger } from '@ugm/logger';
import { initializeJobEvents } from './jobEvents.js';
import { initializeSocketEvents } from './socketEvents.js';
/**
 * Initialize all event handlers
 */
export const initializeEvents = (io, queueEvents) => {
    logger.info('Initializing event handlers...');
    // Initialize job events
    initializeJobEvents(io, queueEvents);
    // Initialize socket events
    initializeSocketEvents(io);
    logger.info('All event handlers initialized');
};
export default { initializeEvents };
