import { NextResponse, type NextRequest } from "next/server";
import type { CardResponse } from "@chiklati/shared";
import { callInternalApi } from "@/lib/internal-api";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const idempotencyKey = request.headers.get("idempotency-key") ?? undefined;
  const body = await request.text();

  try {
    const result = await callInternalApi<CardResponse>("/cards", {
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
  const path = accountId ? `/cards?accountId=${encodeURIComponent(accountId)}` : "/cards";

  try {
    const result = await callInternalApi<CardResponse[]>(path, { method: "GET" });
    return NextResponse.json(result.body, { status: result.status });
  } catch {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
}
