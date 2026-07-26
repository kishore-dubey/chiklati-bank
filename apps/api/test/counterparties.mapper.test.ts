import { describe, expect, it } from "vitest";
import {
  CounterpartyAccountType,
  CounterpartyPermissions,
  CounterpartyType,
  type Counterparty,
} from "@chiklati/db";
import type { CreateCounterpartyInput } from "@chiklati/shared";
import {
  toCounterpartyResponse,
  toUnitAchCounterpartyAttributes,
} from "../src/modules/counterparties/counterparties.mapper.js";

const input: CreateCounterpartyInput = {
  customerId: "cust-1",
  name: "Jane External",
  routingNumber: "812345678",
  accountNumber: "9988776655",
  accountType: "Checking",
  type: "Person",
};

const counterparty: Counterparty = {
  id: "cp-1",
  unitCounterpartyId: "2152047",
  customerId: "cust-1",
  userId: "user-1",
  name: "Jane External",
  routingNumber: "812345678",
  accountNumber: "9988776655",
  accountType: CounterpartyAccountType.Checking,
  type: CounterpartyType.Person,
  permissions: CounterpartyPermissions.CreditOnly,
  tags: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

describe("counterparties.mapper", () => {
  it("maps a create-counterparty input to Unit attributes, injecting the idempotency key", () => {
    const result = toUnitAchCounterpartyAttributes(input, "idem-1");
    expect(result).toEqual({
      name: "Jane External",
      routingNumber: "812345678",
      accountNumber: "9988776655",
      accountType: "Checking",
      type: "Person",
      permissions: undefined,
      idempotencyKey: "idem-1",
    });
  });

  it("maps a Counterparty record to the response DTO", () => {
    const result = toCounterpartyResponse(counterparty);
    expect(result).toEqual({
      id: "cp-1",
      unitCounterpartyId: "2152047",
      customerId: "cust-1",
      name: "Jane External",
      routingNumber: "812345678",
      accountNumber: "9988776655",
      accountType: "Checking",
      type: "Person",
      permissions: "CreditOnly",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  });
});
