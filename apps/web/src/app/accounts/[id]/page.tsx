import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { callInternalApi } from "@/lib/internal-api";
import type { AccountResponse, TransactionResponse } from "@chiklati/shared";
import { AccountNumberReveal } from "./account-number-reveal";
import { RefreshButton } from "./refresh-button";

function formatCents(cents: string): string {
  return (Number(cents) / 100).toFixed(2);
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

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
    <main>
      <h1>{account.depositProduct} account</h1>
      <p>
        Routing: {account.routingNumber} &middot; Account:{" "}
        <AccountNumberReveal accountNumber={account.accountNumber} />
      </p>
      <p>Status: {account.status}</p>
      <p>
        Balance: ${formatCents(account.balance)} &middot; Available: ${formatCents(account.available)} &middot;
        Hold: ${formatCents(account.hold)}
      </p>

      <h2>Transactions</h2>
      <RefreshButton />
      {transactions.length === 0 ? (
        <p>No transactions yet.</p>
      ) : (
        <ul>
          {transactions.map((txn) => (
            <li key={txn.id}>
              {txn.unitCreatedAt} &mdash; {txn.type} ({txn.direction}) &mdash; ${formatCents(txn.amount)} &mdash;{" "}
              {txn.summary}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
