import Link from "next/link";
import { auth } from "@/auth";
import { callInternalApi } from "@/lib/internal-api";
import type { AccountResponse, CardResponse, CustomerResponse, PaymentResponse } from "@chiklati/shared";
import { CreateAccountButton } from "./create-account-button";
import { CardActions } from "../cards/[id]/card-actions";

function formatCents(cents: string): string {
  return (Number(cents) / 100).toFixed(2);
}

const RECENT_PAYMENTS_LIMIT = 5;

export default async function DashboardPage(): Promise<React.ReactElement> {
  const session = await auth();

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
    <main>
      <h1>Dashboard</h1>
      <p>Signed in as {session?.user?.email}</p>

      <h2>Quick actions</h2>
      <ul>
        <li>
          <Link href="/onboarding">Open an account (new application)</Link>
        </li>
        <li>
          <Link href="/payments/new">Send a payment</Link>
        </li>
        <li>
          <Link href="/cards/new">Issue a card</Link>
        </li>
      </ul>

      <h2>Your cards</h2>
      {cards.length === 0 ? (
        <p>No cards yet -- issue one to get started.</p>
      ) : (
        <ul>
          {cards.map((card) => (
            <li key={card.id}>
              <Link href={`/cards/${card.id}`}>
                &bull;&bull;&bull;&bull; {card.last4Digits}
              </Link>{" "}
              &mdash; {card.status}
              <CardActions cardId={card.id} status={card.status} />
            </li>
          ))}
        </ul>
      )}
      <Link href="/cards">View all cards</Link>

      <h2>Customers &amp; accounts</h2>
      {customers.length === 0 ? (
        <p>No approved customers yet -- submit an application to get started.</p>
      ) : (
        <ul>
          {customers.map((customer) => {
            const customerAccounts = accounts.filter((account) => account.customerId === customer.id);

            return (
              <li key={customer.id}>
                <strong>{customer.type}</strong> customer ({customer.status})
                {customerAccounts.length === 0 ? (
                  customer.status === "Active" ? (
                    <CreateAccountButton customerId={customer.id} />
                  ) : null
                ) : (
                  <ul>
                    {customerAccounts.map((account) => (
                      <li key={account.id}>
                        <Link href={`/accounts/${account.id}`}>
                          {account.depositProduct} &bull;&bull;&bull;{account.accountNumber.slice(-4)} &mdash; $
                          {formatCents(account.available)} available
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <h2>Recent payments</h2>
      {recentPayments.length === 0 ? (
        <p>No payments yet.</p>
      ) : (
        <ul>
          {recentPayments.map((payment) => (
            <li key={payment.id}>
              <Link href={`/payments/${payment.id}`}>
                {payment.rail} &mdash; {payment.status} &mdash; ${formatCents(payment.amount)}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link href="/payments">View all payments</Link>
    </main>
  );
}
