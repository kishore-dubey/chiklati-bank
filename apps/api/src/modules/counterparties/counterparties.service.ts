import type { CounterpartyResponse, CreateCounterpartyInput } from "@chiklati/shared";
import { createAchCounterparty } from "../../lib/unit/counterparties.resource.js";
import { findActiveCustomerForUser } from "../customers/customers.repository.js";
import {
  createCounterpartyRecord,
  findCounterpartiesForUser,
  findCounterpartyById,
} from "./counterparties.repository.js";
import { toCounterpartyResponse, toUnitAchCounterpartyAttributes } from "./counterparties.mapper.js";

export class CustomerNotEligibleError extends Error {
  constructor(customerId: string) {
    super(`No active customer ${customerId} found for this user`);
    this.name = "CustomerNotEligibleError";
  }
}

export async function createCounterparty(
  userId: string,
  input: CreateCounterpartyInput,
  idempotencyKey: string,
): Promise<CounterpartyResponse> {
  const customer = await findActiveCustomerForUser(input.customerId, userId);

  if (!customer) {
    throw new CustomerNotEligibleError(input.customerId);
  }

  const unitDocument = await createAchCounterparty(
    customer.unitCustomerId,
    toUnitAchCounterpartyAttributes(input, idempotencyKey),
  );
  const attrs = unitDocument.data.attributes;

  const record = await createCounterpartyRecord({
    unitCounterpartyId: unitDocument.data.id,
    customerId: customer.id,
    userId,
    name: attrs.name,
    routingNumber: attrs.routingNumber,
    accountNumber: attrs.accountNumber,
    accountType: attrs.accountType,
    type: attrs.type,
    permissions: attrs.permissions ?? null,
    tags: attrs.tags ?? null,
  });

  return toCounterpartyResponse(record);
}

export async function listCounterparties(
  userId: string,
  customerId?: string,
): Promise<CounterpartyResponse[]> {
  const records = await findCounterpartiesForUser(userId, customerId);
  return records.map(toCounterpartyResponse);
}

export async function getCounterpartyById(
  id: string,
  userId: string,
): Promise<CounterpartyResponse | null> {
  const record = await findCounterpartyById(id, userId);
  return record ? toCounterpartyResponse(record) : null;
}
