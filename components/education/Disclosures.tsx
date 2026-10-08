export function Disclosures() {
  return (
    <footer className="disclosures">
      <p>
        <strong>Educational illustration.</strong> Hypothetical examples, not a
        recommendation, forecast or projection. A RILA can lose money.
        Protection is limited and generally applies at the end of a defined
        crediting period.
      </p>
      <details>
        <summary>Important considerations &amp; assumptions</summary>
        <div className="disclosure-body">
          <p>
            Actual RILA terms vary by insurer and contract, including index
            options, crediting methods, buffers, floors, caps, participation
            rates, fees and surrender provisions. Adjustable settings here do
            not represent an actual carrier offering.
          </p>
          <p>
            All index returns shown are cumulative price returns over the
            selected term and exclude dividends. The index comparison is
            hypothetical; an index itself cannot be purchased. Neither
            comparison includes investment costs, taxes, contract fees,
            withdrawals or optional rider charges.
          </p>
          <p>
            Buffers and floors generally apply over defined crediting periods.
            Interim contract values and early withdrawals can differ from the
            end-of-term results shown and may be affected by adjustments and
            surrender charges. Fees can reduce value even when the illustrated
            credited return is 0%.
          </p>
          <p>
            Caps and participation rates can limit upside; participation rates
            above 100% can increase the modeled upside before any applicable
            cap. Product terms may change at renewal. A crediting period is not
            the same as a surrender period.
          </p>
          <p>
            Contract guarantees depend on the claims-paying ability of the
            issuing insurer. Review the applicable prospectus and contract
            materials with your advisor before investing.
          </p>
          <p>
            Sources:{" "}
            <a
              href="https://www.investor.gov/introduction-investing/investing-basics/glossary/registered-index-linked-annuity-rila"
              target="_blank"
              rel="noreferrer"
            >
              SEC Investor.gov: RILAs
            </a>{" "}
            ·{" "}
            <a
              href="https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/updated-investor-bulletin-indexed-annuities"
              target="_blank"
              rel="noreferrer"
            >
              SEC Investor.gov: indexed annuities
            </a>
          </p>
        </div>
      </details>
    </footer>
  );
}
