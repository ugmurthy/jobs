import prisma from '../lib/prisma.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { SignOptions } from 'jsonwebtoken';

// Define our own User interface since we're having issues with the Prisma generated one
interface User {
  id: number;
  username: string;
  password: string;
  email?: string | null;
  webhookUrl?: string | null;
  refreshToken?: string | null;
  refreshTokenExpiry?: Date | null;
  resetToken?: string | null;
  resetTokenExpiry?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRegistrationData {
  username: string;
  password: string;
  email?: string;
  webhookUrl?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserPayload {
  userId: number;
  username: string;
}

export class UserService {
  // Register a new user
  async register(data: UserRegistrationData): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    return prisma.user.create({
      data: {
        username: data.username,
        password: hashedPassword,
        email: data.email,
        webhookUrl: data.webhookUrl
      }
    }) as Promise<User>;
  }
  
  // Authenticate a user and generate tokens
  async login(username: string, password: string): Promise<AuthTokens | null> {
    const user = await prisma.user.findUnique({ where: { username } }) as User | null;
    
    if (!user) return null;
    
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) return null;
    
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
  async logout(userId: number): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        refreshToken: null,
        refreshTokenExpiry: null
      }
    });
  }
  
  // Refresh an access token using a refresh token
  async refreshToken(refreshToken: string): Promise<string | null> {
    const user = await prisma.user.findFirst({
      where: {
        refreshToken,
        refreshTokenExpiry: {
          gt: new Date()
        }
      }
    }) as User | null;
    
    if (!user) return null;
    
    // Generate new access token
    return this.generateAccessToken(user);
  }
  
  // Generate a password reset token
  async generatePasswordResetToken(email: string): Promise<string | null> {
    const user = await prisma.user.findUnique({ where: { email } }) as User | null;
    if (!user) return null;
    
    const resetToken = jwt.sign(
      { userId: user.id },
      process.env.TOKEN_SECRET || '',
      { expiresIn: '1h' } as SignOptions
    );
    
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
  async resetPassword(resetToken: string, newPassword: string): Promise<boolean> {
    const user = await prisma.user.findFirst({
      where: {
        resetToken,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    }) as User | null;
    
    if (!user) return false;
    
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
  async getUserById(id: number): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } }) as Promise<User | null>;
  }
  
  // Get user by username
  async getUserByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { username } }) as Promise<User | null>;
  }
  
  // Update user webhook URL
  async updateWebhookUrl(userId: number, webhookUrl: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { webhookUrl }
    }) as Promise<User>;
  }
  
  // Helper methods for token generation
  private generateAccessToken(user: User): string {
    return jwt.sign(
      { userId: user.id, username: user.username },
      process.env.TOKEN_SECRET || '',
      { expiresIn: process.env.TOKEN_EXPIRY || '1800s' } as SignOptions
    );
  }
  
  private generateRefreshToken(user: User): string {
    return jwt.sign(
      { userId: user.id },
      process.env.REFRESH_TOKEN_SECRET || '',
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' } as SignOptions
    );
  }
}

export default new UserService();