# TeachGenie Tutoring Platform

An AI-powered online tutoring platform built with Next.js 14 and Supabase.

## 🚀 Features

- **Real-time Messaging**: Secure chat system with email notifications
- **Session Management**: Flexible booking system with customizable durations and rates
- **User Authentication**: Role-based access control (students/tutors) with email verification
- **Profile Management**: Rich profiles with image uploads and subject specializations
- **Review System**: Student reviews and ratings for tutors
- **Responsive Design**: Modern UI built with Tailwind CSS

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Styling**: Tailwind CSS
- **Email**: Resend
- **Deployment**: Vercel

## 📚 Documentation

- [Architecture Guide](./ARCHITECTURE.md) - Technical architecture and design decisions
- [Platform Plan](./PLATFORM_PLAN.MD) - Feature roadmap and development phases
- [Testing Guide](./TESTING.md) - Testing strategies and implementation
- [Profile Images](./PROFILE_IMAGES.MD) - Image upload and management

## 🚦 Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see ARCHITECTURE.md)
4. Run the development server: `npm run dev`

## 🔐 Security

- Row Level Security (RLS) on all database tables
- Secure authentication with Supabase Auth
- Server-side email notifications with Resend
- Protected API routes with proper session validation
