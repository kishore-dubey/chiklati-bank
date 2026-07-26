import { describe, expect, it } from "vitest";
import type { BusinessApplicationInput, IndividualApplicationInput } from "@chiklati/shared";
import {
  applicantDisplayEmail,
  applicantDisplayName,
  toUnitBusinessApplicationAttributes,
  toUnitIndividualApplicationAttributes,
} from "../src/modules/applications/applications.mapper.js";

const individualInput: IndividualApplicationInput = {
  type: "individual",
  ssn: "000000004",
  fullName: { first: "Tara", last: "Wilson" },
  dateOfBirth: "1990-01-01",
  address: { street: "21 Main St", city: "Springfield", state: "IL", postalCode: "62704", country: "US" },
  phone: { countryCode: "1", number: "5555550100" },
  email: "tara@example.com",
  occupation: "ScientistOrTechnologist",
};

const businessInput: BusinessApplicationInput = {
  type: "business",
  name: "Acme Inc",
  entityType: "LLC",
  stateOfIncorporation: "DE",
  yearOfIncorporation: "2020",
  address: { street: "1 Corp Way", city: "Wilmington", state: "DE", postalCode: "19801", country: "US" },
  phone: { countryCode: "1", number: "5555550200" },
  contact: {
    fullName: { first: "Jane", last: "Doe" },
    email: "jane@acme.example",
    phone: { countryCode: "1", number: "5555550201" },
  },
  officer: {
    fullName: { first: "Jane", last: "Doe" },
    dateOfBirth: "1985-05-05",
    title: "CEO",
    ssn: "000000004",
    email: "jane@acme.example",
    phone: { countryCode: "1", number: "5555550201" },
    address: { street: "1 Corp Way", city: "Wilmington", state: "DE", postalCode: "19801", country: "US" },
    occupation: "ExecutiveOrManager",
  },
  beneficialOwners: [],
  attestedNoBeneficialOwners: true,
};

describe("applications.mapper", () => {
  it("maps an individual application input to Unit attributes, injecting the idempotency key", () => {
    const result = toUnitIndividualApplicationAttributes(individualInput, "idem-key-1");

    expect(result).toEqual({
      ssn: "000000004",
      fullName: { first: "Tara", last: "Wilson" },
      dateOfBirth: "1990-01-01",
      address: individualInput.address,
      phone: individualInput.phone,
      email: "tara@example.com",
      occupation: "ScientistOrTechnologist",
      idempotencyKey: "idem-key-1",
    });
  });

  it("maps a business application input to Unit attributes, injecting the idempotency key", () => {
    const result = toUnitBusinessApplicationAttributes(businessInput, "idem-key-2");

    expect(result.name).toBe("Acme Inc");
    expect(result.officer.title).toBe("CEO");
    expect(result.attestedNoBeneficialOwners).toBe(true);
    expect(result.idempotencyKey).toBe("idem-key-2");
  });

  it("derives the applicant display name for individuals and businesses", () => {
    expect(applicantDisplayName(individualInput)).toBe("Tara Wilson");
    expect(applicantDisplayName(businessInput)).toBe("Acme Inc");
  });

  it("derives the applicant display email for individuals and businesses", () => {
    expect(applicantDisplayEmail(individualInput)).toBe("tara@example.com");
    expect(applicantDisplayEmail(businessInput)).toBe("jane@acme.example");
  });
});
