import { ArrowRight, Code2, Cpu, Palette, Shield, MapPin, CalendarDays } from "lucide-react";

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const asset = (name, width) => cloudName
  ? `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_${width}/pcic/public/landing/2026/${name}`
  : `/report/${name}.jpg`;

const domains = [
  { name: "Code Crafters", icon: Code2, description: "Build software and learn by making." },
  { name: "Turing Tribe", icon: Cpu, description: "Explore data and intelligent systems." },
  { name: "Cyber Crew", icon: Shield, description: "Practice security through challenges and projects." },
  { name: "Pixel Peeps", icon: Palette, description: "Design experiences people love to use." },
];

const stories = [
  { image: "semester-kickoff", title: "Semester kickoff", alt: "Peak Craft members gathered outdoors at the second semester kickoff", source: "Semester Two, page 4" },
  { image: "project-meetup", title: "Project meetup", alt: "Members collaborating around laptops at a project meetup", source: "Semester Two, page 5" },
  { image: "women-at-peak", title: "Women at Peak", alt: "Students attending the International Women's Day session", source: "Semester Two, page 6" },
  { image: "ai-outreach", title: "AI in Action", alt: "Students and volunteers at an AI outreach event", source: "Semester Two, page 6" },
];

export default function Home() {
  const isAuthenticated = Boolean(sessionStorage.getItem("pcic_token") || localStorage.getItem("pcic_token"));
  const upcoming = Date.now() < new Date("2026-10-16T13:30:00.000Z").getTime();
  return <div className="min-h-screen bg-[#061534] text-white">
    <header className="border-b border-white/10">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5" aria-label="Main navigation">
        <a href="/" className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-cyan-500 text-lg font-black">⌃</span><span className="text-sm font-black leading-tight tracking-[0.16em]">PEAK<br />CRAFT</span></a>
        <div className="hidden items-center gap-7 text-sm text-slate-200 md:flex"><a href="#about">About</a><a href="#domains">Domains</a><a href="#stories">Our year</a><a href="/peak-projects">Projects</a></div>
        <a href={isAuthenticated ? "/dashboard" : "/login"} className="rounded-full border border-cyan-300 px-5 py-2 text-sm font-bold text-cyan-200 hover:bg-cyan-300 hover:text-slate-950">{isAuthenticated ? "Dashboard" : "Member login"}</a>
      </nav>
    </header>

    <main>
      <section className="relative overflow-hidden px-5 pb-24 pt-20 sm:pt-28">
        <div className="pointer-events-none absolute -right-24 top-4 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative z-10">
            <p className="mb-6 text-xs font-black uppercase tracking-[0.3em] text-cyan-300">Hawassa University · Informatics Community</p>
            <h1 className="max-w-4xl text-5xl font-black leading-[1.04] tracking-tight sm:text-7xl lg:text-8xl">Build together.<br /><span className="text-orange-400">Reach new peaks.</span></h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-slate-200">A student community for practical projects, shared learning, mentorship, and ideas that make an impact.</p>
            <div className="mt-9 flex flex-wrap gap-4"><a href="/login?mode=signup" className="inline-flex items-center gap-2 rounded-full bg-orange-400 px-7 py-3 font-bold text-slate-950 hover:bg-orange-300">Join Peak Craft <ArrowRight size={18} /></a><a href="/peak-projects" className="rounded-full border border-white/40 px-7 py-3 font-bold hover:bg-white/10">Explore projects</a></div>
          </div>
          <div className="relative"><div className="absolute -inset-3 rotate-3 rounded-[2rem] border border-cyan-300/40" /><img src={asset("semester-kickoff", 960)} srcSet={cloudName ? `${asset("semester-kickoff", 480)} 480w, ${asset("semester-kickoff", 960)} 960w` : undefined} sizes="(max-width: 1024px) 100vw, 44vw" width="840" height="441" fetchPriority="high" alt="Peak Craft members gathered outdoors at the second semester kickoff" className="relative aspect-[1.65] w-full rounded-[1.6rem] object-cover shadow-2xl" /><span className="absolute -bottom-5 -left-4 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950">Created by students · Built for students</span></div>
        </div>
      </section>

      {upcoming && <section className="bg-orange-400 px-5 py-12 text-slate-950" aria-label="Featured event"><div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.2em]">This Friday · Featured event</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">PeakCraft Project Showcase & Semester Kick-Off</h2><p className="mt-3 max-w-2xl">2nd and 3rd-year Informatics students: bring your curiosity and fresh semester energy.</p><div className="mt-5 flex flex-wrap gap-5 text-sm font-semibold"><span className="flex items-center gap-2"><CalendarDays size={18} /> Oct 16 · 1:30–4:30 PM</span><span className="flex items-center gap-2"><MapPin size={18} /> IoT Hall, 003</span><span>6/02/2019 E.C.</span></div><p className="mt-3 text-sm">200 seats · RSVP required · no walk-ins</p></div><a href="/events/project-showcase-semester-kickoff-2026" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-slate-950 px-7 py-4 font-bold text-white hover:bg-slate-800">Reserve your seat <ArrowRight size={18} /></a></div></section>}

      <section id="about" className="px-5 py-24"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">What we do</p><h2 className="mt-4 text-4xl font-black sm:text-5xl">Learn by building. Grow by sharing.</h2></div><div className="space-y-5 text-lg leading-relaxed text-slate-300"><p>Peak Craft brings Informatics students together around hands-on projects, domain learning, mentorship, career readiness, and outreach.</p><p>Members work across domains, learn practical tools, and carry ideas from first sketch to finished project.</p></div></div></section>

      <section id="domains" className="bg-white px-5 py-24 text-slate-950"><div className="mx-auto max-w-7xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-700">Find your domain</p><h2 className="mt-4 text-4xl font-black">Four ways to make your mark.</h2><div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{domains.map(({ name, icon: Icon, description }, index) => <article key={name} className="rounded-2xl border border-slate-200 p-7 shadow-sm"><div className={`inline-flex rounded-xl p-3 ${index % 2 ? "bg-orange-100 text-orange-700" : "bg-cyan-100 text-cyan-700"}`}><Icon size={28} /></div><h3 className="mt-6 text-xl font-black">{name}</h3><p className="mt-2 text-slate-600">{description}</p></article>)}</div></div></section>

      <section className="px-5 py-24"><div className="mx-auto max-w-7xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">A year of momentum</p><h2 className="mt-4 text-4xl font-black">Built on people and projects.</h2><div className="mt-10 grid gap-8 sm:grid-cols-3"><div><p className="text-5xl font-black text-orange-400">250+</p><p className="mt-2 text-slate-200">new members in Semester One</p></div><div><p className="text-5xl font-black text-cyan-300">6</p><p className="mt-2 text-slate-200">cross-domain projects completed in Semester Two</p></div><div><p className="text-5xl font-black text-orange-400">49</p><p className="mt-2 text-slate-200">students joined the Semester One blood donation drive</p></div></div><p className="mt-8 text-xs text-slate-400">Source: PCIC Semester One & Two Digital Report, 2026. Figures describe those reporting periods.</p></div></section>

      <section id="stories" className="bg-[#0b234a] px-5 py-24"><div className="mx-auto max-w-7xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Our year in pictures</p><h2 className="mt-4 text-4xl font-black">A community in motion.</h2><div className="mt-10 grid gap-6 md:grid-cols-2">{stories.map((story) => <figure key={story.image} className="overflow-hidden rounded-2xl bg-slate-900"><img src={asset(story.image, 840)} srcSet={cloudName ? `${asset(story.image, 420)} 420w, ${asset(story.image, 840)} 840w` : undefined} sizes="(max-width: 768px) 100vw, 50vw" width="840" height="441" loading="lazy" alt={story.alt} className="aspect-[1.9] w-full object-cover" /><figcaption className="flex justify-between gap-2 p-5"><span className="font-bold">{story.title}</span><span className="text-xs text-slate-400">{story.source}</span></figcaption></figure>)}</div></div></section>

      <section className="px-5 py-24 text-center"><h2 className="text-4xl font-black">Your next idea starts here.</h2><p className="mx-auto mt-4 max-w-xl text-slate-300">Join Peak Craft and find people to learn, build, and grow with.</p><a href="/login?mode=signup" className="mt-7 inline-flex items-center gap-2 rounded-full bg-orange-400 px-7 py-3 font-bold text-slate-950">Join the community <ArrowRight size={18} /></a></section>
    </main>
    <footer className="border-t border-white/15 px-5 py-10 text-sm text-slate-300"><div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-5"><span>© 2026 Peak Craft Informatics Community · Hawassa University</span><div className="flex gap-6"><a href="https://t.me/peakcraftcommunity">Telegram</a><a href="/peak-projects">Projects</a><a href="/login">Member login</a></div></div></footer>
  </div>;
}
