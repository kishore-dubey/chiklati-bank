import { CardStatus } from "@chiklati/db";
import { logger } from "../../lib/logger.js";
import { applyCardStatusUpdate, findCardByUnitCardId } from "../cards/cards.repository.js";
import { getRelationshipId } from "./webhook-event.utils.js";
import type { IncomingUnitEvent } from "./webhooks.service.js";

export async function handleCardEvent(
  event: IncomingUnitEvent,
  eventCreatedAt: Date,
): Promise<{ cardId?: string; applied: boolean }> {
  const unitCardId = getRelationshipId(event, "card");

  if (!unitCardId) {
    logger.warn({ eventType: event.type }, "card event missing card relationship");
    return { applied: false };
  }

  if (event.type === "card.created") {
    // Normally already persisted by our own synchronous issuance response;
    // only reachable if that write crashed after Unit's call succeeded.
    // Unlike account.created, we acknowledge-only here (same reasoning as
    // payment.created's backfill) rather than reconstruct a row from just
    // the webhook -- we don't have the account/customer linkage the create
    // flow resolves.
    const existing = await findCardByUnitCardId(unitCardId);
    return { cardId: existing?.id, applied: true };
  }

  if (event.type === "card.statusChanged") {
    const newStatus = event.attributes?.["newStatus"];
    if (typeof newStatus !== "string" || !(newStatus in CardStatus)) {
      logger.warn({ unitCardId, newStatus }, "card.statusChanged event with unrecognized status");
      return { applied: false };
    }
    return applyCardStatusUpdate(unitCardId, CardStatus[newStatus as keyof typeof CardStatus], eventCreatedAt);
  }

  // card.activated, card.pinChanged, card.reissuing, card.replacing and any
  // other/future card event types: acknowledged only. These are all
  // physical-card-relevant events (activation, reissue-on-expiry, etc) that
  // this system never triggers since it only issues virtual cards.
  const existing = await findCardByUnitCardId(unitCardId);
  return { cardId: existing?.id, applied: true };
}
