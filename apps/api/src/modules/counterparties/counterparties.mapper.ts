import type { Counterparty } from "@chiklati/db";
import type { CounterpartyResponse, CreateCounterpartyInput } from "@chiklati/shared";
import type { UnitCreateAchCounterpartyRequestAttributes } from "../../lib/unit/unit-payments.types.js";

export function toUnitAchCounterpartyAttributes(
  input: CreateCounterpartyInput,
  idempotencyKey: string,
): UnitCreateAchCounterpartyRequestAttributes {
  return {
    name: input.name,
    routingNumber: input.routingNumber,
    accountNumber: input.accountNumber,
    accountType: input.accountType,
    type: input.type,
    permissions: input.permissions,
    idempotencyKey,
  };
}

export function toCounterpartyResponse(record: Counterparty): CounterpartyResponse {
  return {
    id: record.id,
    unitCounterpartyId: record.unitCounterpartyId,
    customerId: record.customerId,
    name: record.name,
    routingNumber: record.routingNumber,
    accountNumber: record.accountNumber,
    accountType: record.accountType,
    type: record.type,
    permissions: record.permissions,
    createdAt: record.createdAt.toISOString(),
  };
}
