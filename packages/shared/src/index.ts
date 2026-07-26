export { apiEnvSchema, type ApiEnv } from "./env/api-env.schema.js";
export { webEnvSchema, type WebEnv } from "./env/web-env.schema.js";
export { loginSchema, type LoginInput } from "./auth/login.schema.js";
export {
  internalAuthClaimsSchema,
  type InternalAuthClaims,
} from "./auth/internal-auth-claims.schema.js";

export {
  fullNameSchema,
  phoneSchema,
  addressSchema,
  type FullName,
  type Phone,
  type Address,
} from "./applications/common.schema.js";
export {
  individualApplicationInputSchema,
  type IndividualApplicationInput,
} from "./applications/individual-application.schema.js";
export {
  businessEntityTypeSchema,
  businessApplicationInputSchema,
  type BusinessApplicationInput,
} from "./applications/business-application.schema.js";
export {
  createApplicationInputSchema,
  type CreateApplicationInput,
} from "./applications/create-application.schema.js";
export {
  applicationTypeSchema,
  applicationStatusSchema,
  applicationResponseSchema,
  type ApplicationType,
  type ApplicationStatus,
  type ApplicationResponse,
} from "./applications/application-response.schema.js";
