import Link from 'next/link'
import Image from 'next/image'
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
  ShieldCheckIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  PlayIcon,
  HeartIcon,
  SparklesIcon,
  RocketLaunchIcon,
  LightBulbIcon,
  GlobeAltIcon,
  TrophyIcon
} from '@heroicons/react/24/outline'

export default function Home() {
  return (
    <div className="relative min-h-screen">
      {/* Hero Section with New Color Scheme */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-teal-50">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-[#05aaae]/30 to-[#0bb8bc]/20 rounded-full mix-blend-multiply filter blur-xl opacity-80 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-[#e38614]/25 to-[#f39c1f]/15 rounded-full mix-blend-multiply filter blur-xl opacity-80 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-gradient-to-br from-[#05aaae]/20 to-[#214966]/10 rounded-full mix-blend-multiply filter blur-xl opacity-80 animate-blob animation-delay-4000"></div>
          <div className="absolute top-20 right-20 w-60 h-60 bg-gradient-to-br from-[#e38614]/20 to-[#f39c1f]/10 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-1000"></div>
          <div className="absolute bottom-20 left-20 w-60 h-60 bg-gradient-to-br from-[#05aaae]/15 to-[#0bb8bc]/10 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-3000"></div>
        </div>

        <div className="relative px-6 lg:px-8 py-12 lg:py-18">
          <div className="mx-auto max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Column - Content */}
              <div className="text-center lg:text-left">
                <div className="mb-6">
                  <span className="inline-flex items-center rounded-full bg-gradient-to-r from-[#e38614] to-[#f39c1f] px-4 py-2 text-sm font-medium text-white ring-1 ring-inset ring-[#e38614]/30 shadow-lg">
                    <SparklesIcon className="w-4 h-4 mr-2" />
                    Expert Tutors, Proven Results
                  </span>
                </div>
                
                <h1 className="text-5xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-[#214966] mb-6">
                    <span className="bg-gradient-to-r from-[#05aaae] to-[#0bb8bc] bg-clip-text text-transparent leading-relaxed drop-shadow-sm">
                      Learn from the
                    </span>
                    <br />
                    <span className="text-[#214966] drop-shadow-lg relative">
                      Best Tutors
                      <div className="absolute -inset-2 bg-gradient-to-r from-[#e38614]/30 to-[#f39c1f]/30 rounded-lg opacity-20 blur-xl -z-10"></div>
                    </span>
                  </h1>
                
                <p className="text-lg sm:text-xl leading-8 text-gray-700 mb-8 max-w-2xl mx-auto lg:mx-0">
                  Connect with exceptional tutors who are passionate about your success. Our carefully selected educators 
                  bring expertise, patience, and proven teaching methods to every session.
                </p>

                {/* Trust indicators */}
                <div className="flex flex-wrap justify-center lg:justify-start items-center gap-6 mb-8 text-sm text-gray-600">
                  <div className="flex items-center">
                    <div className="flex text-[#e38614] mr-2">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <span className="font-medium">Top-rated tutors</span>
                  </div>

                  <div className="flex items-center">
                    <UserGroupIcon className="w-4 h-4 text-[#05aaae] mr-2" />
                    <span className="font-medium">All ages</span>
                  </div>
                  <div className="flex items-center">
                    <TrophyIcon className="w-4 h-4 text-[#e38614] mr-2" />
                    <span className="font-medium">Proven results</span>
                  </div>
                </div>
                
                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-8">
                  <Link
                    href="/tutors"
                    className="group relative px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-[#e38614] to-[#f39c1f] rounded-full shadow-lg hover:from-[#d17a12] hover:to-[#e38614] hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 w-full sm:w-auto"
                  >
                    <span className="flex items-center justify-center">
                      Find Your Perfect Tutor
                      <ArrowRightIcon className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                    </span>
                  </Link>
                  <Link 
                    href="/auth/register" 
                    className="group px-8 py-4 text-lg font-semibold text-[#214966] bg-white rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 border-2 border-[#05aaae] hover:border-[#0bb8bc] w-full sm:w-auto"
                  >
                    <span className="flex items-center justify-center">
                      Join For Free
                      <PlayIcon className="ml-2 w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                    </span>
                  </Link>
                </div>
              </div>

              {/* Right Column - Visual */}
              <div className="relative hidden lg:block">
                <div className="relative">
                  {/* Main illustration */}
                  <div className="relative bg-white rounded-3xl p-8 shadow-2xl border border-gray-100">
                    <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-r from-[#e38614] to-[#f39c1f] rounded-full flex items-center justify-center shadow-lg">
                      <AcademicCapIcon className="w-12 h-12 text-white" />
                    </div>
                    <div className="text-center">
                      <div className="w-32 h-32 bg-[#214966] rounded-full mx-auto mb-6 flex items-center justify-center">
                        <UserGroupIcon className="w-16 h-16 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-[#214966] mb-2">Expert Tutors</h3>
                      <p className="text-gray-600">Qualified educators ready to help you succeed</p>
                    </div>
                  </div>
                  
                  {/* Floating elements */}
                  <div className="absolute -top-8 -left-8 bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-gradient-to-r from-[#05aaae] to-[#0bb8bc] rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">Live Session</span>
                    </div>
                  </div>
                  
                  <div className="absolute -bottom-8 -right-8 bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                    <div className="flex items-center space-x-3">
                      <StarIcon className="w-5 h-5 text-[#e38614] fill-current" />
                      <span className="text-sm font-medium text-gray-700">5.0 Rating</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Updated Colors */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-[#214966] sm:text-4xl lg:text-5xl mb-6">
              What Our Users Say
            </h2>
            <p className="text-xl leading-8 text-gray-600">
              Real feedback from people who love our platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {testimonials.map((testimonial, index) => (
              <div key={testimonial.name} className="relative group">
                <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform group-hover:-translate-y-2 border border-gray-100 h-full flex flex-col">
                  {/* Quote icon */}
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-r from-[#e38614] to-[#f39c1f] rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white text-2xl font-serif">&ldquo;</span>
                  </div>
                  
                  {/* Rating */}
                  <div className="flex items-center mb-6 mt-4">
                    <div className="flex text-[#e38614]">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon key={i} className="w-6 h-6 fill-current" />
                      ))}
                    </div>
                    <span className="ml-2 text-sm font-medium text-gray-600">5.0</span>
                  </div>
                  
                  {/* Content */}
                  <p className="text-gray-700 mb-6 italic text-lg leading-relaxed flex-grow">
                    {testimonial.content}
                    <span className="text-2xl font-serif text-[#05aaae]">&rdquo;</span>
                  </p>
                  
                  {/* Author */}
                  <div className="flex items-center mt-auto">
                    {testimonial.image ? (
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 ring-4 ring-white shadow-lg">
                        <Image
                          src={testimonial.image}
                          alt={testimonial.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-r from-[#e38614] to-[#f39c1f] rounded-full flex items-center justify-center flex-shrink-0 ring-4 ring-white shadow-lg">
                        <span className="text-white font-bold text-xl">{testimonial.name.charAt(0)}</span>
                      </div>
                    )}
                    <div className="ml-4">
                      <div className="font-bold text-[#214966] text-lg">{testimonial.name}</div>
                      <div className="text-gray-600">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* What students achieve */}
          <div className="text-center">
            <div className="inline-flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8 bg-white rounded-2xl px-4 sm:px-8 py-6 shadow-lg border border-gray-100">
              <div className="text-center">
                <div className="text-3xl sm:text-3xl font-bold text-[#e38614]">Confidence</div>
                <div className="text-base sm:text-sm text-gray-600">Building</div>
              </div>
              <div className="hidden sm:block w-px h-12 bg-gradient-to-b from-[#05aaae]/30 to-[#e38614]/30"></div>
              <div className="text-center">
                <div className="text-3xl sm:text-3xl font-bold text-[#05aaae]">Understanding</div>
                <div className="text-base sm:text-sm text-gray-600">Deep Learning</div>
              </div>
              <div className="hidden sm:block w-px h-12 bg-gradient-to-b from-[#e38614]/30 to-[#214966]/30"></div>
              <div className="text-center">
                <div className="text-3xl sm:text-3xl font-bold text-[#214966]">Progress</div>
                <div className="text-base sm:text-sm text-gray-600">Measurable Results</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced How It Works Section - Updated Colors */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-white via-blue-50 to-teal-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-[#214966] sm:text-4xl lg:text-5xl mb-6">
              Learning Made Simple
            </h2>
            <p className="text-xl leading-8 text-gray-600">
              Get started in minutes with our tools designed for your success
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {howItWorks.map((step, index) => (
              <div key={step.title} className="relative group">
                {/* Connection lines */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-6 w-12 h-0.5 bg-gradient-to-r from-[#05aaae]/40 to-[#e38614]/40 transform -translate-y-1/2 z-0"></div>
                )}
                
                <div className="relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform group-hover:-translate-y-2 border border-gray-100 h-full flex flex-col justify-center">
                  {/* Step number */}
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-r from-[#e38614] to-[#f39c1f] rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {index + 1}
                  </div>
                  
                  {/* Icon */}
                  <div className="flex items-center justify-center w-20 h-20 bg-[#214966] rounded-2xl mb-6 mt-4">
                    <step.icon className="w-10 h-10 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-[#214966] mb-4 text-center">{step.title}</h3>
                  <p className="text-gray-600 text-center leading-relaxed flex-grow">{step.description}</p>
                  
                  {/* Hover effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#214966]/5 via-[#05aaae]/5 to-[#e38614]/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Features Section - Updated Colors */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-teal-50 via-white to-blue-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-[#214966] sm:text-4xl lg:text-5xl mb-6">
              Why Our Tutors Are Exceptional
            </h2>
            <p className="text-xl leading-8 text-gray-600">
              Our tutors bring expertise, passion, and proven teaching methods to sessions
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.name} className="group relative">
                <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform group-hover:-translate-y-2 border border-gray-100 h-full flex flex-col">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#e38614] to-[#f39c1f] rounded-2xl shadow-lg">
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-[#214966]">{feature.name}</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed flex-grow">{feature.description}</p>
                  
                  {/* Hover indicator */}
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ArrowRightIcon className="w-6 h-6 text-[#05aaae]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Subjects Section - Updated Colors */}
      <section className="py-16 sm:py-22 bg-gradient-to-br from-white via-blue-50 to-teal-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-[#214966] sm:text-4xl lg:text-5xl mb-6">
              Master Any Subject
            </h2>
            <p className="text-xl leading-8 text-gray-600">
              From core academics to specialized skills, our tutors cover everything you need
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {subjects.map((subject) => (
              <div key={subject.name} className="group relative h-full">
                <div className="bg-gradient-to-br from-white via-[#05aaae]/10 to-[#214966]/5 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-2 border border-gray-200 h-full flex flex-col justify-center hover:border-[#05aaae]/30">
                  <div className="text-center">
                    <div className="mx-auto flex items-center justify-center w-16 h-16 bg-[#05aaae] rounded-2xl mb-4 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                      <BookOpenIcon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#214966] group-hover:text-[#05aaae] transition-colors duration-300">{subject.name}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

        {/* Enhanced CTA Section - Updated Colors */}
        <section className="mt-8 sm:mt-16 py-16 sm:py-22 bg-gradient-to-br from-blue-50 via-white to-teal-50 relative overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-[#05aaae]/30 to-[#0bb8bc]/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-[#e38614]/25 to-[#f39c1f]/15 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-gradient-to-br from-[#05aaae]/20 to-[#214966]/10 rounded-full blur-3xl"></div>
            <div className="absolute top-20 right-20 w-60 h-60 bg-gradient-to-br from-[#e38614]/20 to-[#f39c1f]/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 left-20 w-60 h-60 bg-gradient-to-br from-[#05aaae]/15 to-[#0bb8bc]/10 rounded-full blur-3xl"></div>
          </div>
          
          <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
            <div className="mx-auto max-w-5xl text-center">
              {/* Enhanced title with icon */}
              <div className="mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-[#e38614]/20 to-[#f39c1f]/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#e38614]/30">
                  <RocketLaunchIcon className="w-10 h-10 text-[#214966]" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-[#214966] sm:text-4xl lg:text-5xl mb-6">
                  Ready to Transform Your Learning?
                </h2>
                <p className="text-xl leading-8 text-gray-700 mb-8 max-w-3xl mx-auto">
                  Join other students who&apos;ve already discovered the power of personalized tutoring with expert educators. 
                  Start your journey today and unlock your full potential.
                </p>
              </div>

              {/* Enhanced benefits grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-lg">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#05aaae] to-[#0bb8bc] rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircleIcon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#214966] mb-2">Start Free Today</h3>
                  <p className="text-gray-600 text-sm">No credit card required, no commitment</p>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-lg">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#e38614] to-[#f39c1f] rounded-full flex items-center justify-center mx-auto mb-4">
                    <ClockIcon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#214966] mb-2">Instant Access</h3>
                  <p className="text-gray-600 text-sm">Connect with tutors in minutes</p>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-lg">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#05aaae] to-[#0bb8bc] rounded-full flex items-center justify-center mx-auto mb-4">
                    <StarIcon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#214966] mb-2">Proven Results</h3>
                  <p className="text-gray-600 text-sm">See improvement in just weeks</p>
                </div>
              </div>
              
              {/* Enhanced CTA buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-10">
                <Link
                  href="/auth/register"
                  className="group px-10 py-5 text-lg font-semibold text-white bg-gradient-to-r from-[#e38614] to-[#f39c1f] rounded-full shadow-2xl hover:from-[#d17a12] hover:to-[#e38614] hover:shadow-3xl transform hover:-translate-y-2 transition-all duration-300 w-full sm:w-auto relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="flex items-center justify-center relative z-10">
                    <RocketLaunchIcon className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform duration-300" />
                    Start Learning Today
                  </span>
                </Link>
                
                <Link 
                  href="/auth/register" 
                  className="group px-10 py-5 text-lg font-semibold text-[#214966] bg-white rounded-full shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 transition-all duration-300 w-full sm:w-auto relative overflow-hidden border-2 border-[#05aaae] hover:border-[#0bb8bc]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#05aaae]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="flex items-center justify-center relative z-10">
                    <HeartIcon className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform duration-300" />
                    Become a Tutor
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>
    </div>
  )
}

const howItWorks = [
  {
    title: 'Find Your Perfect Match',
    description: 'Browse our curated network of qualified tutors and find the ideal match for your learning style and goals.',
    icon: UserGroupIcon,
  },
  {
    title: 'Book Your Session',
    description: 'Schedule sessions that fit your busy life with flexible timing, duration options, and instant confirmation.',
    icon: ClockIcon,
  },
  {
    title: 'Learn & Excel',
    description: 'Connect with your tutor in high-quality video sessions, track your progress, and achieve your academic goals.',
    icon: ChartBarIcon,
  },
]

const features = [
  {
    name: 'Expert Tutors',
    description: 'Connect with qualified, background-checked tutors who are experts in their fields and passionate about teaching.',
    icon: AcademicCapIcon,
  },
  {
    name: 'Flexible Scheduling',
    description: 'Book sessions that fit your schedule, with options for one-on-one learning, group sessions, and last-minute availability.',
    icon: ClockIcon,
  },
  {
    name: 'Progress Tracking',
    description: 'Monitor your learning journey with detailed feedback, performance metrics, and personalized learning plans.',
    icon: ChartBarIcon,
  },
  {
    name: 'Secure Platform',
    description: 'Learn with confidence knowing your sessions are secure, private, and protected by enterprise-grade security.',
    icon: ShieldCheckIcon,
  },
  {
    name: 'Interactive Sessions',
    description: 'Engage in high-quality video calls with screen sharing, virtual whiteboards, and real-time collaboration tools.',
    icon: VideoCameraIcon,
  },
  {
    name: '24/7 Support',
    description: 'Get help whenever you need it with our responsive customer support team and comprehensive help resources.',
    icon: ChatBubbleLeftRightIcon,
  },
]

const subjects = [
  { name: 'Math' },
  { name: 'Science' },
  { name: 'English' },
  { name: 'History' },
  { name: 'Computer Science' },
  { name: 'Languages' }
]

const testimonials = [
  {
    name: 'Sarah Brown',
    role: 'High School Student',
    content: 'My tutor helped me improve my essay writing skills so much! I went from struggling with structure to getting A\'s on my papers. His feedback was always detailed and constructive.',
  },
  {
    name: 'Thomas Barry',
    role: 'Math & Science Tutor',
    content: 'I love teaching on TeachGenie! The platform is incredibly user-friendly and makes it easy to connect with students from anywhere in the world. The payment system is seamless.',
    image: '/testimonials/Thomas_Tutor.jpg'
  },
  {
    name: 'Jeannie Au',
    role: 'English & Literature Tutor',
    content: 'The TeachGenie platform is an excellent environment for tutors who are passionate about making a positive impact on students\' academic journeys. The supportive community and robust tools make it ideal for helping students succeed.',
    image: '/testimonials/Jeannie_Tutor.jpg'
  },
] 