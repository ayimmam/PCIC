import { lazy, Suspense, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCancelSeat, useMyTicket, useReserveSeat, useShowcase } from "@/hooks/useShowcase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const TicketQR = lazy(() => import("@/components/events/TicketQR"));

export default function ShowcaseEvent() {
  const { user, isAuthenticated } = useAuth();
  const [year, setYear] = useState(user?.academicYear || 2);
  const { data: event, isLoading, error } = useShowcase();
  const { data: ticketData } = useMyTicket(event?._id, isAuthenticated);
  const reserve = useReserveSeat(event?._id);
  const cancel = useCancelSeat(event?._id);
  const registration = ticketData?.registration;
  const reserveNow = async () => {
    try { await reserve.mutateAsync(Number(year)); toast.success("Your seat is reserved"); }
    catch (err) { toast.error(err.response?.data?.message || "Unable to reserve a seat"); }
  };
  const cancelNow = async () => {
    try { await cancel.mutateAsync(); toast.success("Reservation cancelled"); }
    catch (err) { toast.error(err.response?.data?.message || "Unable to cancel reservation"); }
  };

  return <main className="min-h-screen bg-slate-950 px-5 py-12 text-white">
    <div className="mx-auto max-w-3xl">
      <Link to="/" className="font-bold tracking-[0.2em] text-cyan-300">PEAK CRAFT</Link>
      {isLoading ? <p className="mt-10">Loading event…</p> : error ? <p className="mt-10">Event details are unavailable right now.</p> : <>
        <p className="mt-12 text-sm font-semibold uppercase tracking-[0.2em] text-orange-300">Project showcase · Semester kick-off</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">{event.title}</h1>
        <p className="mt-6 text-xl text-slate-200">Ideas, innovation, and fresh semester energy for second- and third-year Informatics students.</p>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/20 p-5"><p className="text-xs uppercase text-cyan-300">When</p><p className="mt-2 font-semibold">Friday, 6/02/2019 E.C.</p><p className="text-sm text-slate-300">October 16, 2026 · 1:30–4:30 PM</p></div>
          <div className="rounded-xl border border-white/20 p-5"><p className="text-xs uppercase text-cyan-300">Where</p><p className="mt-2 font-semibold">IoT Hall, 003</p><p className="text-sm text-slate-300">Hawassa University</p></div>
          <div className="rounded-xl border border-white/20 p-5"><p className="text-xs uppercase text-cyan-300">Seats</p><p className="mt-2 font-semibold">{event.remaining} of 200 available</p><p className="text-sm text-slate-300">RSVP required · no walk-ins</p></div>
        </div>
        <div className="mt-10 rounded-2xl bg-slate-900 p-6">
          {!isAuthenticated ? <><p className="mb-4">Sign in or create an account to reserve your seat.</p><Link to={`/login?mode=signup&next=${encodeURIComponent(`/events/${event.slug}`)}`} className="inline-block rounded-md bg-orange-400 px-5 py-3 font-bold text-slate-950">Sign up and RSVP</Link></>
            : registration?.status === "reserved" || registration?.status === "checked_in" ? <>
              <h2 className="text-2xl font-bold">{registration.status === "checked_in" ? "You’re checked in" : "Your seat is reserved"}</h2>
              {ticketData?.ticket && <div className="mt-5"><Suspense fallback={<p>Preparing ticket…</p>}><TicketQR ticket={ticketData.ticket} name={user.name} /></Suspense></div>}
              {registration.status === "reserved" && event.registrationOpen && <Button variant="outline" className="mt-5 text-slate-950" onClick={cancelNow} disabled={cancel.isPending}>Cancel reservation</Button>}
            </> : !event.registrationOpen ? <p className="text-lg font-semibold">{event.remaining === 0 ? "All seats are reserved." : "RSVP is closed."}</p> : <>
              <h2 className="text-2xl font-bold">Reserve your seat</h2>
              <p className="mt-2 text-slate-300">Peak staff will scan your personal QR ticket at the door.</p>
              <label htmlFor="event-year" className="mt-5 block text-sm">Academic year</label>
              <select id="event-year" className="mt-1 block rounded-md bg-white px-3 py-2 text-slate-950" value={year} onChange={(e) => setYear(Number(e.target.value))}><option value={2}>Second year</option><option value={3}>Third year</option></select>
              <Button className="mt-5 bg-orange-400 text-slate-950 hover:bg-orange-300" onClick={reserveNow} disabled={reserve.isPending}>{reserve.isPending ? "Reserving…" : "Reserve a seat"}</Button>
            </>}
        </div>
        <p className="mt-8 text-slate-300">Bring your curiosity. Bring your energy. Follow <a className="text-cyan-300 underline" href="https://t.me/peakcraftcommunity">@peakcraftcommunity</a> for updates.</p>
      </>}
    </div>
  </main>;
}
