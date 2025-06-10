import { z } from "zod";

export const signupSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(255, "Full name must be less than 255 characters"),

    email: z
      .string()
      .email("Please provide a valid email address")
      .toLowerCase()
      .max(255, "Email must be less than 255 characters"),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(255, "Password must be less than 255 characters") // Updated to match DB constraint
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),

    confirmPassword: z.string(),

    userRole: z
      .enum(["student", "mentor", "admin"])
      .default("student")
      .optional(), // Changed from 'role' to 'userRole' and added 'admin'

    profileImageUrl: z
      .string()
      .url("Please provide a valid URL")
      .max(1024, "Profile image URL must be less than 1024 characters") // Added length constraint to match DB
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
