"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlined";

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
    <Stack spacing={1} sx={{ mt: 1 }}>
      <Button
        size="small"
        variant="outlined"
        startIcon={<AddCircleOutlineIcon fontSize="small" />}
        onClick={handleClick}
        disabled={isSubmitting}
        sx={{ alignSelf: "flex-start" }}
      >
        {isSubmitting ? "Creating..." : "Create account"}
      </Button>
      {error ? <Alert severity="error">{error}</Alert> : null}
    </Stack>
  );
}
