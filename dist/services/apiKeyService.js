import prisma from '../lib/prisma.js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { logger } from '@ugm/logger';
class ApiKeyService {
    /**
     * Generate a new API key for a user
     * @param userId User ID
     * @param name Descriptive name for the API key
     * @param permissions Array of permissions granted to this key
     * @param expiresAt Optional expiration date
     * @returns The generated API key with its full value (shown only once)
     */
    async generateApiKey(userId, name, permissions, expiresAt) {
        // Generate a secure random API key
        const keyBuffer = crypto.randomBytes(32);
        const fullKey = keyBuffer.toString('base64').replace(/[+/=]/g, '');
        // Extract prefix for display purposes (first 8 characters)
        const prefix = fullKey.substring(0, 8);
        // Hash the key for storage
        const hashedKey = await bcrypt.hash(fullKey, 10);
        // Store the API key in the database
        const apiKey = await prisma.apiKey.create({
            data: {
                userId,
                name,
                key: hashedKey,
                prefix,
                permissions: JSON.stringify(permissions),
                expiresAt,
                isActive: true,
                createdAt: new Date()
            }
        });
        logger.info(`API key generated for user ${userId} with name "${name}"`);
        // Return the full key (only shown once) along with the API key data
        return {
            apiKey: {
                id: apiKey.id,
                userId: apiKey.userId,
                name: apiKey.name,
                prefix: apiKey.prefix,
                permissions: JSON.parse(apiKey.permissions),
                lastUsed: apiKey.lastUsed,
                createdAt: apiKey.createdAt,
                expiresAt: apiKey.expiresAt,
                isActive: apiKey.isActive
            },
            key: fullKey
        };
    }
    /**
     * Validate an API key
     * @param key The API key to validate
     * @returns User ID and permissions if valid, null if invalid
     */
    async validateApiKey(key) {
        // Extract prefix from the key
        const prefix = key.substring(0, 8);
        //logger.debug(`apiKeyService.validateApiKey: Extracted prefix: ${prefix}`);
        // Find API keys with matching prefix
        const apiKeys = await prisma.apiKey.findMany({
            where: {
                prefix,
                isActive: true,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } }
                ]
            }
        });
        // If no keys found with this prefix, return null
        if (apiKeys.length === 0) {
            logger.error(`apiKeyService.validateApiKey: No API keys found with prefix: ${prefix}`);
            return null;
        }
        //logger.debug(`apiKeyService.validateApiKey: Found ${apiKeys.length} API keys with matching prefix`);
        // Check each key with matching prefix
        for (const apiKey of apiKeys) {
            // Compare the provided key with the hashed key in the database
            const isValid = await bcrypt.compare(key, apiKey.key);
            if (isValid) {
                // Update last used timestamp
                await prisma.apiKey.update({
                    where: { id: apiKey.id },
                    data: { lastUsed: new Date() }
                });
                //logger.debug(`apiKeyService.validateApiKey: API key validated successfully for user ${apiKey.userId}`);
                // Return user ID and permissions (parse JSON string to array)
                return {
                    userId: apiKey.userId,
                    permissions: JSON.parse(apiKey.permissions)
                };
            }
        }
        // No matching key found
        return null;
    }
    /**
     * List all API keys for a user
     * @param userId User ID
     * @returns Array of API keys
     */
    async listApiKeys(userId) {
        const apiKeys = await prisma.apiKey.findMany({
            where: { userId }
        });
        return apiKeys.map((key) => ({
            id: key.id,
            userId: key.userId,
            name: key.name,
            prefix: key.prefix,
            permissions: JSON.parse(key.permissions),
            lastUsed: key.lastUsed,
            createdAt: key.createdAt,
            expiresAt: key.expiresAt,
            isActive: key.isActive
        }));
    }
    /**
     * Revoke an API key
     * @param keyId API key ID
     * @param userId User ID (for authorization)
     * @returns True if successful, false if not found or not authorized
     */
    async revokeApiKey(keyId, userId) {
        // Find the API key
        const apiKey = await prisma.apiKey.findUnique({
            where: { id: keyId }
        });
        // Check if the key exists and belongs to the user
        if (!apiKey || apiKey.userId !== userId) {
            return false;
        }
        // Revoke the key by setting isActive to false
        await prisma.apiKey.update({
            where: { id: keyId },
            data: { isActive: false }
        });
        logger.info(`API key ${keyId} revoked for user ${userId}`);
        return true;
    }
    /**
     * Update an API key
     * @param keyId API key ID
     * @param userId User ID (for authorization)
     * @param updates Updates to apply
     * @returns Updated API key if successful, null if not found or not authorized
     */
    async updateApiKey(keyId, userId, updates) {
        // Find the API key
        const apiKey = await prisma.apiKey.findUnique({
            where: { id: keyId }
        });
        // Check if the key exists and belongs to the user
        if (!apiKey || apiKey.userId !== userId) {
            return null;
        }
        // Prepare updates - convert permissions array to JSON string if present
        const dataUpdates = {
            name: updates.name,
            expiresAt: updates.expiresAt,
            isActive: updates.isActive
        };
        // Convert permissions array to JSON string if present
        if (updates.permissions) {
            dataUpdates.permissions = JSON.stringify(updates.permissions);
        }
        // Update the key
        const updatedKey = await prisma.apiKey.update({
            where: { id: keyId },
            data: dataUpdates
        });
        logger.info(`API key ${keyId} updated for user ${userId}`);
        return {
            id: updatedKey.id,
            userId: updatedKey.userId,
            name: updatedKey.name,
            prefix: updatedKey.prefix,
            permissions: JSON.parse(updatedKey.permissions),
            lastUsed: updatedKey.lastUsed,
            createdAt: updatedKey.createdAt,
            expiresAt: updatedKey.expiresAt,
            isActive: updatedKey.isActive
        };
    }
}
export default new ApiKeyService();
