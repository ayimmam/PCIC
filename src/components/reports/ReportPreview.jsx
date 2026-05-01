import { forwardRef } from "react";
import { format } from "date-fns";
import pcicLogo from "@/assets/pcic-logo.png";
import {
  MembersByDomainChart,
  MembersByBatchChart,
  MemberStatusChart,
  EventsByDomainChart,
  DecisionsByCategoryChart,
  CandidateOutcomesChart,
} from "./ReportCharts";

const ReportPreview = forwardRef(function ReportPreview(
  { reportData, manualFields, dateRange },
  ref
) {
  if (!reportData) return null;

  const { members, events, decisions, strikes, candidates, projects } =
    reportData;

  const startYear = dateRange?.startDate
    ? new Date(dateRange.startDate).getFullYear()
    : "";
  const endYear = dateRange?.endDate
    ? new Date(dateRange.endDate).getFullYear()
    : "";
  const yearLabel =
    startYear === endYear ? `${startYear}` : `${startYear}–${endYear}`;

  return (
    <div
      ref={ref}
      className="bg-white text-gray-900 max-w-[850px] mx-auto"
      style={{ fontFamily: "Inter, system-ui, sans-serif", padding: "40px" }}
    >
      {/* ── Cover / Header ─────────────────────────── */}
      <div className="text-center mb-10 border-b-2 border-indigo-600 pb-8">
        <img
          src={pcicLogo}
          alt="PCIC Logo"
          className="mx-auto mb-4 h-20 w-20 object-contain"
        />
        <h1 className="text-3xl font-bold text-indigo-700 mb-1">
          Yearly Report: {yearLabel}
        </h1>
        <p className="text-lg text-gray-600">
          Peak Craft Informatics Community (PCIC)
        </p>
        <div className="mt-4 text-sm text-gray-500 space-y-0.5">
          <p>
            <strong>Prepared By:</strong>{" "}
            {manualFields?.preparedBy || "[Name/Role]"}
          </p>
          <p>
            <strong>Date:</strong>{" "}
            {format(new Date(), "MMMM d, yyyy")}
          </p>
          <p>
            <strong>Report Period:</strong>{" "}
            {dateRange?.startDate
              ? format(new Date(dateRange.startDate), "MMM d, yyyy")
              : "N/A"}{" "}
            –{" "}
            {dateRange?.endDate
              ? format(new Date(dateRange.endDate), "MMM d, yyyy")
              : "N/A"}
          </p>
        </div>
      </div>

      {/* ── 1. Executive Summary ───────────────────── */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-indigo-700 border-b border-gray-200 pb-1 mb-3">
          1. Executive Summary
        </h2>

        <div className="mb-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">Overview</h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">
            {manualFields?.executiveSummary ||
              `During this reporting period, PCIC managed ${members?.total || 0} members across four technical domains. The community organized ${events?.total || 0} events, processed ${candidates?.total || 0} membership applications, and tracked ${projects?.total || 0} active projects.`}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <StatBox
            label="Total Members"
            value={members?.total || 0}
          />
          <StatBox
            label="New Registrations"
            value={members?.newRegistrations || 0}
          />
          <StatBox label="Events Held" value={events?.total || 0} />
          <StatBox
            label="Total Check-ins"
            value={events?.totalCheckedIn || 0}
          />
        </div>

        {manualFields?.academicHighlights && (
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">
              Academic Highlights
            </h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {manualFields.academicHighlights}
            </p>
          </div>
        )}

        {manualFields?.operationalWins && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">
              Operational Wins
            </h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {manualFields.operationalWins}
            </p>
          </div>
        )}
      </section>

      {/* ── 2. Key Achievements & Statistics ────────── */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-indigo-700 border-b border-gray-200 pb-1 mb-3">
          2. Annual Key Achievements & Statistics
        </h2>

        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">
            Membership Growth
          </h3>
          <p className="text-sm text-gray-600">
            Total members: <strong>{members?.total || 0}</strong> | Active:{" "}
            <strong>{members?.active || 0}</strong> | Warning:{" "}
            <strong>{members?.warning || 0}</strong> | Inactive:{" "}
            <strong>{members?.inactive || 0}</strong>
          </p>
          <p className="text-sm text-gray-600">
            New registrations in period:{" "}
            <strong>{members?.newRegistrations || 0}</strong>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <MembersByDomainChart data={members?.byDomain} />
          <MembersByBatchChart data={members?.byBatch} />
        </div>

        <MemberStatusChart data={members} />

        {manualFields?.engagementStats && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">
              Engagement & Social Media
            </h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {manualFields.engagementStats}
            </p>
          </div>
        )}
      </section>

      {/* ── 3. Event Execution Recap ───────────────── */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-indigo-700 border-b border-gray-200 pb-1 mb-3">
          3. Event Execution Recap
        </h2>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <StatBox label="Total Events" value={events?.total || 0} />
          <StatBox
            label="Total Reported Attendees"
            value={events?.totalReportedAttendees || 0}
          />
        </div>

        <EventsByDomainChart data={events?.byDomain} />

        {events?.topEvents && events.topEvents.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Top Attended Events
            </h3>
            <table className="w-full text-sm border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-2 border-b">Event</th>
                  <th className="text-left p-2 border-b">Domain</th>
                  <th className="text-left p-2 border-b">Date</th>
                  <th className="text-right p-2 border-b">Attendees</th>
                </tr>
              </thead>
              <tbody>
                {events.topEvents.slice(0, 5).map((evt, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="p-2">{evt.title}</td>
                    <td className="p-2">{evt.domain}</td>
                    <td className="p-2">
                      {evt.date
                        ? format(new Date(evt.date), "MMM d, yyyy")
                        : "—"}
                    </td>
                    <td className="p-2 text-right">{evt.attendeeCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {manualFields?.internalEvents && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">
              Internal Events Summary
            </h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {manualFields.internalEvents}
            </p>
          </div>
        )}

        {manualFields?.communityOutreach && (
          <div className="mt-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">
              Community & Outreach
            </h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {manualFields.communityOutreach}
            </p>
          </div>
        )}
      </section>

      {/* ── 4. Departmental & Domain Reports ────────── */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-indigo-700 border-b border-gray-200 pb-1 mb-3">
          4. Departmental & Domain Reports
        </h2>

        {/* Decisions */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">
            Decisions & Governance
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            Total decisions: <strong>{decisions?.total || 0}</strong>
          </p>
          <DecisionsByCategoryChart data={decisions?.byCategory} />
        </div>

        {/* Strikes */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">
            Disciplinary Actions
          </h3>
          <p className="text-sm text-gray-600">
            Total strikes: <strong>{strikes?.total || 0}</strong> | Members
            affected: <strong>{strikes?.membersAffected || 0}</strong>
          </p>
        </div>

        {/* Applications */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">
            Membership Applications
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            Total applications: <strong>{candidates?.total || 0}</strong>
          </p>
          <CandidateOutcomesChart data={candidates?.byStatus} />
        </div>

        {/* Projects */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">
            Project Management
          </h3>
          <p className="text-sm text-gray-600">
            Total projects: <strong>{projects?.total || 0}</strong> | Todo
            completion rate:{" "}
            <strong>{projects?.todoCompletionRate || 0}%</strong> (
            {projects?.completedTodos || 0}/{projects?.totalTodos || 0})
          </p>
        </div>

        {/* Domain-specific manual reports */}
        <div className="mt-4 space-y-4">
          <h3 className="text-base font-semibold text-indigo-600">
            Domain Highlights
          </h3>

          {manualFields?.codeCraftersReport && (
            <DomainReportBlock
              domain="Code Crafters"
              content={manualFields.codeCraftersReport}
            />
          )}
          {manualFields?.turingTribeReport && (
            <DomainReportBlock
              domain="Turing Tribe"
              content={manualFields.turingTribeReport}
            />
          )}
          {manualFields?.cyberCrewReport && (
            <DomainReportBlock
              domain="Cyber Crew"
              content={manualFields.cyberCrewReport}
            />
          )}
          {manualFields?.pixelPeepsReport && (
            <DomainReportBlock
              domain="Pixel Peeps"
              content={manualFields.pixelPeepsReport}
            />
          )}

          {manualFields?.publicRelationsReport && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1">
                Public Relations
              </h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {manualFields.publicRelationsReport}
              </p>
            </div>
          )}

          {manualFields?.presidentialReport && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1">
                Presidential / Secretarial
              </h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {manualFields.presidentialReport}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── 5. Financial & Resource Review ──────────── */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-indigo-700 border-b border-gray-200 pb-1 mb-3">
          5. Financial & Resource Review
        </h2>
        <p className="text-sm text-gray-600 whitespace-pre-wrap">
          {manualFields?.financialReview ||
            "No financial data was provided for this reporting period."}
        </p>
      </section>

      {/* ── 6. Future Roadmap ──────────────────────── */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-indigo-700 border-b border-gray-200 pb-1 mb-3">
          6. Future Roadmap & Strategic Priorities
        </h2>

        {manualFields?.leadershipTransition && (
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">
              Leadership Transition
            </h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {manualFields.leadershipTransition}
            </p>
          </div>
        )}

        {manualFields?.upcomingEvents && (
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">
              Upcoming Major Events
            </h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {manualFields.upcomingEvents}
            </p>
          </div>
        )}

        {manualFields?.growthTargets && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">
              Growth Targets
            </h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {manualFields.growthTargets}
            </p>
          </div>
        )}

        {!manualFields?.leadershipTransition &&
          !manualFields?.upcomingEvents &&
          !manualFields?.growthTargets && (
            <p className="text-sm text-gray-500 italic">
              No future roadmap information was provided.
            </p>
          )}
      </section>

      {/* ── Footer ──────────────────────────────────── */}
      <div className="border-t-2 border-indigo-600 pt-4 mt-10 text-center text-xs text-gray-400">
        <p>
          Peak Craft Informatics Community (PCIC) · Hawassa University ·{" "}
          {yearLabel}
        </p>
        <p>This report was auto-generated from the PCIC Management System.</p>
      </div>
    </div>
  );
});

function StatBox({ label, value }) {
  return (
    <div className="border border-gray-200 rounded-md p-3 text-center">
      <p className="text-2xl font-bold text-indigo-700">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function DomainReportBlock({ domain, content }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-1">{domain}</h4>
      <p className="text-sm text-gray-600 whitespace-pre-wrap">{content}</p>
    </div>
  );
}

export default ReportPreview;
