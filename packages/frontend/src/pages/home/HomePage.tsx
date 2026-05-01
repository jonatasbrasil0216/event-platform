import { Link } from "react-router-dom";

export const HomePage = () => (
  <main className="container">
    <section className="hero">
      <p className="eyebrow">Event Platform</p>
      <h1>Discover events worth showing up for.</h1>
      <p className="hero-copy">
        A responsive event experience for attendees and organizers. Start by creating an account.
      </p>
      <div className="hero-actions">
        <Link className="btn btn-primary" to="/signup">
          Create account
        </Link>
        <Link className="btn btn-secondary" to="/login">
          Sign in
        </Link>
      </div>
    </section>
  </main>
);
