import { notFound } from "next/navigation";
import { callInternalApi } from "@/lib/internal-api";
import type { PaymentResponse } from "@chiklati/shared";
import { RefreshButton } from "@/components/RefreshButton";
import { StatusChip } from "@/components/StatusChip";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { SandboxControls } from "./sandbox-controls";

function formatCents(cents: string): string {
  return (Number(cents) / 100).toFixed(2);
}

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const { id } = await params;

  const result = await callInternalApi<PaymentResponse>(`/payments/${id}`, { method: "GET" });

  if (result.status === 404) {
    notFound();
  }

  const payment = result.body;

  return (
    <Stack spacing={3} sx={{ maxWidth: 640 }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            {payment.rail} payment
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {payment.unitPaymentId}
          </Typography>
        </Box>
        <RefreshButton />
      </Stack>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <StatusChip status={payment.status} />
            <Chip label={payment.direction} size="small" variant="outlined" />
          </Stack>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            ${formatCents(payment.amount)}
          </Typography>
          <Typography color="text.secondary">{payment.description}</Typography>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Counterparty
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box
          component="pre"
          sx={{
            m: 0,
            p: 2,
            bgcolor: "grey.50",
            borderRadius: 1,
            fontSize: 13,
            overflowX: "auto",
          }}
        >
          {JSON.stringify(payment.counterpartySnapshot, null, 2)}
        </Box>
      </Paper>

      <SandboxControls paymentId={payment.id} rail={payment.rail} status={payment.status} />
    </Stack>
  );
}
