import { z } from "zod";

// Schema for user registration
export const registerSchema = z.object({
  body: z.object({
    username: z
      .string()
      .min(3)
      .max(25, "Username must be between 3 and 25 characters long"),
    email: z.string().email("Must be a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
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

export const updateUsernameSchema = z.object({
  body: z.object({
    username: z
      .string({ required_error: "Username is required" })
      .min(3)
      .max(25, "username must be between 3 and 25 characters long")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores"
      ),
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
      .min(8)
      .max(20, "Password must be between 8 and 20 characters long")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
      ),
  }),
});
