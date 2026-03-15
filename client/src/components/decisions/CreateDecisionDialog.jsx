import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useCreateDecision } from "@/hooks/useDecisions";
import { useMembers } from "@/hooks/useMembers";
import { toast } from "sonner";
import { X } from "lucide-react";

const DEFAULT_CATEGORIES = [
  { value: "exam-schedule", label: "Exam Schedule" },
  { value: "holiday", label: "Holiday" },
  { value: "stakeholder", label: "Stakeholder" },
  { value: "project-progress", label: "Project Progress" },
  { value: "learning", label: "Learning" },
];

const ADD_OTHER_VALUE = "__add_other__";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
}).refine((data) => {
  if (data.category === "exam-schedule") return !!(data.startDate && data.endDate);
  if (data.category === "holiday") return !!data.startDate;
  return true;
}, { message: "Exam schedule requires start and end date; holiday requires start date.", path: ["startDate"] });

export default function CreateDecisionDialog({ open, onOpenChange }) {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [stakeholderIds, setStakeholderIds] = useState([]);
  const [addCategoryValue, setAddCategoryValue] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "", category: "", startDate: "", endDate: "" },
  });

  const category = watch("category");
  const showDates = category === "exam-schedule" || category === "holiday";
  const showEndDate = category === "exam-schedule";

  const createDecision = useCreateDecision();
  const { data: members } = useMembers({});

  const handleAddCategory = () => {
    const v = addCategoryValue.trim().toLowerCase().replace(/\s+/g, "-");
    if (!v) return;
    if (categories.some((c) => c.value === v)) {
      setValue("category", v);
      setAddCategoryValue("");
      setShowAddCategory(false);
      return;
    }
    const newCat = { value: v, label: addCategoryValue.trim() };
    setCategories((prev) => [...prev, newCat]);
    setValue("category", v);
    setAddCategoryValue("");
    setShowAddCategory(false);
  };

  const handleCategoryChange = (v) => {
    if (v === ADD_OTHER_VALUE) {
      setShowAddCategory(true);
      return;
    }
    setValue("category", v);
  };

  const addStakeholder = (userId) => {
    if (userId && !stakeholderIds.includes(userId)) setStakeholderIds((prev) => [...prev, userId]);
  };

  const removeStakeholder = (userId) => {
    setStakeholderIds((prev) => prev.filter((id) => id !== userId));
  };

  const onSubmit = async (values) => {
    try {
      const payload = {
        title: values.title,
        description: values.description,
        category: values.category,
        stakeholders: stakeholderIds,
        startDate: values.startDate || undefined,
        endDate: values.endDate || undefined,
      };
      await createDecision.mutateAsync(payload);
      toast.success("Decision created");
      reset();
      setStakeholderIds([]);
      setCategories(DEFAULT_CATEGORIES);
      onOpenChange(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create decision");
    }
  };

  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      setStakeholderIds([]);
      setShowAddCategory(false);
      setAddCategoryValue("");
      setCategories(DEFAULT_CATEGORIES);
    }
    onOpenChange(isOpen);
  };

  const memberMap = useMemo(() => {
    const m = {};
    (members || []).forEach((u) => { m[u._id] = u; });
    return m;
  }, [members]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
            <Select value={category || undefined} onValueChange={handleCategoryChange}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
                <SelectItem value={ADD_OTHER_VALUE}>Add another category...</SelectItem>
              </SelectContent>
            </Select>
            {showAddCategory && (
              <div className="flex gap-2">
                <Input
                  placeholder="New category name"
                  value={addCategoryValue}
                  onChange={(e) => setAddCategoryValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCategory())}
                />
                <Button type="button" variant="secondary" onClick={handleAddCategory}>
                  Add
                </Button>
              </div>
            )}
            {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
          </div>
          {showDates && (
            <>
              <div className="space-y-2">
                <Label>Start date {category === "holiday" && "(required for holiday)"}</Label>
                <Input type="date" {...register("startDate")} />
                {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
              </div>
              {showEndDate && (
                <div className="space-y-2">
                  <Label>End date (required for exam schedule)</Label>
                  <Input type="date" {...register("endDate")} />
                  {errors.endDate && <p className="text-sm text-destructive">{errors.endDate.message}</p>}
                </div>
              )}
            </>
          )}
          <div className="space-y-2">
            <Label>Stakeholders</Label>
            <div className="flex flex-wrap gap-2">
              {stakeholderIds.map((id) => (
                <Badge key={id} variant="secondary" className="gap-1 pr-1">
                  {memberMap[id]?.name || id}
                  <button
                    type="button"
                    className="rounded-full p-0.5 hover:bg-muted"
                    onClick={() => removeStakeholder(id)}
                    aria-label="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Select key={`stakeholder-${stakeholderIds.length}`} value="" onValueChange={(v) => v && v !== "_none" && addStakeholder(v)}>
              <SelectTrigger><SelectValue placeholder="Add stakeholder..." /></SelectTrigger>
              <SelectContent>
                {(members || [])
                  .filter((m) => !stakeholderIds.includes(m._id))
                  .map((m) => (
                    <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>
                  ))}
                {(members || []).filter((m) => !stakeholderIds.includes(m._id)).length === 0 && (
                  <SelectItem value="_none" disabled>All members added</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={createDecision.isPending}>
            {createDecision.isPending ? "Creating..." : "Create Decision"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
