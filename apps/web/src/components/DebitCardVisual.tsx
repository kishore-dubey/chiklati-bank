import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import type { CardStatus, CardType } from "@chiklati/shared";
import { StatusChip } from "./StatusChip";

const TYPE_LABEL: Record<CardType, string> = {
  IndividualVirtual: "Individual · Virtual",
  BusinessVirtual: "Business · Virtual",
};

export function DebitCardVisual({
  last4Digits,
  expirationDate,
  type,
  status,
  compact = false,
}: {
  last4Digits: string;
  expirationDate: string;
  type: CardType;
  status: CardStatus;
  compact?: boolean;
}): React.ReactElement {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: compact ? 320 : 360,
        aspectRatio: "1.6 / 1",
        borderRadius: 3,
        p: compact ? 2 : 2.5,
        color: "common.white",
        background: "linear-gradient(135deg, #0B3D66 0%, #123C6B 45%, #1B8A6B 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: 3,
      }}
    >
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <Typography variant={compact ? "caption" : "subtitle2"} sx={{ letterSpacing: 1, opacity: 0.85 }}>
          CHIKLATI BANK
        </Typography>
        <StatusChip status={status} />
      </Stack>

      <CreditCardIcon sx={{ opacity: 0.6, fontSize: compact ? 24 : 30 }} />

      <Box>
        <Typography variant={compact ? "body1" : "h6"} sx={{ letterSpacing: 2, fontFamily: "monospace" }}>
          •••• •••• •••• {last4Digits}
        </Typography>
        <Stack direction="row" sx={{ justifyContent: "space-between", mt: 0.5 }}>
          <Typography variant="caption" sx={{ opacity: 0.85 }}>
            {TYPE_LABEL[type]}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.85 }}>
            Exp {expirationDate}
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}
