import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import FileUpload from "@/components/shared/FileUpload";
import { useSubmitApplication } from "@/hooks/useCandidates";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  motivation: z.string().optional(),
});

export default function CandidateUploadDialog({ open, onOpenChange }) {
  const [portfolio, setPortfolio] = useState(null);
  const [resume, setResume] = useState(null);
  const submitApp = useSubmitApplication();

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", motivation: "" },
  });

  const onSubmit = async (values) => {
    const formData = new FormData();
    formData.append("name", values.name);
    formData.append("email", values.email);
    if (values.motivation) formData.append("motivation", values.motivation);
    if (portfolio) formData.append("portfolio", portfolio);
    if (resume) formData.append("resume", resume);

    try {
      await submitApp.mutateAsync(formData);
      toast.success("Application submitted successfully!");
      reset();
      setPortfolio(null);
      setResume(null);
      onOpenChange(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Submission failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply to PCIC</DialogTitle>
          <DialogDescription>Submit your portfolio and resume to join the community.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input {...register("name")} placeholder="Your full name" />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input {...register("email")} type="email" placeholder="your@email.com" />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Motivation</Label>
            <Textarea {...register("motivation")} placeholder="Why do you want to join PCIC?" />
          </div>
          <FileUpload label="Portfolio" onFileSelect={setPortfolio} />
          <FileUpload label="Resume" onFileSelect={setResume} />
          <Button type="submit" className="w-full" disabled={submitApp.isPending}>
            {submitApp.isPending ? "Submitting..." : "Submit Application"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
