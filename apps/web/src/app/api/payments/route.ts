import { NextResponse, type NextRequest } from "next/server";
import type { PaymentResponse } from "@chiklati/shared";
import { callInternalApi } from "@/lib/internal-api";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const idempotencyKey = request.headers.get("idempotency-key") ?? undefined;
  const body = await request.text();

  try {
    const result = await callInternalApi<PaymentResponse>("/payments", {
      method: "POST",
      body,
      idempotencyKey,
    });
    return NextResponse.json(result.body, { status: result.status });
  } catch {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const accountId = request.nextUrl.searchParams.get("accountId");
  const path = accountId ? `/payments?accountId=${encodeURIComponent(accountId)}` : "/payments";

  try {
    const result = await callInternalApi<PaymentResponse[]>(path, { method: "GET" });
    return NextResponse.json(result.body, { status: result.status });
  } catch {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
}
