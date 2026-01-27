import { NextResponse } from "next/server";
import { signInPanitia } from "@/lib/auth";

export async function POST(request: Request) {
  const { email, password } = await request.json();
  if (!email || !password) {
    return NextResponse.json({ message: "Email dan password wajib diisi." }, { status: 400 });
  }
  try {
    await signInPanitia(email, password);
  } catch (error) {
    return NextResponse.json({ message: (error as Error).message }, { status: 401 });
  }
  return NextResponse.json({ success: true });
}
