import type {
  BusinessApplicationInput,
  CreateApplicationInput,
  IndividualApplicationInput,
} from "@chiklati/shared";
import type {
  UnitBusinessApplicationRequestAttributes,
  UnitIndividualApplicationRequestAttributes,
} from "../../lib/unit/unit-client.types.js";

export function toUnitIndividualApplicationAttributes(
  input: IndividualApplicationInput,
  idempotencyKey: string,
): UnitIndividualApplicationRequestAttributes {
  return {
    ssn: input.ssn,
    fullName: input.fullName,
    dateOfBirth: input.dateOfBirth,
    address: input.address,
    phone: input.phone,
    email: input.email,
    occupation: input.occupation,
    idempotencyKey,
  };
}

export function toUnitBusinessApplicationAttributes(
  input: BusinessApplicationInput,
  idempotencyKey: string,
): UnitBusinessApplicationRequestAttributes {
  return {
    name: input.name,
    address: input.address,
    phone: input.phone,
    stateOfIncorporation: input.stateOfIncorporation,
    ein: input.ein,
    entityType: input.entityType,
    yearOfIncorporation: input.yearOfIncorporation,
    contact: input.contact,
    officer: input.officer,
    beneficialOwners: input.beneficialOwners,
    attestedNoBeneficialOwners: input.attestedNoBeneficialOwners,
    idempotencyKey,
  };
}

export function applicantDisplayName(input: CreateApplicationInput): string {
  return input.type === "individual" ? `${input.fullName.first} ${input.fullName.last}` : input.name;
}

export function applicantDisplayEmail(input: CreateApplicationInput): string {
  return input.type === "individual" ? input.email : input.contact.email;
}
