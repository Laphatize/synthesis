import WorkspaceClient from "./components/WorkspaceClient";

export default function Home() {
  const flowSteps = [
    {
      title: "Write the idea",
      detail: "Start with a plain-language brief in the editor.",
    },
    {
      title: "AI retrieves",
      detail: "Queries arXiv, PubMed, web archives, and labs.",
    },
    {
      title: "Vector memory",
      detail: "Embeds notes and sources into a private index.",
    },
    {
      title: "Map the evidence",
      detail: "Links claims to sources and highlights gaps.",
    },
    {
      title: "Publish or share",
      detail: "Export a clean brief or share a workspace.",
    },
  ];

  const vectorSignals = [
    {
      title: "Embedding pipeline",
      detail: "Auto-chunks notes, PDFs, and screenshots into vectors.",
      tag: "On upload",
    },
    {
      title: "Semantic search",
      detail: "Instantly find supporting work by meaning, not keywords.",
      tag: "200ms avg",
    },
    {
      title: "Memory layers",
      detail: "Separate personal notes, public papers, and team lore.",
      tag: "Private by default",
    },
  ];

  const sources = [
    "arXiv",
    "PubMed",
    "Semantic Scholar",
    "OpenAlex",
    "GitHub",
    "Datasets",
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="synthesis-grid min-h-screen">
        <div className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-20 pt-10">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--blue-wash)] text-lg font-semibold text-[var(--blue-ink)]">
                S
              </span>
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                  Synthesis
                </p>
                <p className="text-lg font-semibold">Research-backed idea workspace</p>
              </div>
            </div>
            <nav className="hidden items-center gap-6 text-sm font-medium text-[var(--ink-muted)] md:flex">
              <a href="#workspace">Workspace</a>
              <a href="#backend">API</a>
              <a href="#vector">Vector DB</a>
              <a href="#flow">Flow</a>
              <a href="#sources">Sources</a>
            </nav>
            <div className="flex items-center gap-3">
              <button className="hidden rounded-full border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--ink-muted)] md:inline-flex">
                Request access
              </button>
              <button className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-200">
                Start a workspace
              </button>
            </div>
          </header>

          <section className="relative grid gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative z-10 flex flex-col gap-6">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--line)] bg-white/80 px-4 py-2 text-xs font-semibold text-[var(--blue-ink)]">
                <span className="h-2 w-2 rounded-full bg-[var(--accent)]"></span>
                AI research companion for non-traditional ideas
              </div>
              <h1 className="text-4xl font-semibold leading-tight tracking-tight text-[var(--foreground)] sm:text-5xl lg:text-6xl">
                Build the abstract.
                <span className="font-serif text-[var(--accent-strong)]"> Anchor it in evidence.</span>
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-[var(--ink-muted)]">
                Synthesis is a calm, blue-and-white workspace where anyone can write
                an idea, and the AI continuously collects supporting research,
                builds a vector database, and connects the evidence directly into
                your workspace.
              </p>
              <div className="flex flex-wrap gap-4">
                <button className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200">
                  Create an idea workspace
                </button>
                <button className="rounded-full border border-[var(--line)] px-6 py-3 text-sm font-semibold text-[var(--blue-ink)]">
                  Watch 90-sec demo
                </button>
              </div>
              <div className="flex flex-wrap gap-6 text-sm text-[var(--ink-muted)]">
                <div>
                  <p className="text-2xl font-semibold text-[var(--foreground)]">5 mins</p>
                  <p>to seed a research trail</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-[var(--foreground)]">120+</p>
                  <p>sources indexed per idea</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-[var(--foreground)]">3 layers</p>
                  <p>of private vector memory</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="hero-glow absolute inset-0"></div>
              <div className="relative z-10 flex flex-col gap-4 rounded-[var(--radius-xl)] border border-[var(--line)] bg-white p-6 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[var(--ink-muted)]">Active workspace</p>
                    <p className="text-xl font-semibold">Cold Fusion for Everyday Builders</p>
                  </div>
                  <span className="tag rounded-full px-3 py-1 text-xs font-semibold">LIVE</span>
                </div>
                <div className="grid gap-4">
                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Idea brief</p>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--foreground)]">
                      We are exploring a safe, tabletop demonstration of low-energy
                      fusion and mapping which materials or measurement methods are
                      most promising.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--blue-wash)] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--blue-ink)]">
                      AI suggestions
                    </p>
                    <ul className="mt-2 space-y-1 text-sm leading-relaxed text-[var(--foreground)]">
                      <li>Collected 18 recent papers on calorimetry design.</li>
                      <li>Flagged 3 contradicting claims for review.</li>
                      <li>Suggested 2 alternative hypotheses to test.</li>
                    </ul>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-[var(--line)] bg-white p-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                        Vector memory
                      </p>
                      <p className="text-sm text-[var(--foreground)]">1,842 embeddings · 4 collections</p>
                    </div>
                    <button className="rounded-full bg-[var(--accent-strong)] px-3 py-2 text-xs font-semibold text-white">
                      Open index
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="flow" className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">MVP flow</h2>
              <span className="tag rounded-full px-3 py-1 text-xs font-semibold">Always-on AI</span>
            </div>
            <div className="grid gap-4 md:grid-cols-5">
              {flowSteps.map((step, index) => (
                <div
                  key={step.title}
                  className={`fade-up delay-${index + 1} rounded-2xl border border-[var(--line)] bg-white p-4 text-sm shadow-sm`}
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                    {step.title}
                  </p>
                  <p className="mt-2 text-[var(--foreground)]">{step.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="workspace" className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[var(--radius-xl)] border border-[var(--line)] bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--ink-muted)]">Workspace canvas</p>
                  <h3 className="text-2xl font-semibold">Idea builder for non-traditional research</h3>
                </div>
                <button className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white">
                  Add to workspace
                </button>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Notes</p>
                  <p className="mt-2 text-sm text-[var(--foreground)]">
                    Drafts, hypotheses, and quick sketches. AI highlights knowledge gaps.
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Evidence</p>
                  <p className="mt-2 text-sm text-[var(--foreground)]">
                    Papers, datasets, code repos, and citations grouped by claim.
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Decisions</p>
                  <p className="mt-2 text-sm text-[var(--foreground)]">
                    Track experiments, validations, and what to test next.
                  </p>
                </div>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-[1.4fr_0.6fr]">
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--blue-wash)] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--blue-ink)]">
                    Live context
                  </p>
                  <p className="mt-2 text-sm text-[var(--foreground)]">
                    AI is currently searching for: plasma containment, nickel lattice
                    anomalies, and low-cost calorimetry.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="tag rounded-full px-3 py-1 text-xs font-semibold">Pending 12</span>
                    <span className="tag rounded-full px-3 py-1 text-xs font-semibold">Reviewed 7</span>
                    <span className="tag rounded-full px-3 py-1 text-xs font-semibold">Linked 5</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--line)] bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">
                    Add to workspace
                  </p>
                  <p className="mt-2 text-sm text-[var(--foreground)]">
                    Drop a URL, PDF, or audio note. Synthesis will ingest and
                    index it automatically.
                  </p>
                  <button className="mt-4 w-full rounded-full bg-[var(--accent-strong)] px-4 py-2 text-xs font-semibold text-white">
                    Upload material
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="rounded-[var(--radius-xl)] border border-[var(--line)] bg-white p-6 shadow-xl">
                <p className="text-sm text-[var(--ink-muted)]">Workspace status</p>
                <p className="mt-2 text-2xl font-semibold">Evidence map</p>
                <p className="mt-3 text-sm text-[var(--foreground)]">
                  Claims are automatically tied to the research that supports or
                  challenges them. The AI flags weak links and suggests better
                  sources.
                </p>
                <div className="mt-4 flex flex-col gap-3">
                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-3">
                    <p className="text-xs text-[var(--ink-muted)]">Strong support</p>
                    <p className="text-sm">4 peer-reviewed confirmations</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-3">
                    <p className="text-xs text-[var(--ink-muted)]">Mixed evidence</p>
                    <p className="text-sm">2 papers, 1 lab note</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-3">
                    <p className="text-xs text-[var(--ink-muted)]">Open questions</p>
                    <p className="text-sm">3 missing measurements</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--blue-wash)] p-6 shadow-xl">
                <p className="text-sm text-[var(--blue-ink)]">Team feed</p>
                <p className="mt-2 text-xl font-semibold">Add collaborators</p>
                <p className="mt-3 text-sm text-[var(--foreground)]">
                  Invite experts or curious friends. Every contribution becomes a
                  traceable source in your vector memory.
                </p>
                <button className="mt-4 rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-semibold text-[var(--blue-ink)]">
                  Invite a collaborator
                </button>
              </div>
            </div>
          </section>

          <section id="backend" className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Live backend</h2>
              <span className="tag rounded-full px-3 py-1 text-xs font-semibold">Connected</span>
            </div>
            <WorkspaceClient />
          </section>

          <section id="vector" className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="flex flex-col gap-4">
              <div className="rounded-[var(--radius-xl)] border border-[var(--line)] bg-white p-6 shadow-xl">
                <p className="text-sm text-[var(--ink-muted)]">Vector database</p>
                <h3 className="mt-2 text-2xl font-semibold">The memory core for every workspace</h3>
                <p className="mt-3 text-sm text-[var(--foreground)]">
                  Every note, citation, and file becomes a retrievable vector. The
                  system maintains a clean lineage so you can see where each claim
                  was sourced.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="tag rounded-full px-3 py-1 text-xs font-semibold">Embeddings</span>
                  <span className="tag rounded-full px-3 py-1 text-xs font-semibold">Chunking</span>
                  <span className="tag rounded-full px-3 py-1 text-xs font-semibold">Rerankers</span>
                  <span className="tag rounded-full px-3 py-1 text-xs font-semibold">Citations</span>
                </div>
              </div>
              <div className="rounded-[var(--radius-xl)] border border-[var(--line)] bg-white p-6 shadow-xl">
                <p className="text-sm text-[var(--ink-muted)]">Vector insights</p>
                <div className="mt-4 flex flex-col gap-3">
                  {vectorSignals.map((signal) => (
                    <div key={signal.title} className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">{signal.title}</p>
                        <span className="tag rounded-full px-2 py-1 text-[10px] font-semibold">
                          {signal.tag}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-[var(--foreground)]">{signal.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[var(--radius-xl)] border border-[var(--line)] bg-white p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--ink-muted)]">Vector index explorer</p>
                  <p className="text-2xl font-semibold">Semantic retrieval panel</p>
                </div>
                <button className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white">
                  Create collection
                </button>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Query</p>
                  <p className="mt-2 text-sm text-[var(--foreground)]">
                    “low-energy fusion experiment calorimetry”
                  </p>
                  <p className="mt-3 text-xs text-[var(--ink-muted)]">Top matches · 0.12 similarity</p>
                  <ul className="mt-2 space-y-1 text-xs text-[var(--foreground)]">
                    <li>Calorimeter drift prevention · 2024</li>
                    <li>Nickel lattice anomalies · 2023</li>
                    <li>Low-cost thermal imaging · 2022</li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-[var(--line)] bg-[var(--blue-wash)] p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--blue-ink)]">
                    Retrieval actions
                  </p>
                  <p className="mt-2 text-sm text-[var(--foreground)]">
                    Pin relevant paragraphs, attach to claims, and generate
                    citations without leaving the workspace.
                  </p>
                  <button className="mt-4 w-full rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-semibold text-[var(--blue-ink)]">
                    Add citations
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section id="sources" className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Trusted sources</h2>
              <span className="tag rounded-full px-3 py-1 text-xs font-semibold">Always updating</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {sources.map((source) => (
                <span
                  key={source}
                  className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-xs font-semibold text-[var(--ink-muted)]"
                >
                  {source}
                </span>
              ))}
            </div>
          </section>

          <footer className="flex flex-col gap-4 border-t border-[var(--line)] pt-8 text-sm text-[var(--ink-muted)] md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold text-[var(--foreground)]">Synthesis MVP</p>
              <p>White, traditional, and calm. Built for idea builders.</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <button className="rounded-full border border-[var(--line)] px-4 py-2 text-xs font-semibold">
                Join beta
              </button>
              <button className="rounded-full bg-[var(--accent-strong)] px-4 py-2 text-xs font-semibold text-white">
                Start building
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
