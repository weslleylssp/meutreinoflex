import { z } from "zod";

// Exercise validation schema
export const exerciseSchema = z.object({
  id: z.string(),
  name: z.string()
    .trim()
    .min(1, "Exercise name is required")
    .max(100, "Exercise name must be less than 100 characters"),
  sets: z.number()
    .int("Sets must be a whole number")
    .min(1, "At least 1 set is required")
    .max(20, "Maximum 20 sets allowed"),
  reps: z.number()
    .int("Reps must be a whole number")
    .min(1, "At least 1 rep is required")
    .max(200, "Maximum 200 reps allowed"),
  weight: z.number()
    .min(0, "Weight cannot be negative")
    .max(1000, "Maximum 1000kg allowed"),
  gifUrl: z.string().url().optional().or(z.literal(""))
});

// Workout validation schema
export const workoutSchema = z.object({
  id: z.string(),
  name: z.string()
    .trim()
    .min(1, "Workout name is required")
    .max(100, "Workout name must be less than 100 characters"),
  exercises: z.array(exerciseSchema)
    .min(1, "At least one exercise is required")
    .max(20, "Maximum 20 exercises allowed")
});

// Share code validation schema
export const shareCodeSchema = z.string()
  .trim()
  .regex(/^[A-Z0-9]{6}$/, "Share code must be 6 alphanumeric characters");

// Edge function input validation schemas
export const searchExercisesInputSchema = z.object({
  searchTerm: z.string().trim().max(100).optional(),
  bodyPart: z.string().trim().max(50).optional().nullable(),
  equipment: z.string().trim().max(50).optional().nullable()
});

export const exerciseFiltersInputSchema = z.object({
  type: z.enum(['bodyPart', 'equipment'], {
    errorMap: () => ({ message: "Type must be 'bodyPart' or 'equipment'" })
  })
});
