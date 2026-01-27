import { NextRequest, NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth";
import { updateAttendee } from "@/lib/storage";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await getUserFromSession();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const updated = await updateAttendee(id, (current) => ({
    ...current,
    status: "confirmed",
    confirmedAt: new Date().toISOString(),
  }));

  if (!updated) {
    return NextResponse.json({ message: "QR tidak valid" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
