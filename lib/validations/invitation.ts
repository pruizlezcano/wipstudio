import { z } from "zod";

export const createInvitationSchema = z.object({
  email: z.string().optional(),
  emails: z.array(z.email({ message: "Invalid email" })).optional(),
  restrictToEmails: z.boolean().optional(),
  maxUses: z
    .number()
    .int()
    .positive("Max uses must be a positive number")
    .optional()
    .nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
});

export const acceptInvitationSchema = z.object({
  token: z.uuid({ message: "Invalid invitation token" }),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
