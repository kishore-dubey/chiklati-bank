import { describe, expect, it } from "vitest";
import { CardStatus, CardType, type Card } from "@chiklati/db";
import type { Cardholder } from "@chiklati/shared";
import {
  toCardResponse,
  toLocalCardStatus,
  toUnitBusinessCardAttributes,
  toUnitIndividualCardAttributes,
} from "../src/modules/cards/cards.mapper.js";

const cardholder: Cardholder = {
  fullName: { first: "Kishore", last: "Dubey" },
  phone: { countryCode: "1", number: "5555550100" },
  email: "kishore@example.com",
  dateOfBirth: "1990-01-01",
  address: { street: "5230 Newell Rd", city: "Palo Alto", state: "CA", postalCode: "94303", country: "US" },
};

const card: Card = {
  id: "card-1",
  unitCardId: "9372626",
  accountId: "acc-1",
  customerId: "cust-1",
  userId: "user-1",
  type: CardType.BusinessVirtual,
  status: CardStatus.Active,
  last4Digits: "3545",
  expirationDate: "2030-07",
  tags: null,
  lastEventAt: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:01.000Z"),
};

describe("cards.mapper", () => {
  it("maps individual card creation to Unit attributes, injecting only the idempotency key", () => {
    const result = toUnitIndividualCardAttributes("idem-1");
    expect(result).toEqual({ idempotencyKey: "idem-1" });
  });

  it("maps business card creation to Unit attributes, carrying the full cardholder", () => {
    const result = toUnitBusinessCardAttributes(cardholder, "idem-2");
    expect(result).toEqual({
      address: cardholder.address,
      fullName: cardholder.fullName,
      phone: cardholder.phone,
      email: cardholder.email,
      dateOfBirth: cardholder.dateOfBirth,
      idempotencyKey: "idem-2",
    });
  });

  it("maps Unit's card status strings onto the local enum", () => {
    expect(toLocalCardStatus("Active")).toBe(CardStatus.Active);
    expect(toLocalCardStatus("Frozen")).toBe(CardStatus.Frozen);
    expect(toLocalCardStatus("Stolen")).toBe(CardStatus.Stolen);
  });

  it("maps a Card record to the response DTO", () => {
    const result = toCardResponse(card);
    expect(result).toEqual({
      id: "card-1",
      unitCardId: "9372626",
      accountId: "acc-1",
      type: "BusinessVirtual",
      status: "Active",
      last4Digits: "3545",
      expirationDate: "2030-07",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:01.000Z",
    });
  });
});
