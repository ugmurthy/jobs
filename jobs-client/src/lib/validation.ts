import { z } from 'zod';

// Auth validation schemas
export const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  email: z.string().email('Invalid email address'),
  webhookUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Job validation schemas
export const jobSubmitSchema = z.object({
  name: z.string().min(1, 'Job name is required'),
  data: z.record(z.any()).optional(),
  options: z.object({
    priority: z.number().int().min(1).max(100).optional(),
    attempts: z.number().int().min(1).optional(),
    delay: z.number().int().min(0).optional(),
  }).optional(),
});

// Job scheduling validation schemas
export const cronExpressionSchema = z.string().regex(
  /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/,
  'Invalid cron expression'
);

export const scheduleJobSchema = z.object({
  name: z.string().min(1, 'Job name is required'),
  data: z.record(z.any()).optional(),
  schedule: z.object({
    type: z.enum(['cron', 'every', 'once']),
    value: z.string().min(1, 'Schedule value is required'),
  }),
  options: z.object({
    priority: z.number().int().min(1).max(100).optional(),
    attempts: z.number().int().min(1).optional(),
  }).optional(),
});

// Webhook validation schemas
export const webhookSchema = z.object({
  url: z.string().url('Invalid webhook URL'),
  events: z.array(z.string()).min(1, 'At least one event must be selected'),
  active: z.boolean().default(true),
  description: z.string().optional(),
});

// API key validation schemas
export const apiKeySchema = z.object({
  name: z.string().min(1, 'API key name is required'),
  permissions: z.array(z.string()).min(1, 'At least one permission must be selected'),
  expiresAt: z.string().optional().or(z.literal('')),
});

// Types derived from schemas
export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type JobSubmitFormValues = z.infer<typeof jobSubmitSchema>;
export type ScheduleJobFormValues = z.infer<typeof scheduleJobSchema>;
export type WebhookFormValues = z.infer<typeof webhookSchema>;
export type ApiKeyFormValues = z.infer<typeof apiKeySchema>;