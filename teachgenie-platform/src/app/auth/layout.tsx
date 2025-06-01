export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-full flex-1">
        <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
          {children}
        </div>
        <div className="relative hidden w-0 flex-1 lg:block">
          <div className="absolute inset-0 bg-primary-600" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-800" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="max-w-2xl px-8 text-center">
              <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Transform Your Learning Journey
              </h2>
              <p className="mt-6 text-lg leading-8 text-primary-100">
                Connect with expert tutors who can help you achieve your academic goals. Whether you're looking to improve your grades or learn something new, we've got you covered.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 