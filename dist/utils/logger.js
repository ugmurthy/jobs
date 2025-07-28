/**
 * This is a wrapper around the @ugm/logger package
 * It's created to provide a consistent logging interface
 * and to make it easier to switch to a different logger in the future
 */
import { logger } from '@ugm/logger';
// Re-export the logger
export { logger };
// Define log levels
export var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warn";
    LogLevel["INFO"] = "info";
    LogLevel["DEBUG"] = "debug";
})(LogLevel = LogLevel || (LogLevel = {}));
/**
 * Set the log level
 */
export function setLogLevel(level) {
    logger.level = level;
}
/**
 * Log an error message
 */
export function error(message, ...args) {
    logger.error(message, ...args);
}
/**
 * Log a warning message
 */
export function warn(message, ...args) {
    logger.warn(message, ...args);
}
/**
 * Log an info message
 */
export function info(message, ...args) {
    logger.info(message, ...args);
}
/**
 * Log a debug message
 */
export function debug(message, ...args) {
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
