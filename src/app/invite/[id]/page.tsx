import { notFound } from "next/navigation";
import { eventConfig, buildInviteLink } from "@/lib/event";
import { getAttendee, normalizeAttendeeId } from "@/lib/storage";
import { InviteQr } from "@/components/invite-qr";

export const dynamic = "force-dynamic";

type Props = {
  params: { id: string };
};

type MetadataProps = Props;

export async function generateMetadata(props: MetadataProps) {
  const params = await Promise.resolve(props.params);
  const attendee = await getAttendee(normalizeAttendeeId(params.id));
  const title = attendee
    ? `RSVP ${attendee.name} • ${eventConfig.name}`
    : `RSVP Tidak Ditemukan • ${eventConfig.name}`;
  const description = attendee
    ? `Konfirmasi kehadiran ${attendee.name} pada ${eventConfig.name}`
    : `RSVP tidak ditemukan untuk kode ${params.id}`;
  return {
    title,
    description,
  };
}

export default async function InvitePage(props: Props) {
  const params = await Promise.resolve(props.params);
  const attendee = await getAttendee(normalizeAttendeeId(params.id));

  if (!attendee) {
    notFound();
  }

  const qrPayload = JSON.stringify({
    inviteId: attendee.id,
    name: attendee.name,
    npm: attendee.npm,
  });

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">RSVP resmi</p>
          <h1 className="text-2xl font-semibold">{eventConfig.name}</h1>
          <p className="text-sm text-slate-300">{eventConfig.schedule}</p>
          <p className="text-sm text-slate-400">{eventConfig.venue}</p>
        </header>

        <section className="rounded-3xl bg-white/10 p-6 text-sm shadow-lg backdrop-blur">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Detail peserta</p>
          <div className="mt-3 space-y-1 text-base">
            <p className="font-semibold text-white">{attendee.name}</p>
            <p className="text-slate-300">{attendee.program}</p>
            <p className="text-slate-400">Nomor WhatsApp: {attendee.phone}</p>
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">NPM</p>
            <p className="text-2xl font-semibold text-white">{attendee.npm}</p>
          </div>
          <p className="mt-4 text-sm text-slate-300">
            Silakan hadir sesuai jadwal dan tunjukkan QR di bawah ini pada meja registrasi. Anda juga dapat menyimpan atau membagikan tautan ini: {buildInviteLink(attendee.id)}
          </p>
        </section>

        <section className="rounded-3xl bg-white p-6 text-slate-900 shadow-lg">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">QR konfirmasi kehadiran</p>
          <p className="mt-2 text-sm text-slate-500">
            Pemindaian QR akan otomatis mencatat kehadiran Anda. Pastikan layar cukup terang saat ditunjukkan kepada petugas.
          </p>
          <div className="mt-6 flex justify-center">
            <InviteQr value={qrPayload} size={220} />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 text-sm text-slate-200">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Alur kehadiran</p>
          <ol className="mt-3 space-y-2 text-slate-200">
            <li>1. Tiba di {eventConfig.venue} sebelum pukul 09.00 WIB.</li>
            <li>2. Tunjukkan QR ini pada meja registrasi panitia.</li>
            <li>3. Setelah discan, Anda akan diarahkan ke area duduk sesuai arahan panitia.</li>
          </ol>
          <p className="mt-4 text-xs text-slate-400">
            Jika ada pertanyaan, hubungi panitia melalui nomor resmi yang tercantum pada pesan WhatsApp.
          </p>
        </section>
      </div>
    </div>
  );
}
