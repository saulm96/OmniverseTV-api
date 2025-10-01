import { z } from 'zod';

// Schema for creating a new subscription
export const createSubscriptionSchema = z.object({
  body: z.object({
    packageId: z.number().int().positive('Package ID must be a positive integer'),
  }),
});

// Schema for canceling a subscription
export const cancelSubscriptionSchema = z.object({
  params: z.object({
    id: z
      .string()
      .min(1)
      .regex(/^\d+$/, 'Subscription ID must be a numeric string'),
  }),
});