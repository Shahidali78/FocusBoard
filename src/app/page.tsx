import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Layers3,
  Sparkles,
  UsersRound,
  Zap,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="landing-page">
      <nav className="landing-nav">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <Layers3 size={20} />
          </span>
          <span>Focusboard</span>
        </Link>
        <div className="landing-nav-actions">
          <Link href="/login" className="button button-ghost">
            Log in
          </Link>
          <Link href="/register" className="button button-primary">
            Start planning
          </Link>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <Sparkles size={15} />
            A calmer way to ship great work
          </div>
          <h1>
            Turn ambitious ideas into{" "}
            <span className="gradient-text">visible progress.</span>
          </h1>
          <p>
            Plan projects, move work forward, and keep your team aligned in one
            thoughtfully designed workspace.
          </p>
          <div className="hero-actions">
            <Link href="/register" className="button button-primary button-large">
              Create your workspace
              <ArrowRight size={18} />
            </Link>
            <Link href="/login" className="button button-secondary button-large">
              Try the demo
            </Link>
          </div>
          <div className="hero-proof">
            <span>
              <CheckCircle2 size={16} /> Free local setup
            </span>
            <span>
              <CheckCircle2 size={16} /> No credit card
            </span>
          </div>
        </div>

        <div className="hero-visual" aria-label="Focusboard product preview">
          <div className="preview-glow" />
          <div className="preview-window">
            <div className="preview-sidebar">
              <div className="preview-logo" />
              <div className="preview-nav active" />
              <div className="preview-nav" />
              <div className="preview-nav short" />
            </div>
            <div className="preview-content">
              <div className="preview-header">
                <div>
                  <span />
                  <strong />
                </div>
                <button />
              </div>
              <div className="preview-board">
                {[
                  ["Backlog", 2],
                  ["In progress", 3],
                  ["In review", 2],
                ].map(([name, count], columnIndex) => (
                  <div className="preview-column" key={String(name)}>
                    <div className="preview-column-title">
                      <span>{name}</span>
                      <small>{count}</small>
                    </div>
                    {Array.from({ length: Number(count) }).map((_, taskIndex) => (
                      <div className="preview-card" key={taskIndex}>
                        <i className={`tone-${columnIndex + 1}`} />
                        <b />
                        <em />
                        <div>
                          <span />
                          <small />
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="feature-strip">
        <article>
          <Zap />
          <div>
            <h3>Move faster</h3>
            <p>Drag work through a clear, flexible delivery flow.</p>
          </div>
        </article>
        <article>
          <UsersRound />
          <div>
            <h3>Stay aligned</h3>
            <p>Ownership, priorities, and context live with every task.</p>
          </div>
        </article>
        <article>
          <Layers3 />
          <div>
            <h3>See the whole plan</h3>
            <p>Switch between projects without losing your place.</p>
          </div>
        </article>
      </section>
    </main>
  );
}
