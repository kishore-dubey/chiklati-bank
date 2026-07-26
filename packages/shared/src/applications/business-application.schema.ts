import { z } from "zod";
import { addressSchema, fullNameSchema, phoneSchema } from "./common.schema.js";

export const businessEntityTypeSchema = z.enum([
  "LLC",
  "Partnership",
  "PubliclyTradedCorporation",
  "PrivatelyHeldCorporation",
  "NotForProfitOrganization",
]);

// Confirmed against the live Unit sandbox's own 400 response, not docs
// (which list this field as optional -- the sandbox rejects its absence).
export const businessVerticalSchema = z.enum([
  "AdultEntertainmentDatingOrEscortServices",
  "AdvertisingOrMarketing",
  "AgricultureForestryFishingOrHunting",
  "ArtsEntertainmentAndRecreation",
  "BusinessSupportOrBuildingServices",
  "Cannabis",
  "Construction",
  "DirectMarketingOrTelemarketing",
  "EducationalServices",
  "FinancialServicesCryptocurrency",
  "FinancialServicesDebitCollectionOrConsolidation",
  "FinancialServicesMoneyServicesBusinessOrCurrencyExchange",
  "FinancialServicesOther",
  "FinancialServicesPaydayLending",
  "GamingOrGambling",
  "HealthCareAndSocialAssistance",
  "HospitalityAccommodationOrFoodServices",
  "LegalAccountingConsultingOrComputerProgramming",
  "Manufacturing",
  "Mining",
  "Nutraceuticals",
  "PersonalCareServices",
  "PublicAdministration",
  "RealEstate",
  "ReligiousCivicAndSocialOrganizations",
  "RepairAndMaintenance",
  "RetailTrade",
  "TechnologyMediaOrTelecom",
  "TransportationOrWarehousing",
  "Utilities",
  "WholesaleTrade",
]);

const businessOfficerSchema = z.object({
  fullName: fullNameSchema,
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dateOfBirth must be YYYY-MM-DD"),
  title: z.string().min(1),
  ssn: z
    .string()
    .regex(/^\d{9}$/, "SSN must be 9 digits")
    .optional(),
  email: z.email(),
  phone: phoneSchema,
  address: addressSchema,
  occupation: z.string().min(1),
});

const beneficialOwnerSchema = businessOfficerSchema
  .omit({ title: true })
  .extend({
    percentage: z.number().int().min(25).max(100),
  });

export const businessApplicationInputSchema = z.object({
  type: z.literal("business"),
  name: z.string().min(1),
  // Confirmed required by the live Unit sandbox regardless of entity type
  // (rejects every business application without it), though our earlier
  // schema had this optional.
  ein: z.string().regex(/^\d{9}$/, "EIN must be 9 digits"),
  businessVertical: businessVerticalSchema,
  entityType: businessEntityTypeSchema,
  stateOfIncorporation: z.string().length(2),
  yearOfIncorporation: z.string().regex(/^\d{4}$/, "yearOfIncorporation must be YYYY"),
  address: addressSchema,
  phone: phoneSchema,
  contact: z.object({
    fullName: fullNameSchema,
    email: z.email(),
    phone: phoneSchema,
  }),
  officer: businessOfficerSchema,
  beneficialOwners: z.array(beneficialOwnerSchema).default([]),
  attestedNoBeneficialOwners: z.boolean().default(false),
});

export type BusinessApplicationInput = z.infer<typeof businessApplicationInputSchema>;
