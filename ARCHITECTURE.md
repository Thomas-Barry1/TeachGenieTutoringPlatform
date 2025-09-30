# TeachGenie Platform Architecture

## Tech Stack
- **Frontend**: Next.js 14 (App Router)
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Email**: Resend
- **Payment Processing**: Stripe Connect (destination charges)
- **Deployment**: Vercel
- **Styling**: Tailwind CSS

## Project Setup

### Environment Variables
Required environment variables in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
RESEND_API_KEY=your_resend_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

### Configuration Files
- `next.config.js` - Next.js configuration
- `postcss.config.js` - PostCSS configuration for Tailwind
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `eslint.config.mjs` - ESLint configuration
- `.eslintrc.json` - Legacy ESLint configuration for compatibility

### Middleware
- `src/middleware.ts` - Handles authentication and route protection
- Protects routes based on user type and authentication status
- Redirects unauthenticated users to login
- Redirects authenticated users away from auth pages

## Project Structure

### Key Directories
- `/src/app` - Next.js app router pages and layouts
- `/src/components` - Reusable React components
- `/src/contexts` - React context providers
- `/src/lib` - Utility functions and configurations
- `/src/types` - TypeScript type definitions
- `/src/styles` - Global styles and Tailwind imports
- `/public` - Static assets

### Important Files
- `src/lib/supabase/schema.sql` - Database schema and RLS policies
- `src/lib/supabase/client.ts` - Supabase client configuration
- `src/lib/supabase/server.ts` - Supabase server client with cookie management
- `src/lib/stripe/server.ts` - Stripe server-side configuration
- `src/lib/stripe/client.ts` - Stripe client-side configuration
- `src/contexts/AuthContext.tsx` - Authentication state management
- `src/types/database.ts` - Database type definitions
- `src/types/supabase.ts` - Supabase client type definitions
- `src/middleware.ts` - Route protection and authentication
- `src/app/layout.tsx` - Root layout with providers
- `src/app/page.tsx` - Landing page
- `src/app/api/notify-message/route.ts` - Email notification API endpoint

### New Session Management Components
- `src/components/sessions/SessionFilters.tsx` - Advanced filtering and search functionality
- `src/components/sessions/SessionPagination.tsx` - Smart pagination with responsive design
- `src/components/sessions/SessionCard.tsx` - Individual session display with actions
- `src/components/sessions/SessionCard.test.tsx` - Unit tests for session filtering logic

## Database Schema

### Core Tables
1. `profiles`
   - Extends Supabase auth
   - Stores basic user information
   - User types: 'student' or 'tutor'
   - Includes avatar_url for profile images

2. `tutor_profiles`
   - Additional information for tutors
   - Links to profiles table
   - Stores bio, hourly rate, verification status
   - Includes Stripe Connect account information

3. `subjects`
   - Available tutoring subjects
   - Categorized by subject area
   - Used for tutor specialization and session booking

4. `tutor_subjects`
   - Many-to-many relationship between tutors and subjects
   - Used to track tutor specializations

5. `sessions`
   - Records of tutoring sessions
   - Links tutors, students, and subjects
   - Tracks timing and status
   - Includes payment status and Stripe payment intent ID

6. `session_payments`
   - Payment records for sessions
   - Handles platform fees and tutor payouts
   - Tracks payment status and history
   - Integrated with Stripe Connect destination charges

7. `reviews`
   - Student reviews for tutors
   - Includes ratings and comments
   - Links to sessions

8. `chat_rooms`
   - Stores chat room information
   - Contains metadata like creation time
   - Simple structure focused on message exchange

9. `chat_participants`
   - Manages the many-to-many relationship between users and chat rooms
   - Tracks who is part of each chat room
   - Essential for access control and RLS policies
   - Enables proper user management in chat rooms

10. `chat_messages`
    - Stores individual messages
    - Links to chat rooms and senders
    - Tracks read status and timestamps
    - Supports message history

11. `message_notifications`
    - Handles real-time notifications
    - Tracks unread messages
    - Manages notification preferences

12. `user_info`
    - Stores user preferences and learning data on users for AI tutors or tools
    - Category array allows for easier searchability and categorization
    - Tracks learning styles, interests, goals, and personality traits
    - Includes confidence scores for AI-driven data collection

