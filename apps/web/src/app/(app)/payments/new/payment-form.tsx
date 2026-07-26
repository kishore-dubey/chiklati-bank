"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AccountResponse, CounterpartyResponse, PaymentResponse } from "@chiklati/shared";
import { StatusChip } from "@/components/StatusChip";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { usePaymentStatusPolling } from "../payment-status-poller";

type Rail = "book" | "ach" | "wire";

function toCents(dollars: string): string {
  const value = Math.round(Number(dollars) * 100);
  return Number.isFinite(value) && value >= 0 ? value.toString() : "0";
}

function accountLabel(account: AccountResponse): string {
  return `${account.depositProduct} •••${account.accountNumber.slice(-4)} ($${(
    Number(account.available) / 100
  ).toFixed(2)} available)`;
}

export function PaymentForm({
  accounts,
  counterparties: initialCounterparties,
}: {
  accounts: AccountResponse[];
  counterparties: CounterpartyResponse[];
}): React.ReactElement {
  const router = useRouter();
  const [rail, setRail] = useState<Rail>("book");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdPayment, setCreatedPayment] = useState<PaymentResponse | null>(null);

  // Book
  const [counterpartyAccountId, setCounterpartyAccountId] = useState(
    accounts[1]?.id ?? accounts[0]?.id ?? "",
  );

  // ACH
  const [counterparties, setCounterparties] = useState(initialCounterparties);
  const [counterpartyId, setCounterpartyId] = useState(initialCounterparties[0]?.id ?? "");
  const [direction, setDirection] = useState<"Credit" | "Debit">("Credit");
  const [showNewCounterparty, setShowNewCounterparty] = useState(false);
  const [newCounterparty, setNewCounterparty] = useState({
    name: "",
    routingNumber: "",
    accountNumber: "",
  });
  const [isCreatingCounterparty, setIsCreatingCounterparty] = useState(false);

  // Wire
  const [wireCounterparty, setWireCounterparty] = useState({
    name: "",
    routingNumber: "",
    accountNumber: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
  });

  async function handleCreateCounterparty(): Promise<void> {
    if (!accounts[0]) {
      return;
    }
    setIsCreatingCounterparty(true);
    setError(null);
    try {
      const response = await fetch("/api/counterparties", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({
          customerId: accounts[0].customerId,
          ...newCounterparty,
          accountType: "Checking",
          type: "Person",
        }),
      });
      const body = (await response.json()) as CounterpartyResponse | { error: string };
      if (!response.ok) {
        setError("error" in body ? body.error : "Failed to create counterparty");
        return;
      }
      const counterparty = body as CounterpartyResponse;
      setCounterparties((current) => [...current, counterparty]);
      setCounterpartyId(counterparty.id);
      setShowNewCounterparty(false);
    } finally {
      setIsCreatingCounterparty(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    setCreatedPayment(null);

    const payload =
      rail === "book"
        ? { rail, accountId, counterpartyAccountId, amount: toCents(amount), description }
        : rail === "ach"
          ? { rail, accountId, counterpartyId, amount: toCents(amount), direction, description }
          : {
              rail,
              accountId,
              amount: toCents(amount),
              description,
              counterparty: {
                name: wireCounterparty.name,
                routingNumber: wireCounterparty.routingNumber,
                accountNumber: wireCounterparty.accountNumber,
                address: {
                  street: wireCounterparty.street,
                  city: wireCounterparty.city,
                  state: wireCounterparty.state,
                  postalCode: wireCounterparty.postalCode,
                  country: "US",
                },
              },
            };

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as PaymentResponse | { error: string };

      if (!response.ok) {
        setError("error" in body ? body.error : "Payment failed");
        return;
      }

      setCreatedPayment(body as PaymentResponse);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Stack spacing={3} sx={{ maxWidth: 560 }}>
      <ToggleButtonGroup
        value={rail}
        exclusive
        onChange={(_event, value: Rail | null) => value && setRail(value)}
        color="primary"
        fullWidth
      >
        <ToggleButton value="book">Book</ToggleButton>
        <ToggleButton value="ach">ACH</ToggleButton>
        <ToggleButton value="wire">Wire</ToggleButton>
      </ToggleButtonGroup>

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel id="from-account-label">From account</InputLabel>
              <Select
                labelId="from-account-label"
                label="From account"
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

            {rail === "book" ? (
              <FormControl fullWidth>
                <InputLabel id="to-account-label">To account (one of your own)</InputLabel>
                <Select
                  labelId="to-account-label"
                  label="To account (one of your own)"
                  value={counterpartyAccountId}
                  onChange={(e) => setCounterpartyAccountId(e.target.value)}
                  required
                >
                  {accounts.map((account) => (
                    <MenuItem key={account.id} value={account.id}>
                      {accountLabel(account)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : null}

            {rail === "ach" ? (
              <Stack spacing={2}>
                <FormControl fullWidth>
                  <InputLabel id="counterparty-label">Counterparty</InputLabel>
                  <Select
                    labelId="counterparty-label"
                    label="Counterparty"
                    value={counterpartyId}
                    onChange={(e) => setCounterpartyId(e.target.value)}
                  >
                    {counterparties.map((counterparty) => (
                      <MenuItem key={counterparty.id} value={counterparty.id}>
                        {counterparty.name} •••{counterparty.accountNumber.slice(-4)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  size="small"
                  variant="text"
                  onClick={() => setShowNewCounterparty((v) => !v)}
                  sx={{ alignSelf: "flex-start" }}
                >
                  {showNewCounterparty ? "Cancel" : "+ Add new counterparty"}
                </Button>

                {showNewCounterparty ? (
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={2}>
                      <TextField
                        label="Name"
                        value={newCounterparty.name}
                        onChange={(e) => setNewCounterparty({ ...newCounterparty, name: e.target.value })}
                        fullWidth
                      />
                      <TextField
                        label="Routing number"
                        value={newCounterparty.routingNumber}
                        onChange={(e) =>
                          setNewCounterparty({ ...newCounterparty, routingNumber: e.target.value })
                        }
                        fullWidth
                      />
                      <TextField
                        label="Account number"
                        value={newCounterparty.accountNumber}
                        onChange={(e) =>
                          setNewCounterparty({ ...newCounterparty, accountNumber: e.target.value })
                        }
                        fullWidth
                      />
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="outlined"
                          color="secondary"
                          onClick={() =>
                            setNewCounterparty({
                              name: "Jane Sandbox",
                              routingNumber: "812345678",
                              accountNumber: "9988771234",
                            })
                          }
                        >
                          Fill sandbox data
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          disabled={isCreatingCounterparty}
                          onClick={handleCreateCounterparty}
                        >
                          {isCreatingCounterparty ? "Creating..." : "Create counterparty"}
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                ) : null}

                <FormControl>
                  <FormLabel id="direction-label">Direction</FormLabel>
                  <ToggleButtonGroup
                    value={direction}
                    exclusive
                    onChange={(_event, value: "Credit" | "Debit" | null) => value && setDirection(value)}
                    size="small"
                    sx={{ mt: 1 }}
                  >
                    <ToggleButton value="Credit">Credit (push funds out)</ToggleButton>
                    <ToggleButton value="Debit">Debit (pull funds in)</ToggleButton>
                  </ToggleButtonGroup>
                </FormControl>
              </Stack>
            ) : null}

            {rail === "wire" ? (
              <Stack spacing={2}>
                <Typography variant="subtitle2" color="text.secondary">
                  Wire counterparty
                </Typography>
                <TextField
                  label="Name"
                  value={wireCounterparty.name}
                  onChange={(e) => setWireCounterparty({ ...wireCounterparty, name: e.target.value })}
                  required
                  fullWidth
                />
                <TextField
                  label="Routing number"
                  value={wireCounterparty.routingNumber}
                  onChange={(e) =>
                    setWireCounterparty({ ...wireCounterparty, routingNumber: e.target.value })
                  }
                  required
                  fullWidth
                />
                <TextField
                  label="Account number"
                  value={wireCounterparty.accountNumber}
                  onChange={(e) =>
                    setWireCounterparty({ ...wireCounterparty, accountNumber: e.target.value })
                  }
                  required
                  fullWidth
                />
                <TextField
                  label="Street"
                  value={wireCounterparty.street}
                  onChange={(e) => setWireCounterparty({ ...wireCounterparty, street: e.target.value })}
                  required
                  fullWidth
                />
                <TextField
                  label="City"
                  value={wireCounterparty.city}
                  onChange={(e) => setWireCounterparty({ ...wireCounterparty, city: e.target.value })}
                  required
                  fullWidth
                />
                <TextField
                  label="State"
                  value={wireCounterparty.state}
                  onChange={(e) => setWireCounterparty({ ...wireCounterparty, state: e.target.value })}
                  required
                  fullWidth
                />
                <TextField
                  label="Postal code"
                  value={wireCounterparty.postalCode}
                  onChange={(e) =>
                    setWireCounterparty({ ...wireCounterparty, postalCode: e.target.value })
                  }
                  required
                  fullWidth
                />
              </Stack>
            ) : null}

            <Divider />

            <TextField
              label="Amount (dollars)"
              type="number"
              slotProps={{ htmlInput: { step: "0.01", min: 0 } }}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              fullWidth
            />

            <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send payment"}
            </Button>

            {error ? <Alert severity="error">{error}</Alert> : null}
          </Stack>
        </Box>
      </Paper>

      {createdPayment ? <CreatedPaymentStatus payment={createdPayment} /> : null}
    </Stack>
  );
}

function CreatedPaymentStatus({ payment }: { payment: PaymentResponse }): React.ReactElement {
  const { payment: current, isPolling } = usePaymentStatusPolling(payment);

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
        Payment status
      </Typography>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <Typography>{current.rail}</Typography>
        <StatusChip status={current.status} />
        {isPolling ? (
          <Typography variant="caption" color="text.secondary">
            checking for updates...
          </Typography>
        ) : null}
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Unit payment ID: {current.unitPaymentId}
      </Typography>
    </Paper>
  );
}
