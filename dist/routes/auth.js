import { Router } from 'express';
import { logger } from '@ugm/logger';
import userService from '../services/userService.js';
import { authenticate } from '../middleware/combinedAuth.js';
const router = Router();
/**
 * User registration route
 */
router.post('/register', async (req, res) => {
    try {
        const { username, password, email, webhookUrl } = req.body;
        // Validate input
        if (!username || !password) {
            res.status(400).json({ message: 'Username and password are required' });
            return;
        }
        // Check if user already exists
        const existingUser = await userService.getUserByUsername(username);
        if (existingUser) {
            res.status(409).json({ message: 'Username already exists' });
            return;
        }
        // Register user
        const user = await userService.register({ username, password, email, webhookUrl });
        // Generate tokens
        const tokens = await userService.login(username, password);
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                webhookUrl: user.webhookUrl
            },
            ...tokens
        });
    }
    catch (error) {
        logger.error('Registration error:', error);
        res.status(500).json({ message: 'An error occurred during registration' });
    }
});
/**
 * User login route
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        // Validate input
        if (!username || !password) {
            res.status(400).json({ message: 'Username and password are required' });
            return;
        }
        // Authenticate user
        const tokens = await userService.login(username, password);
        if (!tokens) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        res.json({
            message: 'Login successful',
            ...tokens
        });
    }
    catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({ message: 'An error occurred during login' });
    }
});
/**
 * User logout route
 */
router.post('/logout', authenticate, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }
        await userService.logout(req.user.userId);
        res.json({ message: 'Logout successful' });
    }
    catch (error) {
        logger.error('Logout error:', error);
        res.status(500).json({ message: 'An error occurred during logout' });
    }
});
/**
 * Token refresh route
 */
router.post('/refresh-token', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            res.status(400).json({ message: 'Refresh token is required' });
            return;
        }
        const accessToken = await userService.refreshToken(refreshToken);
        if (!accessToken) {
            res.status(401).json({ message: 'Invalid or expired refresh token' });
            return;
        }
        res.json({ accessToken });
    }
    catch (error) {
        logger.error('Token refresh error:', error);
        res.status(500).json({ message: 'An error occurred during token refresh' });
    }
});
/**
 * Password reset request route
 */
router.post('/request-password-reset', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ message: 'Email is required' });
            return;
        }
        const resetToken = await userService.generatePasswordResetToken(email);
        if (!resetToken) {
            // Don't reveal if email exists or not for security
            res.json({ message: 'If your email is registered, you will receive a password reset link' });
            return;
        }
        // In a real application, you would send an email with the reset link
        // For this example, we'll just return the token
        res.json({
            message: 'Password reset token generated',
            resetToken
        });
    }
    catch (error) {
        logger.error('Password reset request error:', error);
        res.status(500).json({ message: 'An error occurred during password reset request' });
    }
});
/**
 * Password reset route
 */
router.post('/reset-password', async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;
        if (!resetToken || !newPassword) {
            res.status(400).json({ message: 'Reset token and new password are required' });
            return;
        }
        const success = await userService.resetPassword(resetToken, newPassword);
        if (!success) {
            res.status(400).json({ message: 'Invalid or expired reset token' });
            return;
        }
        res.json({ message: 'Password reset successful' });
    }
    catch (error) {
        logger.error('Password reset error:', error);
        res.status(500).json({ message: 'An error occurred during password reset' });
    }
});
/**
 * Protected route example
 */
router.get('/protected', authenticate, (req, res) => {
    if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
    }
    res.json({ message: 'This is a protected route', user: req.user });
});
/**
 * Get current user information
 */
router.get('/me', authenticate, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }
        // Get full user details from database
        const user = await userService.getUserById(req.user.userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Return user without sensitive information
        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        });
    }
    catch (error) {
        logger.error('Error fetching current user:', error);
        res.status(500).json({ message: 'An error occurred while fetching user data' });
    }
});
export default router;
