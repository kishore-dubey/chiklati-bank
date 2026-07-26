import Link from "next/link";
import { auth } from "@/auth";
import { callInternalApi } from "@/lib/internal-api";
import type { AccountResponse, CustomerResponse } from "@chiklati/shared";
import { CreateAccountButton } from "./create-account-button";

function formatCents(cents: string): string {
  return (Number(cents) / 100).toFixed(2);
}

export default async function DashboardPage(): Promise<React.ReactElement> {
  const session = await auth();

  const [customersResult, accountsResult] = await Promise.all([
    callInternalApi<CustomerResponse[]>("/customers", { method: "GET" }),
    callInternalApi<AccountResponse[]>("/accounts", { method: "GET" }),
  ]);

  const customers = customersResult.status === 200 ? customersResult.body : [];
  const accounts = accountsResult.status === 200 ? accountsResult.body : [];

  return (
    <main>
      <h1>Dashboard</h1>
      <p>Signed in as {session?.user?.email}</p>
      <Link href="/onboarding">Open an account (new application)</Link>
      {" | "}
      <Link href="/payments">Payments</Link>

      <h2>Customers</h2>
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
    </main>
  );
}
