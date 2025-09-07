import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { AuthProvider } from '@/contexts/AuthContext'
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import FreeConsultationBanner from '@/components/layout/FreeConsultationBanner'
import StructuredData, { organizationSchema, websiteSchema } from '@/components/StructuredData'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TeachGenie - Online Tutoring Platform | Expert Tutors for All Subjects',
  description: 'Connect with expert tutors for personalized learning experiences. Find qualified educators for math, science, English, and more. Flexible scheduling, proven results, and 24/7 support.',
  keywords: [
    'online tutoring',
    'tutoring platform',
    'private tutors',
    'math tutor',
    'science tutor',
    'English tutor',
    'homework help',
    'academic support',
    'online learning',
    'educational services',
    'personalized learning',
    'expert tutors',
    'qualified educators',
    'flexible scheduling',
    'one-on-one tutoring'
  ],
  authors: [{ name: 'TeachGenie Team' }],
  creator: 'TeachGenie',
  publisher: 'TeachGenie',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://teachgenie.io'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'TeachGenie - Online Tutoring Platform | Expert Tutors for All Subjects',
    description: 'Connect with expert tutors for personalized learning experiences. Find qualified educators for math, science, English, and more. Flexible scheduling, proven results, and 24/7 support.',
    url: 'https://teachgenie.io',
    siteName: 'TeachGenie',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'TeachGenie - Online Tutoring Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TeachGenie - Online Tutoring Platform',
    description: 'Connect with expert tutors for personalized learning experiences. Find qualified educators for all subjects.',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon/favicon.ico', sizes: 'any' },
      { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/favicon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { url: '/favicon/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <StructuredData data={organizationSchema} />
        <StructuredData data={websiteSchema} />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            <FreeConsultationBanner />
            <Header />
            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            <Footer />
          </div>
        </AuthProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
} 