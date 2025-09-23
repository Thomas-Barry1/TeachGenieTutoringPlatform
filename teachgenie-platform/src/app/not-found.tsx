import Link from 'next/link'
import { HomeIcon, MagnifyingGlassIcon, AcademicCapIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teachgenie-deep-blue via-white to-teachgenie-teal/20 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full text-center">
        {/* 404 Number */}
        <div className="mb-8">
          <h1 className="text-9xl sm:text-[12rem] font-bold text-teachgenie-deep-blue/20 select-none">
            404
          </h1>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-4xl sm:text-5xl font-bold text-teachgenie-deep-blue">
              Oops! Page Not Found
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              The page you&apos;re looking for seems to have wandered off into the digital void. 
              Don&apos;t worry, even the best tutors sometimes need to find their way back!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
            <Link
              href="/"
              className="group inline-flex items-center px-8 py-4 bg-teachgenie-orange text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:bg-teachgenie-orange-dark transform hover:-translate-y-1 transition-all duration-300"
            >
              <HomeIcon className="w-5 h-5 mr-2" />
              Go Home
            </Link>
            
            <Link
              href="/tutors"
              className="group inline-flex items-center px-8 py-4 bg-white text-teachgenie-deep-blue font-semibold rounded-2xl border-2 border-teachgenie-teal shadow-lg hover:shadow-xl hover:bg-teachgenie-teal hover:text-white transform hover:-translate-y-1 transition-all duration-300"
            >
              <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
              Find Tutors
            </Link>
          </div>

          {/* Quick Links */}
          <div className="mt-12">
            <h3 className="text-lg font-semibold text-teachgenie-deep-blue mb-6">
              Popular Pages
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl mx-auto">
              <Link
                href="/dashboard"
                className="group p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-teachgenie-teal/30 hover:border-teachgenie-orange hover:shadow-lg transition-all duration-300"
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-teachgenie-deep-blue rounded-full flex items-center justify-center group-hover:bg-teachgenie-orange transition-colors duration-300">
                    <AcademicCapIcon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-teachgenie-deep-blue group-hover:text-teachgenie-orange transition-colors duration-300">
                    Dashboard
                  </span>
                </div>
              </Link>

              <Link
                href="/tutors"
                className="group p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-teachgenie-teal/30 hover:border-teachgenie-orange hover:shadow-lg transition-all duration-300"
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-teachgenie-deep-blue rounded-full flex items-center justify-center group-hover:bg-teachgenie-orange transition-colors duration-300">
                    <MagnifyingGlassIcon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-teachgenie-deep-blue group-hover:text-teachgenie-orange transition-colors duration-300">
                    Browse Tutors
                  </span>
                </div>
              </Link>

              <Link
                href="/inbox"
                className="group p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-teachgenie-teal/30 hover:border-teachgenie-orange hover:shadow-lg transition-all duration-300"
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-teachgenie-deep-blue rounded-full flex items-center justify-center group-hover:bg-teachgenie-orange transition-colors duration-300">
                    <ChatBubbleLeftRightIcon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-teachgenie-deep-blue group-hover:text-teachgenie-orange transition-colors duration-300">
                    Messages
                  </span>
                </div>
              </Link>

              <Link
                href="/auth/login"
                className="group p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-teachgenie-teal/30 hover:border-teachgenie-orange hover:shadow-lg transition-all duration-300"
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-teachgenie-deep-blue rounded-full flex items-center justify-center group-hover:bg-teachgenie-orange transition-colors duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-teachgenie-deep-blue group-hover:text-teachgenie-orange transition-colors duration-300">
                    Sign In
                  </span>
                </div>
              </Link>
            </div>
          </div>

          {/* Help Text */}
          <div className="mt-12 p-6 bg-teachgenie-teal/10 rounded-2xl border border-teachgenie-teal/20">
            <p className="text-gray-600">
              Still can&apos;t find what you&apos;re looking for? 
              <Link href="/contact" className="text-teachgenie-orange hover:text-teachgenie-orange-dark font-medium ml-1">
                Contact our support team
              </Link>
              {' '}and we&apos;ll help you get back on track!
            </p>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-teachgenie-orange/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-teachgenie-teal/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-teachgenie-deep-blue/10 rounded-full blur-lg animate-pulse delay-500"></div>
      </div>
    </div>
  )
}
