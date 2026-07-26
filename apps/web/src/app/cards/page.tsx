import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { callInternalApi } from "@/lib/internal-api";
import type { CardResponse } from "@chiklati/shared";

export default async function CardsPage(): Promise<React.ReactElement> {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const result = await callInternalApi<CardResponse[]>("/cards", { method: "GET" });
  const cards = result.status === 200 ? result.body : [];

  return (
    <main>
      <h1>Cards</h1>
      <Link href="/cards/new">Issue a card</Link>

      {cards.length === 0 ? (
        <p>No cards yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Card</th>
              <th>Type</th>
              <th>Status</th>
              <th>Expires</th>
            </tr>
          </thead>
          <tbody>
            {cards.map((card) => (
              <tr key={card.id}>
                <td>
                  <Link href={`/cards/${card.id}`}>&bull;&bull;&bull;&bull; {card.last4Digits}</Link>
                </td>
                <td>{card.type}</td>
                <td>{card.status}</td>
                <td>{card.expirationDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
