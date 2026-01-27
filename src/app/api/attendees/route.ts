import { NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth";
import {
  addAttendee,
  readAttendees,
  type AttendeePayload,
} from "@/lib/storage";

export async function GET() {
  const user = await getUserFromSession();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const attendees = await readAttendees();
  return NextResponse.json({ attendees });
}

export async function POST(req: Request) {
  const user = await getUserFromSession();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const payload = (await req.json()) as Partial<AttendeePayload>;
  if (!payload.name || !payload.program || !payload.phone || !payload.email) {
    return NextResponse.json(
      { message: "Nama, program studi, email, dan nomor WA wajib diisi." },
      { status: 400 },
    );
  }

  const attendee = await addAttendee({
    name: payload.name,
    program: payload.program,
    phone: payload.phone,
    email: payload.email,
    npm: payload.npm ?? "-",
    seat: payload.seat ?? "-",
  });

  return NextResponse.json(attendee, { status: 201 });
}
