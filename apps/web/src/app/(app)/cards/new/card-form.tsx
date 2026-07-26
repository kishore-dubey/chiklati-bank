"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AccountResponse, CardResponse } from "@chiklati/shared";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

function accountLabel(account: AccountResponse): string {
  return `${account.depositProduct} •••${account.accountNumber.slice(-4)} ($${(
    Number(account.available) / 100
  ).toFixed(2)} available)`;
}

export function CardForm({
  accounts,
  businessCustomerIds,
}: {
  accounts: AccountResponse[];
  businessCustomerIds: string[];
}): React.ReactElement {
  const router = useRouter();
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const businessSet = new Set(businessCustomerIds);
  const selectedAccount = accounts.find((account) => account.id === accountId);
  const needsCardholder = selectedAccount ? businessSet.has(selectedAccount.customerId) : false;

  const [cardholder, setCardholder] = useState({
    first: "",
    last: "",
    countryCode: "1",
    number: "",
    email: "",
    dateOfBirth: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      accountId,
      ...(needsCardholder
        ? {
            cardholder: {
              fullName: { first: cardholder.first, last: cardholder.last },
              phone: { countryCode: cardholder.countryCode, number: cardholder.number },
              email: cardholder.email,
              dateOfBirth: cardholder.dateOfBirth,
              address: {
                street: cardholder.street,
                city: cardholder.city,
                state: cardholder.state,
                postalCode: cardholder.postalCode,
                country: "US",
              },
            },
          }
        : {}),
    };

    try {
      const response = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as CardResponse | { error: string };

      if (!response.ok) {
        setError("error" in body ? body.error : "Failed to issue card");
        return;
      }

      router.push(`/cards/${(body as CardResponse).id}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 3, maxWidth: 560 }}>
      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <FormControl fullWidth>
            <InputLabel id="card-account-label">Account</InputLabel>
            <Select
              labelId="card-account-label"
              label="Account"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              required
            >
              {accounts.map((account) => (
                <MenuItem key={account.id} value={account.id}>
                  {accountLabel(account)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {needsCardholder ? (
            <Stack spacing={2}>
              <Typography variant="subtitle2" color="text.secondary">
                Cardholder (required for business accounts)
              </Typography>
              <TextField
                label="First name"
                value={cardholder.first}
                onChange={(e) => setCardholder({ ...cardholder, first: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Last name"
                value={cardholder.last}
                onChange={(e) => setCardholder({ ...cardholder, last: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Phone number"
                value={cardholder.number}
                onChange={(e) => setCardholder({ ...cardholder, number: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Email"
                type="email"
                value={cardholder.email}
                onChange={(e) => setCardholder({ ...cardholder, email: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Date of birth (YYYY-MM-DD)"
                value={cardholder.dateOfBirth}
                onChange={(e) => setCardholder({ ...cardholder, dateOfBirth: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Street"
                value={cardholder.street}
                onChange={(e) => setCardholder({ ...cardholder, street: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="City"
                value={cardholder.city}
                onChange={(e) => setCardholder({ ...cardholder, city: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="State"
                value={cardholder.state}
                onChange={(e) => setCardholder({ ...cardholder, state: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Postal code"
                value={cardholder.postalCode}
                onChange={(e) => setCardholder({ ...cardholder, postalCode: e.target.value })}
                required
                fullWidth
              />
              <Button
                size="small"
                variant="outlined"
                color="secondary"
                sx={{ alignSelf: "flex-start" }}
                onClick={() =>
                  setCardholder({
                    first: "Kishore",
                    last: "Dubey",
                    countryCode: "1",
                    number: "5555550100",
                    email: "kishore@example.com",
                    dateOfBirth: "1990-01-01",
                    street: "5230 Newell Rd",
                    city: "Palo Alto",
                    state: "CA",
                    postalCode: "94303",
                  })
                }
              >
                Fill sandbox data
              </Button>
            </Stack>
          ) : null}

          <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
            {isSubmitting ? "Issuing..." : "Issue card"}
          </Button>
          {error ? <Alert severity="error">{error}</Alert> : null}
        </Stack>
      </Box>
    </Paper>
  );
}
