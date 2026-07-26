export interface JsonApiResourceIdentifier {
  type: string;
  id: string;
}

export interface JsonApiRelationship {
  data: JsonApiResourceIdentifier | JsonApiResourceIdentifier[] | null;
}

export interface JsonApiResource<TAttributes = Record<string, unknown>> {
  type: string;
  id: string;
  attributes: TAttributes;
  relationships?: Record<string, JsonApiRelationship>;
}

export interface JsonApiDocument<TAttributes = Record<string, unknown>> {
  data: JsonApiResource<TAttributes>;
  included?: JsonApiResource[];
}

export interface JsonApiErrorObject {
  status: string;
  code?: string;
  title: string;
  detail?: string;
}

export interface JsonApiErrorDocument {
  errors: JsonApiErrorObject[];
}

export type UnitApplicationStatus =
  | "AwaitingDocuments"
  | "PendingReview"
  | "Approved"
  | "Denied"
  | "Canceled";

export interface UnitApplicationAttributes {
  createdAt: string;
  status: UnitApplicationStatus;
  message?: string;
  [key: string]: unknown;
}

export type UnitApplicationResource = JsonApiResource<UnitApplicationAttributes>;
export type UnitApplicationDocument = JsonApiDocument<UnitApplicationAttributes>;

export interface UnitFullName {
  first: string;
  last: string;
}

export interface UnitPhone {
  countryCode: string;
  number: string;
}

export interface UnitAddress {
  street: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface UnitIndividualApplicationRequestAttributes {
  ssn?: string;
  fullName: UnitFullName;
  dateOfBirth: string;
  address: UnitAddress;
  phone: UnitPhone;
  email: string;
  occupation: string;
  idempotencyKey?: string;
  tags?: Record<string, string>;
}

export interface UnitBusinessOfficerAttributes {
  fullName: UnitFullName;
  dateOfBirth: string;
  title: string;
  ssn?: string;
  email: string;
  phone: UnitPhone;
  address: UnitAddress;
  occupation: string;
}

export interface UnitBeneficialOwnerAttributes {
  fullName: UnitFullName;
  dateOfBirth: string;
  ssn?: string;
  email: string;
  percentage: number;
  phone: UnitPhone;
  address: UnitAddress;
  occupation: string;
}

export interface UnitBusinessApplicationRequestAttributes {
  name: string;
  address: UnitAddress;
  phone: UnitPhone;
  stateOfIncorporation: string;
  ein: string;
  businessVertical: string;
  entityType: string;
  yearOfIncorporation: string;
  contact: {
    fullName: UnitFullName;
    email: string;
    phone: UnitPhone;
  };
  officer: UnitBusinessOfficerAttributes;
  beneficialOwners: UnitBeneficialOwnerAttributes[];
  attestedNoBeneficialOwners: boolean;
  idempotencyKey?: string;
  tags?: Record<string, string>;
}
