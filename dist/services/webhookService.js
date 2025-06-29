import { logger } from '@ugm/logger';
import prisma from '../lib/prisma.js';
import userService from './userService.js';
import got from 'got';
/**
 * Valid webhook event types
 */
export const validEventTypes = ['progress', 'completed', 'failed', 'delta', 'all'];
/**
 * Service for webhook-related operations
 */
class WebhookService {
    /**
     * Get all webhooks for a user
     */
    async getUserWebhooks(userId) {
        logger.info(`Getting webhooks for user ${userId}`);
        const webhooks = await prisma.webhook.findMany({
            where: { userId }
        });
        return webhooks;
    }
    /**
     * Create a new webhook
     */
    async createWebhook(webhookData) {
        logger.info(`Creating webhook for user ${webhookData.userId}`);
        // Validate event type
        if (!validEventTypes.includes(webhookData.eventType)) {
            throw new Error(`Invalid event type. Must be one of: ${validEventTypes.join(', ')}`);
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
    async updateWebhook(webhookId, userId, updates) {
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
        if (updates.eventType && !validEventTypes.includes(updates.eventType)) {
            throw new Error(`Invalid event type. Must be one of: ${validEventTypes.join(', ')}`);
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
    async deleteWebhook(webhookId, userId) {
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
    async sendWebhookNotification(payload) {
        logger.info(`Sending webhook notification for job ${payload.id}`);
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
            // Legacy support for webhookUrl field
            if (webhooks.length === 0 && user.webhookUrl && payload.eventType === 'completed') {
                webhooks.push({
                    id: 0,
                    url: user.webhookUrl,
                    eventType: 'completed',
                    active: true,
                    userId: payload.userId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    description: 'Legacy webhook'
                });
            }
            if (webhooks.length === 0) {
                logger.info(`No webhooks configured for user ${payload.userId} and event ${payload.eventType}`);
                return [false];
            }
            // Send to all configured webhooks
            const promises = webhooks.map(async (webhook) => {
                try {
                    logger.info(`Sending ${payload.eventType} webhook to ${webhook.url} for job ${payload.id}`);
                    await got.post(webhook.url, {
                        json: payload,
                        timeout: { request: 10000 }, // 10s timeout
                        retry: { limit: 3 } // Retry 3 times
                    });
                    logger.info(`Successfully sent webhook to ${webhook.url}`);
                    return true;
                }
                catch (error) {
                    logger.error(`Failed to send webhook to ${webhook.url}: ${error}`);
                    return false;
                }
            });
            return await Promise.all(promises);
        }
        catch (error) {
            logger.error(`Webhook processing error: ${error}`);
            return [false];
        }
    }
}
export default new WebhookService();
