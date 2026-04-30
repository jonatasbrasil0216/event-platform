import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { cancelRegistrationRequest, listMyRegistrationsRequest } from "../api/registrations";
import { LoadingBlocks } from "../components/LoadingBlocks";
import { MyRegistrationCard } from "../components/MyRegistrationCard";
import { SegmentedCountTabs } from "../components/SegmentedCountTabs";
import { useAuthStore } from "../stores/auth";

export const MyRegistrationsPage = () => {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const regsQuery = useQuery({
    queryKey: ["my-registrations"],
    queryFn: listMyRegistrationsRequest,
    enabled: user?.role === "attendee"
  });
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  const cancelMutation = useMutation({
    mutationFn: cancelRegistrationRequest,
    onSuccess: () => {
      toast.success("Registration cancelled");
      queryClient.invalidateQueries({ queryKey: ["my-registrations"] });
    },
    onError: (error) => toast.error(error.message)
  });

  if (user?.role !== "attendee") {
    return (
      <main className="container">
        <section className="panel">
          <h1>Attendee access only</h1>
          <p>Use an attendee account to view your registrations.</p>
        </section>
      </main>
    );
  }

  const activeRegistrations =
    regsQuery.data?.data.filter(({ registration }) => registration.status === "active") ?? [];
  const now = Date.now();
  const upcomingRegs = activeRegistrations.filter(({ event }) => new Date(event.date).getTime() >= now);
  const pastRegs = activeRegistrations.filter(({ event }) => new Date(event.date).getTime() < now);
  const visibleRegs = activeTab === "upcoming" ? upcomingRegs : pastRegs;

  return (
    <main className="container my-reg-page">
      <section className="my-reg-header">
        <h1>My registrations</h1>
        <p>Events you've signed up for.</p>
      </section>
      {regsQuery.isLoading ? (
        <LoadingBlocks />
      ) : regsQuery.isError ? (
        <section className="panel">
          <h3>Could not load registrations</h3>
          <p>Please refresh the page and try again.</p>
        </section>
      ) : (
        <section>
          <SegmentedCountTabs
            activeId={activeTab}
            ariaLabel="Registration timeline tabs"
            className="my-reg-tabs"
            items={[
              { id: "upcoming", label: "Upcoming", count: upcomingRegs.length },
              { id: "past", label: "Past", count: pastRegs.length }
            ]}
            onChange={setActiveTab}
          />

          <p className="my-reg-count-label">{`${visibleRegs.length} ${activeTab} events`}</p>

          {visibleRegs.length ? (
            <section className="my-reg-grid">
              {visibleRegs.map(({ registration, event, organizerName }) => (
                <MyRegistrationCard
                  cancelDisabled={cancelMutation.isPending}
                  event={event}
                  key={registration._id}
                  onCancel={(eventId) => cancelMutation.mutate(eventId)}
                  organizerName={organizerName}
                />
              ))}
            </section>
          ) : (
            <article className="panel">
              <h3>{activeTab === "upcoming" ? "No upcoming registrations" : "No past registrations"}</h3>
              <p>Browse events and register to build your schedule.</p>
            </article>
          )}
        </section>
      )}
    </main>
  );
};
