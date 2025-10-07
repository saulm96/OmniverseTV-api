import { z } from "zod";

// Schema for user registration
export const registerSchema = z.object({
  body: z.object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters long")
      .max(25, "Username must be at most 25 characters long"),
    email: z.string().email("Must be a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .max(20, "Password must be at most 20 characters long")
      .regex(
        //TODO: check if the regex works as expected
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),
  }),
});

// Schema for user login
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Must be a valid email address"),
    password: z.string().min(1, "Password is required"),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters long')
      .max(25, 'Username must be at most 25 characters long')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
      .optional(),
    firstName: z
      .string()
      .min(2, 'First name must be at least 2 characters long')
      .regex(/^[a-zA-Z]+$/, 'First name can only contain letters')
      .optional(),
    lastName: z
      .string()
      .min(2, 'Last name must be at least 2 characters long')
      .regex(/^[a-zA-Z]+$/, 'Last name can only contain letters')
      .optional(),
    preferred_language: z
      .string()
      .length(2, 'Language code must be 2 characters long')
      .optional(),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email("Must be a valid email address"),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().nonempty("Token is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .max(20, "Password must be at most 20 characters long")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
      ),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z
      .string()
      .nonempty('Current password is required'),
    newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(20, "Password must be at most 20 characters long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    ),
  }),
});

export const setPasswordSchema = z.object({
  body: z.object({
    password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(20, "Password must be at most 20 characters long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    ),
  }),
});

export const requestEmailChangeSchema = z.object({
  body: z.object({
    newEmail: z.string().email('Invalid new email address'),
    password: z.string().nonempty('Password is required'),
  }),
});

export const confirmEmailChangeSchema = z.object({
  body: z.object({
    token: z.string().nonempty('Token is required'),
  }),
});