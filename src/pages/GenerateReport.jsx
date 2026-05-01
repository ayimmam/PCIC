import PageHeader from "@/components/shared/PageHeader";
import ReportGenerator from "@/components/reports/ReportGenerator";

export default function GenerateReport() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Annual Report Generator"
        subtitle="Generate a comprehensive PCIC report with live data and export to PDF"
      />
      <ReportGenerator />
    </div>
  );
}
