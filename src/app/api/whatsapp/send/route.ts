import { NextResponse } from "next/server";
import { getUserFromSession } from "@/lib/auth";
import { buildInviteLink, eventConfig } from "@/lib/event";
import {
  getAttendee,
  normalizePhone,
  updateAttendee,
  type AttendeeRecord,
} from "@/lib/storage";
import nodemailer from "nodemailer";

const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = Number(process.env.EMAIL_PORT || "587");
const EMAIL_USER = process.env.EMAIL_USER || "fak_teknik@unisma.ac.id";
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || "fak_teknik@unisma.ac.id";

type RequestBody = {
  attendeeId: string;
  message?: string;
};

function composeDefaultMessage(attendee: AttendeeRecord, qrLink?: string) {
  // Gunakan field yang memang ada di eventConfig; alamat opsional jika dikonfigurasi terpisah
  const scheduleLine = eventConfig.schedule || "Jumat, 20 Juni 2025 • 18:00";
  const maybeAddress = (eventConfig as unknown as { address?: string }).address;

  const lines = [
    `Kepada Yth. Bapak/Ibu/Saudara/i - ${attendee.name.toUpperCase()}`,
    ``,
    `Pesan ini merupakan pengingat acara ${eventConfig.name} yang akan diselenggarakan pada :`,
    ``,
    `Jadwal : ${scheduleLine}`,
    `Tempat : ${eventConfig.venue}`,
  ];

  if (maybeAddress && maybeAddress.trim()) {
    lines.push(`Alamat : ${maybeAddress}`);
  }

  lines.push(
    ``,
    `Mohon untuk menyimpan pesan ini dan menyiapkan kode QR pada tautan di bawah sebagai konfirmasi kehadiran di area check point.`,
    ``
  );

  if (qrLink) {
    lines.push(`🔗 Kode QR & Konfirmasi Kehadiran: ${qrLink}`);
  }

  lines.push(
    ``,
    `Terima kasih atas perhatian dan kehadiran Bapak/Ibu/Saudara/i.`,
    ``,
    `Catatan : RSVP ini berlaku untuk peserta terdaftar.`
  );

  return lines.join("\n");
}

export async function POST(req: Request) {
  const user = await getUserFromSession();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!EMAIL_HOST || !EMAIL_PASS) {
    return NextResponse.json(
      { message: "Konfigurasi email belum lengkap." },
      { status: 500 }
    );
  }

  const body = (await req.json()) as RequestBody;

  if (!body.attendeeId) {
    return NextResponse.json(
      { message: "attendeeId wajib diisi" },
      { status: 400 }
    );
  }

  const attendee = await getAttendee(body.attendeeId);
  if (!attendee) {
    return NextResponse.json(
      { message: "Data RSVP tidak ditemukan" },
      { status: 404 }
    );
  }

  const qrLink = buildInviteLink(attendee.id);

  const message =
    body.message?.trim() || composeDefaultMessage(attendee, qrLink);

  if (!attendee.email) {
    return NextResponse.json(
      { message: "Email peserta belum tersedia." },
      { status: 400 }
    );
  }

  const transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_PORT === 465,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });

  const subject = `Undangan RSVP • ${eventConfig.name}`;
  await transporter.sendMail({
    from: EMAIL_FROM,
    to: attendee.email,
    subject,
    text: message,
  });

  const updated = await updateAttendee(attendee.id, (current) => ({
    ...current,
    whatsappSent: true,
    status: current.status === "draft" ? "sent" : current.status,
  }));

  return NextResponse.json({
    status: "sent",
    attendee: updated,
    email: { to: attendee.email },
  });
}
