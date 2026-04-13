"use client";

import { FormEvent, useMemo, useState } from "react";

type SubmitState = "idle" | "loading" | "success" | "error";
type BillingView = "monthly" | "yearly";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://tradelynk-api-t598w.ondigitalocean.app/api/v1";
const WAITLIST_ENDPOINT =
  process.env.NEXT_PUBLIC_WAITLIST_ENDPOINT || `${API_BASE}/waitlist`;

async function submitWaitlist(email: string) {
  const response = await fetch(WAITLIST_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      source: "go.tradelynk.app",
    }),
  });

  return response;
}

function WaitlistForm({
  buttonText,
  note,
}: {
  buttonText: string;
  note?: string;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [error, setError] = useState("");

  const isBusy = state === "loading";

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    setState("loading");
    setError("");

    try {
      const res = await submitWaitlist(trimmed);

      if (res.ok || res.status === 409) {
        setState("success");
        return;
      }

      throw new Error(`Request failed with ${res.status}`);
    } catch {
      setState("error");
      setError(
        "Something went wrong. Please try again or email hello@tradelynk.app.",
      );
    }
  };

  if (state === "success") {
    return (
      <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-200">
        You are on the list. We will email you with early access and help you
        launch your store in under 5 minutes.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="flex gap-2">
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          className="min-w-0 flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-violet-300"
        />
        <button
          type="submit"
          disabled={isBusy}
          className="shrink-0 whitespace-nowrap rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isBusy ? "Joining..." : buttonText}
        </button>
      </div>

      {note ? <p className="text-xs text-white/65">{note}</p> : null}
      {state === "error" ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
          {error}
        </p>
      ) : null}
    </form>
  );
}

