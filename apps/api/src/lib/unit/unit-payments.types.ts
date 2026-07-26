import type { JsonApiDocument, JsonApiResource, UnitAddress } from "./unit-client.types.js";

export type UnitPaymentStatus =
  | "Pending"
  | "PendingReview"
  | "Clearing"
  | "Sent"
  | "Rejected"
  | "Canceled";

export interface UnitPaymentAttributes {
  createdAt: string;
  status: UnitPaymentStatus;
  amount: number;
  description: string;
  direction?: "Credit" | "Debit";
  reason?: string | null;
  counterparty?: {
    routingNumber: string;
    accountNumber: string;
    accountType?: string;
    name: string;
  };
  tags?: Record<string, string>;
  [key: string]: unknown;
}

export type UnitPaymentResource = JsonApiResource<UnitPaymentAttributes>;
export type UnitPaymentDocument = JsonApiDocument<UnitPaymentAttributes>;

export interface UnitCreateBookPaymentRequestAttributes {
  amount: number;
  description: string;
  idempotencyKey?: string;
  tags?: Record<string, string>;
}

export interface UnitCreateAchPaymentRequestAttributes {
  amount: number;
  direction: "Credit" | "Debit";
  description: string;
  addenda?: string;
  sameDay?: boolean;
  idempotencyKey?: string;
  tags?: Record<string, string>;
}

export interface UnitCreateWirePaymentRequestAttributes {
  amount: number;
  description: string;
  counterparty: {
    name: string;
    routingNumber: string;
    accountNumber: string;
    address: UnitAddress;
  };
  idempotencyKey?: string;
  tags?: Record<string, string>;
}

export type UnitCounterpartyAccountType = "Checking" | "Savings" | "Loan";
export type UnitCounterpartyType = "Business" | "Person" | "Unknown";
export type UnitCounterpartyPermissions = "CreditOnly" | "DebitOnly" | "CreditAndDebit";

export interface UnitCounterpartyAttributes {
  createdAt: string;
  name: string;
  routingNumber: string;
  bank?: string;
  accountNumber: string;
  accountType: UnitCounterpartyAccountType;
  type: UnitCounterpartyType;
  permissions?: UnitCounterpartyPermissions;
  tags?: Record<string, string>;
  [key: string]: unknown;
}

export type UnitCounterpartyResource = JsonApiResource<UnitCounterpartyAttributes>;
export type UnitCounterpartyDocument = JsonApiDocument<UnitCounterpartyAttributes>;

export interface UnitCreateAchCounterpartyRequestAttributes {
  name: string;
  routingNumber: string;
  accountNumber: string;
  accountType: UnitCounterpartyAccountType;
  type: UnitCounterpartyType;
  permissions?: UnitCounterpartyPermissions;
  tags?: Record<string, string>;
  idempotencyKey?: string;
}
