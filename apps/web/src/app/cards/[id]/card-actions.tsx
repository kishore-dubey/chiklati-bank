"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CardResponse, CardStatus } from "@chiklati/shared";

const ACTIONS_BY_STATUS: Record<string, { label: string; path: string }[]> = {
  Active: [
    { label: "Freeze", path: "freeze" },
    { label: "Close", path: "close" },
    { label: "Report stolen", path: "report-stolen" },
    { label: "Report lost", path: "report-lost" },
  ],
  Frozen: [
    { label: "Unfreeze", path: "unfreeze" },
    { label: "Close", path: "close" },
    { label: "Report stolen", path: "report-stolen" },
    { label: "Report lost", path: "report-lost" },
  ],
};

export function CardActions({
  cardId,
  status,
}: {
  cardId: string;
  status: CardStatus;
}): React.ReactElement | null {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const actions = ACTIONS_BY_STATUS[status];

  if (!actions) {
    return null;
  }

  async function handleClick(path: string): Promise<void> {
    setIsSubmitting(path);
    setError(null);
    try {
      const response = await fetch(`/api/cards/${cardId}/${path}`, {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
      });
      const body = (await response.json()) as CardResponse | { error?: string };
      if (!response.ok) {
        setError("error" in body ? (body.error ?? "Action failed") : "Action failed");
        return;
      }
      router.refresh();
    } finally {
      setIsSubmitting(null);
    }
  }

  return (
    <div>
      {actions.map((action) => (
        <button
          key={action.path}
          type="button"
          disabled={isSubmitting !== null}
          onClick={() => handleClick(action.path)}
        >
          {isSubmitting === action.path ? "Working..." : action.label}
        </button>
      ))}
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
