import { Router } from 'express';
import { logger } from '@ugm/logger';
import apiKeyService from '../services/apiKeyService.js';
import { authenticate } from '../middleware/combinedAuth.js';
const router = Router();
/**
 * GET /api-keys
 * List all API keys for the authenticated user
 */
router.get('/', authenticate, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }
        const apiKeys = await apiKeyService.listApiKeys(req.user.userId);
        res.json({
            message: 'API keys retrieved successfully',
            apiKeys
        });
    }
    catch (error) {
        logger.error('Error retrieving API keys:', error);
        res.status(500).json({ message: 'An error occurred while retrieving API keys' });
    }
});
/**
 * POST /api-keys
 * Create a new API key
 */
router.post('/', authenticate, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }
        const { name, permissions, expiresAt } = req.body;
        if (!name) {
            res.status(400).json({ message: 'API key name is required' });
            return;
        }
        if (!permissions || !Array.isArray(permissions)) {
            res.status(400).json({ message: 'Permissions must be an array' });
            return;
        }
        // Parse expiresAt if provided
        let expiryDate;
        if (expiresAt) {
            expiryDate = new Date(expiresAt);
            if (isNaN(expiryDate.getTime())) {
                res.status(400).json({ message: 'Invalid expiration date format' });
                return;
            }
        }
        const result = await apiKeyService.generateApiKey(req.user.userId, name, permissions, expiryDate);
        res.status(201).json({
            message: 'API key created successfully',
            apiKey: {
                ...result.apiKey,
                key: result.key // Include the full key in the response (only shown once)
            }
        });
    }
    catch (error) {
        logger.error('Error creating API key:', error);
        res.status(500).json({ message: 'An error occurred while creating the API key' });
    }
});
/**
 * DELETE /api-keys/:id
 * Revoke an API key
 */
router.delete('/:id', authenticate, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }
        const keyId = parseInt(req.params.id, 10);
        if (isNaN(keyId)) {
            res.status(400).json({ message: 'Invalid API key ID' });
            return;
        }
        const success = await apiKeyService.revokeApiKey(keyId, req.user.userId);
        if (!success) {
            res.status(404).json({ message: 'API key not found or not authorized' });
            return;
        }
        res.json({ message: 'API key revoked successfully' });
    }
    catch (error) {
        logger.error('Error revoking API key:', error);
        res.status(500).json({ message: 'An error occurred while revoking the API key' });
    }
});
/**
 * PUT /api-keys/:id
 * Update an API key (name, permissions, etc.)
 */
router.put('/:id', authenticate, async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }
        const keyId = parseInt(req.params.id, 10);
        if (isNaN(keyId)) {
            res.status(400).json({ message: 'Invalid API key ID' });
            return;
        }
        const { name, permissions, expiresAt, isActive } = req.body;
        // Validate updates
        if (permissions && !Array.isArray(permissions)) {
            res.status(400).json({ message: 'Permissions must be an array' });
            return;
        }
        // Parse expiresAt if provided
        let expiryDate;
        if (expiresAt === null) {
            expiryDate = null;
        }
        else if (expiresAt) {
            expiryDate = new Date(expiresAt);
            if (isNaN(expiryDate.getTime())) {
                res.status(400).json({ message: 'Invalid expiration date format' });
                return;
            }
        }
        const updates = {};
        if (name !== undefined)
            updates.name = name;
        if (permissions !== undefined)
            updates.permissions = permissions;
        if (expiryDate !== undefined)
            updates.expiresAt = expiryDate;
        if (isActive !== undefined)
            updates.isActive = isActive;
        const updatedKey = await apiKeyService.updateApiKey(keyId, req.user.userId, updates);
        if (!updatedKey) {
            res.status(404).json({ message: 'API key not found or not authorized' });
            return;
        }
        res.json({
            message: 'API key updated successfully',
            apiKey: updatedKey
        });
    }
    catch (error) {
        logger.error('Error updating API key:', error);
        res.status(500).json({ message: 'An error occurred while updating the API key' });
    }
});
export default router;
