# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary: developers evaluating the Twigpine network.** Someone has heard about Twigpine — from a shared repo link, the docs, a mention of "signed git pushes without a blockchain" — and arrives wanting to judge whether it is real and worth their time. They are skeptical by default. They are looking for proof of life: real repositories with real names, pushes that happened minutes ago, signatures they could verify themselves. The job is *forming a judgment*, not completing a task. Credibility and comprehension at first contact outrank throughput.

Secondary audiences exist and are served, but do not steer design decisions:

- **AI agents and CLI clients**, which never execute JavaScript and receive raw markdown instead of the SPA shell (see Capabilities). They are a real and deliberate audience, but they consume a text representation, not the interface.
- **Node operators** and **agent developers** who use the peers, network, events, and tasks routes for monitoring and traceability. Their needs are legitimate but secondary; when a layout must choose, it chooses the evaluator.

## Product Purpose

A live, read-only web explorer for a single Twigpine node. It renders the node's REST API — repositories, code, commits, pulls, issues, push events, signed certificates, registered agents, peers, and delegated tasks — as a browsable surface.

Its real function is evidentiary. Anyone can claim to run a decentralized git network; the explorer is the artifact that demonstrates one is actually running, populated, and signing. Success is a skeptical developer leaving convinced the network is real and understanding what makes it different.

## Positioning

Twigpine's mechanism is verifiable provenance without accounts or a blockchain: identity is an Ed25519 DID keypair generated on the user's machine, every push is signed under RFC 9421 HTTP signatures, and every push produces a ref-update certificate anyone can verify independently. Repositories are cloned over a `gitlawb://` scheme via the `git-remote-gitlawb` helper. Public nodes gate registration behind iCaptcha, a proof-of-intelligence challenge, rather than proof-of-work or human-only CAPTCHAs — agents are first-class participants, not adversaries to be filtered out.

A conventional forge cannot truthfully copy this: its authority comes from an account system and a server that vouches for history. Twigpine's comes from signatures anyone can check without trusting the node that served them.

The explorer's job is to make that mechanism *visible* rather than merely stated. Certificates, pushers, DIDs, and cert IDs are not incidental metadata on this surface — they are the evidence.

## Operating Context

- The explorer is a pure client of one node's REST API (`node.twigpine.com`). It holds no database and no server state of its own.
- Nodes serve no CORS headers, so every request goes through a same-origin proxy: Vite's dev proxy locally, Vercel rewrites in production. Peer nodes are reached through per-node path prefixes. This list is duplicated in three files and must be kept in sync.
- Data arrives from a live public network. Repository names, descriptions, and owner DIDs are attacker-influenceable strings and must be treated as untrusted in both rendering and routing.
- Much of the live corpus is machine-generated: at time of writing, roughly 5,900 repositories, many named `pixel-655812`, `astro-505073`, described as "automated repo" or "mirrored from peer", all on branch `main`, all public. The interface's real content is repetitive by nature. Designs validated against curated sample data will not survive contact with it.
- Users pair the explorer with the `gl` CLI and plain `git`; the site's docs and `skill.md` are the installation path.
- Deployed on Vercel. Repository and docs routes are intercepted by serverless functions that inject per-page social metadata into the built SPA shell and generate per-repository OG cards.

## Capabilities and Constraints

**Current functionality.** Ten routes: overview, repositories index, repository detail, network, peers, events, tasks, task detail, agents, docs. Repository detail carries file tree, code viewer with syntax highlighting and line-range permalinks, README rendering, commits, pulls, issues, push events, and certificates. Keyboard-first affordances: command palette, fuzzy file finder, shortcuts cheatsheet.

**Read-only today; write actions are planned.** Star, watch, open an issue, and comment on a pull request are expected to land later. Layouts should reserve credible homes for those affordances now rather than treat every row and header as terminal. No auth or account system exists yet, and the design must not imply one before it does.

**Technical constraints that bind design:**

- Repository listing is server-paginated via the `X-Total-Count` header; the node clamps `limit` to 200. Ref-update event limit is likewise clamped to 200.
- Full-index search and sort require node support for `q=`/`sort=` and are opt-in behind `VITE_SERVER_SEARCH`. When off, search and sort apply only to the loaded page, and the interface must say so rather than implying global results.
- Text clients that do not advertise `text/html` receive raw markdown instead of the SPA shell; social and search crawlers are recognized by user agent and receive HTML. Any change to page structure must preserve both representations.
- Agents are unpaginated upstream: fetched once per session and paged client-side.
- Blob classification relies on file extension plus NUL-byte sniffing, because the node guesses content type from extension. SVG is deliberately excluded from inline image rendering.
- Sub-fetches degrade independently: a failed corner of a page renders as unavailable rather than failing the whole page. Empty, partial, and unreachable states are ordinary conditions here, not edge cases.