export default function GoLandingPage() {
  const [billing, setBilling] = useState<BillingView>("monthly");

  const yearlyEffective = useMemo(() => Math.round(63000 / 12), []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
          <p className="text-lg font-extrabold tracking-tight">
            Trade<span className="text-violet-300">lynk</span>
          </p>
          <a
            href="#waitlist"
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
          >
            Join Waitlist
          </a>
        </div>
      </nav>

      <section className="mx-auto max-w-3xl px-4 pb-14 pt-14 text-center sm:pt-20">
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-400/35 bg-violet-500/15 px-3 py-1 text-xs font-semibold text-violet-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          🔴 Limited early access — spots filling fast
        </p>
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          Stop Sending Photos One By One.
          <br />
          <span className="text-violet-300">
            Get A Store Link That Sells For You.
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-white/70 sm:text-lg">
          Right now, you're losing sales to sellers who are faster than you.
          Tradelynk gives you yourname.tradelynk.app — your own store where
          customers browse, order, and pay. Set up in 5 minutes. Works while you
          sleep.
        </p>

        <div className="mx-auto mt-7 grid max-w-2xl grid-cols-1 gap-2 text-left sm:grid-cols-2">
          {[
            "Upload unlimited products instantly",
            "Your own link — yourname.tradelynk.app",
            "Customers order without DMing you",
            "Payments sent to your bank in 24h",
            "Your store sells 24/7 while you sleep",
            "Set up in under 5 minutes — free trial",
          ].map((pill) => (
            <div
              key={pill}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#121212] px-3 py-2 text-xs text-white/85"
            >
              <span className="text-emerald-400">✓</span>
              <span>{pill}</span>
            </div>
          ))}
        </div>

        <div
          id="waitlist"
          className="mx-auto mt-10 max-w-xl rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-6"
        >
          <WaitlistForm
            buttonText="Claim My Store →"
            note="7-day free trial · ₦7,500/mo after · No credit card needed"
          />
          <p className="mt-3 text-sm text-white/85">
            ⚡ Sellers on Tradelynk average ₦50,000+ monthly sales
          </p>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/5">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-7 text-center sm:grid-cols-4">
          <div>
            <p className="text-2xl font-extrabold text-violet-300">50+</p>
            <p className="text-xs uppercase tracking-wide text-white/60">
              Sellers already live
            </p>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-violet-300">₦50K+</p>
            <p className="text-xs uppercase tracking-wide text-white/60">
              Average monthly sales
            </p>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-violet-300">1,200+</p>
            <p className="text-xs uppercase tracking-wide text-white/60">
              Orders placed this month
            </p>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-violet-300">4.8★</p>
            <p className="text-xs uppercase tracking-wide text-white/60">
              Seller satisfaction
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
          Sound familiar?
        </p>
        <h2 className="mt-3 text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
          Selling on Instagram and WhatsApp is exhausting
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-white/65">
          You are running a real business, but your store is still stuck in DMs.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-[#1A1A1A] p-5">
            <p className="text-2xl">💬</p>
            <h3 className="mt-3 text-base font-bold">
              You're typing the same answer 100 times a day
            </h3>
            <p className="mt-2 text-sm text-white/65">
              You type the same answers all day instead of growing your
              business.
            </p>
            <p className="mt-3 text-xl font-extrabold text-violet-300">73%</p>
            <p className="text-xs text-white/60">
              of seller time lost to repetitive DMs
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-[#1A1A1A] p-5">
            <p className="text-2xl">⏰</p>
            <h3 className="mt-3 text-base font-bold">
              Slow reply = lost sale. Every single time.
            </h3>
            <p className="mt-2 text-sm text-white/65">
              Buyers message multiple sellers. First response usually wins.
            </p>
            <p className="mt-3 text-xl font-extrabold text-violet-300">60%</p>
            <p className="text-xs text-white/60">
              of sales lost to slow replies
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-[#1A1A1A] p-5">
            <p className="text-2xl">😴</p>
            <h3 className="mt-3 text-base font-bold">
              Your store closes when you sleep. Theirs doesn't.
            </h3>
            <p className="mt-2 text-sm text-white/65">
              Sales opportunities are missed every night while you are offline.
            </p>
            <p className="mt-3 text-xl font-extrabold text-violet-300">₦18K+</p>
            <p className="text-xs text-white/60">
              average monthly sales lost overnight
            </p>
          </article>
        </div>
      </section>

      <section className="bg-[#111111] py-14">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
            Simple pricing
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Monthly or yearly. Your choice.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-white/65">
            7-day free trial first. No credit card required to start.
          </p>

          <div className="mx-auto mt-6 inline-flex rounded-full border border-white/10 bg-[#1A1A1A] p-1">
            <button
              onClick={() => setBilling("monthly")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                billing === "monthly"
                  ? "bg-violet-600 text-white"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                billing === "yearly"
                  ? "bg-violet-600 text-white"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Yearly
            </button>
          </div>

          {billing === "monthly" ? (
            <div className="mx-auto mt-6 max-w-md rounded-2xl border border-white/10 bg-[#1A1A1A] p-6 text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">
                Monthly plan
              </p>
              <p className="mt-2 text-4xl font-extrabold tracking-tight">
                ₦7,500
              </p>
              <p className="text-sm text-white/60">per month, cancel anytime</p>
              <ul className="mt-5 space-y-2 text-sm text-white/80">
                <li>✓ Your own store at yourname.tradelynk.app</li>
                <li>✓ Unlimited products and collections</li>
                <li>✓ Direct payments to your bank</li>
                <li>✓ Order notifications and tracking</li>
                <li>✓ 7-day free trial included</li>
              </ul>
            </div>
          ) : (
            <div className="mx-auto mt-6 max-w-md rounded-2xl border-2 border-violet-500 bg-[#1A1A1A] p-6 text-left">
              <p className="inline-block rounded-full bg-violet-600 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
                Best value
              </p>
              <p className="mt-3 text-4xl font-extrabold tracking-tight">
                ₦63,000
              </p>
              <p className="text-sm text-white/60">
                per year ({`~₦${yearlyEffective.toLocaleString()}`}/month
                effective)
              </p>
              <p className="mt-2 inline-block rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                Save ₦27,000, 2 months free
              </p>
              <ul className="mt-5 space-y-2 text-sm text-white/80">
                <li>✓ Everything in monthly</li>
                <li>✓ Priority setup support</li>
                <li>✓ Price lock for current cycle</li>
                <li>✓ ₦500 off with bank transfer</li>
                <li>✓ 7-day free trial included</li>
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="bg-linear-to-br from-violet-950 via-violet-800 to-violet-600 py-14">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Your store link is waiting. Claim it free.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/80">
            Join the waitlist — we'll set up your store personally and make sure
            your first sale happens within 7 days.
          </p>
          <div className="mx-auto mt-7 max-w-xl rounded-2xl border border-white/25 bg-white/10 p-4">
            <WaitlistForm buttonText="Claim My Store →" />
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-4 py-8 text-center text-sm text-white/65">
        <p>
          © 2026 Tradelynk. Built for Nigerian sellers on Instagram and
          WhatsApp.
        </p>
        <p className="mt-2 text-violet-300">go.tradelynk.app</p>
      </footer>
    </div>
  );
}
