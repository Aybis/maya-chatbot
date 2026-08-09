import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import {
  ArrowRight, ArrowUpRight, Sparkle, Cpu, Brain, Eye, Waveform,
  Files, ShieldCheck, Building, Users, Key, Command, Globe, Lock,
  ChartLineUp, CheckCircle, Lightning, Cube, Network, Fingerprint, Database,
} from '@phosphor-icons/react'

const navLinks = ['Product', 'Capabilities', 'Providers', 'Security', 'Pricing']

const capabilities = [
  {
    icon: Brain,
    title: 'Agentic Reasoning',
    desc: 'Multi-step planning, tool use, and self-correction that rivals Claude and ChatGPT for complex enterprise workflows.',
  },
  {
    icon: Eye,
    title: 'Vision & Multimodal',
    desc: 'Understand images, diagrams, and documents natively. Graph, chart, and screenshot comprehension built in.',
  },
  {
    icon: Waveform,
    title: 'Audio & Speech',
    desc: 'Streaming voice input and output. Build voice agents and real-time conversational experiences.',
  },
  {
    icon: Files,
    title: 'File & Document Agents',
    desc: 'Ingest PDFs, code, spreadsheets, and more. Extract, summarize, and act on your organization\u2019s knowledge.',
  },
  {
    icon: Command,
    title: 'Tool & MCP Support',
    desc: 'Connect any tool, API, or MCP server. Your assistant can execute real actions, not just answer.',
  },
  {
    icon: ChartLineUp,
    title: 'Usage & Cost Control',
    desc: 'Per-request token tracking, cost breakdowns by provider, and hard budget guardrails for your team.',
  },
]

const providers = [
  { name: 'Surplus Intelligence', note: 'Spot-market cheap inference', tag: 'Cheapest' },
  { name: 'Shiteru', note: 'Primary reasoning models', tag: 'Fast' },
  { name: 'OpenRouter', note: '400+ models, one key', tag: 'Unified' },
  { name: '9Router', note: 'Local multi-provider proxy', tag: 'Free tier' },
]

const enterprise = [
  { icon: ShieldCheck, title: 'SSO & Role-Based Access', desc: 'Owner, admin, and member roles with invitation-based team onboarding.' },
  { icon: Key, title: 'Bring Your Own Key', desc: 'Connect your own provider keys. Full visibility, no lock-in, no markup.' },
  { icon: Building, title: 'Multi-Tenant Workspaces', desc: 'Isolated organizations with per-tenant data, memory, and configuration.' },
  { icon: Fingerprint, title: 'Token & Cost Governance', desc: 'Granular usage metering and alerts. Know exactly what every seat costs.' },
]

const pricing = [
  { name: 'Personal', price: 'Free', desc: 'For individuals exploring agentic AI.', features: ['1 workspace', 'Any provider (BYOK)', 'Core chat + artifacts', 'Usage dashboard'], cta: 'Start free' },
  { name: 'Team', price: '$20', per: '/seat/mo', desc: 'For teams shipping with AI.', features: ['Unlimited workspaces', 'Role-based access', 'Team invitations', 'Usage & cost analytics', 'Priority support'], cta: 'Start trial', featured: true },
  { name: 'Enterprise', price: 'Custom', desc: 'For organizations at scale.', features: ['SSO / SAML', 'Audit logs', 'Dedicated onboarding', 'SLA & support', 'Custom model routing'], cta: 'Contact sales' },
]

function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line/70 bg-canvas/90 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <Logo size={28} />
          <span className="text-[15px] font-semibold tracking-tight">Maya</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <a key={l} href={`#${l.toLowerCase()}`} className="text-sm text-muted transition-colors hover:text-ink">
              {l}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-ink transition-opacity hover:opacity-70">
            Sign in
          </Link>
          <Link
            to="/register"
            className="flex items-center gap-1.5 rounded-[6px] bg-ink px-4 py-2 text-sm font-medium text-canvas transition-transform hover:scale-[0.98] active:scale-[0.97]"
          >
            Get started <ArrowRight size={14} />
          </Link>
        </div>
      </nav>
    </header>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-24 md:pt-40 md:pb-32">
      {/* ambient light */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-accent-soft blur-3xl opacity-70" />

      <div className="relative mx-auto max-w-6xl px-6 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-medium text-muted">
          <span className="flex h-1.5 w-1.5 rounded-full bg-accent" />
          Enterprise-grade agentic AI platform
        </div>

        <h1 className="mx-auto max-w-4xl text-balance text-4xl font-semibold leading-[1.1] tracking-tighter md:text-6xl">
          Your AI workforce.
          <br />
          <span className="text-muted">Claude-class capability.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
          Maya is a multi-tenant AI platform that deploys agentic chatbots on par with
          Claude and ChatGPT — with full visibility, your own providers, and enterprise controls.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/register"
            className="flex w-full items-center justify-center gap-2 rounded-[6px] bg-ink px-6 py-3 text-sm font-medium text-canvas transition-transform hover:scale-[0.98] sm:w-auto"
          >
            Start building free <ArrowRight size={16} />
          </Link>
          <a
            href="#capabilities"
            className="flex w-full items-center justify-center gap-1.5 rounded-[6px] border border-line bg-canvas px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-surface sm:w-auto"
          >
            Explore capabilities
          </a>
        </div>

        <div className="mt-10 flex items-center justify-center gap-6 text-xs text-muted">
          <span className="flex items-center gap-1.5"><CheckCircle size={14} weight="fill" className="text-accent" /> Bring your own key</span>
          <span className="flex items-center gap-1.5"><CheckCircle size={14} weight="fill" className="text-accent" /> 0 vendor lock-in</span>
          <span className="flex items-center gap-1.5"><CheckCircle size={14} weight="fill" className="text-accent" /> SOC-2 ready</span>
        </div>
      </div>
    </section>
  )
}

