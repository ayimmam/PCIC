import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateEvent } from "@/hooks/useEvents";
import { toast } from "sonner";

const DOMAINS = ["T&G", "Technical", "Events", "Marketing", "Finance", "General"];

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  domain: z.string().min(1, "Domain is required"),
  capacity: z.coerce.number().int().min(0).optional(),
});

export default function CreateEventForm({ onSuccess }) {
  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues: { title: "", description: "", date: "", domain: "", capacity: 0 },
  });

  const createEvent = useCreateEvent();

  const onSubmit = async (values) => {
    try {
      await createEvent.mutateAsync(values);
      toast.success("Event created successfully");
      reset();
      onSuccess?.();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create event");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...register("title")} placeholder="Event title" />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register("description")} placeholder="Event details..." />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date">Date & Time</Label>
          <Input id="date" type="datetime-local" {...register("date")} />
          {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Domain</Label>
          <Select value={watch("domain")} onValueChange={(v) => setValue("domain", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select domain" />
            </SelectTrigger>
            <SelectContent>
              {DOMAINS.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.domain && <p className="text-sm text-destructive">{errors.domain.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="capacity">Capacity (0 = unlimited)</Label>
        <Input id="capacity" type="number" {...register("capacity")} min={0} />
      </div>

      <Button type="submit" disabled={createEvent.isPending} className="w-full">
        {createEvent.isPending ? "Creating..." : "Create Event"}
      </Button>
    </form>
  );
}
