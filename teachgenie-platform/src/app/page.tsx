import Link from 'next/link'

export default function Home() {
  return (
    <div className="relative isolate">
      {/* Hero section */}
      <div className="relative px-6 lg:px-8">
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Find Your Perfect Tutor
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Connect with expert tutors for personalized learning experiences. Whether you&#39;re looking to improve your grades, learn a new skill, or prepare for exams, we&#39;ve got you covered.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/tutors"
                className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                Find a Tutor
              </Link>
              <Link href="/auth/register" className="text-sm font-semibold leading-6 text-gray-900">
                Become a Tutor <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Feature section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary-600">Learn Faster</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need to succeed
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Our platform connects you with qualified tutors who can help you achieve your learning goals.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}

const features = [
  {
    name: 'Expert Tutors',
    description: 'Connect with qualified tutors who are experts in their fields.',
  },
  {
    name: 'Flexible Scheduling',
    description: 'Book sessions that fit your schedule, with options for one-on-one or group learning.',
  },
  {
    name: 'Progress Tracking',
    description: 'Monitor your learning progress with detailed feedback and performance metrics.',
  },
] 