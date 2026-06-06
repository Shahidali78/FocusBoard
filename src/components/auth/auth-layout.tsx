import Link from "next/link";
import { Layers3, ShieldCheck, Sparkles } from "lucide-react";

type AuthLayoutProps = {
  mode: "login" | "register";
  children: React.ReactNode;
};

export function AuthLayout({ mode, children }: AuthLayoutProps) {
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <Link href="/" className="brand auth-brand">
          <span className="brand-mark">
            <Layers3 size={20} />
          </span>
          <span>Focusboard</span>
        </Link>

        <div className="auth-heading">
          <span className="auth-kicker">
            <Sparkles size={14} />
            {mode === "login" ? "Welcome back" : "Start with clarity"}
          </span>
          <h1>{mode === "login" ? "Pick up where you left off." : "Build momentum from day one."}</h1>
          <p>
            {mode === "login"
              ? "Sign in to organize your projects and move the next important task forward."
              : "Create your workspace, invite your team, and turn plans into visible progress."}
          </p>
        </div>

        {children}

        {mode === "login" && (
          <div className="demo-credentials">
            <ShieldCheck size={18} />
            <div>
              <strong>Demo account</strong>
              <span>demo@focusboard.dev / Demo1234!</span>
            </div>
          </div>
        )}
      </section>

      <aside className="auth-art">
        <div className="auth-orbit orbit-one" />
        <div className="auth-orbit orbit-two" />
        <div className="auth-quote">
          <div className="quote-mark">“</div>
          <blockquote>
            Great work becomes easier when everyone can see what matters now
            and what comes next.
          </blockquote>
          <div className="quote-author">
            <span className="quote-avatar">MC</span>
            <div>
              <strong>Maya Chen</strong>
              <small>Design lead, Northstar Studio</small>
            </div>
          </div>
        </div>
        <div className="floating-task task-one">
          <span />
          <div>
            <strong>Homepage visual direction</strong>
            <small>In progress</small>
          </div>
        </div>
        <div className="floating-task task-two">
          <span />
          <div>
            <strong>Customer story modules</strong>
            <small>Ready for review</small>
          </div>
        </div>
      </aside>
    </main>
  );
}
