"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Monitor,
  Settings2,
  ShieldCheck,
  X,
} from "lucide-react";
import { educationalProduct } from "@/lib/products";
import { RilaProductTerms } from "@/types/product";
import {
  calculateEducationalOutcome,
  outcomeAccessibleSummary,
} from "@/lib/calculations/education";
import { pct } from "@/lib/formatters";
import { MarketControl } from "@/components/education/MarketControl";
import { BufferVisual } from "@/components/education/BufferVisual";
import { OutcomeComparison } from "@/components/education/OutcomeComparison";
import { AdvisorSettings } from "@/components/education/AdvisorSettings";
import { ScenarioTable } from "@/components/education/ScenarioTable";
import { Disclosures } from "@/components/education/Disclosures";
import { CompareStrategies } from "@/components/compare/CompareStrategies";

export default function HomePage() {
  const [terms, setTerms] = useState<RilaProductTerms>(educationalProduct);
  const [investment, setInvestment] = useState(100000);
  const [market, setMarket] = useState(-0.18);
  const [settings, setSettings] = useState(false);
  const [presentation, setPresentation] = useState(false);
  const visualRef = useRef<HTMLElement>(null);
  const outcome = useMemo(
    () => calculateEducationalOutcome(terms, market, investment),
    [terms, market, investment],
  );
  const [announcement, setAnnouncement] = useState("");
  useEffect(() => {
    const timer = setTimeout(
      () => setAnnouncement(outcomeAccessibleSummary(outcome)),
      350,
    );
    return () => clearTimeout(timer);
  }, [outcome]);
  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPresentation(false);
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, []);
  const chooseScenario = (r: number) => {
    setMarket(r);
    visualRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "start",
    });
  };
  const buffer = terms.protection.kind === "buffer";
  const bufferRate =
    terms.protection.kind === "buffer" ? terms.protection.rate : 0;
  return (
    <main
      className={`education-app ${presentation ? "presentation" : ""}`}
      data-testid="app-root"
    >
      <a className="skip-link" href="#interactive-explanation">
        Skip to interactive explanation
      </a>
      <header className="app-header">
        <a href="#" className="app-brand" aria-label="RILA explainer home">
          <ShieldCheck size={22} strokeWidth={1.6} />
          <span>
            RILA <strong>Explained</strong>
          </span>
        </a>
        <div className="header-actions">
          {!presentation && (
            <button
              aria-expanded={settings}
              aria-controls="advisor-settings"
              onClick={() => setSettings(!settings)}
            >
              <Settings2 size={16} />
              Advisor settings
            </button>
          )}
          <button
            className={presentation ? "active" : ""}
            aria-pressed={presentation}
            onClick={() => setPresentation(!presentation)}
          >
            {presentation ? <X size={16} /> : <Monitor size={16} />}
            {presentation ? "Exit presentation" : "Presentation view"}
          </button>
        </div>
      </header>
      <section className="intro">
        <h1>{buffer ? "How a RILA buffer works" : "How a RILA floor works"}</h1>
        <p className="intro-description">
          {buffer
            ? `At the end of the selected term, a ${pct(bufferRate)} buffer absorbs the first ${pct(bufferRate)} of the index’s loss. You bear losses beyond it.`
            : `At the end of the selected term, this floor limits the index-linked loss to ${pct(Math.abs(terms.protection.kind === "floor" ? terms.protection.rate : 0))}. It works differently from a buffer.`}
        </p>
        <div className="terms-summary">
          <span>
            {buffer
              ? `${pct(bufferRate)} buffer`
              : `${pct(Math.abs(terms.protection.kind === "floor" ? terms.protection.rate : 0))} loss floor`}
          </span>
          <span>
            {terms.upside.kind === "cap"
              ? `${pct(terms.upside.cap)} cap · ${pct(terms.upside.participationRate)} participation`
              : terms.upside.kind === "participation"
                ? `${pct(terms.upside.participationRate)} participation · no cap`
                : `${pct(terms.upside.rate)} trigger credit`}
          </span>
          <span>
            {terms.creditingPeriodMonths / 12}-year term · cumulative return
          </span>
        </div>
      </section>
      {settings && !presentation && (
        <AdvisorSettings
          terms={terms}
          onChange={setTerms}
          investment={investment}
          setInvestment={setInvestment}
        />
      )}
      <section
        id="interactive-explanation"
        className="interactive-section"
        ref={visualRef}
        aria-label="Interactive buffer explanation"
      >
        <MarketControl value={market} onChange={setMarket} />
        <BufferVisual outcome={outcome} terms={terms} />
        <OutcomeComparison outcome={outcome} investment={investment} />
        <div
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {announcement}
        </div>
      </section>
      {!presentation && (
        <>
          <section className="guided-story" aria-label="Try the tradeoff">
            <div>
              <span className="story-number">01</span>
              <h2>Try a loss within the buffer.</h2>
              <p>
                {buffer
                  ? "Watch the absorbed portion grow before any loss reaches you."
                  : "See how a small decline passes through before the floor is reached."}
              </p>
              <button
                onClick={() =>
                  chooseScenario(buffer ? -Math.min(0.05, bufferRate) : -0.05)
                }
              >
                Try −5% <ArrowDown size={16} />
              </button>
            </div>
            <div>
              <span className="story-number">02</span>
              <h2>Then try a rising market.</h2>
              <p>
                {terms.upside.kind === "cap"
                  ? "See the growth you keep and the growth above the cap."
                  : "See what the selected upside rule credits."}
              </p>
              <button onClick={() => chooseScenario(0.25)}>
                Try +25% <ArrowUpRight size={16} />
              </button>
            </div>
          </section>
          <ScenarioTable
            terms={terms}
            investment={investment}
            selected={market}
            onSelect={chooseScenario}
          />
          <section className="tradeoff-section">
            <p className="eyebrow">Understand the exchange</p>
            <h2>
              Some downside absorbed.
              <br />
              <span>Different rules for upside.</span>
            </h2>
            <div className="tradeoff-grid">
              <div>
                <h3>What it protects</h3>
                <p>
                  {buffer
                    ? `The first ${pct(bufferRate)} of an index decline over this defined term.`
                    : "Index losses beyond the selected floor, at the end of the term."}
                </p>
              </div>
              <div>
                <h3>What it doesn’t</h3>
                <p>
                  {buffer
                    ? "Losses beyond the buffer. Your account can still lose money."
                    : "The portion of the index loss above the floor. Your account can still lose money."}{" "}
                  Early withdrawals and fees can change the outcome.
                </p>
              </div>
              <div>
                <h3>What you give up</h3>
                <p>
                  {terms.upside.kind === "cap"
                    ? `Gains above the ${pct(terms.upside.cap)} cap aren’t credited after participation is applied.`
                    : terms.upside.kind === "participation"
                      ? `Your gains follow the ${pct(terms.upside.participationRate)} participation rule. Actual terms determine the tradeoff.`
                      : "Your upside follows a fixed trigger rule rather than the full index gain."}
                </p>
              </div>
            </div>
          </section>
          <details className="advanced-comparison">
            <summary>
              Advisor tools · compare additional strategy structures
            </summary>
            <p className="comparison-note">
              These are independent hypothetical strategy settings. They use the
              same index return and starting investment as the main
              illustration. Index-protection rules shown here are not a promise
              of guaranteed account value.
            </p>
            <CompareStrategies
              startingPremium={investment}
              marketReturn={market}
              setMarketReturn={setMarket}
              roundToDollar
            />
          </details>
        </>
      )}
      <Disclosures />
    </main>
  );
}
