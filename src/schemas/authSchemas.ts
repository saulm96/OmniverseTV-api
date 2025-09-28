import { z } from 'zod';

// Schema for user registration
export const registerSchema = z.object({
  body: z.object({
    username: z.string().min(3, 'Username must be at least 3 characters long'),
    email: z.string().email('Must be a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
  }),
});

// Schema for user login
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Must be a valid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});
