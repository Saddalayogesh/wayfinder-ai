import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getHealth } from '../services/api'

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
    description: 'Describe your trip and get a day-by-day plan crafted around your interests, budget and pace.',
  },
  {
    icon: '📍',
    title: 'Curated places',
    description: 'Explore attractions, restaurants and hidden gems for any destination you have in mind.',
  },
  {
    icon: '⭐',
    title: 'Favorites & personalization',
    description: 'Save the places you love and keep every trip you plan in one place.',
  },
]

export default function Home() {
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
      <section className="bg-gradient-to-b from-indigo-50 to-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
            Plan your perfect trip with{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">
              AI
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
            Tell us where you want to go and what you love to do. The AI Trip Planner
            builds a personalized itinerary, discovers great places, and keeps your
            favorites — all served from a single deployable.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/register"
              className="rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700"
            >
              Start planning
            </Link>
            <Link
              to="/login"
              className="rounded-xl border border-slate-300 bg-white px-8 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Sign in
            </Link>
          </div>

          {/* Live backend connectivity check */}
          <div className="mt-12 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-500 shadow-sm">
            <span className={`h-2 w-2 rounded-full ${statusDot}`} aria-hidden="true" />
            {statusLabel}
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="text-3xl" aria-hidden="true">
                {feature.icon}
              </div>
              <h2 className="mt-4 text-lg font-semibold text-slate-900">{feature.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
