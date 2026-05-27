import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, CloudRain, X, FileText, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function acceptedExtensions(accept) {
  const extensions = new Set();
  Object.values(accept || {}).forEach((extList) => {
    (extList || []).forEach((ext) => {
      if (typeof ext === "string" && ext.startsWith(".")) {
        extensions.add(ext.toLowerCase());
      }
    });
  });
  return Array.from(extensions);
}

export default function FileUpload({
  onFileSelect,
  accept = { "application/pdf": [".pdf"], "image/*": [".png", ".jpg", ".jpeg"] },
  maxSize = 10 * 1024 * 1024,
  label = "Upload file",
  dropIcon = "upload",
}) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const allowedExts = acceptedExtensions(accept);
  const acceptedLabel = allowedExts.length > 0 ? allowedExts.join(", ") : "accepted format";

  const onDrop = useCallback(
    (acceptedFiles, rejectedFiles) => {
      setError("");
      if (rejectedFiles.length > 0) {
        const err = rejectedFiles[0].errors[0];
        const maxMb = (maxSize / (1024 * 1024)).toFixed(1);
        if (err.code === "file-too-large") {
          setError(`File is too large (max ${maxMb}MB)`);
          return;
        }
        if (err.code === "file-invalid-type") {
          setError(`Only ${acceptedLabel} files are accepted.`);
          return;
        }
        setError(err.message);
        return;
      }
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
        onFileSelect?.(acceptedFiles[0]);
      }
    },
    [acceptedLabel, maxSize, onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
  });

  const removeFile = () => {
    setFile(null);
    onFileSelect?.(null);
  };

  const FileIcon = file?.type?.startsWith("image") ? Image : FileText;
  const DropIcon = dropIcon === "cloud-rain" ? CloudRain : Upload;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      {!file ? (
        <div
          {...getRootProps()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
            isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
          )}
        >
          <input {...getInputProps()} />
          <DropIcon className="mb-2 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {isDragActive ? "Drop the file here" : "Drag & drop or click to select"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {acceptedLabel} only, max {(maxSize / (1024 * 1024)).toFixed(1)}MB
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border p-3">
          <FileIcon className="h-8 w-8 text-muted-foreground" />
          <div className="flex-1 truncate">
            <p className="truncate text-sm font-medium">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
          <Button variant="ghost" size="icon" onClick={removeFile}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
