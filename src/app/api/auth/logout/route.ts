import { NextResponse } from "next/server";
import { signOutPanitia } from "@/lib/auth";

export async function POST() {
  await signOutPanitia();
  return NextResponse.json({ success: true });
}
