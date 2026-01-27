import { query } from "@/lib/db";

// Normalisasi nomor WhatsApp ke format internasional Indonesia (E.164 tanpa '+')
export function normalizePhone(raw: string): string {
  // hapus semua karakter non-digit
  const digitsOnly = (raw || "").replace(/\D+/g, "");
  if (!digitsOnly) return "";

  // kasus umum: 08xxxxxxx -> 628xxxxxxx
  if (digitsOnly.startsWith("0")) {
    return "62" + digitsOnly.slice(1);
  }
  // sudah 62xxxx -> biarkan
  if (digitsOnly.startsWith("62")) {
    return digitsOnly;
  }
  // 8xxxxxxxx -> 628xxxxxxxx
  if (digitsOnly.startsWith("8")) {
    return "62" + digitsOnly;
  }
  // jika ada leading 00 (kode internasional), ubah 00 -> (hapus) dan tambahkan sesuai Indonesia bila perlu
  if (digitsOnly.startsWith("00")) {
    const n = digitsOnly.slice(2);
    if (n.startsWith("62")) return n;
    if (n.startsWith("8")) return "62" + n; // 00 8xx -> 628xx
    return n;
  }
  // fallback: kembalikan digit yang sudah dibersihkan
  return digitsOnly;
}

export type RSVPStatus = "draft" | "sent" | "confirmed";

export type AttendeeRecord = {
  id: string;
  name: string;
  program: string;
  phone: string;
  email: string;
  npm: string;
  seat: string;
  status: RSVPStatus;
  whatsappSent: boolean;
  confirmedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AttendeePayload = Pick<
  AttendeeRecord,
  "name" | "program" | "phone" | "email" | "npm" | "seat"
>;

export type AttendeeRow = {
  id: string;
  name: string;
  program: string;
  phone: string;
  email: string;
  npm: string;
  seat: string;
  status: RSVPStatus;
  whatsapp_sent: boolean;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
};

const mapRow = (row: AttendeeRow): AttendeeRecord => ({
  id: row.id,
  name: row.name,
  program: row.program,
  phone: row.phone,
  email: row.email,
  npm: row.npm,
  seat: row.seat,
  status: row.status,
  whatsappSent: row.whatsapp_sent,
  confirmedAt: row.confirmed_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export function normalizeAttendeeId(raw: string) {
  let value = raw || "";
  if (value.includes("%")) {
    try {
      value = decodeURIComponent(value);
    } catch {
      // keep original if decode fails
    }
  }
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

export async function readAttendees(): Promise<AttendeeRecord[]> {
  const rows = await query<AttendeeRow>(
    "select * from attendees order by created_at asc"
  );
  return rows.map(mapRow);
}

export async function addAttendee(
  payload: AttendeePayload,
  providedId?: string
) {
  const nextId = normalizeAttendeeId(providedId || payload.name);
  const rows = await query<AttendeeRow>(
    `insert into attendees (id, name, program, phone, email, npm, seat, status, whatsapp_sent)
     values ($1, $2, $3, $4, $5, coalesce($6, '-'), coalesce($7, '-'), 'draft', false)
     returning *`,
    [
      nextId,
      payload.name,
      payload.program,
      normalizePhone(payload.phone),
      payload.email,
      payload.npm,
      payload.seat,
    ]
  );
  return mapRow(rows[0]);
}

export async function updateAttendee(
  id: string,
  updater: (current: AttendeeRecord) => AttendeeRecord
) {
  const normalizedId = normalizeAttendeeId(id);
  const current = await getAttendee(normalizedId);
  if (!current) return null;

  const nextState = updater(current);
  const rows = await query<AttendeeRow>(
    `update attendees
     set name=$1,
         program=$2,
         phone=$3,
         email=$4,
         npm=$5,
         seat=$6,
         status=$7,
         whatsapp_sent=$8,
         confirmed_at=$9,
         updated_at=now()
     where id=$10
     returning *`,
    [
      nextState.name,
      nextState.program,
      nextState.phone,
      nextState.email,
      nextState.npm,
      nextState.seat,
      nextState.status,
      nextState.whatsappSent,
      nextState.confirmedAt,
      normalizedId,
    ]
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function getAttendee(id: string) {
  const rows = await query<AttendeeRow>(
    "select * from attendees where id=$1 limit 1",
    [normalizeAttendeeId(id)]
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function clearAttendees() {
  await query("delete from attendees");
}
