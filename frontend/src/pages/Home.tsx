import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getHealth } from '../services/api'
import { useAuth } from '../context/AuthContext'
import Badge from '../components/common/Badge'
import Card from '../components/common/Card'
import Button from '../components/common/Button'

type ApiStatus = 'checking' | 'up' | 'down'

interface Feature {
  icon: string
  title: string
  description: string
}

const features: Feature[] = [
  {
    icon: '🧠',
    title: 'AI-powered itineraries',
    description:
      'Describe your trip and get a day-by-day plan crafted around your interests, budget and pace — then regenerate any day on a whim.',
  },
  {
    icon: '🗺️',
    title: 'Interactive maps',
    description:
      'Every place lands on a live map with day-colored pins, popups, and cost breakdowns so the whole trip is instantly scannable.',
  },
  {
    icon: '⭐',
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

export default function Home() {
  const { isAuthenticated } = useAuth()
  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking')

  useEffect(() => {
    getHealth()
      .then((health) => setApiStatus(health.status === 'UP' ? 'up' : 'down'))
      .catch(() => setApiStatus('down'))
  }, [])

  const statusDot =
    apiStatus === 'up'
      ? 'bg-emerald-500'
      : apiStatus === 'down'
        ? 'bg-rose-500'
        : 'bg-amber-400 animate-pulse'

  const statusLabel =
    apiStatus === 'up'
      ? 'Backend connected'
      : apiStatus === 'down'
        ? 'Backend offline'
        : 'Checking backend…'

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-slate-50 to-slate-50">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-indigo-200/40 blur-3xl"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <Badge color="indigo" className="px-3 py-1 text-xs uppercase tracking-wide">
            ✨ AI Trip Planner
          </Badge>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
            Plan your perfect trip with{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">
              AI
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
            Tell us where you want to go and what you love to do. The AI Trip
            Planner builds a personalized itinerary, discovers great places, and
            keeps your favorites — all served from a single deployable.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to={isAuthenticated ? '/trips/new' : '/register'}>
              <Button size="lg" className="w-full shadow-raised sm:w-auto">
                🧳 Plan My Trip
              </Button>
            </Link>
            {!isAuthenticated && (
              <Link to="/login">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Sign in
                </Button>
              </Link>
            )}
          </div>

          <div className="mt-12 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-500 shadow-sm">
            <span className={`h-2 w-2 rounded-full ${statusDot}`} aria-hidden="true" />
            {statusLabel}
          </div>
        </div>
      </section>

      {/* Feature overview */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Everything a trip needs
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            From the first idea to the final budget, one app takes you there.
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group p-6 hover:-translate-y-1 hover:shadow-raised"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-2xl transition group-hover:scale-110" aria-hidden="true">
                {feature.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Three steps to takeoff
            </h2>
          </div>
          <ol className="mt-10 grid gap-8 sm:grid-cols-3">
            {steps.map((step) => (
              <li key={step.number} className="relative pl-12 sm:pl-0 sm:text-center">
                <span className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white sm:static sm:mx-auto sm:mb-4">
                  {step.number}
                </span>
                <h3 className="text-base font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  )
}
