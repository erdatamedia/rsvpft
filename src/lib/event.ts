export const eventConfig = {
  name: "RSVP Yudisium Semester Ganjil 2025/2026 Fakultas Teknik UNISMA",
  schedule: "Rabu, 28 Januari 2026 • 09.00 WIB",
  venue: "Fakultas Teknik UNISMA",
  gate: "Registrasi dibuka pukul 08.00 WIB",
  linkPrefix: "https://undangan.ftunisma.online/invite",
};

export const buildInviteLink = (id: string) =>
  `${eventConfig.linkPrefix}/${encodeURIComponent(id)}`;
