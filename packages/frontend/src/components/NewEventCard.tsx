import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

export const NewEventCard = () => {
  return (
    <Link className="my-events-add-card only-desktop" to="/events/new">
      <span className="my-events-add-icon">
        <Plus size={24} strokeWidth={2.1} />
      </span>
      <h3>Create new event</h3>
      <p>Add another event to your roster</p>
    </Link>
  );
};
