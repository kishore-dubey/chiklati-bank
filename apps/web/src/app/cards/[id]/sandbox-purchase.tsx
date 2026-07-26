"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CardStatus } from "@chiklati/shared";

export function SandboxPurchase({
  cardId,
  status,
}: {
  cardId: string;
  status: CardStatus;
}): React.ReactElement | null {
  const router = useRouter();
  const [amount, setAmount] = useState("15.00");
  const [merchantName, setMerchantName] = useState("Coffee Shop");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status !== "Active") {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const cents = Math.round(Number(amount) * 100).toString();
      const response = await fetch(`/api/sandbox/cards/${cardId}/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: cents, merchantName }),
      });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        setError(body.error ?? "Simulation request failed");
        return;
      }
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <legend>Simulate a purchase (sandbox only)</legend>
      <input
        placeholder="Amount (dollars)"
        type="number"
        step="0.01"
        min="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />
      <input
        placeholder="Merchant name"
        value={merchantName}
        onChange={(e) => setMerchantName(e.target.value)}
        required
      />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Simulating..." : "Simulate purchase"}
      </button>
      {error ? <p role="alert">{error}</p> : null}
    </form>
  );
}
