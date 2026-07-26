import { PaymentStatus, type Payment } from "@chiklati/db";
import type { AchPaymentInput, BookPaymentInput, PaymentResponse, WirePaymentInput } from "@chiklati/shared";
import type {
  UnitCreateAchPaymentRequestAttributes,
  UnitCreateBookPaymentRequestAttributes,
  UnitCreateWirePaymentRequestAttributes,
  UnitPaymentStatus,
} from "../../lib/unit/unit-payments.types.js";

export function toLocalPaymentStatus(status: UnitPaymentStatus): PaymentStatus {
  return PaymentStatus[status as keyof typeof PaymentStatus];
}

export function toUnitBookPaymentAttributes(
  input: BookPaymentInput,
  idempotencyKey: string,
): UnitCreateBookPaymentRequestAttributes {
  return {
    amount: Number(input.amount),
    description: input.description,
    idempotencyKey,
  };
}

export function toUnitAchPaymentAttributes(
  input: AchPaymentInput,
  idempotencyKey: string,
): UnitCreateAchPaymentRequestAttributes {
  return {
    amount: Number(input.amount),
    direction: input.direction,
    description: input.description,
    addenda: input.addenda,
    sameDay: input.sameDay,
    idempotencyKey,
  };
}

export function toUnitWirePaymentAttributes(
  input: WirePaymentInput,
  idempotencyKey: string,
): UnitCreateWirePaymentRequestAttributes {
  return {
    amount: Number(input.amount),
    description: input.description,
    counterparty: input.counterparty,
    idempotencyKey,
  };
}

export function toPaymentResponse(record: Payment): PaymentResponse {
  return {
    id: record.id,
    unitPaymentId: record.unitPaymentId,
    rail: record.rail,
    accountId: record.accountId,
    direction: record.direction,
    amount: record.amount.toString(),
    status: record.status,
    description: record.description,
    counterpartyId: record.counterpartyId,
    counterpartySnapshot: record.counterpartySnapshot as Record<string, unknown>,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