function ProductPreview() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <div className="overflow-hidden rounded-2xl hairline lift">
        <div className="flex items-center gap-2 border-b border-line bg-surface px-4 py-3">
          <span className="h-3 w-3 rounded-full bg-muted-2/40" />
          <span className="h-3 w-3 rounded-full bg-muted-2/40" />
          <span className="h-3 w-3 rounded-full bg-muted-2/40" />
          <div className="ml-4 flex-1 rounded-md border border-line bg-canvas px-3 py-1.5 text-xs text-muted">
            app.maya.ai/chat
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr]">
          {/* sidebar */}
          <div className="hidden border-r border-line bg-surface p-4 md:block">
            <div className="mb-4 flex items-center gap-2 rounded-md bg-ink px-3 py-2 text-xs font-medium text-canvas">
              <Sparkle size={14} weight="fill" /> New chat
            </div>
            <div className="space-y-1.5">
              {['Q3 roadmap planning', 'Deploy Kubernetes agent', 'API docs generator', 'Data pipeline analysis'].map((c, i) => (
                <div key={c} className={`rounded-md px-3 py-2 text-xs ${i === 0 ? 'bg-accent-soft font-medium text-accent-ink' : 'text-muted'}`}>
                  {c}
                </div>
              ))}
            </div>
          </div>
          {/* chat */}
          <div className="p-6 md:p-8">
            <div className="mx-auto max-w-2xl space-y-6">
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-surface-2 text-[11px] font-semibold">U</span>
                <div className="rounded-xl rounded-tl-sm border border-line bg-surface px-4 py-3 text-sm">
                  Build me an agent that monitors our API for errors, summarizes incidents, and drafts a fix.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-ink text-canvas"><Sparkle size={13} weight="fill" /></span>
                <div className="flex-1 space-y-3">
                  <div className="rounded-xl rounded-tl-sm border border-line px-4 py-3 text-sm leading-relaxed text-ink-2">
                    I'll set up an agentic loop that watches your endpoint. Here's the plan:
                  </div>
                  <div className="space-y-2 rounded-xl border border-line bg-surface p-4">
                    {[
                      ['1', 'Monitors /v1/status every 60s'],
                      ['2', 'Classifies incidents by severity'],
                      ['3', 'Summarizes root cause'],
                      ['4', 'Drafts a fix + opens a PR'],
                    ].map(([n, t]) => (
                      <div key={n} className="flex items-center gap-3 text-xs">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-soft text-[10px] font-semibold text-accent-ink">{n}</span>
                        <span className="text-muted">{t}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <span className="rounded-md border border-line px-2.5 py-1 text-[11px] text-muted">Reasoning</span>
                    <span className="rounded-md border border-line px-2.5 py-1 text-[11px] text-muted">Tool use</span>
                    <span className="rounded-md border border-line px-2.5 py-1 text-[11px] text-muted">Artifacts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Capabilities() {
  return (
    <section id="capabilities" className="border-t border-line bg-surface py-24 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Agentic capability, built in.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted">
            Every model exposes its true capabilities — reasoning, vision, audio, files, and tools — surfaced automatically and routed to the right provider.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="group rounded-xl hairline bg-canvas p-6 transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] bg-surface-2 text-ink transition-colors group-hover:bg-accent-soft group-hover:text-accent-ink">
                <Icon size={20} weight="bold" />
              </div>
              <h3 className="mb-1.5 text-[15px] font-semibold">{title}</h3>
              <p className="text-sm leading-relaxed text-muted">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Providers() {
  return (
    <section id="providers" className="py-24 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 grid grid-cols-1 gap-8 md:grid-cols-2 md:items-end">
          <h2 className="max-w-md text-3xl font-semibold tracking-tight md:text-4xl">
            Your providers. Your prices. Your control.
          </h2>
          <p className="text-base leading-relaxed text-muted">
            Connect any OpenAI-compatible provider. Maya auto-discovers models and their capabilities, so you always use the cheapest model that does the job.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {providers.map(({ name, note, tag }) => (
            <div key={name} className="rounded-xl hairline bg-surface p-6">
              <div className="mb-3 flex items-center justify-between">
                <Database size={18} className="text-muted" />
                <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent-ink">{tag}</span>
              </div>
              <div className="text-sm font-semibold">{name}</div>
              <div className="mt-1 text-xs text-muted">{note}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl hairline bg-surface p-6 text-sm text-muted">
          <span className="flex items-center gap-2"><Globe size={16} /> 400+ models via OpenRouter</span>
          <span className="flex items-center gap-2"><Cpu size={16} /> Spot-market pricing</span>
          <span className="flex items-center gap-2"><Cube size={16} /> Capability-aware routing</span>
        </div>
      </div>
    </section>
  )
}

function Enterprise() {
  return (
    <section id="security" className="border-t border-line bg-ink py-24 text-canvas md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Built for enterprises.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted">
            Multi-tenant from day one. Isolated workspaces, granular controls, and full governance.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-line sm:grid-cols-2 lg:grid-cols-4">
          {enterprise.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-ink p-8">
              <Icon size={22} className="mb-4 text-canvas" weight="duotone" />
              <h3 className="mb-2 text-[15px] font-semibold">{title}</h3>
              <p className="text-sm leading-relaxed text-muted">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-6 text-xs text-muted">
          <span className="flex items-center gap-2"><Lock size={14} /> End-to-end encrypted</span>
          <span className="flex items-center gap-2"><ShieldCheck size={14} /> SOC 2 Type II</span>
          <span className="flex items-center gap-2"><Network size={14} /> Self-host ready</span>
        </div>
      </div>
    </section>
  )
}

function Pricing() {
  return (
    <section id="pricing" className="bg-surface py-24 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Pricing that scales with you.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted">
            Bring your own keys and pay only for seats. No per-token markup, ever.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {pricing.map((p) => (
            <div
              key={p.name}
              className={`relative flex flex-col rounded-xl p-7 ${
                p.featured ? 'hairline bg-ink text-canvas lift' : 'hairline bg-canvas'
              }`}
            >
              {p.featured && (
                <span className="absolute -top-3 left-7 rounded-full bg-accent px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-canvas">
                  Popular
                </span>
              )}
              <h3 className={`text-sm font-semibold ${p.featured ? 'text-canvas' : 'text-ink'}`}>{p.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight">{p.price}</span>
                {p.per && <span className={`text-sm ${p.featured ? 'text-muted' : 'text-muted'}`}>{p.per}</span>}
              </div>
              <p className={`mt-2 text-sm ${p.featured ? 'text-muted' : 'text-muted'}`}>{p.desc}</p>
              <ul className="mt-6 flex-1 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className={`flex items-start gap-2 text-sm ${p.featured ? 'text-canvas/90' : 'text-ink-2'}`}>
                    <CheckCircle size={15} weight="fill" className={`mt-0.5 flex-shrink-0 ${p.featured ? 'text-accent' : 'text-accent'}`} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className={`mt-8 flex items-center justify-center gap-1.5 rounded-[6px] px-5 py-2.5 text-sm font-medium transition-transform hover:scale-[0.98] ${
                  p.featured
                    ? 'bg-canvas text-ink'
                    : 'border border-line bg-canvas text-ink hover:bg-surface'
                }`}
              >
                {p.cta} <ArrowUpRight size={15} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTA() {
  return (
    <section className="py-24 md:py-28">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <div className="mb-5 flex items-center justify-center gap-2 text-sm font-medium text-accent-ink">
          <Lightning size={16} weight="fill" /> Deploy in minutes
        </div>
        <h2 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
          Ship your AI workforce today.
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted">
          Join teams building Claude-class agents with full control over cost, providers, and data.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/register"
            className="flex w-full items-center justify-center gap-2 rounded-[6px] bg-ink px-6 py-3 text-sm font-medium text-canvas transition-transform hover:scale-[0.98] sm:w-auto"
          >
            Get started free <ArrowRight size={16} />
          </Link>
          <a
            href="#capabilities"
            className="flex w-full items-center justify-center rounded-[6px] border border-line px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-surface sm:w-auto"
          >
            Talk to sales
          </a>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  const cols = [
    { h: 'Product', links: ['Chat', 'Artifacts', 'Projects', 'Memory', 'Skills'] },
    { h: 'Platform', links: ['Providers', 'API keys', 'Analytics', 'Security', 'Pricing'] },
    { h: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
  ]
  return (
    <footer className="border-t border-line bg-surface py-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2">
            <div className="flex items-center gap-2">
              <Logo size={28} />
              <span className="text-[15px] font-semibold tracking-tight">Maya</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              The multi-tenant agentic AI platform for teams that want Claude-class capability with full control.
            </p>
          </div>
          {cols.map(({ h, links }) => (
            <div key={h}>
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">{h}</div>
              <ul className="space-y-2">
                {links.map((l) => (
                  <li key={l}><a href="#" className="text-sm text-muted transition-colors hover:text-ink">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} Maya. All rights reserved.</span>
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5"><Building size={13} /> B2B SaaS</span>
            <span className="flex items-center gap-1.5"><Users size={13} /> Multi-tenant</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function Landing() {
  return (
    <div className="min-h-[100dvh] bg-canvas text-ink">
      <Nav />
      <main>
        <Hero />
        <ProductPreview />
        <Capabilities />
        <Providers />
        <Enterprise />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </div>
  )
}