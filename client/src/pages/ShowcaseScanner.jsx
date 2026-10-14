import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRedeemTicket, useShowcase, useStaffRoster } from "@/hooks/useShowcase";
import { Button } from "@/components/ui/button";

export default function ShowcaseScanner() {
  const { user } = useAuth();
  const { data: event, isLoading } = useShowcase();
  const staff = ["president", "event_organizer"].includes(user?.role);
  const { data: roster, error: rosterError } = useStaffRoster(event?._id, staff);
  const redeem = useRedeemTicket(event?._id);
  const video = useRef(null);
  const controls = useRef(null);
  const accepting = useRef(false);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const [manualTicket, setManualTicket] = useState("");

  const scanTicket = async (value) => {
    if (accepting.current) return;
    accepting.current = true;
    controls.current?.stop(); setScanning(false);
    try { setResult({ success: true, ...await redeem.mutateAsync(value) }); }
    catch (error) { setResult({ success: false, message: error.response?.data?.message || "Could not verify ticket" }); }
  };

  useEffect(() => {
    if (!scanning || !video.current) return undefined;
    let disposed = false;
    import("@zxing/browser").then(async ({ BrowserQRCodeReader }) => {
      if (disposed) return;
      const reader = new BrowserQRCodeReader();
      const deviceControls = await reader.decodeFromConstraints({ video: { facingMode: { ideal: "environment" } }, audio: false }, video.current, (decoded) => {
        if (decoded?.getText()) scanTicket(decoded.getText());
      });
      if (disposed) deviceControls.stop(); else controls.current = deviceControls;
    }).catch(() => { if (!disposed) { setCameraError("Camera unavailable. Check permissions or use a ticket image."); setScanning(false); } });
    return () => { disposed = true; controls.current?.stop(); controls.current = null; };
  }, [scanning]);

  const scanImage = async (file) => {
    if (!file) return;
    accepting.current = false;
    try {
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      const url = URL.createObjectURL(file);
      try { const decoded = await new BrowserQRCodeReader().decodeFromImageUrl(url); await scanTicket(decoded.getText()); }
      finally { URL.revokeObjectURL(url); }
    } catch { setResult({ success: false, message: "No readable QR code in that image" }); }
  };

  if (!staff) return <main className="p-8"><p>Staff access required.</p><Link to="/dashboard">Dashboard</Link></main>;
  return <main className="min-h-screen bg-slate-950 p-5 text-white">
    <div className="mx-auto max-w-xl">
      <Link to="/dashboard" className="text-cyan-300">← Dashboard</Link>
      <h1 className="mt-6 text-3xl font-bold">Event check-in</h1>
      <p className="mt-2 text-slate-300">Scan each member’s personal RSVP ticket. An internet connection is required.</p>
      {isLoading && <p className="mt-6">Loading event…</p>}
      {rosterError && <p className="mt-6 rounded-lg bg-red-900 p-4">You are not assigned to scan this event.</p>}
      {roster && <p className="mt-4 text-sm">{roster.checkedIn} checked in · {roster.total} reservations</p>}
      {!rosterError && event && <>
        <div className="mt-6 overflow-hidden rounded-xl border border-white/20 bg-black">
          <video ref={video} className="aspect-square w-full object-cover" playsInline muted />
        </div>
        {cameraError && <p className="mt-3 text-orange-300">{cameraError}</p>}
        <Button className="mt-4 bg-cyan-400 text-slate-950 hover:bg-cyan-300" onClick={() => { accepting.current = false; setResult(null); setScanning(true); }} disabled={scanning || Boolean(rosterError)}>{scanning ? "Scanning…" : "Scan next ticket"}</Button>
        {result && <div role="status" className={`mt-5 rounded-xl p-5 text-lg font-bold ${result.success ? "bg-green-800" : "bg-red-900"}`}>
          {result.message}{result.name ? ` · ${result.name}` : ""}
        </div>}
        <label htmlFor="ticket-image" className="mt-8 block text-sm">Camera unavailable? Scan a saved ticket image</label>
        <input id="ticket-image" className="mt-2 block text-sm" type="file" accept="image/*" onChange={(e) => scanImage(e.target.files?.[0])} />
        <details className="mt-6 text-sm text-slate-300"><summary>Paste a ticket credential</summary><textarea className="mt-2 w-full rounded-md p-3 text-slate-950" value={manualTicket} onChange={(e) => setManualTicket(e.target.value)} /><Button className="mt-2" onClick={() => { accepting.current = false; scanTicket(manualTicket); }} disabled={!manualTicket || redeem.isPending}>Verify</Button></details>
      </>}
    </div>
  </main>;
}
