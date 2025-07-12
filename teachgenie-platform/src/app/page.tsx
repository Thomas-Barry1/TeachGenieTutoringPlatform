import Link from 'next/link'
import { 
  AcademicCapIcon, 
  ClockIcon, 
  ChartBarIcon, 
  UserGroupIcon,
  StarIcon,
  BookOpenIcon,
  VideoCameraIcon,
  ChatBubbleLeftRightIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

export default function Home() {
  return (
    <div className="relative isolate overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-50 via-white to-secondary-50" />
      
      {/* Hero section */}
      <div className="relative px-6 lg:px-8">
        <div className="mx-auto max-w-4xl py-16 sm:py-24 lg:py-32">
          <div className="text-center">
            <div className="mb-8">
              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-primary-100 to-secondary-100 px-4 py-2 text-sm font-medium text-primary-800 ring-1 ring-inset ring-primary-200/20">
                <StarIcon className="w-4 h-4 mr-2" />
                Connect with expert tutors and students
              </span>
            </div>
            
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-7xl lg:text-8xl">
              <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                Learn & Teach
              </span>
              <br />
              <span className="text-gray-900">with Confidence</span>
            </h1>
            
            <p className="mt-8 text-xl leading-8 text-gray-600 max-w-3xl mx-auto">
              Connect with expert tutors for personalized learning experiences, or share your knowledge and earn while helping others succeed.
            </p>
            
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link
                href="/tutors"
                className="group relative px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
              >
                Find Your Perfect Tutor
                <span className="ml-2 group-hover:translate-x-1 transition-transform duration-200">→</span>
              </Link>
              <Link 
                href="/auth/register" 
                className="group px-8 py-4 text-lg font-semibold text-primary-700 bg-white rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 border-2 border-primary-200 hover:border-primary-300"
              >
                Become a Tutor
                <span className="ml-2 group-hover:translate-x-1 transition-transform duration-200">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* How it works section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              How TeachGenie Works
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Get started in minutes with our simple, effective platform
            </p>
          </div>
          
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {howItWorks.map((step, index) => (
                <div key={step.title} className="relative group">
                  <div className="absolute -inset-4 bg-gradient-to-r from-primary-100 to-secondary-100 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full mb-6">
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-2">{index + 1}</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features section */}
      <div className="py-24 sm:py-32 bg-gradient-to-br from-gray-50 to-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-primary-600">Why Choose TeachGenie</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to succeed
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Our platform provides the tools and support you need to achieve your learning and teaching goals.
            </p>
          </div>
          
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.name} className="group relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-2">
                    <div className="flex items-center gap-x-4 mb-6">
                      <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg">
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">{feature.name}</h3>
                    </div>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Popular subjects section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Popular Subjects
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Find tutors for your favorite subjects or explore new areas of learning
            </p>
          </div>
          
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
              {subjects.map((subject) => (
                <div key={subject.name} className="group relative">
                  <div className="absolute -inset-2 bg-gradient-to-r from-primary-100 to-secondary-100 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1">
                    <div className="text-center">
                      <div className="mx-auto flex items-center justify-center w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg mb-4">
                        <BookOpenIcon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{subject.name}</h3>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials section */}
      <div className="py-24 sm:py-32 bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              What Our Users Say
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Real stories from students and tutors who found success on our platform
            </p>
          </div>
          
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {testimonials.map((testimonial) => (
                <div key={testimonial.name} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center mb-6">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon key={i} className="w-5 h-5 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 mb-6 italic">&quot;{testimonial.content}&quot;</p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">{testimonial.name.charAt(0)}</span>
                    </div>
                    <div className="ml-4">
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Ready to Get Started?
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Join our growing community of students and tutors who are already learning and teaching on TeachGenie
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link
                href="/auth/register"
                className="group px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
              >
                Start Learning Today
                <span className="ml-2 group-hover:translate-x-1 transition-transform duration-200">→</span>
              </Link>
              <Link 
                href="/auth/register" 
                className="group px-8 py-4 text-lg font-semibold text-primary-700 bg-white rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 border-2 border-primary-200 hover:border-primary-300"
              >
                Start Teaching Today
                <span className="ml-2 group-hover:translate-x-1 transition-transform duration-200">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const howItWorks = [
  {
    title: 'Find Your Match',
    description: 'Browse our network of qualified tutors and find the perfect match for your learning goals.',
    icon: UserGroupIcon,
  },
  {
    title: 'Book Your Session',
    description: 'Schedule sessions that fit your schedule with flexible timing and duration options.',
    icon: ClockIcon,
  },
  {
    title: 'Learn & Grow',
    description: 'Connect with your tutor, track your progress, and achieve your learning objectives.',
    icon: ChartBarIcon,
  },
]

const features = [
  {
    name: 'Expert Tutors',
    description: 'Connect with qualified tutors who are experts in their fields and passionate about teaching.',
    icon: AcademicCapIcon,
  },
  {
    name: 'Flexible Scheduling',
    description: 'Book sessions that fit your schedule, with options for one-on-one or group learning.',
    icon: ClockIcon,
  },
  {
    name: 'Progress Tracking',
    description: 'Monitor your learning progress with detailed feedback and performance metrics.',
    icon: ChartBarIcon,
  },
  {
    name: 'Secure Payments',
    description: 'Safe and secure payment processing with transparent pricing and no hidden fees.',
    icon: ShieldCheckIcon,
  },
  {
    name: 'Video Sessions',
    description: 'High-quality video calls with screen sharing and interactive whiteboard features.',
    icon: VideoCameraIcon,
  },
  {
    name: '24/7 Support',
    description: 'Get help whenever you need it with our responsive customer support team.',
    icon: ChatBubbleLeftRightIcon,
  },
]

const subjects = [
  { name: 'Mathematics' },
  { name: 'Science' },
  { name: 'English' },
  { name: 'History' },
  { name: 'Computer Science' },
  { name: 'Languages' },
  { name: 'Music' },
  { name: 'Art' },
]

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Student',
    content: 'My tutor helped me improve my essay writing skills so much! I went from struggling with structure to getting A\'s on my papers. The feedback was always detailed and constructive.',
  },
  {
    name: 'Michael Chen',
    role: 'Tutor',
    content: 'I love teaching on TeachGenie! The platform is easy to use and I can help students from anywhere in the world.',
  },
  {
    name: 'Emily Rodriguez',
    role: 'Student',
    content: 'The flexibility of scheduling sessions around my busy schedule has been incredible. Highly recommend!',
  },
] 