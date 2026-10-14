import fs from "node:fs";
import path from "node:path";

const dist = new URL("../dist/", import.meta.url);
const shell = fs.readFileSync(new URL("index.html", dist), "utf8");
const homeShell = fs.readFileSync(new URL("home.html", dist), "utf8");
const productionEnv = fs.readFileSync(new URL("../.env.production", import.meta.url), "utf8");
const cloudName = productionEnv.match(/^VITE_CLOUDINARY_CLOUD_NAME=([a-z0-9_-]+)$/m)?.[1];
const hero = (width) => cloudName
  ? `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto,w_${width}/pcic/public/landing/2026/semester-kickoff`
  : "/report/semester-kickoff.jpg";
const html = (title, description, body, route, noindex = false) => shell
  .replace(/<title>.*?<\/title>/, `<title>${title}</title><meta name="description" content="${description}"><link rel="canonical" href="https://pcic.tech${route}">${noindex ? '<meta name="robots" content="noindex">' : ""}`)
  .replace('<div id="root"></div>', `<div id="root">${body}</div>`);

const landing = `<main class="min-h-screen bg-[#061534] px-5 py-16 text-white"><div class="mx-auto max-w-7xl"><header class="font-black tracking-widest">PEAK CRAFT</header><section class="grid gap-8 py-16 lg:grid-cols-2"><div><h1 class="text-5xl font-black">Build together. Reach new peaks.</h1><p class="mt-6 text-lg">Peak Craft Informatics Community at Hawassa University: practical projects, shared learning, mentorship and outreach.</p><p class="mt-6"><a class="text-orange-400 underline" href="/login?mode=signup">Join Peak Craft</a> · <a href="/peak-projects">Explore projects</a></p></div><img class="w-full rounded-2xl" src="${hero(960)}" ${cloudName ? `srcset="${hero(480)} 480w, ${hero(960)} 960w" sizes="(max-width: 1024px) 100vw, 44vw"` : ""} width="840" height="441" fetchpriority="high" alt="Peak Craft members at the semester kickoff"></section><h2 class="text-3xl font-bold">PeakCraft Project Showcase &amp; Semester Kick-Off</h2><p>Friday, October 16, 2026 · 1:30–4:30 PM · IoT Hall, 003 · RSVP required</p><p><a class="text-orange-400 underline" href="/events/project-showcase-semester-kickoff-2026">Reserve a seat</a></p><h2 class="mt-10 text-2xl font-bold">Four domains</h2><p>Code Crafters · Turing Tribe · Cyber Crew · Pixel Peeps</p><h2 class="mt-10 text-2xl font-bold">Our impact</h2><p>250+ new members in Semester One. Six cross-domain projects completed in Semester Two.</p></div></main>`;
fs.writeFileSync(new URL("index.html", dist), homeShell
  .replace(/<title>.*?<\/title>/, '<title>Peak Craft Informatics Community | Hawassa University</title><meta name="description" content="Build together and reach new peaks with Peak Craft Informatics Community."><link rel="canonical" href="https://pcic.tech/">')
  .replace('<div id="root"></div>', `<div id="root">${landing}</div>`));

const entries = [
  ["login", "Sign in or join Peak Craft", "Sign in or create your Peak Craft account.", true],
  ["dashboard", "PCIC member dashboard", "PCIC member dashboard.", true],
  ["events", "PCIC events", "Member events and attendance.", true],
  ["members", "PCIC members", "Member management.", true],
  ["reports", "PCIC decisions", "Leadership decisions.", true],
  ["career", "PCIC progression", "Member progression.", true],
  ["projects", "PCIC projects", "Member projects.", true],
  ["summer-project", "PCIC summer project", "Member summer project.", true],
  ["leadership-compliance", "PCIC leadership compliance", "Leadership reports.", true],
  ["admin", "PCIC administration", "Admin tools.", true],
  ["check-in", "PCIC staff check-in", "Staff check-in scanner.", true],
  ["peak-projects", "Peak Craft projects", "Explore projects built by Peak Craft members.", false],
];
for (const [route, title, description, noindex] of entries) {
  const dir = new URL(`${route}/`, dist);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(new URL("index.html", dir), html(title, description, "", `/${route}`, noindex));
}
const eventDir = new URL("events/project-showcase-semester-kickoff-2026/", dist);
fs.mkdirSync(eventDir, { recursive: true });
fs.writeFileSync(new URL("index.html", eventDir), html("PeakCraft Project Showcase & Semester Kick-Off", "RSVP for the PeakCraft showcase on Friday, October 16, 2026 at IoT Hall, 003.", `<main><h1>PeakCraft Project Showcase &amp; Semester Kick-Off</h1><p>Friday, October 16, 2026 · 1:30–4:30 PM · IoT Hall, 003</p><a href="/login?mode=signup">Sign up to RSVP</a></main>`, "/events/project-showcase-semester-kickoff-2026"));
const eventHtml = new URL("index.html", eventDir);
fs.writeFileSync(eventHtml, fs.readFileSync(eventHtml, "utf8").replace("</head>", `<script type="application/ld+json">${JSON.stringify({
  "@context": "https://schema.org", "@type": "Event",
  name: "PeakCraft Project Showcase & Semester Kick-Off",
  startDate: "2026-10-16T13:30:00+03:00", endDate: "2026-10-16T16:30:00+03:00",
  eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  eventStatus: "https://schema.org/EventScheduled",
  location: { "@type": "Place", name: "IoT Hall, 003", address: { "@type": "PostalAddress", addressLocality: "Hawassa", addressCountry: "ET" } },
  organizer: { "@type": "Organization", name: "Peak Craft Informatics Community", url: "https://pcic.tech/" },
  url: "https://pcic.tech/events/project-showcase-semester-kickoff-2026",
})}</script></head>`));
const scanDir = new URL("events/project-showcase-semester-kickoff-2026/check-in/", dist);
fs.mkdirSync(scanDir, { recursive: true });
fs.writeFileSync(new URL("index.html", scanDir), html("PCIC staff check-in", "Staff check-in scanner.", "", "/events/project-showcase-semester-kickoff-2026/check-in", true));
fs.writeFileSync(new URL("404.html", dist), shell);
fs.writeFileSync(new URL("robots.txt", dist), "User-agent: *\nAllow: /\nDisallow: /login\nDisallow: /dashboard\nDisallow: /admin\nSitemap: https://pcic.tech/sitemap.xml\n");
fs.writeFileSync(new URL("sitemap.xml", dist), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://pcic.tech/</loc></url><url><loc>https://pcic.tech/peak-projects</loc></url><url><loc>https://pcic.tech/events/project-showcase-semester-kickoff-2026</loc></url></urlset>`);
