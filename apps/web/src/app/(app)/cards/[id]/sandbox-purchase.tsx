"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CardStatus } from "@chiklati/shared";
import { SandboxPanel } from "@/components/SandboxPanel";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

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
    <SandboxPanel>
      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={1.5}>
          <Typography>Simulate a purchase</Typography>
          <TextField
            label="Amount (dollars)"
            type="number"
            slotProps={{ htmlInput: { step: "0.01", min: 0 } }}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            size="small"
          />
          <TextField
            label="Merchant name"
            value={merchantName}
            onChange={(e) => setMerchantName(e.target.value)}
            required
            size="small"
          />
          <Button
            type="submit"
            variant="outlined"
            color="warning"
            size="small"
            startIcon={<PlayArrowIcon fontSize="small" />}
            disabled={isSubmitting}
            sx={{ alignSelf: "flex-start" }}
          >
            {isSubmitting ? "Simulating..." : "Simulate purchase"}
          </Button>
          {error ? <Alert severity="error">{error}</Alert> : null}
        </Stack>
      </Box>
    </SandboxPanel>
  );
}
