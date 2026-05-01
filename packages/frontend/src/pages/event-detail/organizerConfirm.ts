export type OrganizerConfirmAction = "cancel" | "discard" | "duplicate" | "draft";

type MutationsPack = Record<OrganizerConfirmAction, { isPending: boolean }>;

export const getOrganizerConfirmCopy = (
  action: OrganizerConfirmAction
): { title: string; message: string; confirmLabel: string; danger: boolean } => {
  switch (action) {
    case "cancel":
      return {
        title: "Cancel event?",
        message: "This will cancel the event and move it to Cancelled.",
        confirmLabel: "Cancel Event",
        danger: true
      };
    case "discard":
      return {
        title: "Discard event?",
        message: "This permanently removes the event and cannot be undone.",
        confirmLabel: "Discard Event",
        danger: true
      };
    case "duplicate":
      return {
        title: "Duplicate event?",
        message: "This will create a copy of this event with the same details.",
        confirmLabel: "Duplicate Event",
        danger: false
      };
    case "draft":
      return {
        title: "Make this event draft?",
        message: "This will move the event from Published to Draft.",
        confirmLabel: "Make it Draft",
        danger: false
      };
  }
};

export const isOrganizerConfirmPending = (
  action: OrganizerConfirmAction,
  mutations: MutationsPack
): boolean => mutations[action].isPending;
