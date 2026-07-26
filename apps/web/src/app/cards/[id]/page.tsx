import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { callInternalApi } from "@/lib/internal-api";
import type { CardResponse } from "@chiklati/shared";
import { CardActions } from "./card-actions";
import { RefreshButton } from "./refresh-button";
import { SandboxPurchase } from "./sandbox-purchase";

export default async function CardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  const result = await callInternalApi<CardResponse>(`/cards/${id}`, { method: "GET" });

  if (result.status === 404) {
    notFound();
  }

  const card = result.body;

  return (
    <main>
      <h1>Card &bull;&bull;&bull;&bull; {card.last4Digits}</h1>
      <p>Status: {card.status}</p>
      <p>
        Type: {card.type} &middot; Expires: {card.expirationDate}
      </p>
      <p>Unit card ID: {card.unitCardId}</p>

      <RefreshButton />
      <CardActions cardId={card.id} status={card.status} />
      <SandboxPurchase cardId={card.id} status={card.status} />
    </main>
  );
}
