import { Router } from 'express';
import { logger } from '@ugm/logger';
import { authenticateToken } from '../middleware/auth.js';
import { serverAdapter } from '../config/bull.js';
const router = Router();
/**
 * Mount Bull Board UI
 * This is already handled in app.ts, but we're keeping this route
 * for potential future admin-specific routes
 */
router.use('/', serverAdapter.getRouter());
/**
 * Admin dashboard route
 * This is a placeholder for a future admin dashboard
 */
router.get('/dashboard', authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }
        // In a real application, you would check if the user has admin privileges
        // For now, we'll just return a simple message
        res.json({ message: 'Admin dashboard' });
    }
    catch (error) {
        logger.error('Admin dashboard error:', error);
        res.status(500).json({ message: 'An error occurred while accessing admin dashboard' });
    }
});
export default router;
