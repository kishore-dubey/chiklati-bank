import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { callInternalApi } from "@/lib/internal-api";
import type { PaymentResponse } from "@chiklati/shared";

function formatCents(cents: string): string {
  return (Number(cents) / 100).toFixed(2);
}

export default async function PaymentsPage(): Promise<React.ReactElement> {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const result = await callInternalApi<PaymentResponse[]>("/payments", { method: "GET" });
  const payments = result.status === 200 ? result.body : [];

  return (
    <main>
      <h1>Payments</h1>
      <Link href="/payments/new">Send a payment</Link>

      {payments.length === 0 ? (
        <p>No payments yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Rail</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Description</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td>
                  <Link href={`/payments/${payment.id}`}>{payment.rail}</Link>
                </td>
                <td>{payment.status}</td>
                <td>${formatCents(payment.amount)}</td>
                <td>{payment.description}</td>
                <td>{payment.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
