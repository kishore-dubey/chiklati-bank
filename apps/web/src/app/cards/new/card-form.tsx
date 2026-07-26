"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AccountResponse, CardResponse } from "@chiklati/shared";

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
    <form onSubmit={handleSubmit}>
      <fieldset>
        <legend>Account</legend>
        <select value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {accountLabel(account)}
            </option>
          ))}
        </select>
      </fieldset>

      {needsCardholder ? (
        <fieldset>
          <legend>Cardholder (required for business accounts)</legend>
          <input
            placeholder="First name"
            value={cardholder.first}
            onChange={(e) => setCardholder({ ...cardholder, first: e.target.value })}
            required
          />
          <input
            placeholder="Last name"
            value={cardholder.last}
            onChange={(e) => setCardholder({ ...cardholder, last: e.target.value })}
            required
          />
          <input
            placeholder="Phone number"
            value={cardholder.number}
            onChange={(e) => setCardholder({ ...cardholder, number: e.target.value })}
            required
          />
          <input
            placeholder="Email"
            type="email"
            value={cardholder.email}
            onChange={(e) => setCardholder({ ...cardholder, email: e.target.value })}
            required
          />
          <input
            placeholder="Date of birth (YYYY-MM-DD)"
            value={cardholder.dateOfBirth}
            onChange={(e) => setCardholder({ ...cardholder, dateOfBirth: e.target.value })}
            required
          />
          <input
            placeholder="Street"
            value={cardholder.street}
            onChange={(e) => setCardholder({ ...cardholder, street: e.target.value })}
            required
          />
          <input
            placeholder="City"
            value={cardholder.city}
            onChange={(e) => setCardholder({ ...cardholder, city: e.target.value })}
            required
          />
          <input
            placeholder="State"
            value={cardholder.state}
            onChange={(e) => setCardholder({ ...cardholder, state: e.target.value })}
            required
          />
          <input
            placeholder="Postal code"
            value={cardholder.postalCode}
            onChange={(e) => setCardholder({ ...cardholder, postalCode: e.target.value })}
            required
          />
          <button
            type="button"
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
          </button>
        </fieldset>
      ) : null}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Issuing..." : "Issue card"}
      </button>
      {error ? <p role="alert">{error}</p> : null}
    </form>
  );
}
