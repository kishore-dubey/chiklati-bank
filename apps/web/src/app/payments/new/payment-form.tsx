"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AccountResponse, CounterpartyResponse, PaymentResponse } from "@chiklati/shared";
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
    <div>
      <div role="radiogroup" aria-label="Payment rail">
        <label>
          <input type="radio" checked={rail === "book"} onChange={() => setRail("book")} /> Book
        </label>{" "}
        <label>
          <input type="radio" checked={rail === "ach"} onChange={() => setRail("ach")} /> ACH
        </label>{" "}
        <label>
          <input type="radio" checked={rail === "wire"} onChange={() => setRail("wire")} /> Wire
        </label>
      </div>

      <form onSubmit={handleSubmit}>
        <fieldset>
          <legend>From account</legend>
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {accountLabel(account)}
              </option>
            ))}
          </select>
        </fieldset>

        {rail === "book" ? (
          <fieldset>
            <legend>To account (one of your own accounts)</legend>
            <select
              value={counterpartyAccountId}
              onChange={(e) => setCounterpartyAccountId(e.target.value)}
              required
            >
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {accountLabel(account)}
                </option>
              ))}
            </select>
          </fieldset>
        ) : null}

        {rail === "ach" ? (
          <fieldset>
            <legend>Counterparty</legend>
            <select value={counterpartyId} onChange={(e) => setCounterpartyId(e.target.value)}>
              {counterparties.map((counterparty) => (
                <option key={counterparty.id} value={counterparty.id}>
                  {counterparty.name} &bull;&bull;&bull;{counterparty.accountNumber.slice(-4)}
                </option>
              ))}
            </select>{" "}
            <button type="button" onClick={() => setShowNewCounterparty((v) => !v)}>
              {showNewCounterparty ? "Cancel" : "+ Add new counterparty"}
            </button>
            {showNewCounterparty ? (
              <div>
                <input
                  placeholder="Name"
                  value={newCounterparty.name}
                  onChange={(e) => setNewCounterparty({ ...newCounterparty, name: e.target.value })}
                />
                <input
                  placeholder="Routing number"
                  value={newCounterparty.routingNumber}
                  onChange={(e) =>
                    setNewCounterparty({ ...newCounterparty, routingNumber: e.target.value })
                  }
                />
                <input
                  placeholder="Account number"
                  value={newCounterparty.accountNumber}
                  onChange={(e) =>
                    setNewCounterparty({ ...newCounterparty, accountNumber: e.target.value })
                  }
                />
                <button
                  type="button"
                  onClick={() =>
                    setNewCounterparty({
                      name: "Jane Sandbox",
                      routingNumber: "812345678",
                      accountNumber: "9988771234",
                    })
                  }
                >
                  Fill sandbox data
                </button>
                <button type="button" disabled={isCreatingCounterparty} onClick={handleCreateCounterparty}>
                  {isCreatingCounterparty ? "Creating..." : "Create counterparty"}
                </button>
              </div>
            ) : null}

            <div role="radiogroup" aria-label="Direction">
              <label>
                <input
                  type="radio"
                  checked={direction === "Credit"}
                  onChange={() => setDirection("Credit")}
                />{" "}
                Credit (push funds out)
              </label>{" "}
              <label>
                <input type="radio" checked={direction === "Debit"} onChange={() => setDirection("Debit")} />{" "}
                Debit (pull funds in)
              </label>
            </div>
          </fieldset>
        ) : null}

        {rail === "wire" ? (
          <fieldset>
            <legend>Wire counterparty</legend>
            <input
              placeholder="Name"
              value={wireCounterparty.name}
              onChange={(e) => setWireCounterparty({ ...wireCounterparty, name: e.target.value })}
              required
            />
            <input
              placeholder="Routing number"
              value={wireCounterparty.routingNumber}
              onChange={(e) => setWireCounterparty({ ...wireCounterparty, routingNumber: e.target.value })}
              required
            />
            <input
              placeholder="Account number"
              value={wireCounterparty.accountNumber}
              onChange={(e) => setWireCounterparty({ ...wireCounterparty, accountNumber: e.target.value })}
              required
            />
            <input
              placeholder="Street"
              value={wireCounterparty.street}
              onChange={(e) => setWireCounterparty({ ...wireCounterparty, street: e.target.value })}
              required
            />
            <input
              placeholder="City"
              value={wireCounterparty.city}
              onChange={(e) => setWireCounterparty({ ...wireCounterparty, city: e.target.value })}
              required
            />
            <input
              placeholder="State"
              value={wireCounterparty.state}
              onChange={(e) => setWireCounterparty({ ...wireCounterparty, state: e.target.value })}
              required
            />
            <input
              placeholder="Postal code"
              value={wireCounterparty.postalCode}
              onChange={(e) => setWireCounterparty({ ...wireCounterparty, postalCode: e.target.value })}
              required
            />
          </fieldset>
        ) : null}

        <fieldset>
          <legend>Amount &amp; description</legend>
          <input
            placeholder="Amount (dollars)"
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <input
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </fieldset>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send payment"}
        </button>
      </form>

      {error ? <p role="alert">{error}</p> : null}
      {createdPayment ? <CreatedPaymentStatus payment={createdPayment} /> : null}
    </div>
  );
}

function CreatedPaymentStatus({ payment }: { payment: PaymentResponse }): React.ReactElement {
  const { payment: current, isPolling } = usePaymentStatusPolling(payment);

  return (
    <section>
      <h2>Payment status</h2>
      <p>
        {current.rail} &mdash; <strong>{current.status}</strong>
        {isPolling ? " (checking for updates...)" : ""}
      </p>
      <p>Unit payment ID: {current.unitPaymentId}</p>
    </section>
  );
}
