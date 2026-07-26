"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CardResponse, CardStatus } from "@chiklati/shared";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import AcUnitIcon from "@mui/icons-material/AcUnit";
import BlockIcon from "@mui/icons-material/Block";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import WbSunnyOutlinedIcon from "@mui/icons-material/WbSunnyOutlined";

const ACTIONS_BY_STATUS: Record<
  string,
  { label: string; path: string; color: "warning" | "success" | "error"; icon: React.ElementType }[]
> = {
  Active: [
    { label: "Freeze", path: "freeze", color: "warning", icon: AcUnitIcon },
    { label: "Close", path: "close", color: "error", icon: BlockIcon },
    { label: "Report stolen", path: "report-stolen", color: "error", icon: ReportProblemOutlinedIcon },
    { label: "Report lost", path: "report-lost", color: "error", icon: SearchOffIcon },
  ],
  Frozen: [
    { label: "Unfreeze", path: "unfreeze", color: "success", icon: WbSunnyOutlinedIcon },
    { label: "Close", path: "close", color: "error", icon: BlockIcon },
    { label: "Report stolen", path: "report-stolen", color: "error", icon: ReportProblemOutlinedIcon },
    { label: "Report lost", path: "report-lost", color: "error", icon: SearchOffIcon },
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
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
        {actions.map((action) => (
          <Button
            key={action.path}
            size="small"
            variant="outlined"
            color={action.color}
            startIcon={<action.icon fontSize="small" />}
            disabled={isSubmitting !== null}
            onClick={() => handleClick(action.path)}
          >
            {isSubmitting === action.path ? "Working..." : action.label}
          </Button>
        ))}
      </Stack>
      {error ? <Alert severity="error">{error}</Alert> : null}
    </Stack>
  );
}
