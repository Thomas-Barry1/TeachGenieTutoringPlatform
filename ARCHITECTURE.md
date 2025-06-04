# TeachGenie Platform Architecture

## Tech Stack
- **Frontend**: Next.js 14 (App Router)
- **Backend**: Supabase
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Deployment**: Vercel
- **Styling**: Tailwind CSS

## Project Structure

### Key Directories
- `/src/app` - Next.js app router pages and layouts
- `/src/components` - Reusable React components
- `/src/contexts` - React context providers
- `/src/lib` - Utility functions and configurations
- `/src/types` - TypeScript type definitions

### Important Files
- `src/lib/supabase/schema.sql` - Database schema and RLS policies
- `src/lib/supabase/client.ts` - Supabase client configuration
- `src/contexts/AuthContext.tsx` - Authentication state management
- `src/types/database.ts` - Database type definitions
- `src/types/supabase.ts` - Supabase client type definitions

## Database Schema

### Core Tables
1. `profiles`
   - Extends Supabase auth
   - Stores basic user information
   - User types: 'student' or 'tutor'

2. `tutor_profiles`
   - Additional information for tutors
   - Links to profiles table
   - Stores bio, hourly rate, verification status

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

6. `session_payments`
   - Payment records for sessions
   - Handles platform fees and tutor payouts
   - Integrates with Stripe

7. `reviews`
   - Student reviews for tutors
   - Includes ratings and comments
   - Links to sessions

8. `chat_rooms` and `chat_messages`
   - Real-time chat functionality
   - Links to sessions
   - Handles message notifications

## Security & Access Control

### Row Level Security (RLS)
- All tables have RLS enabled
- Policies ensure users can only access their own data
- Public access is granted where appropriate (e.g., tutor listings)

### Key RLS Policies
1. Profiles
   - Users can view and update their own profile
   - Authenticated users can create profiles

2. Tutor Profiles
   - Public read access
   - Tutors can update their own profile

3. Subjects
   - Public read access
   - Admin-only write access

4. Tutor Subjects
   - Public read access
   - Tutors can manage their own subjects

5. Sessions
   - Users can view their own sessions
   - Students can create sessions
   - Tutors can update their sessions

## Authentication Flow

1. Registration
   - User selects role (student/tutor)
   - Creates Supabase auth account
   - Creates corresponding profile
   - Tutors get additional tutor_profile entry

2. Login
   - Uses Supabase auth
   - Loads user profile and role
   - Redirects to appropriate dashboard

## Important Decisions

1. **Database Design**
   - Separate profiles and tutor_profiles tables for better data organization
   - Many-to-many relationship for tutor subjects
   - Comprehensive session tracking with payment integration

2. **Security**
   - RLS policies for granular access control
   - No direct database access from frontend
   - Secure authentication flow

3. **Real-time Features**
   - Chat system for session communication
   - Message notifications
   - Session status updates

4. **UI/UX**
   - Responsive design with Tailwind CSS
   - Clear separation of tutor and student interfaces
   - Intuitive subject management

## Development Guidelines

1. **Type Safety**
   - Use TypeScript for all components
   - Define database types in `types/database.ts`
   - Use proper type definitions for Supabase queries

2. **Component Structure**
   - Keep components focused and reusable
   - Use proper prop typing
   - Implement error boundaries where needed

3. **State Management**
   - Use React Context for global state
   - Keep component state local when possible
   - Use proper loading and error states

4. **Database Operations**
   - Always use RLS policies
   - Handle errors appropriately
   - Use proper TypeScript types for queries

## Future Considerations

1. **Scalability**
   - Consider pagination for large data sets
   - Implement caching where appropriate
   - Monitor database performance

2. **Features**
   - Video integration for sessions
   - Advanced scheduling system
   - Payment processing improvements

3. **Security**
   - Regular security audits
   - Enhanced verification system
   - Rate limiting implementation

## Deployment

1. **Environment**
   - Development: Local with Supabase
   - Production: Vercel + Supabase
   - Environment variables for configuration

2. **Monitoring**
   - Error tracking
   - Performance monitoring
   - Usage analytics

## Maintenance

1. **Database**
   - Regular backups
   - Schema migrations
   - Performance optimization

2. **Code**
   - Regular dependency updates
   - Code quality checks
   - Documentation updates 