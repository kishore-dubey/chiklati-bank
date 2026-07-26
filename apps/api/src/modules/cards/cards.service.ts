import { CardStatus, CardType } from "@chiklati/db";
import type { CardResponse, CreateCardInput } from "@chiklati/shared";
import {
  closeCard as closeUnitCard,
  createBusinessVirtualCard,
  createIndividualVirtualCard,
  freezeCard as freezeUnitCard,
  reportLostCard as reportLostUnitCard,
  reportStolenCard as reportStolenUnitCard,
  unfreezeCard as unfreezeUnitCard,
} from "../../lib/unit/cards.resource.js";
import type { UnitCardDocument } from "../../lib/unit/unit-cards.types.js";
import { findAccountById } from "../accounts/accounts.repository.js";
import { findActiveCustomerForUser } from "../customers/customers.repository.js";
import { createCardRecord, findCardById, findCardsForUser, updateCardStatusById } from "./cards.repository.js";
import {
  toCardResponse,
  toLocalCardStatus,
  toUnitBusinessCardAttributes,
  toUnitIndividualCardAttributes,
} from "./cards.mapper.js";

export class AccountNotEligibleError extends Error {
  constructor(accountId: string) {
    super(`No account ${accountId} found for this user`);
    this.name = "AccountNotEligibleError";
  }
}

export class CardNotEligibleError extends Error {
  constructor(cardId: string) {
    super(`No card ${cardId} found for this user`);
    this.name = "CardNotEligibleError";
  }
}

export class CardholderRequiredError extends Error {
  constructor() {
    super("Cardholder details are required to issue a card on a business account");
    this.name = "CardholderRequiredError";
  }
}

export async function issueCard(
  userId: string,
  input: CreateCardInput,
  idempotencyKey: string,
): Promise<CardResponse> {
  const account = await findAccountById(input.accountId, userId);

  if (!account) {
    throw new AccountNotEligibleError(input.accountId);
  }

  const customer = await findActiveCustomerForUser(account.customerId, userId);

  if (!customer) {
    throw new AccountNotEligibleError(input.accountId);
  }

  const isBusiness = customer.type === "Business";

  let unitDocument: UnitCardDocument;

  if (isBusiness) {
    if (!input.cardholder) {
      throw new CardholderRequiredError();
    }
    unitDocument = await createBusinessVirtualCard(
      account.unitAccountId,
      toUnitBusinessCardAttributes(input.cardholder, idempotencyKey),
    );
  } else {
    unitDocument = await createIndividualVirtualCard(
      account.unitAccountId,
      toUnitIndividualCardAttributes(idempotencyKey),
    );
  }

  const attrs = unitDocument.data.attributes;

  const record = await createCardRecord({
    unitCardId: unitDocument.data.id,
    accountId: account.id,
    customerId: customer.id,
    userId,
    type: isBusiness ? CardType.BusinessVirtual : CardType.IndividualVirtual,
    status: toLocalCardStatus(attrs.status),
    last4Digits: attrs.last4Digits,
    expirationDate: attrs.expirationDate,
    tags: attrs.tags ?? null,
  });

  return toCardResponse(record);
}

export async function listCards(userId: string, accountId?: string): Promise<CardResponse[]> {
  const records = await findCardsForUser(userId, accountId);
  return records.map(toCardResponse);
}

export async function getCardById(id: string, userId: string): Promise<CardResponse | null> {
  const record = await findCardById(id, userId);
  return record ? toCardResponse(record) : null;
}

async function applyCardAction(
  id: string,
  userId: string,
  action: (unitCardId: string) => Promise<UnitCardDocument>,
  targetStatus: CardStatus,
): Promise<CardResponse> {
  const card = await findCardById(id, userId);

  if (!card) {
    throw new CardNotEligibleError(id);
  }

  await action(card.unitCardId);
  const updated = await updateCardStatusById(card.id, targetStatus);
  return toCardResponse(updated);
}

export async function freezeCard(id: string, userId: string): Promise<CardResponse> {
  return applyCardAction(id, userId, freezeUnitCard, CardStatus.Frozen);
}

export async function unfreezeCard(id: string, userId: string): Promise<CardResponse> {
  return applyCardAction(id, userId, unfreezeUnitCard, CardStatus.Active);
}

export async function closeCard(id: string, userId: string): Promise<CardResponse> {
  return applyCardAction(id, userId, closeUnitCard, CardStatus.ClosedByCustomer);
}

export async function reportCardStolen(id: string, userId: string): Promise<CardResponse> {
  return applyCardAction(id, userId, reportStolenUnitCard, CardStatus.Stolen);
}

export async function reportCardLost(id: string, userId: string): Promise<CardResponse> {
  return applyCardAction(id, userId, reportLostUnitCard, CardStatus.Lost);
}
