import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getHealth } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useReveal } from '../hooks/useReveal'
import Badge from '../components/common/Badge'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import TripCover from '../components/common/TripCover'
import ResponsiveImg from '../components/common/ResponsiveImg'
import { ArrowRight, BrainCircuit, Map, Quote, Star, Sun } from 'lucide-react'

type ApiStatus = 'checking' | 'up' | 'down'

interface Feature {
  icon: typeof BrainCircuit
  title: string
  description: string
}

const features: Feature[] = [
  {
    icon: BrainCircuit,
    title: 'AI-crafted itineraries',
    description:
      'Describe your trip and get a day-by-day plan built around your interests, budget and pace — then regenerate any day on a whim.',
  },
  {
    icon: Map,
    title: 'Interactive maps',
    description:
      'Every place lands on a live map with day-colored pins, popups, and cost breakdowns so the whole trip is instantly scannable.',
  },
  {
    icon: Star,
    title: 'Favorites & budget',
    description:
      'Save the places you love, keep every trip you plan in one place, and watch your estimated spend against your budget in real time.',
  },
]

const steps = [
  { number: '01', title: 'Tell us where & when', text: 'Destination, dates, travelers, budget and travel style.' },
  { number: '02', title: 'Let AI draft it', text: 'Gemini builds a day-by-day itinerary matched to your interests.' },
  { number: '03', title: 'Tune it your way', text: 'Regenerate days, save favorites, and track the budget as you go.' },
]

const stats = [
  { value: '2,000+', label: 'Trips planned' },
  { value: '60+', label: 'Countries covered' },
  { value: '4.9★', label: 'Traveler rating' },
]

/** Destination inspiration — photos pulled from the static travel pool. */
const inspirations = [
  { name: 'Kyoto', tag: 'Tranquil' },
  { name: 'Santorini', tag: 'Iconic' },
  { name: 'Patagonia', tag: 'Adventure' },
  { name: 'Maldives', tag: 'Island escape' },
  { name: 'Amsterdam', tag: 'Canals' },
  { name: 'Iceland', tag: 'Aurora' },
  { name: 'Marrakech', tag: 'Exotic' },
  { name: 'Banff', tag: 'Wild' },
]

const testimonials = [
  {
    quote:
      'We handed Wayfinder a vague “somewhere warm in March” and got a twelve-day itinerary that felt like a private concierge had read our minds.',
    name: 'Aarav Mehta',
    role: '14 days across Japan',
  },
  {
    quote:
      'The maps, the budget tracker, the day-by-day regeneration — it replaced three spreadsheets and a travel agent. Quietly luxurious and effortless.',
    name: 'Sofia Lindqvist',
    role: 'Santorini & Athens honeymoon',
  },
]

