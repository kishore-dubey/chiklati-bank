import Link from "next/link";
import { callInternalApi } from "@/lib/internal-api";
import type { AccountResponse, CardResponse, CustomerResponse, PaymentResponse } from "@chiklati/shared";
import { StatusChip } from "@/components/StatusChip";
import { DebitCardVisual } from "@/components/DebitCardVisual";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { CreateAccountButton } from "./create-account-button";
import { CardActions } from "../cards/[id]/card-actions";

function formatCents(cents: string): string {
  return (Number(cents) / 100).toFixed(2);
}

const RECENT_PAYMENTS_LIMIT = 5;

const QUICK_ACTIONS = [
  {
    href: "/onboarding",
    label: "Open an account",
    description: "Start a new individual or business application",
    icon: PersonAddAlt1Icon,
  },
  {
    href: "/payments/new",
    label: "Send a payment",
    description: "Book transfer, ACH, or wire",
    icon: SwapHorizIcon,
  },
  {
    href: "/cards/new",
    label: "Issue a card",
    description: "Issue a virtual debit card",
    icon: CreditCardIcon,
  },
];

export default async function DashboardPage(): Promise<React.ReactElement> {
  const [customersResult, accountsResult, cardsResult, paymentsResult] = await Promise.all([
    callInternalApi<CustomerResponse[]>("/customers", { method: "GET" }),
    callInternalApi<AccountResponse[]>("/accounts", { method: "GET" }),
    callInternalApi<CardResponse[]>("/cards", { method: "GET" }),
    callInternalApi<PaymentResponse[]>("/payments", { method: "GET" }),
  ]);

  const customers = customersResult.status === 200 ? customersResult.body : [];
  const accounts = accountsResult.status === 200 ? accountsResult.body : [];
  const cards = cardsResult.status === 200 ? cardsResult.body : [];
  const payments = paymentsResult.status === 200 ? paymentsResult.body : [];
  const recentPayments = payments.slice(0, RECENT_PAYMENTS_LIMIT);

  return (
    <Stack spacing={4}>
      <Typography variant="h4" sx={{ fontWeight: 600 }}>
        Dashboard
      </Typography>

      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Quick actions
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
            gap: 2,
          }}
        >
          {QUICK_ACTIONS.map((action) => (
            <Card key={action.href} variant="outlined">
              <CardContent>
                <action.icon color="primary" sx={{ fontSize: 32, mb: 1 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {action.label}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {action.description}
                </Typography>
                <Button href={action.href} variant="contained" size="small">
                  Go
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>

      <Box>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Your cards
          </Typography>
          <Button href="/cards" size="small">
            View all cards
          </Button>
        </Stack>
        {cards.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography color="text.secondary">No cards yet -- issue one to get started.</Typography>
          </Paper>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(auto-fill, minmax(300px, 1fr))" },
              gap: 2,
            }}
          >
            {cards.map((card) => (
              <Stack key={card.id} spacing={1}>
                <Link href={`/cards/${card.id}`} style={{ textDecoration: "none" }}>
                  <DebitCardVisual
                    last4Digits={card.last4Digits}
                    expirationDate={card.expirationDate}
                    type={card.type}
                    status={card.status}
                    compact
                  />
                </Link>
                <CardActions cardId={card.id} status={card.status} />
              </Stack>
            ))}
          </Box>
        )}
      </Box>

      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Customers &amp; accounts
        </Typography>
        {customers.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography color="text.secondary">
              No approved customers yet -- submit an application to get started.
            </Typography>
          </Paper>
        ) : (
          <Paper variant="outlined">
            <List disablePadding>
              {customers.map((customer, index) => {
                const customerAccounts = accounts.filter(
                  (account) => account.customerId === customer.id,
                );

                return (
                  <Box key={customer.id}>
                    {index > 0 ? <Divider /> : null}
                    <ListItem
                      alignItems="flex-start"
                      sx={{ flexDirection: "column", alignItems: "stretch", py: 2 }}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ alignItems: "center", mb: customerAccounts.length ? 1 : 0 }}
                      >
                        <Typography sx={{ fontWeight: 600 }}>{customer.type} customer</Typography>
                        <StatusChip status={customer.status} />
                      </Stack>
                      {customerAccounts.length === 0 ? (
                        customer.status === "Active" ? (
                          <CreateAccountButton customerId={customer.id} />
                        ) : null
                      ) : (
                        <List disablePadding dense>
                          {customerAccounts.map((account) => (
                            <ListItem key={account.id} disablePadding sx={{ py: 0.5 }}>
                              <ListItemText
                                primary={
                                  <Link href={`/accounts/${account.id}`}>
                                    {account.depositProduct} &bull;&bull;&bull;
                                    {account.accountNumber.slice(-4)}
                                  </Link>
                                }
                                secondary={`$${formatCents(account.available)} available`}
                              />
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </ListItem>
                  </Box>
                );
              })}
            </List>
          </Paper>
        )}
      </Box>

      <Box>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Recent payments
          </Typography>
          <Button href="/payments" size="small">
            View all payments
          </Button>
        </Stack>
        {recentPayments.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography color="text.secondary">No payments yet.</Typography>
          </Paper>
        ) : (
          <Paper variant="outlined">
            <List disablePadding>
              {recentPayments.map((payment, index) => (
                <Box key={payment.id}>
                  {index > 0 ? <Divider /> : null}
                  <ListItem
                    disablePadding
                    secondaryAction={<StatusChip status={payment.status} />}
                  >
                    <ListItemButton href={`/payments/${payment.id}`} sx={{ pr: 14 }}>
                      <ListItemText
                        primary={`${payment.rail} — $${formatCents(payment.amount)}`}
                        secondary={payment.description}
                      />
                    </ListItemButton>
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
