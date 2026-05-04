import { NextResponse } from "next/server";
import { syncUser } from "@/actions/auth";

export async function POST() {
  try {
    await syncUser();
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 401 });
  }
}
