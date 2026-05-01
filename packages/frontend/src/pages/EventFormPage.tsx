import { zodResolver } from "@hookform/resolvers/zod";
import type { EventCategory } from "@event-platform/shared";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronDown, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  createEventRequest,
  getEventRequest,
  makeEventDraftRequest,
  republishEventRequest,
  updateEventRequest
} from "../api/events";
import { MarkdownEditorField } from "../components/MarkdownEditorField";
import { useAuthStore } from "../stores/auth";
import { getCategoryLabel, getCategoryToneClass } from "../utils/categoryTheme";
import {
  eventFormSchema,
  validateCapacityAtLeastRegistrations,
  validateEventDateNotInPast,
  type EventFormValues
} from "../utils/eventFormValidation";
import styles from "./EventFormPage.module.css";

type FormValues = EventFormValues;

const categories: EventCategory[] = ["tech", "networking", "workshop", "social", "other"];

const toLocalInputParts = (isoDate: string) => {
  const parsedDate = new Date(isoDate);
  const year = parsedDate.getFullYear();
  const month = `${parsedDate.getMonth() + 1}`.padStart(2, "0");
  const day = `${parsedDate.getDate()}`.padStart(2, "0");
  const hours = `${parsedDate.getHours()}`.padStart(2, "0");
  const minutes = `${parsedDate.getMinutes()}`.padStart(2, "0");
  return { date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` };
};

export const EventFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isEdit = Boolean(id);
  const [dateValue, setDateValue] = useState("");
  const [timeValue, setTimeValue] = useState("");
  const [submitIntent, setSubmitIntent] = useState<"publish" | "draft">("publish");

  const form = useForm<FormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: { name: "", description: "", category: "tech", date: "", location: "", capacity: 50 }
  });
  const selectedCategory = form.watch("category");

  const eventQuery = useQuery({
    queryKey: ["event", id],
    queryFn: () => getEventRequest(id!),
    enabled: isEdit
  });
  const minCapacity = eventQuery.data?.event.registeredCount ?? 1;
  const existingEventDateMs = eventQuery.data ? new Date(eventQuery.data.event.date).getTime() : null;
  const allowPastDateForEdit = Boolean(isEdit && existingEventDateMs !== null && existingEventDateMs <= Date.now());

  useEffect(() => {
    if (!eventQuery.data) return;
    const { date: localDate, time: localTime } = toLocalInputParts(eventQuery.data.event.date);
    setDateValue(localDate);
    setTimeValue(localTime);
    form.reset({
      name: eventQuery.data.event.name,
      description: eventQuery.data.event.description,
      category: eventQuery.data.event.category,
      date: `${localDate}T${localTime}`,
      location: eventQuery.data.event.location,
      capacity: eventQuery.data.event.capacity
    });
  }, [eventQuery.data, form]);

  useEffect(() => {
    if (!dateValue || !timeValue) {
      form.setValue("date", "", { shouldValidate: false });
      return;
    }
    form.setValue("date", `${dateValue}T${timeValue}`, { shouldValidate: true });
  }, [dateValue, timeValue, form]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        ...values,
        name: values.name.trim(),
        description: values.description.trim(),
        location: values.location.trim(),
        date: new Date(values.date).toISOString()
      };
      const saved = isEdit ? await updateEventRequest(id!, payload) : await createEventRequest(payload);
      if (submitIntent === "draft") return makeEventDraftRequest(saved.event._id);
      if (isEdit) return republishEventRequest(saved.event._id);
      return saved;
    },
    onSuccess: () => {
      toast.success(
        submitIntent === "draft"
          ? isEdit ? "Draft saved" : "Event created as draft"
          : isEdit ? "Event updated" : "Event created"
      );
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
    <main className={`container ${styles.page}`}>
      <Link className={`back-link ${styles.back}`} to="/organizer/events">
        ← Back to my events
      </Link>
      <header className={styles.header}>
        <div>
          <h1>{isEdit ? "Edit event" : "Create event"}</h1>
          <p>Save as a draft to keep editing, or publish to make it visible to attendees.</p>
        </div>
        <div className={styles.headerActions}>
          <button className="btn btn-ghost" onClick={() => navigate("/organizer/events")} type="button">
            Cancel
          </button>
          <button
            className="btn btn-secondary"
            disabled={mutation.isPending}
            onClick={() => setSubmitIntent("draft")}
            type="submit"
            form="event-form"
          >
            {mutation.isPending ? "Saving..." : "Save as draft"}
          </button>
          <button
            className="btn btn-primary"
            disabled={mutation.isPending}
            onClick={() => setSubmitIntent("publish")}
            type="submit"
            form="event-form"
          >
            {mutation.isPending ? "Saving..." : "Publish event"}
          </button>
        </div>
      </header>

      <form className={styles.form} id="event-form" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
        <input
          {...form.register("date", {
            validate: (value) =>
              validateEventDateNotInPast(value, {
                allowPastDateForEdit,
                nowMs: Date.now()
              })
          })}
          type="hidden"
        />

        <section className={`panel ${styles.section}`}>
          <h2>Basic details</h2>
          <p className={styles.sectionSub}>Name, description, and category for your event.</p>

          <label className={styles.label}>
            Event name
            <input {...form.register("name")} maxLength={100} placeholder="Building serverless apps with TypeScript" type="text" />
            <div className={styles.captionRow}>
              <span className={styles.caption}>3–100 characters</span>
              <span className="field-error">{form.formState.errors.name?.message ?? ""}</span>
            </div>
          </label>

          <div className={styles.label}>
            <span>Description</span>
            <Controller
              control={form.control}
              name="description"
              render={({ field }) => (
                <MarkdownEditorField
                  maxLength={2000}
                  onChange={field.onChange}
                  placeholder="Describe your event..."
                  value={field.value}
                />
              )}
            />
            <div className={styles.captionRow}>
              <span className={styles.caption}>10–2000 characters</span>
              <span className={styles.caption}>{`${form.watch("description")?.length ?? 0} / 2000`}</span>
            </div>
            <span className="field-error">{form.formState.errors.description?.message ?? ""}</span>
          </div>

          <label className={styles.label}>
            Category
            <div className={`${styles.inputIconWrap} ${getCategoryToneClass(selectedCategory)}`}>
              <span className={styles.leadingDot} />
              <select {...form.register("category")} className={styles.withLeadingDot}>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {getCategoryLabel(category)}
                  </option>
                ))}
              </select>
              <ChevronDown className={`${styles.inputIcon} ${styles.selectIcon}`} size={15} strokeWidth={1.8} />
            </div>
          </label>
        </section>

        <section className={`panel ${styles.section}`}>
          <h2>When & where</h2>
          <p className={styles.sectionSub}>When the event happens and where attendees should go.</p>
          <div className={styles.dateTimeGrid}>
            <label className={styles.label}>
              Date
              <input onChange={(e) => setDateValue(e.target.value)} type="date" value={dateValue} />
            </label>
            <label className={styles.label}>
              Time
              <input onChange={(e) => setTimeValue(e.target.value)} type="time" value={timeValue} />
            </label>
          </div>
          <span className="field-error">{form.formState.errors.date?.message ?? ""}</span>

          <label className={styles.label}>
            Location
            <div className={styles.inputIconWrap}>
              <input {...form.register("location")} placeholder="Industry City, Brooklyn, NY" type="text" />
              <MapPin className={styles.inputIcon} size={15} strokeWidth={1.8} />
            </div>
            <span className={styles.caption}>Address or venue name</span>
            <span className="field-error">{form.formState.errors.location?.message ?? ""}</span>
          </label>
        </section>

        <section className={`panel ${styles.section}`}>
          <h2>Capacity</h2>
          <p className={styles.sectionSub}>How many people can register for this event.</p>
          <div className={styles.capacityRow}>
            <label className={styles.label}>
              Maximum attendees
              <input
                {...form.register("capacity", {
                  valueAsNumber: true,
                  validate: (value) => validateCapacityAtLeastRegistrations(value, minCapacity)
                })}
                min={minCapacity}
                type="number"
              />
            </label>
            <p className={styles.capacityHint}>
              You can change this later, but never below the current registration count.
            </p>
          </div>
          <span className="field-error">{form.formState.errors.capacity?.message ?? ""}</span>
        </section>
      </form>
    </main>
  );
};
