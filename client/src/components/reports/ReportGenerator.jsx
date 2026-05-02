import { useState, useRef } from "react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useReportData } from "@/hooks/useReports";
import ReportPreview from "./ReportPreview";
import { exportReportToPDF } from "./ReportPDFExport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileDown,
  Eye,
  Settings2,
  CalendarDays,
  Loader2,
} from "lucide-react";

export default function ReportGenerator() {
  const { user } = useAuth();
  const previewRef = useRef(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [fetchDates, setFetchDates] = useState({ start: "", end: "" });
  const [showPreview, setShowPreview] = useState(false);
  const [exporting, setExporting] = useState(false);

  const {
    data: reportData,
    isLoading,
    isError,
    error,
  } = useReportData(fetchDates.start, fetchDates.end);

  const [manualFields, setManualFields] = useState({
    preparedBy: user?.name || "",
    executiveSummary: "",
    academicHighlights: "",
    operationalWins: "",
    engagementStats: "",
    internalEvents: "",
    communityOutreach: "",
    codeCraftersReport: "",
    turingTribeReport: "",
    cyberCrewReport: "",
    pixelPeepsReport: "",
    publicRelationsReport: "",
    presidentialReport: "",
    financialReview: "",
    leadershipTransition: "",
    upcomingEvents: "",
    growthTargets: "",
  });

  const updateField = (key, value) => {
    setManualFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleFetchData = () => {
    if (!startDate || !endDate) return;
    setFetchDates({ start: startDate, end: endDate });
    setShowPreview(false);
  };

  const handleExport = async () => {
    if (!previewRef.current) return;
    setExporting(true);
    try {
      const startYear = startDate
        ? new Date(startDate).getFullYear()
        : "Report";
      const filename = `PCIC-Report-${startYear}.pdf`;
      await exportReportToPDF(previewRef.current, filename);
    } catch (err) {
      // silent fail — toast can be added
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Date Range + Fetch */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4" />
            Report Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-end gap-4">
            <div className="w-full sm:w-auto">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-auto">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button onClick={handleFetchData} disabled={!startDate || !endDate}>
              Fetch Data
            </Button>
          </div>
          {isError && (
            <p className="mt-2 text-sm text-red-500">
              Error: {error?.response?.data?.message || error?.message}
            </p>
          )}
          {isLoading && (
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Fields (shown after data loads) */}
      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings2 className="h-4 w-4" />
              Report Content (Manual Inputs)
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Fill these fields with data not tracked in the platform. All
              fields are optional.
            </p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="general" className="space-y-4">
              <TabsList className="flex-wrap h-auto">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="events">Events</TabsTrigger>
                <TabsTrigger value="domains">Domains</TabsTrigger>
                <TabsTrigger value="finance">Finance</TabsTrigger>
                <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <FieldBlock
                  label="Prepared By"
                  value={manualFields.preparedBy}
                  onChange={(v) => updateField("preparedBy", v)}
                  placeholder="e.g. John Doe / President"
                />
                <FieldBlock
                  label="Executive Summary Override"
                  value={manualFields.executiveSummary}
                  onChange={(v) => updateField("executiveSummary", v)}
                  multiline
                  placeholder="Leave empty to auto-generate from platform data"
                />
                <FieldBlock
                  label="Academic Highlights"
                  value={manualFields.academicHighlights}
                  onChange={(v) => updateField("academicHighlights", v)}
                  multiline
                  placeholder="Curriculum development, tool training (Git, VS Code), etc."
                />
                <FieldBlock
                  label="Operational Wins"
                  value={manualFields.operationalWins}
                  onChange={(v) => updateField("operationalWins", v)}
                  multiline
                  placeholder="Infrastructure repairs, system launches, etc."
                />
                <FieldBlock
                  label="Engagement & Social Media Stats"
                  value={manualFields.engagementStats}
                  onChange={(v) => updateField("engagementStats", v)}
                  multiline
                  placeholder="Telegram views/post, YouTube subscribers, etc."
                />
              </TabsContent>

              <TabsContent value="events" className="space-y-4">
                <FieldBlock
                  label="Internal Events Summary"
                  value={manualFields.internalEvents}
                  onChange={(v) => updateField("internalEvents", v)}
                  multiline
                  placeholder="Welcoming events, semester kickoffs, troubleshooting sessions, fast track exams..."
                />
                <FieldBlock
                  label="Community & Outreach"
                  value={manualFields.communityOutreach}
                  onChange={(v) => updateField("communityOutreach", v)}
                  multiline
                  placeholder="Blood donations, 5 Million Coders, external partnerships..."
                />
              </TabsContent>

              <TabsContent value="domains" className="space-y-4">
                <FieldBlock
                  label="Code Crafters Highlights"
                  value={manualFields.codeCraftersReport}
                  onChange={(v) => updateField("codeCraftersReport", v)}
                  multiline
                  placeholder="Projects built, skills obtained by members..."
                />
                <FieldBlock
                  label="Turing Tribe Highlights"
                  value={manualFields.turingTribeReport}
                  onChange={(v) => updateField("turingTribeReport", v)}
                  multiline
                  placeholder="Projects built, skills obtained by members..."
                />
                <FieldBlock
                  label="Cyber Crew Highlights"
                  value={manualFields.cyberCrewReport}
                  onChange={(v) => updateField("cyberCrewReport", v)}
                  multiline
                  placeholder="Projects built, skills obtained by members..."
                />
                <FieldBlock
                  label="Pixel Peeps Highlights"
                  value={manualFields.pixelPeepsReport}
                  onChange={(v) => updateField("pixelPeepsReport", v)}
                  multiline
                  placeholder="Designs built, member engagement..."
                />
                <FieldBlock
                  label="Public Relations Report"
                  value={manualFields.publicRelationsReport}
                  onChange={(v) => updateField("publicRelationsReport", v)}
                  multiline
                  placeholder="Content creation, YouTube tutorials, social media growth..."
                />
                <FieldBlock
                  label="Presidential / Secretarial Report"
                  value={manualFields.presidentialReport}
                  onChange={(v) => updateField("presidentialReport", v)}
                  multiline
                  placeholder="Strategic meetings, office hours, administrative paperwork..."
                />
              </TabsContent>

              <TabsContent value="finance" className="space-y-4">
                <FieldBlock
                  label="Financial & Resource Review"
                  value={manualFields.financialReview}
                  onChange={(v) => updateField("financialReview", v)}
                  multiline
                  placeholder="Resource allocation, equipment repairs, purchases..."
                />
              </TabsContent>

              <TabsContent value="roadmap" className="space-y-4">
                <FieldBlock
                  label="Leadership Transition"
                  value={manualFields.leadershipTransition}
                  onChange={(v) => updateField("leadershipTransition", v)}
                  multiline
                  placeholder="Plans for empowering the next administration..."
                />
                <FieldBlock
                  label="Upcoming Major Events"
                  value={manualFields.upcomingEvents}
                  onChange={(v) => updateField("upcomingEvents", v)}
                  multiline
                  placeholder="Hackathons, Half-life events, faculty showcases..."
                />
                <FieldBlock
                  label="Growth Targets"
                  value={manualFields.growthTargets}
                  onChange={(v) => updateField("growthTargets", v)}
                  multiline
                  placeholder="Social media engagement %, member retention goals..."
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {reportData && (
        <div className="flex gap-3">
          <Button
            variant={showPreview ? "secondary" : "default"}
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="mr-2 h-4 w-4" />
            {showPreview ? "Hide Preview" : "Preview Report"}
          </Button>
          <Button
            onClick={handleExport}
            disabled={exporting || !showPreview}
            variant="outline"
          >
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            Export PDF
          </Button>
        </div>
      )}

      {/* Report Preview */}
      {showPreview && reportData && (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <ReportPreview
              ref={previewRef}
              reportData={reportData}
              manualFields={manualFields}
              dateRange={{
                startDate: fetchDates.start,
                endDate: fetchDates.end,
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FieldBlock({ label, value, onChange, multiline, placeholder }) {
  return (
    <div>
      <Label className="text-sm">{label}</Label>
      {multiline ? (
        <textarea
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[80px] resize-y"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <Input
          className="mt-1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
