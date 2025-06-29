import { logger } from '@ugm/logger';

/**
 * Validates if the provided options is a valid JSON object
 */
export function isValidOptions(options: unknown): boolean {
  // Check if options is an object and not null
  if (typeof options !== 'object' || options === null) {
    return false;
  }
  
  try {
    // Try to stringify and parse to ensure it's a valid JSON object
    JSON.parse(JSON.stringify(options));
    logger.debug(`options : ${JSON.stringify(options)}`);
    return true;
  } catch (error) {
    logger.error("Invalid options", options);
    return false;
  }
}

/**
 * Validates if a string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Validates if a string is a valid email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates if a password meets minimum requirements
 * - At least 8 characters
 * - Contains at least one uppercase letter
 * - Contains at least one lowercase letter
 * - Contains at least one number
 */
export function isValidPassword(password: string): boolean {
  if (password.length < 8) {
    return false;
  }
  
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  return hasUppercase && hasLowercase && hasNumber;
}

/**
 * Validates webhook event type
 */
export function isValidWebhookEventType(eventType: string): boolean {
  const validEventTypes = ['progress', 'completed', 'failed', 'delta', 'all'];
  return validEventTypes.includes(eventType);
}

export default {
  isValidOptions,
  isValidUrl,
  isValidEmail,
  isValidPassword,
  isValidWebhookEventType
};