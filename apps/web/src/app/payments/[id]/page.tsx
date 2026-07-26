import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { callInternalApi } from "@/lib/internal-api";
import type { PaymentResponse } from "@chiklati/shared";
import { RefreshButton } from "./refresh-button";
import { SandboxControls } from "./sandbox-controls";

function formatCents(cents: string): string {
  return (Number(cents) / 100).toFixed(2);
}

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;

  const result = await callInternalApi<PaymentResponse>(`/payments/${id}`, { method: "GET" });

  if (result.status === 404) {
    notFound();
  }

  const payment = result.body;

  return (
    <main>
      <h1>{payment.rail} payment</h1>
      <p>Status: {payment.status}</p>
      <p>
        Amount: ${formatCents(payment.amount)} &middot; Direction: {payment.direction}
      </p>
      <p>Description: {payment.description}</p>
      <p>Unit payment ID: {payment.unitPaymentId}</p>

      <h2>Counterparty</h2>
      <pre>{JSON.stringify(payment.counterpartySnapshot, null, 2)}</pre>

      <RefreshButton />
      <SandboxControls paymentId={payment.id} rail={payment.rail} status={payment.status} />
    </main>
  );
}
