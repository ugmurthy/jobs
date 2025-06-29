/**
 * This is a wrapper around the @ugm/logger package
 * It's created to provide a consistent logging interface
 * and to make it easier to switch to a different logger in the future
 */

import { logger } from '@ugm/logger';

// Re-export the logger
export { logger };

// Define log levels
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

/**
 * Set the log level
 */
export function setLogLevel(level: LogLevel): void {
  logger.level = level;
}

/**
 * Log an error message
 */
export function error(message: string, ...args: any[]): void {
  logger.error(message, ...args);
}

/**
 * Log a warning message
 */
export function warn(message: string, ...args: any[]): void {
  logger.warn(message, ...args);
}

/**
 * Log an info message
 */
export function info(message: string, ...args: any[]): void {
  logger.info(message, ...args);
}

/**
 * Log a debug message
 */
export function debug(message: string, ...args: any[]): void {
  logger.debug(message, ...args);
}

export default {
  logger,
  setLogLevel,
  error,
  warn,
  info,
  debug,
  LogLevel
};