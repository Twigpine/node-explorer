import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

/**
 * The last beat of the page.
 *
 * The overview used to stop wherever the activity list ran out, which read as
 * the page being cut off rather than finished. Three routes close it — publish,
 * operate, understand — so a visitor who has read this far is handed the next
 * step instead of a scrollbar that simply ends.
 *
 * Every destination is a route declared in App.tsx; nothing here links to a
 * page that does not exist.
 */
const PATHS = [
  {
    to: '/docs/quickstart',
    step: 'Publish',
    title: 'Push your first repository',
    body: 'Install gl, generate a keypair, and make a signed push. No account, no signup.',
  },
  {
    to: '/docs/node',
    step: 'Operate',
    title: 'Run a node',
    body: 'Register and serve repositories to the rest of the network.',
  },
  {
    to: '/docs/protocol',
    step: 'Understand',
    title: 'Read the protocol',
    body: 'DIDs, signed ref-updates, UCAN delegation, and ref consensus without a blockchain.',
  },
];

export function StartHere() {
  return (
    <section className="border-t border-border pt-4">
      <h2 className="m-0 text-[15px] font-[540] tracking-[-0.01em] text-foreground">Start here</h2>

      {/* Three ruled columns, each a whole link. */}
      <div className="mt-4 grid border-y border-separator md:grid-cols-3">
        {PATHS.map((path, i) => (
          <Link
            key={path.to}
            to={path.to}
            className={cn(
              'group flex flex-col gap-1.5 px-1 py-5 transition-colors hover:bg-surface-secondary md:px-5',
              i > 0 && 'border-t border-separator md:border-l md:border-t-0',
            )}
          >
            <span className="text-[12.5px] text-subtle">{path.step}</span>
            <span className="flex items-center gap-1.5 text-[16px] font-[540] tracking-[-0.01em] text-foreground">
              {path.title}
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </span>
            <span className="max-w-[40ch] text-[13.5px] leading-snug text-muted">{path.body}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
