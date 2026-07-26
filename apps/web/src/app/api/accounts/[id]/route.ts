import { NextResponse, type NextRequest } from "next/server";
import type { AccountResponse } from "@chiklati/shared";
import { callInternalApi } from "@/lib/internal-api";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;

  try {
    const result = await callInternalApi<AccountResponse>(`/accounts/${id}`, { method: "GET" });
    return NextResponse.json(result.body, { status: result.status });
  } catch {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
}