export default function Home() {
  const { isAuthenticated } = useAuth()
  useReveal()
  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking')

  useEffect(() => {
    getHealth()
      .then((health) => setApiStatus(health.status === 'UP' ? 'up' : 'down'))
      .catch(() => setApiStatus('down'))
  }, [])

  const statusDot =
    apiStatus === 'up'
      ? 'bg-success'
      : apiStatus === 'down'
        ? 'bg-error'
        : 'bg-amber-400 animate-pulse'

  const statusLabel =
    apiStatus === 'up'
      ? 'Backend connected'
      : apiStatus === 'down'
        ? 'Backend offline'
        : 'Checking backend…'

  return (
    <main>
      {/* ---- Hero: split layout — text on the solid theme background (always
          readable), golden-hour photo framed beside it. ---- */}
      <section className="relative flex min-h-[88vh] items-center overflow-hidden">
        {/* Warm ambient base + soft golden-hour glows. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-blush/70 via-background to-background dark:from-blush/25 dark:via-background dark:to-background"
        />
        <div
          aria-hidden="true"
          className="orb left-[4%] top-[18%] h-72 w-72 bg-peach/40 dark:bg-peach/15"
          style={{ animationDelay: '-4s' }}
        />
        <div
          aria-hidden="true"
          className="orb bottom-[8%] right-[6%] h-80 w-80 bg-accent/25 dark:bg-accent/15"
          style={{ animationDelay: '-10s' }}
        />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
            {/* ---- Copy column — solid background behind all text. ---- */}
            <div className="text-center lg:text-left">
              <Badge
                color="primary"
                className="animate-fade-in-up border-border bg-surface/80 px-3.5 py-1 text-xs uppercase tracking-[0.2em] backdrop-blur"
              >
                Quiet luxury, planned by AI
              </Badge>
              <h1 className="mt-7 animate-fade-in-up text-balance font-display text-5xl font-normal leading-[1.05] tracking-tight text-text [animation-delay:80ms] sm:text-6xl lg:text-7xl">
                Plan the trip you'll
                <span className="text-gradient-gold">
                  {' '}
                  never forget
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-xl animate-fade-in-up text-lg leading-relaxed text-muted [animation-delay:160ms] sm:text-xl lg:mx-0">
                Tell us where you want to go and what you love to do. Wayfinder AI
                designs a personalized itinerary, discovers great places,
                and keeps your favorites — all in one place.
              </p>
              <div className="mt-10 flex animate-fade-in-up flex-col items-center justify-center gap-3 [animation-delay:240ms] sm:flex-row lg:justify-start">
                <Link to={isAuthenticated ? '/trips/new' : '/register'} className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto">
                    Plan my trip
                    <ArrowRight size={18} aria-hidden="true" />
                  </Button>
                </Link>
                {!isAuthenticated && (
                  <Link to="/login" className="w-full sm:w-auto">
                    <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                      Sign in
                    </Button>
                  </Link>
                )}
              </div>

              <div className="mt-12 inline-flex animate-fade-in-up items-center gap-2.5 rounded-full border border-border bg-surface/70 px-4 py-2 text-xs font-medium text-muted backdrop-blur [animation-delay:320ms] lg:inline-flex">
                <span className={`h-2 w-2 rounded-full ${statusDot}`} aria-hidden="true" />
                {statusLabel}
              </div>

              {/* Luxury stats strip */}
              <dl className="mx-auto mt-12 grid max-w-xl animate-fade-in-up grid-cols-3 gap-6 border-t border-border/70 pt-8 [animation-delay:400ms] lg:mx-0">
                {stats.map((stat) => (
                  <div key={stat.label} className="flex flex-col">
                    {/* dt first in DOM (valid dl semantics); order-* keeps the
                        value visually on top. */}
                    <dt className="order-2 mt-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
                      {stat.label}
                    </dt>
                    <dd className="order-1 font-display text-2xl font-normal tracking-tight text-text sm:text-3xl">
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* ---- Framed golden-hour photo column ---- */}
            <div className="relative animate-fade-in-up [animation-delay:280ms]">
              <div className="media-frame overflow-hidden rounded-3xl border border-border/80 bg-surface shadow-luxe">
                <ResponsiveImg
                  src="/images/hero.jpg"
                  sizes="(min-width: 1024px) 44vw, 100vw"
                  loading="eager"
                  fetchPriority="high"
                  className="aspect-[4/3] w-full"
                />
              </div>
              {/* Floating glass chip over the photo */}
              <div className="absolute -left-3 top-6 flex items-center gap-2 rounded-full border border-border bg-surface/90 px-4 py-2 text-xs font-semibold text-text shadow-lg shadow-black/10 backdrop-blur-md sm:-left-6">
                <Sun size={14} aria-hidden="true" className="text-peach" />
                Golden hour · Coastal escape
              </div>
              {/* Floating mini-stat card */}
              <div className="absolute -bottom-6 right-4 rounded-2xl border border-border bg-surface/95 px-5 py-3.5 shadow-xl shadow-black/15 backdrop-blur-md sm:right-8">
                <p className="font-display text-xl font-normal leading-none tracking-tight text-text">
                  4.9<span className="text-gold">★</span>
                </p>
                <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                  Rated by travelers
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Destination inspiration ---- */}
      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
        <div className="reveal flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.25em] text-accent">
              <span aria-hidden="true" className="h-px w-8 bg-gradient-to-r from-transparent to-accent" />
              Wander often
            </p>
            <h2 className="mt-3 font-display text-3xl font-normal tracking-tight text-text sm:text-4xl">
              Where to next?
            </h2>
          </div>
          <p className="text-sm text-muted">
            Tap a card to start planning
          </p>
        </div>

        {/* Horizontally scrollable row of destination cards. */}
        <div className="mt-8 -mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="flex snap-x snap-mandatory gap-4">
            {inspirations.map((insp, index) => (
              <Link
                key={insp.name}
                to="/trips/new"
                className="reveal group media-frame relative w-60 shrink-0 snap-start overflow-hidden rounded-2xl border border-border/80 bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-luxe focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 sm:w-64"
                style={{ transitionDelay: `${Math.min(index * 60, 420)}ms` }}
              >
                <TripCover
                  label={insp.name}
                  scrim={false}
                  sizes="(min-width: 640px) 16rem, 15rem"
                  imgClassName="transition-transform duration-500 group-hover:scale-105"
                  className="h-44 w-full"
                />
                {/* Legibility scrim — full card height, opaque at the bottom
                    so the destination name is readable on any photo in both
                    themes (the old inset-x-0/bottom-0 div had zero height). */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"
                />
                <Badge
                  color="primary"
                  className="absolute left-3 top-3 border-border/80 bg-blush/90 backdrop-blur-md"
                >
                  {insp.tag}
                </Badge>
                <p className="absolute inset-x-0 bottom-0 p-4 font-display text-xl font-normal tracking-tight text-text">
                  {insp.name}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Feature overview ---- */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
            Everything a trip needs
          </p>
          <h2 className="mt-4 font-display text-4xl font-normal tracking-tight sm:text-5xl">
            From first idea to final budget
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted">
            One app takes you from a passing thought to a fully planned adventure.
          </p>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              className="reveal group p-8 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/15"
              style={{ transitionDelay: `${index * 110}ms` }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/15 text-gold transition-all duration-300 group-hover:scale-110 group-hover:bg-gold/25">
                <feature.icon size={22} aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-text">{feature.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ---- Testimonials ---- */}
      <section className="relative">
        <div className="divider" />
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="reveal mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
              Kind words
            </p>
            <h2 className="mt-4 font-display text-4xl font-normal tracking-tight sm:text-5xl">
              Loved by planners
            </h2>
          </div>
          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            {testimonials.map((item, index) => (
              <Card
                key={item.name}
                className="reveal relative p-8 sm:p-10"
                style={{ transitionDelay: `${index * 120}ms` }}
              >
                <Quote
                  size={30}
                  aria-hidden="true"
                  className="text-gold/60"
                />
                <blockquote className="mt-5 font-display text-xl font-normal leading-relaxed tracking-tight text-text">
                  “{item.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary"
                  >
                    {item.name.charAt(0)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-text">{item.name}</p>
                    <p className="text-xs text-muted">{item.role}</p>
                  </div>
                </figcaption>
              </Card>
            ))}
          </div>
        </div>
        <div className="divider" />
      </section>

      {/* ---- How it works ---- */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="reveal mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
              How it works
            </p>
            <h2 className="mt-4 font-display text-4xl font-normal tracking-tight sm:text-5xl">
              Three steps to takeoff
            </h2>
          </div>
          <ol className="mt-16 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {steps.map((step, index) => (
              <li key={step.number} className="reveal relative pl-14 sm:pl-0 sm:text-center" style={{ transitionDelay: `${index * 110}ms` }}>
                <span className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full border border-accent/30 bg-accent/10 font-display text-sm font-semibold text-accent sm:static sm:mx-auto sm:mb-5">
                  {step.number}
                </span>
                <h3 className="text-lg font-semibold text-text">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
                {index < steps.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute right-0 top-5 hidden text-muted/40 sm:block"
                  >
                    <ArrowRight size={18} />
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
        <div className="divider" />
      </section>
    </main>
  )
}
