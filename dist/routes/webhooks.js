import { Router } from 'express';
import { logger } from '@ugm/logger';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/combinedAuth.js';
import userService from '../services/userService.js';
import { WEBHOOK_EVENT_TYPES, WebhookEventUtils, } from '../types/webhook-events.js';
const router = Router();
/**
 * Get all webhooks for the authenticated user
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }
        const webhooks = await prisma.webhook.findMany({
            where: { userId }
        });
        res.json({ webhooks });
    }
    catch (error) {
        logger.error('Webhooks list error:', error);
        res.status(500).json({ message: 'An error occurred while fetching webhooks' });
    }
});
/**
 * Add a new webhook
 */
router.post('/', authenticate, async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }
        const { url, eventType, description } = req.body;
        if (!url || !eventType) {
            res.status(400).json({ message: 'URL and event type are required' });
            return;
        }
        // Validate event type
        if (!WebhookEventUtils.isValidEventType(eventType)) {
            res.status(400).json({
                message: `Invalid event type. Must be one of: ${WEBHOOK_EVENT_TYPES.join(', ')}`
            });
            return;
        }
        // Check if webhook already exists
        const existingWebhook = await prisma.webhook.findFirst({
            where: {
                userId,
                url,
                eventType
            }
        });
        if (existingWebhook) {
            res.status(409).json({ message: 'Webhook already exists' });
            return;
        }
        // Create new webhook
        const webhook = await prisma.webhook.create({
            data: {
                url,
                eventType,
                description,
                userId
            }
        });
        res.status(201).json({ webhook });
    }
    catch (error) {
        logger.error('Webhook creation error:', error);
        res.status(500).json({ message: 'An error occurred while creating webhook' });
    }
});
/**
 * Update a webhook
 */
router.put('/:id', authenticate, async (req, res) => {
    try {
        const userId = req.user?.userId;
        const webhookId = parseInt(req.params.id);
        if (!userId) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }
        // Check if webhook exists and belongs to user
        const webhook = await prisma.webhook.findFirst({
            where: {
                id: webhookId,
                userId
            }
        });
        if (!webhook) {
            res.status(404).json({ message: 'Webhook not found' });
            return;
        }
        const { url, eventType, description, active } = req.body;
        // Validate event type if provided
        if (eventType && !WebhookEventUtils.isValidEventType(eventType)) {
            res.status(400).json({
                message: `Invalid event type. Must be one of: ${WEBHOOK_EVENT_TYPES.join(', ')}`
            });
            return;
        }
        // Update webhook
        const updatedWebhook = await prisma.webhook.update({
            where: { id: webhookId },
            data: {
                url: url !== undefined ? url : webhook.url,
                eventType: eventType !== undefined ? eventType : webhook.eventType,
                description: description !== undefined ? description : webhook.description,
                active: active !== undefined ? active : webhook.active
            }
        });
        res.json({ webhook: updatedWebhook });
    }
    catch (error) {
        logger.error('Webhook update error:', error);
        res.status(500).json({ message: 'An error occurred while updating webhook' });
    }
});
/**
 * Delete a webhook
 */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const userId = req.user?.userId;
        const webhookId = parseInt(req.params.id);
        if (!userId) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }
        // Check if webhook exists and belongs to user
        const webhook = await prisma.webhook.findFirst({
            where: {
                id: webhookId,
                userId
            }
        });
        if (!webhook) {
            res.status(404).json({ message: 'Webhook not found' });
            return;
        }
        // Delete webhook
        await prisma.webhook.delete({
            where: { id: webhookId }
        });
        res.json({ message: 'Webhook deleted successfully' });
    }
    catch (error) {
        logger.error('Webhook deletion error:', error);
        res.status(500).json({ message: 'An error occurred while deleting webhook' });
    }
});
/**
 * Update webhook URL (legacy)
 */
router.put('/url', authenticate, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }
        const { webhookUrl } = req.body;
        if (!webhookUrl) {
            res.status(400).json({ message: 'Webhook URL is required' });
            return;
        }
        const user = await userService.updateWebhookUrl(req.user.userId, webhookUrl);
        res.json({
            message: 'Webhook URL updated successfully',
            webhookUrl: user.webhookUrl
        });
    }
    catch (error) {
        logger.error('Webhook URL update error:', error);
        res.status(500).json({ message: 'An error occurred during webhook URL update' });
    }
});
/**
 * Protected webhook notification route
 */
router.post("/:id", (req, res) => {
    const ret_val = req.body;
    logger.info(`Received WEBHOOK notification ", ${ret_val.id}/${ret_val.jobname}`);
    logger.debug(`\n${ret_val.result}\n`);
    res.status(200).end();
});
export default router;
