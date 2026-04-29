import { zodResolver } from "@hookform/resolvers/zod";
import { createEventSchema, type EventCategory } from "@event-platform/shared";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { createEventRequest, getEventRequest, updateEventRequest } from "../api/events";
import { useAuthStore } from "../stores/auth";

const localDateTimeSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Invalid datetime")
  .refine((value) => !Number.isNaN(new Date(value).getTime()), "Invalid datetime");

const schema = createEventSchema.extend({
  date: localDateTimeSchema
});
type FormValues = z.infer<typeof schema>;

const categories: EventCategory[] = ["tech", "networking", "workshop", "social", "other"];

export const EventFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isEdit = Boolean(id);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      category: "tech",
      date: "",
      location: "",
      capacity: 50
    }
  });

  const eventQuery = useQuery({
    queryKey: ["event", id],
    queryFn: () => getEventRequest(id!),
    enabled: isEdit
  });

  useEffect(() => {
    if (!eventQuery.data) return;
    form.reset({
      name: eventQuery.data.event.name,
      description: eventQuery.data.event.description,
      category: eventQuery.data.event.category,
      date: eventQuery.data.event.date.slice(0, 16),
      location: eventQuery.data.event.location,
      capacity: eventQuery.data.event.capacity
    });
  }, [eventQuery.data, form]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        ...values,
        date: new Date(values.date).toISOString()
      };
      return isEdit ? updateEventRequest(id!, payload) : createEventRequest(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? "Event updated" : "Event created");
      navigate("/organizer/events");
    },
    onError: (error) => toast.error(error.message)
  });

  if (user?.role !== "organizer") {
    return (
      <main className="container">
        <section className="panel">
          <h1>Organizer access only</h1>
          <p>You need an organizer account to create or edit events.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="container">
      <section className="panel form-panel">
        <p className="eyebrow">{isEdit ? "Update your event" : "Create a new event"}</p>
        <h1>{isEdit ? "Edit Event" : "Create Event"}</h1>
        <form className="auth-form" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
          <label>
            Event name
            <input {...form.register("name")} placeholder="React Meetup NYC" type="text" />
            <span className="field-error">{form.formState.errors.name?.message ?? ""}</span>
          </label>
          <label>
            Description
            <textarea {...form.register("description")} placeholder="Describe your event..." rows={5} />
            <span className="field-error">{form.formState.errors.description?.message ?? ""}</span>
          </label>
          <div className="grid-two">
            <label>
              Category
              <select {...form.register("category")}>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Capacity
              <input {...form.register("capacity", { valueAsNumber: true })} min={1} type="number" />
            </label>
          </div>
          <label>
            Date and time
            <input {...form.register("date")} type="datetime-local" />
            <span className="field-error">{form.formState.errors.date?.message ?? ""}</span>
          </label>
          <label>
            Location
            <input {...form.register("location")} placeholder="Manhattan, NYC" type="text" />
            <span className="field-error">{form.formState.errors.location?.message ?? ""}</span>
          </label>
          <button className="btn btn-primary" disabled={mutation.isPending} type="submit">
            {mutation.isPending ? "Saving..." : isEdit ? "Save changes" : "Create event"}
          </button>
        </form>
      </section>
    </main>
  );
};
