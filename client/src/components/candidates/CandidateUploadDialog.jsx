import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import FileUpload from "@/components/shared/FileUpload";
import { useSubmitApplication } from "@/hooks/useCandidates";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const schema = z.object({
  motivation: z.string().optional(),
  requestedBatch: z.string().min(1, "Target level is required"),
});

const batchLabels = { batch_1: "Batch 1", batch_2: "Batch 2", batch_3: "Batch 3" };

export default function CandidateUploadDialog({ open, onOpenChange }) {
  const [portfolio, setPortfolio] = useState(null);
  const submitApp = useSubmitApplication();
  const { user } = useAuth();

  const availableBatches = useMemo(() => {
    if (!user?.batch) return [];
    const order = ["batch_1", "batch_2", "batch_3"];
    const currentIndex = order.indexOf(user.batch);
    return currentIndex === -1 ? [] : order.slice(currentIndex + 1);
  }, [user]);

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { motivation: "", requestedBatch: "" },
  });

  const onSubmit = async (values) => {
    const formData = new FormData();
    if (values.motivation) formData.append("motivation", values.motivation);
    formData.append("requestedBatch", values.requestedBatch);
    if (portfolio) formData.append("portfolio", portfolio);

    try {
      await submitApp.mutateAsync(formData);
      toast.success("Promotion request submitted successfully!");
      reset();
      setPortfolio(null);
      onOpenChange(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Submission failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Level Promotion</DialogTitle>
          <DialogDescription>
            Upload a single PDF portfolio showing project links, certificates, or proof that you completed your semester learning roadmap.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Motivation</Label>
            <Textarea
              {...register("motivation")}
              placeholder="Summarize why you are ready for the next level. You can reference specific projects or activities from your portfolio."
            />
          </div>
          <div className="space-y-2">
            <Label>Target Level</Label>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={watch("requestedBatch")}
              onChange={(e) => setValue("requestedBatch", e.target.value)}
            >
              <option value="">Select new level</option>
              {availableBatches.map((b) => (
                <option key={b} value={b}>
                  {batchLabels[b]}
                </option>
              ))}
            </select>
            {errors.requestedBatch && (
              <p className="text-sm text-destructive">{errors.requestedBatch.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <FileUpload
              label="Promotion Portfolio (PDF, max 1MB)"
              onFileSelect={setPortfolio}
              accept={{ "application/pdf": [".pdf"] }}
              maxSize={1024 * 1024}
            />
            {!portfolio && (
              <p className="text-xs text-muted-foreground">
                Include: project portfolio links, certificates, or proof that you&apos;ve completed the assigned semester learning roadmap.
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={submitApp.isPending}>
            {submitApp.isPending ? "Submitting..." : "Submit Application"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
