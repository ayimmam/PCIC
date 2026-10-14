import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { PCIC_DOMAINS } from "@/lib/pcicDomains";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import api from "@/api/axios";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(15, "Use at least 15 characters").refine((value) => new TextEncoder().encode(value).length <= 72, "Use at most 72 UTF-8 bytes"),
  domain: z.enum(PCIC_DOMAINS),
  academicYear: z.coerce.number().int().min(1).max(5),
});

export default function Login() {
  const [params, setParams] = useSearchParams();
  const signupMode = params.get("mode") === "signup";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const form = useForm({ resolver: zodResolver(schema), defaultValues: {
    name: "", email: "", password: "", domain: PCIC_DOMAINS[0], academicYear: 2,
  } });
  const from = location.state?.from;
  const next = params.get("next");
  const destination = from?.pathname?.startsWith("/") && !from.pathname.startsWith("//")
    ? `${from.pathname}${from.search || ""}` : next?.startsWith("/") && !next.startsWith("//")
      ? next : "/dashboard";

  const submitLogin = async (event) => {
    event.preventDefault(); setBusy(true);
    try { await login(email, password); navigate(destination, { replace: true }); }
    catch (error) { toast.error(error.response?.data?.message || "Sign in failed"); }
    finally { setBusy(false); }
  };

  const submitSignup = form.handleSubmit(async (values) => {
    setBusy(true);
    try { await signup(values); toast.success("Account created"); navigate(destination, { replace: true }); }
    catch (error) { toast.error(error.response?.data?.message || "Signup failed"); }
    finally { setBusy(false); }
  });

  const submitRecovery = async (event) => {
    event.preventDefault(); setBusy(true);
    try {
      if (params.get("reset")) {
        await api.post("/auth/password-reset/complete", { token: params.get("reset"), password: resetPassword });
        toast.success("Password updated. Sign in again."); setParams({}); setRecoveryMode(false);
      } else {
        await api.post("/auth/password-reset/request", { email });
        toast.success("If this account exists, a recovery email will be sent.");
      }
    } catch (error) { toast.error(error.response?.data?.message || "Recovery failed"); }
    finally { setBusy(false); }
  };

  return <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-white">
    <div className="w-full max-w-md rounded-2xl border border-cyan-400/20 bg-slate-900 p-7 shadow-2xl">
      <Link to="/" className="text-sm font-bold tracking-[0.2em] text-cyan-300">PEAK CRAFT</Link>
      <h1 className="mt-5 text-3xl font-bold">{params.get("reset") ? "Set a new password" : recoveryMode ? "Recover your account" : signupMode ? "Join the community" : "Welcome back"}</h1>
      <p className="mt-2 text-sm text-slate-300">{signupMode ? "Create your member account to RSVP for events." : "Sign in to your PCIC account."}</p>
      {!recoveryMode && !params.get("reset") && <div className="mt-6 grid grid-cols-2 rounded-lg bg-slate-800 p-1 text-sm">
        <button className={`rounded-md py-2 ${!signupMode ? "bg-cyan-400 font-semibold text-slate-950" : "text-slate-200"}`} onClick={() => setParams({ ...(next ? { next } : {}) })}>Sign in</button>
        <button className={`rounded-md py-2 ${signupMode ? "bg-orange-400 font-semibold text-slate-950" : "text-slate-200"}`} onClick={() => setParams({ mode: "signup", ...(next ? { next } : {}) })}>Sign up</button>
      </div>}
      {(recoveryMode || params.get("reset")) ? <form onSubmit={submitRecovery} className="mt-6 space-y-4">
        {params.get("reset") ? <div><Label htmlFor="recovery-password">New password</Label><Input id="recovery-password" type="password" className="mt-1 bg-white text-slate-950" minLength={15} value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} required /></div>
          : <div><Label htmlFor="recovery-email">Email</Label><Input id="recovery-email" type="email" className="mt-1 bg-white text-slate-950" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>}
        <Button disabled={busy} className="w-full bg-cyan-400 text-slate-950" type="submit">{params.get("reset") ? "Set new password" : "Send recovery email"}</Button>
        <button type="button" className="text-sm text-cyan-300 underline" onClick={() => { setRecoveryMode(false); setParams({}); }}>Back to sign in</button>
      </form> : signupMode ? <form onSubmit={submitSignup} className="mt-6 space-y-4">
        <div><Label htmlFor="signup-name">Full name</Label><Input id="signup-name" className="mt-1 bg-white text-slate-950" autoComplete="name" {...form.register("name")} />{form.formState.errors.name && <p className="mt-1 text-xs text-orange-300">Enter your full name.</p>}</div>
        <div><Label htmlFor="signup-email">Email</Label><Input id="signup-email" type="email" className="mt-1 bg-white text-slate-950" autoComplete="email" {...form.register("email")} />{form.formState.errors.email && <p className="mt-1 text-xs text-orange-300">Enter a valid email.</p>}</div>
        <div><Label htmlFor="signup-password">Password</Label><Input id="signup-password" type="password" className="mt-1 bg-white text-slate-950" autoComplete="new-password" {...form.register("password")} />{form.formState.errors.password && <p className="mt-1 text-xs text-orange-300">Use at least 15 characters and at most 72 bytes.</p>}</div>
        <div><Label htmlFor="signup-domain">Peak domain</Label><select id="signup-domain" className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-950" {...form.register("domain")}>{PCIC_DOMAINS.map((domain) => <option key={domain}>{domain}</option>)}</select></div>
        <div><Label htmlFor="signup-year">Academic year</Label><select id="signup-year" className="mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-950" {...form.register("academicYear")}>{[1, 2, 3, 4, 5].map((year) => <option key={year} value={year}>Year {year}</option>)}</select></div>
        <Button type="submit" disabled={busy} className="w-full bg-orange-400 text-slate-950 hover:bg-orange-300">{busy ? "Creating account…" : "Create account"}</Button>
      </form> : <form onSubmit={submitLogin} className="mt-6 space-y-4">
        <div><Label htmlFor="login-email">Email</Label><Input id="login-email" type="email" className="mt-1 bg-white text-slate-950" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
        <div><Label htmlFor="login-password">Password</Label><Input id="login-password" type="password" className="mt-1 bg-white text-slate-950" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
        <Button type="submit" disabled={busy} className="w-full bg-cyan-400 text-slate-950 hover:bg-cyan-300">{busy ? "Signing in…" : "Sign in"}</Button>
        <button type="button" className="text-sm text-cyan-300 underline" onClick={() => setRecoveryMode(true)}>Forgot password?</button>
      </form>}
    </div>
  </main>;
}
