import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateDecision } from "@/hooks/useDecisions";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "exam-schedule", label: "Exam Schedule" },
  { value: "holiday", label: "Holiday" },
  { value: "stakeholder", label: "Stakeholder" },
  { value: "project-progress", label: "Project Progress" },
  { value: "learning", label: "Learning" },
];

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  stakeholders: z.string().optional(),
});

export default function CreateDecisionDialog({ open, onOpenChange }) {
  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", category: "", stakeholders: "" },
  });

  const createDecision = useCreateDecision();

  const onSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        stakeholders: values.stakeholders ? values.stakeholders.split(",").map((s) => s.trim()) : [],
      };
      await createDecision.mutateAsync(payload);
      toast.success("Decision created");
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create decision");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Decision</DialogTitle>
          <DialogDescription>Log a new leadership decision.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input {...register("title")} placeholder="Decision title" />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea {...register("description")} placeholder="Details..." />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={watch("category")} onValueChange={(v) => setValue("category", v)}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Stakeholders (comma-separated)</Label>
            <Input {...register("stakeholders")} placeholder="e.g. President, PM, Domain Leader" />
          </div>
          <Button type="submit" className="w-full" disabled={createDecision.isPending}>
            {createDecision.isPending ? "Creating..." : "Create Decision"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
