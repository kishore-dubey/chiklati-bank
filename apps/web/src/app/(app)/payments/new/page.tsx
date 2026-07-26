import { callInternalApi } from "@/lib/internal-api";
import type { AccountResponse, CounterpartyResponse } from "@chiklati/shared";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PaymentForm } from "./payment-form";

export default async function NewPaymentPage(): Promise<React.ReactElement> {
  const [accountsResult, counterpartiesResult] = await Promise.all([
    callInternalApi<AccountResponse[]>("/accounts", { method: "GET" }),
    callInternalApi<CounterpartyResponse[]>("/counterparties", { method: "GET" }),
  ]);

  const accounts = accountsResult.status === 200 ? accountsResult.body : [];
  const counterparties = counterpartiesResult.status === 200 ? counterpartiesResult.body : [];

  return (
    <Stack spacing={3}>
      <Typography variant="h4" sx={{ fontWeight: 600 }}>
        Send a payment
      </Typography>
      <PaymentForm accounts={accounts} counterparties={counterparties} />
    </Stack>
  );
}
