interface RepoHeroProps {
  totalCount: number;
  page: number;
  perPage: number;
  windowStart: number;
  windowEnd: number;
  title?: string;
  /** Unused; kept so existing call sites compile. */
  accent?: string;
  description?: React.ReactNode;
  countNoun?: string;
  cells?: { label: string; value: string }[];
  seed?: string;
}

/**
 * Listing page header: a title, one sentence of scope, and the counts that
 * describe the list underneath. Plain, because a listing page's job is to get
 * out of the way of the list.
 */
export function RepoHero({
  totalCount,
  title = 'Repositories',
  description,
  countNoun = 'repositories',
  cells,
}: RepoHeroProps) {
  return (
    <header className="pt-10 pb-6 sm:pt-12">
      <h1 className="m-0 text-[30px] sm:text-[36px] font-[540] leading-[1.1] tracking-[-0.03em] text-foreground">
        {title}
      </h1>

      {description ? (
        <div className="mt-3 max-w-[72ch] text-[15px] leading-[1.6] text-muted">{description}</div>
      ) : (
        <p className="m-0 mt-3 max-w-[72ch] text-[15px] leading-[1.6] text-muted">
          <span className="font-medium tabular text-foreground">{totalCount.toLocaleString()}</span>{' '}
          {countNoun} on this node, each clonable over{' '}
          <code className="font-mono text-[14px] text-foreground">gitlawb://</code> and certified
          per ref.
        </p>
      )}

      {cells && cells.length > 0 && (
        <dl className="m-0 mt-5 flex flex-wrap items-baseline gap-x-8 gap-y-2">
          {cells.map(c => (
            <div key={c.label} className="flex items-baseline gap-1.5">
              <dd className="m-0 text-[15px] font-[540] tabular text-foreground">{c.value}</dd>
              <dt className="text-[13px] text-subtle">{c.label}</dt>
            </div>
          ))}
        </dl>
      )}
    </header>
  );
}
