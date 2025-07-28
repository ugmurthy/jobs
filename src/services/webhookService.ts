import { logger } from '@ugm/logger';
import prisma from '../lib/prisma.js';
import userService from './userService.js';
import got from 'got';
import {
  WEBHOOK_EVENT_TYPES,
  WebhookEventType,
  WebhookEventUtils,
} from '../types/webhook-events.js';

// Re-export for backward compatibility
export const validEventTypes = WEBHOOK_EVENT_TYPES;
export type { WebhookEventType };

/**
 * Interface for webhook data
 */
export interface WebhookData {
  url: string;
  eventType: WebhookEventType;
  description?: string;
  active?: boolean;
  userId: number;
}

/**
 * Interface for webhook payload
 */
export interface WebhookPayload {
  id: string;
  jobname: string;
  userId: number;
  eventType: WebhookEventType;
  progress?: number;
  result?: any;
  error?: string;
  content?: any;
}

/**
 * Service for webhook-related operations
 */
class WebhookService {
  /**
   * Get all webhooks for a user
   */
  async getUserWebhooks(userId: number): Promise<any[]> {
    logger.info(`Getting webhooks for user ${userId}`);
    
    const webhooks = await prisma.webhook.findMany({
      where: { userId }
    });
    
    return webhooks;
  }

  /**
   * Create a new webhook
   */
  async createWebhook(webhookData: WebhookData): Promise<any> {
    logger.info(`Creating webhook for user ${webhookData.userId}`);
    
    // Validate event type
    if (!WebhookEventUtils.isValidEventType(webhookData.eventType)) {
      throw new Error(`Invalid event type. Must be one of: ${WEBHOOK_EVENT_TYPES.join(', ')}`);
    }
    
    // Check if webhook already exists
    const existingWebhook = await prisma.webhook.findFirst({
      where: {
        userId: webhookData.userId,
        url: webhookData.url,
        eventType: webhookData.eventType
      }
    });
    
    if (existingWebhook) {
      throw new Error('Webhook already exists');
    }
    
    // Create new webhook
    const webhook = await prisma.webhook.create({
      data: {
        url: webhookData.url,
        eventType: webhookData.eventType,
        description: webhookData.description,
        active: webhookData.active !== undefined ? webhookData.active : true,
        userId: webhookData.userId
      }
    });
    
    return webhook;
  }

  /**
   * Update a webhook
   */
  async updateWebhook(webhookId: number, userId: number, updates: Partial<WebhookData>): Promise<any> {
    logger.info(`Updating webhook ${webhookId} for user ${userId}`);
    
    // Check if webhook exists and belongs to user
    const webhook = await prisma.webhook.findFirst({
      where: {
        id: webhookId,
        userId
      }
    });
    
    if (!webhook) {
      throw new Error('Webhook not found');
    }
    
    // Validate event type if provided
    if (updates.eventType && !WebhookEventUtils.isValidEventType(updates.eventType)) {
      throw new Error(`Invalid event type. Must be one of: ${WEBHOOK_EVENT_TYPES.join(', ')}`);
    }
    
    // Update webhook
    const updatedWebhook = await prisma.webhook.update({
      where: { id: webhookId },
      data: {
        url: updates.url !== undefined ? updates.url : webhook.url,
        eventType: updates.eventType !== undefined ? updates.eventType : webhook.eventType,
        description: updates.description !== undefined ? updates.description : webhook.description,
        active: updates.active !== undefined ? updates.active : webhook.active
      }
    });
    
    return updatedWebhook;
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(webhookId: number, userId: number): Promise<boolean> {
    logger.info(`Deleting webhook ${webhookId} for user ${userId}`);
    
    // Check if webhook exists and belongs to user
    const webhook = await prisma.webhook.findFirst({
      where: {
        id: webhookId,
        userId
      }
    });
    
    if (!webhook) {
      throw new Error('Webhook not found');
    }
    
    // Delete webhook
    await prisma.webhook.delete({
      where: { id: webhookId }
    });
    
    return true;
  }

  /**
   * Send webhook notification
   */
  async sendWebhookNotification(payload: WebhookPayload): Promise<boolean[]> {
    logger.info(`sendWebhookNotification : Sending webhook notification for job ${payload.id}`);
    logger.debug(`sendWebhookNotification : payload ${JSON.stringify(payload)}`)
    try {
      // Get user from database
      const user = await userService.getUserById(payload.userId);
      if (!user) {
        logger.error(`User not found: ${payload.userId}`);
        return [false];
      }
      
      // Get webhooks for this user and event type
      const webhooks = await prisma.webhook.findMany({
        where: {
          userId: payload.userId,
          active: true,
          OR: [
            { eventType: payload.eventType },
            { eventType: 'all' }
          ]
        }
      });
      if (webhooks.length === 0) {
        logger.info(`No webhooks configured for user ${payload.userId} and event ${payload.eventType}`);
        return [false];
      }
      
      // Send to all configured webhooks
      const promises = webhooks.map(async (webhook) => {
        try {
          logger.info(`Sending (${payload.eventType}) webhook to (${webhook.url}) for job (${payload.id})`);
          await got.post(webhook.url, { 
            json: payload,
            timeout: { request: 10000 }, // 10s timeout
            retry: { limit: 3 } // Retry 3 times
          });
          logger.info(`Successfully sent webhook to ${webhook.url}`);
          return true;
        } catch (error) {
          logger.error(`Failed to send webhook to ${webhook.url}: ${error}`);
          return false;
        }
      });
      
      return await Promise.all(promises);
    } catch (error) {
      logger.error(`Webhook processing error: ${error}`);
      return [false];
    }
  }
}

export default new WebhookService();