## Security & Access Control

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own data
- Public access granted where appropriate (tutor listings)

### Key RLS Policies
- **Profiles**: Users view/update own profile, authenticated users create profiles
- **Tutor Profiles**: Public read, tutors update own profile
- **Subjects**: Public read, admin-only write
- **Sessions**: Users view own sessions, only tutors create sessions
- **Chat**: Users access only their chat rooms and messages
- **User Info**: Users manage their own preferences

## Session Management

### Enhanced Session Management (Latest Implementation)
- **Advanced Filtering**: Time-based, status, payment, and subject filters
- **Search Functionality**: Search by tutor/student name or subject
- **Smart Pagination**: 12 sessions per page with intelligent page navigation
- **Responsive Design**: Mobile-first approach with collapsible advanced filters
- **Real-time Updates**: Immediate UI feedback for status changes and deletions

### Session Creation
- Only tutors can create sessions
- Tutors must create sessions where they are the tutor
- Session details: date/time, duration (15min increments), subject, rate
- Price = Duration in hours × Hourly Rate
- Students receive notifications, can view but not modify

### Session Booking Flow
- Tutors can initiate booking from chat or student profiles
- Session details include:
  - Date and time selection
  - Duration options:
    - Preset durations (30min, 1hr, 1.5hr, 2hr)
    - Custom duration with 15-minute increments
    - Minimum duration of 15 minutes
  - Subject (from tutor's available subjects)
  - Rate management:
    - Default rate from tutor profile
    - Adjustable per session
    - Real-time price calculation
    - Price = (Duration in hours × Hourly Rate)
- Students receive notification of new session
- Students can view but not modify session details

### Session States
- Scheduled: Initial state when created
- Completed: After session ends
- Cancelled: If session is cancelled

### Pricing Structure
- Based on tutor's hourly rate
- Rate can be adjusted per session
- Price calculated based on actual duration
- Supports fractional hours
- Minimum 30-minute increments
- Real-time price updates during booking

## Payment System (Stripe Connect)

### Implementation
- **Stripe Connect**: Destination charges for automatic platform fee handling
- **Tutor Onboarding**: Express dashboard integration for tutor account setup
- **Payment Flow**: Direct charges with automatic platform fee deduction
- **Payout System**: Automatic transfers to tutor Stripe accounts

### Key Features
- **Express Dashboard**: One-time login links for tutors to access Stripe dashboard
- **Platform Fees**: Automatic deduction of platform fees from session payments
- **Payment Status Tracking**: Real-time payment status updates
- **Secure Processing**: Server-side payment processing with webhook validation

### API Endpoints
- `POST /api/payments/create-intent` - Creates payment intent with destination charges
- `POST /api/stripe/onboard-tutor` - Initiates tutor Stripe Connect onboarding
- `POST /api/stripe/create-login-link` - Generates Express dashboard login links
- `POST /api/webhooks/stripe` - Handles Stripe webhook events
- `GET /api/stripe/tutor-status` - Checks tutor onboarding status

## Authentication Flow

1. Registration
   - User selects role (student/tutor)
   - Creates Supabase auth account
   - Creates corresponding profile
   - Tutors get additional tutor_profile entry

2. Login
   - Uses Supabase auth with secure cookie management
   - Loads user profile and role
   - Redirects to appropriate dashboard

3. Session Management
   - Uses Next.js 14+ cookie API with `getAll`/`setAll` methods
   - Secure HttpOnly cookies for session persistence
   - Proper token refresh and session validation

## Email Notifications

### Implementation
- **Service**: Resend for transactional emails
- **Security**: Server-side API routes with authentication
- **Triggers**: New messages, session updates, account verification

### API Endpoint
- `POST /api/notify-message` - Sends email notifications
- **Authentication**: Validates user session using Supabase Auth
- **Rate Limiting**: Prevents spam by checking message frequency
- **Error Handling**: Graceful fallback for email delivery failures

### Scheduled Notifications (Cron)
- **Endpoint**: `GET /api/cron/session-notifications`
- **Schedule**: Configured in `vercel.json` to run daily (`0 9 * * *`)
- **Security**: Requires `Authorization: Bearer ${CRON_SECRET}` header. Add `CRON_SECRET` to Vercel Project Environment Variables.
- **Email Types**:
  - Tutor response reminder (tutor only, if no reply to student in >24h; max once per 24h per tutor)
  - 24-hour session reminders (student + tutor)
    - Tutor email also includes AI tool suggestions and teaching tips if tutor is verified
- **Database**: `public.session_notifications` tracks sent notifications to avoid duplicates
  - Columns: `id`, `session_id`, `user_id`, `notification_type`, `sent_at`, `delivery_status`
  - RLS: service role can manage all; users can SELECT their own

### Use Cases
1. **Message Notifications**: Email alerts for new chat messages
2. **Session Updates**: Reminders and confirmations for tutoring sessions
3. **Account Verification**: Email verification for new registrations

## Legal Document Management
- **Format**: Markdown files (`TERMS.md`, `PRIVACY.md`)
- **Rendering**: Server-side with `marked` library + Tailwind Typography
- **Integration**: Required agreement during registration
- **Access**: Public routes `/TERMS` and `/PRIVACY`

## Profile Images

### Database Changes
```sql
ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
```

### Storage Structure
```
profile-images/
├── {user_id}/
│   ├── avatar.jpg
│   └── avatar_thumbnail.jpg
```

### Features
- **Upload**: Drag and drop interface with image preview
- **Processing**: Automatic resizing, thumbnail generation (200x200), WebP conversion
- **Validation**: jpg/jpeg/png/webp, max 5MB, 200x200px to 2000x2000px
- **Fallback**: Default avatar for new users, placeholder during loading

### Security
-- Users can upload their own profile images"

-- Anyone can view profile images

-- Users can manage their own profile images

### Implementation
- **Storage**: Supabase Storage with profile-images bucket
- **Processing**: Image optimization pipeline with automatic resizing
- **Security**: Signed URLs with expiration, CORS configuration, rate limiting
- **Performance**: Lazy loading, progressive loading, browser caching

## User Information Management

### Overview
Flexible system for storing and managing user preferences, learning styles, and personalization data for AI tutors and matching algorithms.

### Database Schema
- **Table**: `user_info`
- **Structure**: Key-value pairs with category arrays for flexible categorization
- **Categories**: Learning styles, interests, goals, personality traits, subject preferences
- **Data Sources**: User input, AI inference, behavioral analysis

### Use Cases
1. **AI Tutor Personalization**: Adapt teaching methods based on learning style
2. **Tutor Matching**: Match students with compatible tutors
3. **Content Recommendation**: Suggest relevant study materials
4. **Progress Tracking**: Monitor learning preferences over time
5. **Behavioral Analysis**: Infer preferences from user interactions

## AI Tutors Tools

### Overview
Premium feature available exclusively to verified tutors, providing access to specialized AI-powered educational tools hosted on `teach.webexpansions.com`.

### Access Control
- **User Type**: Must be a tutor (not a student)
- **Verification Status**: Must be verified by the platform (`tutor_profiles.is_verified = true`)
- **Location**: Available in main navigation header as dropdown menu

### Available Tools
1. **Gap Assessment** - Identify knowledge gaps in student understanding
2. **Test Creator** - Generate customized tests and quizzes
3. **Kahoot Generator** - Create interactive Kahoot-style quizzes
4. **Lesson Plan** - Generate structured lesson plans
5. **Activities** - Access library of educational activities

### Technical Implementation
- **Component**: `src/components/layout/Header.tsx`
- **Conditional Rendering**: Only appears for verified tutors
- **Responsive Design**: Desktop dropdown and mobile collapsible menu
- **External Links**: All tools link to `teach.webexpansions.com` with proper security attributes

### Access Control Logic
```typescript
const isVerifiedTutor = isTutor && tutorProfile?.is_verified
```

### Security Features
- **Server-side Verification**: Database checks through RLS policies
- **External Links**: All links use `target="_blank"` and `rel="noopener noreferrer"`
- **Access Validation**: Verification status checked on component mount

### User Experience
- **Desktop**: Dropdown menu in main navigation with hover effects
- **Mobile**: Collapsible section in mobile menu

## Analytics & Monitoring

### Vercel Web Analytics
- **Package**: `@vercel/analytics` for Next.js integration
- **Setup**: Enable in Vercel dashboard under Analytics tab
- **Implementation**: Analytics component added to root layout
- **Tracking**: Automatic visitor and page view tracking
- **Routes**: Creates `/_vercel/insights/*` routes for data collection
- **Deployment**: Requires Vercel deployment for activation

## Development Guidelines

### Type Safety
- Use TypeScript for all components
- Define database types in `types/database.ts`
- Use proper type definitions for Supabase queries

### Security
- Always use RLS policies
- Never expose sensitive data
- Validate user input
- Use server-side API routes for sensitive operations

### State Management
- Use React Context for global state
- Keep component state local when possible
- Handle loading and error states properly

### Performance Optimization
- Use `useMemo` for expensive calculations
- Implement client-side filtering for better UX
- Optimize pagination with efficient array slicing
- Use responsive design for mobile-first approach

## Common Issues & Solutions

1. **Authentication**
   - Ensure environment variables are set correctly
   - Check RLS policies if data access fails
   - Verify user roles in middleware
   - Use `credentials: 'include'` for API calls requiring authentication
   - Ensure proper cookie management with Next.js 14+ API
   - **OAuth Navigation Issue**: After login, navigation may not work correctly (Messages/Inbox links stay on dashboard)
     - **Cause**: OAuth callback redirects using Next.js router, but navigation state doesn't refresh properly
     - **Solution**: Use `window.location.replace('/dashboard')` instead of `router.push('/dashboard')` in auth callback
     - **Why**: Forces full page reload ensuring proper auth state initialization and component re-rendering

2. **Database**
   - Use proper foreign key relationships
   - Check RLS policies for access issues
   - Monitor query performance

3. **Development**
   - Run `npm install` after pulling changes
   - Clear `.next` cache if build issues occur
   - Check TypeScript types for errors
   - Use Suspense boundaries for components using `useSearchParams()`

4. **Email Notifications**
   - Verify Resend API key is configured
   - Check authentication in API routes
   - Monitor email delivery rates
   - Implement proper rate limiting to prevent spam


## Testing (Implemented)

1. **Unit Tests**
   - Session filtering logic testing
   - Component testing with Jest
   - API route testing
   - Utility function testing

2. **Integration Tests**
   - Authentication flow
   - Session booking
   - Payment processing
   - Email notifications

3. **E2E Tests**
   - User journeys
   - Critical paths
   - Error scenarios

## LLM Rules & Context

### Project Context
- Tutoring platform connecting students with tutors
- All database operations must respect RLS policies
- Authentication handled through Supabase Auth
- Role-based access (student/tutor)
- Payment processing through Stripe Connect

### Important Rules
1. **Database Operations**: Always check RLS policies, never expose sensitive data
2. **Authentication**: Respect user roles, handle errors gracefully
3. **Security**: Never expose API keys, always validate input
4. **Code Style**: Use TypeScript, follow Next.js 14 best practices
5. **Feature Implementation**: Check existing implementations, consider both perspectives
6. **Payment Processing**: Use Stripe Connect destination charges, handle webhooks securely

### Common Pitfalls to Avoid
1. **Authentication**
   - Don't assume user is authenticated
   - Always check user roles before operations
   - Handle token expiration properly

2. **Database**
   - Don't bypass RLS policies
   - Don't expose sensitive data
   - Don't make unnecessary database calls

3. **Performance**
   - Don't make unnecessary API calls
   - Don't load unnecessary data
   - Don't block the main thread

4. **Security**
   - Don't expose environment variables
   - Don't trust client-side data
   - Don't skip input validation

5. **Payments**
   - Don't process payments client-side
   - Don't skip webhook signature verification
   - Don't ignore payment status updates

### Best Practices
1. **Code Organization**
   - Keep components focused and reusable
   - Use proper TypeScript types
   - Follow consistent naming conventions

2. **Error Handling**
   - Provide clear error messages
   - Log errors appropriately
   - Handle edge cases gracefully

3. **Testing (When Implemented)**
   - Write tests for critical paths
   - Test error scenarios
   - Maintain good test coverage 