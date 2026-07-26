"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateAccountButton({ customerId }: { customerId: string }): React.ReactElement {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick(): Promise<void> {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ customerId }),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        setError(body.error ?? "Failed to create account");
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
        {isSubmitting ? "Creating..." : "Create account"}
      </button>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
