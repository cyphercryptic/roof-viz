import { z } from 'zod';

// --- Schemas ---

export const signupSchema = z.object({
  userId: z.string().uuid(),
  companyName: z
    .string()
    .min(1, 'Company name is required')
    .max(100, 'Company name must be 100 characters or less')
    .regex(/^[a-zA-Z0-9\s\-&'.]+$/, 'Company name contains invalid characters'),
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Full name must be 100 characters or less'),
});

export const visualizeSchema = z.object({
  productId: z.string().uuid(),
  originalImagePath: z.string().min(1, 'Image path is required'),
  customerName: z.string().max(200).optional(),
  customerAddress: z.string().max(500).optional(),
});

export const shareSchema = z.object({
  visualization_id: z.string().uuid(),
});

export const proposalSchema = z.object({
  visualization_id: z.string().uuid(),
});

export const inviteAcceptSchema = z.object({
  token: z
    .string()
    .min(32)
    .max(128)
    .regex(/^[a-f0-9]+$/, 'Invalid token format'),
  userId: z.string().uuid(),
  fullName: z
    .string()
    .min(1, 'Full name is required')
    .max(100, 'Full name must be 100 characters or less'),
});

export const inviteValidateSchema = z.object({
  token: z
    .string()
    .min(32)
    .max(128)
    .regex(/^[a-f0-9]+$/, 'Invalid token format'),
});

export const catalogSeedSchema = z.object({
  products: z
    .array(
      z.object({
        brand: z.string().max(100),
        line: z.string().max(200),
        color: z.string().max(100),
        style: z.string().max(100).optional(),
        description: z.string().max(2000).optional(),
      })
    )
    .min(1, 'At least one product is required')
    .max(200, 'Maximum 200 products per request'),
});

export const billingCheckoutSchema = z.object({
  plan: z.enum(['pay_per_use', 'starter', 'pro', 'business', 'business_pro']),
});

// --- Helper ---

type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export function parseBody<T>(schema: z.ZodSchema<T>, data: unknown): ParseResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const message = result.error.issues.map((e) => e.message).join(', ');
  return { success: false, error: message };
}
