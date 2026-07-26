import type { JsonApiDocument, JsonApiResource, UnitAddress, UnitFullName, UnitPhone } from "./unit-client.types.js";

export type UnitCardStatus =
  | "Active"
  | "Inactive"
  | "Frozen"
  | "ClosedByCustomer"
  | "Stolen"
  | "Lost"
  | "SuspectedFraud";

export interface UnitCardAttributes {
  createdAt: string;
  last4Digits: string;
  expirationDate: string;
  status: UnitCardStatus;
  bin?: string;
  fullName?: UnitFullName;
  address?: UnitAddress;
  phone?: UnitPhone;
  email?: string;
  dateOfBirth?: string;
  closeReason?: string;
  tags?: Record<string, string>;
  [key: string]: unknown;
}

export type UnitCardResource = JsonApiResource<UnitCardAttributes>;
export type UnitCardDocument = JsonApiDocument<UnitCardAttributes>;

// Business virtual debit cards are issued to a named human cardholder (the
// business entity itself has no such attributes) -- confirmed empirically:
// Unit incrementally requires address, then fullName, then phone, then
// email, then dateOfBirth once the account's card BIN is set up correctly.
export interface UnitCreateBusinessCardRequestAttributes {
  address: UnitAddress;
  fullName: UnitFullName;
  phone: UnitPhone;
  email: string;
  dateOfBirth: string;
  idempotencyKey?: string;
  tags?: Record<string, string>;
}

// Individual cards draw cardholder identity from the existing Customer
// resource, so no cardholder attributes are required.
export interface UnitCreateIndividualCardRequestAttributes {
  idempotencyKey?: string;
  tags?: Record<string, string>;
}
