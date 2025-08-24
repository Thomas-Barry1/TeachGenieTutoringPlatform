'use client'

import { Fragment, useEffect, useState } from 'react'
import { Disclosure, Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react'
import { Bars3Icon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Find Tutors', href: '/tutors' },
  { name: 'Messages', href: '/inbox' },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Header() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<{ 
    avatar_url: string | null
    user_type: 'student' | 'tutor' | null
  } | null>(null)
  const [tutorProfile, setTutorProfile] = useState<{
    is_verified: boolean
  } | null>(null)

  useEffect(() => {
    async function loadProfile() {
      if (!user) return

      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url, user_type')
        .eq('id', user.id)
        .single()

      if (!error && data) {
        setProfile(data)
        
        // If user is a tutor, load tutor profile for verification status
        if (data.user_type === 'tutor') {
          const { data: tutorData, error: tutorError } = await supabase
            .from('tutor_profiles')
            .select('is_verified')
            .eq('id', user.id)
            .single()

          if (!tutorError && tutorData) {
            setTutorProfile(tutorData)
          }
        }
      }
    }

    loadProfile()
  }, [user])

  const isTutor = profile?.user_type === 'tutor'
  const isVerifiedTutor = isTutor && tutorProfile?.is_verified

  return (
    <Disclosure as="nav" className="bg-white shadow">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <div className="flex flex-shrink-0 items-center">
                  <Link href="/">
                    <img src="/logo.png" alt="TeachGenie Logo" className="h-16 max-h-full w-auto object-contain" />
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8 items-stretch">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={classNames(
                        pathname === item.href
                          ? 'border-primary-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                        'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium h-full'
                      )}
                    >
                      {item.name}
                    </Link>
                  ))}
                  {/* AI Tutors Tools Dropdown - Only for verified tutors */}
                  {isVerifiedTutor && (
                    <Menu as="div" className="relative flex items-stretch">
                      <MenuButton
                        className={classNames(
                          pathname.startsWith('/ai-tools')
                            ? 'border-primary-500 text-gray-900'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                          'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium h-full focus:outline-none bg-white'
                        )}
                        style={{ height: '100%' }}
                                              >
                          <div className="flex items-center">
                            <span>AI Tutors Tools</span>
                          </div>
                          <ChevronDownIcon className="ml-1 h-4 w-4" aria-hidden="true" />
                        </MenuButton>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <MenuItems className="absolute left-0 top-full z-10 w-48 origin-top-left rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <MenuItem>
                            {({ active }) => (
                              <a
                                href="https://teach.webexpansions.com/gap-assessment"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={classNames(
                                  active ? 'bg-gray-100' : '',
                                  'block px-4 py-2 text-sm text-gray-700'
                                )}
                              >
                                Gap Assessment
                              </a>
                            )}
                          </MenuItem>
                          <MenuItem>
                            {({ active }) => (
                              <a
                                href="https://teach.webexpansions.com/test-creator"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={classNames(
                                  active ? 'bg-gray-100' : '',
                                  'block px-4 py-2 text-sm text-gray-700'
                                )}
                              >
                                Test Creator
                              </a>
                            )}
                          </MenuItem>
                          <MenuItem>
                            {({ active }) => (
                              <a
                                href="https://teach.webexpansions.com/kahoot-generator"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={classNames(
                                  active ? 'bg-gray-100' : '',
                                  'block px-4 py-2 text-sm text-gray-700'
                                )}
                              >
                                Kahoot Generator
                              </a>
                            )}
                          </MenuItem>
                          <MenuItem>
                            {({ active }) => (
                              <a
                                href="https://teach.webexpansions.com/lesson-plan"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={classNames(
                                  active ? 'bg-gray-100' : '',
                                  'block px-4 py-2 text-sm text-gray-700'
                                )}
                              >
                                Lesson Plan
                              </a>
                            )}
                          </MenuItem>
                          <MenuItem>
                            {({ active }) => (
                              <a
                                href="https://teach.webexpansions.com/activities"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={classNames(
                                  active ? 'bg-gray-100' : '',
                                  'block px-4 py-2 text-sm text-gray-700'
                                )}
                              >
                                Activities
                              </a>
                            )}
                          </MenuItem>
                        </MenuItems>
                      </Transition>
                    </Menu>
                  )}
                  
                  {/* Dashboard Dropdown */}
                  {(
                    <Menu as="div" className="relative flex items-stretch">
                      <MenuButton
                        className={classNames(
                          (pathname.startsWith('/dashboard') || pathname.startsWith('/profile') || pathname.startsWith('/sessions') || (isTutor && pathname.startsWith('/subjects')))
                            ? 'border-primary-500 text-gray-900'
                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                          'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium h-full focus:outline-none bg-white'
                        )}
                        style={{ height: '100%' }}
                      >
                        Dashboard
                        <ChevronDownIcon className="ml-1 h-4 w-4" aria-hidden="true" />
                      </MenuButton>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <MenuItems className="absolute left-0 top-full z-10 w-48 origin-top-left rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <MenuItem>
                            {({ active }) => (
                              <Link
                                href="/dashboard"
                                className={classNames(
                                  active ? 'bg-gray-100' : '',
                                  'block px-4 py-2 text-sm text-gray-700'
                                )}
                              >
                                Dashboard
                              </Link>
                            )}
                          </MenuItem>
                          <MenuItem>
                            {({ active }) => (
                              <Link
                                href="/dashboard"
                                className={classNames(
                                  active ? 'bg-gray-100' : '',
                                  'block px-4 py-2 text-sm text-gray-700'
                                )}
                              >
                                Profile
                              </Link>
                            )}
                          </MenuItem>
                          {isTutor && (
                            <MenuItem>
                              {({ active }) => (
                                <Link
                                  href="/subjects"
                                  className={classNames(
                                    active ? 'bg-gray-100' : '',
                                    'block px-4 py-2 text-sm text-gray-700'
                                  )}
                                >
                                  Subjects
                                </Link>
                              )}
                            </MenuItem>
                          )}
                          {isTutor && (
                            <MenuItem>
                              {({ active }) => (
                                <Link
                                  href="/payments"
                                  className={classNames(
                                    active ? 'bg-gray-100' : '',
                                    'block px-4 py-2 text-sm text-gray-700'
                                  )}
                                >
                                  Payments
                                </Link>
                              )}
                            </MenuItem>
                          )}
                          <MenuItem>
                            {({ active }) => (
                              <Link
                                href="/sessions"
                                className={classNames(
                                  active ? 'bg-gray-100' : '',
                                  'block px-4 py-2 text-sm text-gray-700'
                                )}
                              >
                                Sessions
                              </Link>
                            )}
                          </MenuItem>
                        </MenuItems>
                      </Transition>
                    </Menu>
                  )}
                </div>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center">
                {user ? (
                  <Menu as="div" className="relative ml-3">
                    <div>
                      <MenuButton className="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                        <span className="sr-only">Open user menu</span>
                        {profile?.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt="Profile"
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-200" />
                        )}
                      </MenuButton>
                    </div>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <MenuItems className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <MenuItem>
                          {({ active }) => (
                            <Link
                              href="/dashboard"
                              className={classNames(
                                active ? 'bg-gray-100' : '',
                                'block px-4 py-2 text-sm text-gray-700'
                              )}
                            >
                              Settings
                            </Link>
                          )}
                        </MenuItem>
                        <MenuItem>
                          {({ active }) => (
                            <button
                              onClick={() => signOut()}
                              className={classNames(
                                active ? 'bg-gray-100' : '',
                                'block w-full px-4 py-2 text-left text-sm text-gray-700'
                              )}
                            >
                              Sign out
                            </button>
                          )}
                        </MenuItem>
                      </MenuItems>
                    </Transition>
                  </Menu>
                ) : (
                  <div className="flex items-center space-x-4">
                    <Link
                      href="/auth/login"
                      className="text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/auth/register"
                      className="btn-primary"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>
              <div className="-mr-2 flex items-center sm:hidden">
                <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 pb-3 pt-2">
              {navigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as={Link}
                  href={item.href}
                  className={classNames(
                    pathname === item.href
                      ? 'bg-primary-50 border-primary-500 text-primary-700'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700',
                    'block border-l-4 py-2 pl-3 pr-4 text-base font-medium'
                  )}
                >
                  {item.name}
                </Disclosure.Button>
              ))}
              
              {/* Mobile AI Tutors Tools Menu - Only for verified tutors */}
              {isVerifiedTutor && (
                <>
                  <Disclosure.Button
                    as="div"
                    className="border-transparent text-gray-500 block border-l-4 py-2 pl-3 pr-4 text-base font-medium"
                  >
                    <div className="flex items-center text-sm font-medium text-gray-900 mb-2">
                      <span>AI Tutors Tools</span>
                    </div>
                    <div className="space-y-1">
                      <a
                        href="https://teach.webexpansions.com/gap-assessment"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-gray-600 hover:text-gray-900 pl-4"
                      >
                        Gap Assessment
                      </a>
                      <a
                        href="https://teach.webexpansions.com/test-creator"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-gray-600 hover:text-gray-900 pl-4"
                      >
                        Test Creator
                      </a>
                      <a
                        href="https://teach.webexpansions.com/kahoot-generator"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-gray-600 hover:text-gray-900 pl-4"
                      >
                        Kahoot Generator
                      </a>
                      <a
                        href="https://teach.webexpansions.com/lesson-plan"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-gray-600 hover:text-gray-900 pl-4"
                      >
                        Lesson Plan
                      </a>
                      <a
                        href="https://teach.webexpansions.com/activities"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-gray-600 hover:text-gray-900 pl-4"
                      >
                        Activities
                      </a>
                    </div>
                  </Disclosure.Button>
                </>
              )}
              
              {/* Mobile Dashboard Menu */}
              {(
                <>
                  <Disclosure.Button
                    as={Link}
                    href="/dashboard"
                    className={classNames(
                      pathname === '/dashboard'
                        ? 'bg-primary-50 border-primary-500 text-primary-700'
                        : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700',
                      'block border-l-4 py-2 pl-3 pr-4 text-base font-medium'
                    )}
                  >
                    Dashboard
                  </Disclosure.Button>
                  {/* <Disclosure.Button
                    as={Link}
                    href="/profile"
                    className={classNames(
                      pathname === '/dashboard'
                        ? 'bg-primary-50 border-primary-500 text-primary-700'
                        : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700',
                      'block border-l-4 py-2 pl-3 pr-4 text-base font-medium'
                    )}
                  >
                    Profile
                  </Disclosure.Button> */}
                  {isTutor && (
                    <Disclosure.Button
                      as={Link}
                      href="/subjects"
                      className={classNames(
                        pathname === '/subjects'
                          ? 'bg-primary-50 border-primary-500 text-primary-700'
                          : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700',
                        'block border-l-4 py-2 pl-3 pr-4 text-base font-medium'
                      )}
                    >
                      Subjects
                    </Disclosure.Button>
                  )}
                  {isTutor && (
                    <Disclosure.Button
                      as={Link}
                      href="/payments"
                      className={classNames(
                        pathname === '/payments'
                          ? 'bg-primary-50 border-primary-500 text-primary-700'
                          : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700',
                        'block border-l-4 py-2 pl-3 pr-4 text-base font-medium'
                      )}
                    >
                      Payments
                    </Disclosure.Button>
                  )}
                  <Disclosure.Button
                    as={Link}
                    href="/sessions"
                    className={classNames(
                      pathname === '/sessions'
                        ? 'bg-primary-50 border-primary-500 text-primary-700'
                        : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700',
                      'block border-l-4 py-2 pl-3 pr-4 text-base font-medium'
                    )}
                  >
                    Sessions
                  </Disclosure.Button>
                </>
              )}
            </div>
            <div className="border-t border-gray-200 pb-3 pt-4">
              {user ? (
                <div className="space-y-1">
                  <Disclosure.Button
                    as={Link}
                    href="/settings"
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                  >
                    Settings
                  </Disclosure.Button>
                  <Disclosure.Button
                    as="button"
                    onClick={() => signOut()}
                    className="block w-full px-4 py-2 text-left text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                  >
                    Sign out
                  </Disclosure.Button>
                </div>
              ) : (
                <div className="space-y-1">
                  <Disclosure.Button
                    as={Link}
                    href="/auth/login"
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                  >
                    Sign in
                  </Disclosure.Button>
                  <Disclosure.Button
                    as={Link}
                    href="/auth/register"
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                  >
                    Sign up
                  </Disclosure.Button>
                </div>
              )}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  )
} 