import jwt from 'jsonwebtoken';
import { logger } from '@ugm/logger';
import userService from '../services/userService.js';
import { TOKEN_SECRET } from '../config/env.js';
/**
 * Middleware to authenticate JWT token
 */
export async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        res.sendStatus(401);
        return;
    }
    try {
        const decoded = jwt.verify(token, TOKEN_SECRET);
        // Verify user exists in database
        const user = await userService.getUserById(decoded.userId);
        if (!user) {
            res.sendStatus(403);
            return;
        }
        req.user = {
            userId: decoded.userId,
            username: decoded.username,
            authMethod: 'jwt'
        };
        next();
    }
    catch (err) {
        logger.error('Authentication error:', err);
        res.sendStatus(403);
    }
}
export default { authenticateToken };
