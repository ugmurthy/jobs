import prisma from '../lib/prisma.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
export class UserService {
    // Register a new user
    async register(data) {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        return prisma.user.create({
            data: {
                username: data.username,
                password: hashedPassword,
                email: data.email,
                webhookUrl: data.webhookUrl
            }
        });
    }
    // Authenticate a user and generate tokens
    async login(username, password) {
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user)
            return null;
        const passwordValid = await bcrypt.compare(password, user.password);
        if (!passwordValid)
            return null;
        // Generate tokens
        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);
        // Store refresh token in database
        await prisma.user.update({
            where: { id: user.id },
            data: {
                refreshToken,
                refreshTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            }
        });
        return { accessToken, refreshToken };
    }
    // Logout a user by invalidating their refresh token
    async logout(userId) {
        await prisma.user.update({
            where: { id: userId },
            data: {
                refreshToken: null,
                refreshTokenExpiry: null
            }
        });
    }
    // Refresh an access token using a refresh token
    async refreshToken(refreshToken) {
        const user = await prisma.user.findFirst({
            where: {
                refreshToken,
                refreshTokenExpiry: {
                    gt: new Date()
                }
            }
        });
        if (!user)
            return null;
        // Generate new access token
        return this.generateAccessToken(user);
    }
    // Generate a password reset token
    async generatePasswordResetToken(email) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user)
            return null;
        const resetToken = jwt.sign({ userId: user.id }, process.env.TOKEN_SECRET || '', { expiresIn: '1h' });
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
            }
        });
        return resetToken;
    }
    // Reset password using a reset token
    async resetPassword(resetToken, newPassword) {
        const user = await prisma.user.findFirst({
            where: {
                resetToken,
                resetTokenExpiry: {
                    gt: new Date()
                }
            }
        });
        if (!user)
            return false;
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null
            }
        });
        return true;
    }
    // Get user by ID
    async getUserById(id) {
        return prisma.user.findUnique({ where: { id } });
    }
    // Get user by username
    async getUserByUsername(username) {
        return prisma.user.findUnique({ where: { username } });
    }
    // Update user webhook URL
    async updateWebhookUrl(userId, webhookUrl) {
        return prisma.user.update({
            where: { id: userId },
            data: { webhookUrl }
        });
    }
    // Helper methods for token generation
    generateAccessToken(user) {
        return jwt.sign({ userId: user.id, username: user.username }, process.env.TOKEN_SECRET || '', { expiresIn: process.env.TOKEN_EXPIRY || '1800s' });
    }
    generateRefreshToken(user) {
        return jwt.sign({ userId: user.id }, process.env.REFRESH_TOKEN_SECRET || '', { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' });
    }
}
export default new UserService();
