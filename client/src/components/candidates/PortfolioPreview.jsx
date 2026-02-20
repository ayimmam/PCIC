import { FileText, Image } from "lucide-react";

export default function PortfolioPreview({ url, type = "pdf" }) {
  if (!url) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
        <p className="text-sm text-muted-foreground">No file uploaded</p>
      </div>
    );
  }

  const fullUrl = url.startsWith("http") ? url : `/${url}`;
  const isPdf = type === "pdf" || url.endsWith(".pdf");

  if (isPdf) {
    return (
      <div className="overflow-hidden rounded-lg border">
        <div className="flex items-center gap-2 border-b bg-muted/50 px-3 py-2">
          <FileText className="h-4 w-4" />
          <span className="text-sm font-medium">Portfolio Document</span>
        </div>
        <iframe src={fullUrl} className="h-[500px] w-full" title="Portfolio Preview" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="flex items-center gap-2 border-b bg-muted/50 px-3 py-2">
        <Image className="h-4 w-4" />
        <span className="text-sm font-medium">Portfolio Image</span>
      </div>
      <img src={fullUrl} alt="Portfolio" className="max-h-[500px] w-full object-contain" />
    </div>
  );
}
