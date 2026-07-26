import { NextResponse, type NextRequest } from "next/server";
import type { AccountResponse } from "@chiklati/shared";
import { callInternalApi } from "@/lib/internal-api";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const idempotencyKey = request.headers.get("idempotency-key") ?? undefined;
  const body = await request.text();

  try {
    const result = await callInternalApi<AccountResponse>("/accounts", {
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
  const customerId = request.nextUrl.searchParams.get("customerId");
  const path = customerId ? `/accounts?customerId=${encodeURIComponent(customerId)}` : "/accounts";

  try {
    const result = await callInternalApi<AccountResponse[]>(path, { method: "GET" });
    return NextResponse.json(result.body, { status: result.status });
  } catch {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
}
