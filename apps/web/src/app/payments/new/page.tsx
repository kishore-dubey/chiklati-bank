import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { callInternalApi } from "@/lib/internal-api";
import type { AccountResponse, CounterpartyResponse } from "@chiklati/shared";
import { PaymentForm } from "./payment-form";

export default async function NewPaymentPage(): Promise<React.ReactElement> {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const [accountsResult, counterpartiesResult] = await Promise.all([
    callInternalApi<AccountResponse[]>("/accounts", { method: "GET" }),
    callInternalApi<CounterpartyResponse[]>("/counterparties", { method: "GET" }),
  ]);

  const accounts = accountsResult.status === 200 ? accountsResult.body : [];
  const counterparties = counterpartiesResult.status === 200 ? counterpartiesResult.body : [];

  return (
    <main>
      <h1>Send a payment</h1>
      <PaymentForm accounts={accounts} counterparties={counterparties} />
    </main>
  );
}