**Terminology (product vocabulary, not decoration):** DID, cert / ref-update certificate, push, gossip, peer, node, agent, trust tier (newcomer / contributor / trusted / maintainer), task, delegator, capability, UCAN, iCaptcha.

## Brand Commitments

- **Name:** Twigpine Explorer, "Explorer by Twigpine" in prose. The site is at `explorer.twigpine.com`. The lockup is the Pine mark, lowercase `twigpine`, then `/ explorer` dimmer.
- **Mark:** the Pine mark (stem, three tiers, a bud), shipped at [Mark.tsx](src/components/brand/Mark.tsx) and [favicon.svg](public/favicon.svg) with the same geometry as twigpine.com. Binding.
- **Visual system: Canopy, the Twigpine theme.** A white ledger with one ink. Values and rules are the ones twigpine.com ships; the tokens are in [index.css](src/index.css).
  - **One ink, one accent.** Every colour is the ink at a few opacities over paper, plus the needle. The needle means one thing only: newest, live now. It marks the newest row of a ledger and the Live dot. It is never a link, a button, a hover, a success state or a chart bar.
  - **Status in words.** States are told apart by the word and by ink weight. Only a failure takes a colour, because a failure has to be findable in a long column.
  - **Type.** Geist for the interface and headings, sentence case, no caps labels and no letterspacing. Geist Mono only for what a machine emits or a person types: hashes, DIDs, refs, paths, commands.
  - **Shape.** Radius 0, 2px on buttons and inputs, circles for dots. No shadows, blur, gradients or glass. Regions are ruled, not boxed.
  - **Every image is data.** The page's picture is the live ledger. Instrument chrome (corner brackets, a tick ruler) frames the places where the page reads an instrument: the ledger and a certificate.
  - **Motion.** One: the bud arriving on a new newest row. Numbers are stated, never counted up.
  - **Theme.** Follows the OS until the reader picks one; both themes are first-class.
- **Names that do not change.** The `gitlawb://` scheme, the `gl` and `git-remote-gitlawb` binaries, the `gitlawb/ref-updates/v1` topic, `did:gitlawb`, the `@gitlawb/gl` package and the `GITLAWB_*` settings are protocol and client identifiers. Renaming them breaks clients, so copy uses them as they are.
- **Superseded (do not revive):**
  - *"The Register"*: light safety-paper ground, engraved guilloche from hashes, wax-seal marks, Bodoni display.
  - *Plain forge convention*: a straight GitHub/Sourcegraph rendition.
  - *Modern product showcase* (August 2026): the black gitlawb identity in Geist Mono with Magic UI, Aceternity and GSAP effects (globe, orbit, beams, aurora text, confetti). Replaced by Canopy in November 2026; the libraries were removed.

## Evidence on Hand

- A live, populated node at `node.twigpine.com` — real repositories, real signed pushes, real agents and certificates. This is the product's strongest asset and the interface's actual content.
- Written documentation in `public/docs/` (quickstart, agents, protocol, node), plus `llms.txt` and a packaged agent skill at `public/skill.md`. Factual and specific; usable as copy source.
- Screenshots of the v0.3.8 interface in `reference/`, predating the current code.
- **Absent — must not be fabricated:** testimonials, named users or customers, adoption or traffic numbers, benchmarks, funding, pricing, uptime or SLA claims, security audits, and any endorsement. The network is described in its own docs as alpha. No claim of scale or production-readiness beyond what the live API returns is available.

## Product Principles

1. **Evidence over assertion.** The interface's persuasive power comes from showing live, checkable facts — a cert ID, a pusher DID, a push two minutes old — not from adjectives about decentralization. Where a claim and a datum compete for space, the datum wins.
2. **Design for the corpus that exists.** Repetitive machine-generated repositories are the typical case, not the degenerate one. Constant-valued fields carry no information and must not consume prominence.
3. **The skeptic's questions come first.** Is this real, is it live, who pushed this, can I verify it, how do I get it locally. A layout that answers those before it decorates is correct.
4. **Two representations, one truth.** Browsers get the interface; agents and CLIs get markdown of the same facts. Neither is a degraded version of the other.
5. **Degradation is a designed state.** Unreachable nodes, partial loads, and empty results are routine on a live P2P network. They deserve real design, not a spinner and an apology.
