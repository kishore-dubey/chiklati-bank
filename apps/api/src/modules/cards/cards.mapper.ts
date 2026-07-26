import { CardStatus, type Card } from "@chiklati/db";
import type { CardResponse, Cardholder } from "@chiklati/shared";
import type {
  UnitCreateBusinessCardRequestAttributes,
  UnitCreateIndividualCardRequestAttributes,
} from "../../lib/unit/unit-cards.types.js";

export function toLocalCardStatus(status: string): CardStatus {
  return CardStatus[status as keyof typeof CardStatus];
}

export function toUnitIndividualCardAttributes(
  idempotencyKey: string,
): UnitCreateIndividualCardRequestAttributes {
  return { idempotencyKey };
}

export function toUnitBusinessCardAttributes(
  cardholder: Cardholder,
  idempotencyKey: string,
): UnitCreateBusinessCardRequestAttributes {
  return {
    address: cardholder.address,
    fullName: cardholder.fullName,
    phone: cardholder.phone,
    email: cardholder.email,
    dateOfBirth: cardholder.dateOfBirth,
    idempotencyKey,
  };
}

export function toCardResponse(record: Card): CardResponse {
  return {
    id: record.id,
    unitCardId: record.unitCardId,
    accountId: record.accountId,
    type: record.type,
    status: record.status,
    last4Digits: record.last4Digits,
    expirationDate: record.expirationDate,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
