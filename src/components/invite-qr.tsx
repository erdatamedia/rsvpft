"use client";

import { QRCodeSVG } from "qrcode.react";

export function InviteQr({ value, size = 200 }: { value: string; size?: number }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <QRCodeSVG value={value} size={size} />
    </div>
  );
}
