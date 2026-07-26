import { NextResponse } from "next/server";
import type { CustomerResponse } from "@chiklati/shared";
import { callInternalApi } from "@/lib/internal-api";

export async function GET(): Promise<NextResponse> {
  try {
    const result = await callInternalApi<CustomerResponse[]>("/customers", { method: "GET" });
    return NextResponse.json(result.body, { status: result.status });
  } catch {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
}
