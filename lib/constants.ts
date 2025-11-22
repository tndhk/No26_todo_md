/**
 * Constants and regex patterns used across the application
 * Centralizes commonly used patterns to prevent duplication and ensure consistency
 */

/**
 * Regex pattern for matching task lines in markdown
 * Format: - [ ] or - [x] followed by content
 * Captures: (indent spaces)(checkbox state)(content)
 */
export const TASK_LINE_PATTERN = /^(\s*)- \[(x| )\] (.*)/;

/**
 * Regex pattern for matching and extracting due dates
 * Format: #due:YYYY-MM-DD
 * Captures: (date string)
 */
export const DUE_DATE_PATTERN = /#due:(\d{4}-\d{2}-\d{2})/;

/**
 * Regex pattern for matching and extracting repeat frequencies
 * Format: #repeat:daily|weekly|monthly
 * Captures: (frequency)
 */
export const REPEAT_FREQUENCY_PATTERN = /#repeat:(daily|weekly|monthly)/;

/**
 * Regex pattern for detecting H1 headers (project title)
 * Format: # Title
 */
export const H1_HEADER_PATTERN = /^# /;

/**
 * Regex pattern for detecting H2 headers (section headers)
 * Format: ## Section
 */
export const H2_HEADER_PATTERN = /^## /;

/**
 * Dangerous HTML/JavaScript patterns that could lead to XSS or injection attacks
 * Used for validating user input in project titles and task content
 */
export const DANGEROUS_PATTERNS = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // Event handlers like onclick=, onload=, etc.
] as const;

/**
 * Maximum allowed occurrences of special tags in task content
 */
export const MAX_DUE_TAG_COUNT = 1;
export const MAX_REPEAT_TAG_COUNT = 1;

/**
 * File lock timeout in milliseconds
 * Prevents deadlocks by forcing release after this duration
 */
export const FILE_LOCK_TIMEOUT_MS = 10000; // 10 seconds

/**
 * Maximum length limits for validation
 * Note: These can be overridden by config values
 */
export const DEFAULT_MAX_PROJECT_TITLE_LENGTH = 100;
export const DEFAULT_MAX_FILENAME_LENGTH = 100;
export const DEFAULT_MAX_SLUG_LENGTH = 50;
