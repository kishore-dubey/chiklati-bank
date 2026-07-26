import { notFound } from "next/navigation";
import { callInternalApi } from "@/lib/internal-api";
import type { CardResponse } from "@chiklati/shared";
import { RefreshButton } from "@/components/RefreshButton";
import { DebitCardVisual } from "@/components/DebitCardVisual";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CardActions } from "./card-actions";
import { SandboxPurchase } from "./sandbox-purchase";

export default async function CardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const { id } = await params;

  const result = await callInternalApi<CardResponse>(`/cards/${id}`, { method: "GET" });

  if (result.status === 404) {
    notFound();
  }

  const card = result.body;

  return (
    <Stack spacing={3} sx={{ maxWidth: 480 }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Card details
        </Typography>
        <RefreshButton />
      </Stack>

      <DebitCardVisual
        last4Digits={card.last4Digits}
        expirationDate={card.expirationDate}
        type={card.type}
        status={card.status}
      />

      <Box>
        <Typography variant="body2" color="text.secondary">
          Unit card ID: {card.unitCardId}
        </Typography>
      </Box>

      <CardActions cardId={card.id} status={card.status} />
      <SandboxPurchase cardId={card.id} status={card.status} />
    </Stack>
  );
}
