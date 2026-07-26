import { z } from "zod";

export const applicationTypeSchema = z.enum(["Individual", "Business"]);

export const applicationStatusSchema = z.enum([
  "AwaitingDocuments",
  "PendingReview",
  "Approved",
  "Denied",
  "Canceled",
]);

export const applicationResponseSchema = z.object({
  id: z.string(),
  unitApplicationId: z.string(),
  type: applicationTypeSchema,
  status: applicationStatusSchema,
  applicantName: z.string(),
  applicantEmail: z.email(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ApplicationType = z.infer<typeof applicationTypeSchema>;
export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;
export type ApplicationResponse = z.infer<typeof applicationResponseSchema>;
