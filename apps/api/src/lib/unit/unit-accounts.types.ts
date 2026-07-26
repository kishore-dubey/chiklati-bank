import type { JsonApiDocument, JsonApiResource } from "./unit-client.types.js";

export type UnitAccountStatus = "Open" | "Frozen" | "Closed";

export interface UnitAccountAttributes {
  createdAt: string;
  name?: string;
  depositProduct: string;
  status: UnitAccountStatus;
  routingNumber: string;
  accountNumber: string;
  currency: string;
  // Wire format is a JSON number -- the mapper is the single point where this
  // gets converted to BigInt. Nothing downstream of that boundary should ever
  // touch a `number` for money again.
  balance: number;
  hold: number;
  available: number;
  tags?: Record<string, string>;
  [key: string]: unknown;
}

export type UnitAccountResource = JsonApiResource<UnitAccountAttributes>;
export type UnitAccountDocument = JsonApiDocument<UnitAccountAttributes>;

export interface UnitCreateAccountRequestAttributes {
  depositProduct: string;
  tags?: Record<string, string>;
  idempotencyKey?: string;
}

export type UnitTransactionDirection = "Credit" | "Debit";

export interface UnitTransactionAttributes {
  createdAt: string;
  direction: UnitTransactionDirection;
  amount: number;
  balance: number;
  summary: string;
  tags?: Record<string, string>;
  [key: string]: unknown;
}

export type UnitTransactionResource = JsonApiResource<UnitTransactionAttributes>;

export interface UnitTransactionListDocument {
  data: UnitTransactionResource[];
}

export type UnitTransactionDocument = JsonApiDocument<UnitTransactionAttributes>;
