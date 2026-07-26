import { notFound } from "next/navigation";
import { callInternalApi } from "@/lib/internal-api";
import type { AccountResponse, TransactionResponse } from "@chiklati/shared";
import { RefreshButton } from "@/components/RefreshButton";
import { StatusChip } from "@/components/StatusChip";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { AccountNumberReveal } from "./account-number-reveal";

function formatCents(cents: string): string {
  return (Number(cents) / 100).toFixed(2);
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const { id } = await params;

  const accountResult = await callInternalApi<AccountResponse>(`/accounts/${id}`, { method: "GET" });

  if (accountResult.status === 404) {
    notFound();
  }

  const account = accountResult.body;

  const transactionsResult = await callInternalApi<TransactionResponse[]>(`/accounts/${id}/transactions`, {
    method: "GET",
  });
  const transactions = transactionsResult.status === 200 ? transactionsResult.body : [];

  return (
    <Stack spacing={3} sx={{ maxWidth: 720 }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, textTransform: "capitalize" }}>
            {account.depositProduct} account
          </Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Routing {account.routingNumber} &middot; Account{" "}
              <AccountNumberReveal accountNumber={account.accountNumber} />
            </Typography>
          </Stack>
        </Box>
        <RefreshButton />
      </Stack>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}>
          <StatusChip status={account.status} />
        </Stack>
        <Typography variant="h3" sx={{ fontWeight: 700 }}>
          ${formatCents(account.balance)}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Balance
        </Typography>
        <Stack direction="row" spacing={4} sx={{ mt: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              ${formatCents(account.available)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Available
            </Typography>
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              ${formatCents(account.hold)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Hold
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Transactions
        </Typography>
        {transactions.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography color="text.secondary">No transactions yet.</Typography>
          </Paper>
        ) : (
          <Paper variant="outlined">
            <List disablePadding>
              {transactions.map((txn, index) => (
                <Box key={txn.id}>
                  {index > 0 ? <Divider /> : null}
                  <ListItem
                    secondaryAction={
                      <Typography
                        sx={{
                          fontWeight: 600,
                          color: txn.direction === "Credit" ? "success.main" : "error.main",
                        }}
                      >
                        {txn.direction === "Credit" ? "+" : "-"}${formatCents(txn.amount)}
                      </Typography>
                    }
                  >
                    <ListItemText
                      primary={txn.summary}
                      secondary={`${new Date(txn.unitCreatedAt).toLocaleString()} · ${txn.type}`}
                    />
                  </ListItem>
                </Box>
              ))}
            </List>
          </Paper>
        )}
      </Box>
    </Stack>
  );
}
