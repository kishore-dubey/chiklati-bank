import { describe, expect, it } from "vitest";
import { PaymentDirection, PaymentRail, PaymentStatus, type Payment } from "@chiklati/db";
import type { AchPaymentInput, BookPaymentInput, WirePaymentInput } from "@chiklati/shared";
import {
  toLocalPaymentStatus,
  toPaymentResponse,
  toUnitAchPaymentAttributes,
  toUnitBookPaymentAttributes,
  toUnitWirePaymentAttributes,
} from "../src/modules/payments/payments.mapper.js";

const bookInput: BookPaymentInput = {
  rail: "book",
  accountId: "acc-1",
  counterpartyAccountId: "acc-2",
  amount: "1000",
  description: "Test book",
};

const achInput: AchPaymentInput = {
  rail: "ach",
  accountId: "acc-1",
  counterpartyId: "cp-1",
  amount: "500",
  direction: "Credit",
  description: "Test ach",
  sameDay: false,
};

const wireInput: WirePaymentInput = {
  rail: "wire",
  accountId: "acc-1",
  amount: "2500",
  description: "Test wire",
  counterparty: {
    name: "Jane Doe",
    routingNumber: "812345678",
    accountNumber: "1234567890",
    address: { street: "1 Main St", city: "NYC", state: "NY", postalCode: "10001", country: "US" },
  },
};

const payment: Payment = {
  id: "pay-1",
  unitPaymentId: "999",
  rail: PaymentRail.Book,
  accountId: "acc-1",
  userId: "user-1",
  direction: PaymentDirection.Credit,
  amount: 1000n,
  status: PaymentStatus.Sent,
  description: "Test book",
  counterpartyId: null,
  counterpartySnapshot: { counterpartyAccountId: "acc-2" },
  tags: null,
  lastEventAt: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:01.000Z"),
};

describe("payments.mapper", () => {
  it("maps a book payment input to Unit attributes, injecting the idempotency key", () => {
    const result = toUnitBookPaymentAttributes(bookInput, "idem-1");
    expect(result).toEqual({ amount: 1000, description: "Test book", idempotencyKey: "idem-1" });
  });

  it("maps an ACH payment input to Unit attributes, injecting the idempotency key", () => {
    const result = toUnitAchPaymentAttributes(achInput, "idem-2");
    expect(result).toEqual({
      amount: 500,
      direction: "Credit",
      description: "Test ach",
      addenda: undefined,
      sameDay: false,
      idempotencyKey: "idem-2",
    });
  });

  it("maps a wire payment input to Unit attributes, injecting the idempotency key", () => {
    const result = toUnitWirePaymentAttributes(wireInput, "idem-3");
    expect(result.amount).toBe(2500);
    expect(result.counterparty.name).toBe("Jane Doe");
    expect(result.idempotencyKey).toBe("idem-3");
  });

  it("maps Unit's payment status strings onto the local enum", () => {
    expect(toLocalPaymentStatus("Pending")).toBe(PaymentStatus.Pending);
    expect(toLocalPaymentStatus("Sent")).toBe(PaymentStatus.Sent);
    expect(toLocalPaymentStatus("Rejected")).toBe(PaymentStatus.Rejected);
  });

  it("maps a Payment record to the response DTO, stringifying BigInt money fields", () => {
    const result = toPaymentResponse(payment);
    expect(result).toEqual({
      id: "pay-1",
      unitPaymentId: "999",
      rail: "Book",
      accountId: "acc-1",
      direction: "Credit",
      amount: "1000",
      status: "Sent",
      description: "Test book",
      counterpartyId: null,
      counterpartySnapshot: { counterpartyAccountId: "acc-2" },
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:01.000Z",
    });
  });
});
