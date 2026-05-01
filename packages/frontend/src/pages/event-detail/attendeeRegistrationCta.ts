import type { Event, User } from "@event-platform/shared";

export type RegistrationCta = {
  label: string;
  disabled: boolean;
  variant: "primary" | "secondary";
  /** Undefined when no click handler (blocked state). */
  onPress: (() => void) | undefined;
};

type MutationPending = { isPending: boolean };

/** Pure mapping for attendee registration / cancel CTAs on the event detail page. */
export const resolveAttendeeRegistrationCta = (options: {
  user: User | null;
  event: Event;
  isRegistered: boolean;
  isPast: boolean;
  isFull: boolean;
  onRegister: () => void;
  onCancelRegistration: () => void;
  registerMutation: MutationPending;
  cancelMutation: MutationPending;
}): RegistrationCta => {
  const {
    user,
    event,
    isRegistered,
    isPast,
    isFull,
    onRegister,
    onCancelRegistration,
    registerMutation,
    cancelMutation
  } = options;

  if (!user) {
    return {
      label: "Sign in to register",
      disabled: true,
      variant: "secondary",
      onPress: undefined
    };
  }
  if (user._id === event.organizerId) {
    return {
      label: "You're hosting this event",
      disabled: true,
      variant: "secondary",
      onPress: undefined
    };
  }
  if (user.role !== "attendee") {
    return {
      label: "Attendee access only",
      disabled: true,
      variant: "secondary",
      onPress: undefined
    };
  }
  if (isPast) {
    return {
      label: "This event has ended",
      disabled: true,
      variant: "secondary",
      onPress: undefined
    };
  }
  if (isRegistered) {
    return {
      label: cancelMutation.isPending ? "Cancelling..." : "Cancel registration",
      disabled: cancelMutation.isPending,
      variant: "secondary",
      onPress: onCancelRegistration
    };
  }
  if (isFull) {
    return {
      label: "Event full",
      disabled: true,
      variant: "secondary",
      onPress: undefined
    };
  }
  if (registerMutation.isPending) {
    return {
      label: "Registering...",
      disabled: true,
      variant: "primary",
      onPress: undefined
    };
  }
  return {
    label: "Register",
    disabled: false,
    variant: "primary",
    onPress: onRegister
  };
};
