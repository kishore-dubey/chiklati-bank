"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PaymentRail, PaymentStatus } from "@chiklati/shared";

const ACH_ACTIONS: Record<string, { label: string; path: string }> = {
  Pending: { label: "Simulate ACH transmit", path: "ach/transmit" },
  Clearing: { label: "Simulate ACH clear", path: "ach/clear" },
};

const WIRE_ACTIONS: Record<string, { label: string; path: string }> = {
  Pending: { label: "Simulate wire transmit", path: "wire/transmit" },
};

export function SandboxControls({
  paymentId,
  rail,
  status,
}: {
  paymentId: string;
  rail: PaymentRail;
  status: PaymentStatus;
}): React.ReactElement | null {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const action = rail === "Ach" ? ACH_ACTIONS[status] : rail === "Wire" ? WIRE_ACTIONS[status] : undefined;

  if (!action) {
    return null;
  }

  async function handleClick(): Promise<void> {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/sandbox/payments/${paymentId}/${action?.path}`, {
        method: "POST",
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
    <div>
      <button type="button" onClick={handleClick} disabled={isSubmitting}>
        {isSubmitting ? "Simulating..." : action.label}
      </button>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
