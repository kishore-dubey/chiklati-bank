import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { callInternalApi } from "@/lib/internal-api";
import type { AccountResponse, CustomerResponse } from "@chiklati/shared";
import { CardForm } from "./card-form";

export default async function NewCardPage(): Promise<React.ReactElement> {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const [accountsResult, customersResult] = await Promise.all([
    callInternalApi<AccountResponse[]>("/accounts", { method: "GET" }),
    callInternalApi<CustomerResponse[]>("/customers", { method: "GET" }),
  ]);

  const accounts = accountsResult.status === 200 ? accountsResult.body : [];
  const customers = customersResult.status === 200 ? customersResult.body : [];
  const businessCustomerIds = new Set(
    customers.filter((customer) => customer.type === "Business").map((customer) => customer.id),
  );

  return (
    <main>
      <h1>Issue a card</h1>
      <CardForm accounts={accounts} businessCustomerIds={[...businessCustomerIds]} />
    </main>
  );
}
