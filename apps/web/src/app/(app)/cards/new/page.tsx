import { callInternalApi } from "@/lib/internal-api";
import type { AccountResponse, CustomerResponse } from "@chiklati/shared";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CardForm } from "./card-form";

export default async function NewCardPage(): Promise<React.ReactElement> {
  const [accountsResult, customersResult] = await Promise.all([
    callInternalApi<AccountResponse[]>("/accounts", { method: "GET" }),
    callInternalApi<CustomerResponse[]>("/customers", { method: "GET" }),
  ]);

  const accounts = accountsResult.status === 200 ? accountsResult.body : [];
  const customers = customersResult.status === 200 ? customersResult.body : [];
  const businessCustomerIds = new Set(
    customers.filter((customer) => customer.type === "Business").map((customer) => customer.id),
  );

  return (
    <Stack spacing={3}>
      <Typography variant="h4" sx={{ fontWeight: 600 }}>
        Issue a card
      </Typography>
      <CardForm accounts={accounts} businessCustomerIds={[...businessCustomerIds]} />
    </Stack>
  );
}
