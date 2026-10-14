import { useEffect, useState } from "react";

export default function TicketQR({ ticket, name }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let current = true;
    import("qrcode").then(({ default: QRCode }) => QRCode.toDataURL(ticket, { width: 320, margin: 2 }))
      .then((url) => { if (current) setSrc(url); });
    return () => { current = false; };
  }, [ticket]);
  return <div className="rounded-2xl bg-white p-5 text-center text-slate-950">
    {src ? <img src={src} width="320" height="320" alt="Your event entry QR code" className="mx-auto" /> : <p>Preparing ticket…</p>}
    <p className="mt-3 font-bold">{name}</p>
    <p className="text-sm">Show this ticket to Peak staff at the door.</p>
    {src && <a href={src} download="peakcraft-showcase-ticket.png" className="mt-3 inline-block text-sm font-semibold text-blue-700 underline">Save ticket image</a>}
  </div>;
}
