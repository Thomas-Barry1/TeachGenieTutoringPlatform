# TeachGenie Tutoring Platform Plan

## Tech Stack
- **Frontend**: Next.js 14 (App Router)
- **Backend**: Supabase
- **Deployment**: Vercel
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL (via Supabase)
- **Real-time**: Supabase Realtime
- **Email**: Resend
- **File Storage**: Supabase Storage

## Core Features (Phase 1)

### 1. User Management
#### Database Schema
```sql
-- Users table (extends Supabase auth)
create table public.profiles (
  id uuid references auth.users on delete cascade,
  user_type text check (user_type in ('student', 'tutor')),
  first_name text,
  last_name text,
  email text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (id)
);

-- Tutor profiles
create table public.tutor_profiles (
  id uuid references public.profiles on delete cascade,
  bio text,
  hourly_rate decimal,
  is_verified boolean default false,
  primary key (id)
);

-- Subject categories
create table public.subjects (
  id uuid default uuid_generate_v4(),
  name text,
  category text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (id)
);

-- Tutor subjects (many-to-many)
create table public.tutor_subjects (
  tutor_id uuid references public.tutor_profiles on delete cascade,
  subject_id uuid references public.subjects on delete cascade,
  primary key (tutor_id, subject_id)
);
```

### 2. Authentication & Authorization
- Separate registration flows for tutors and students
- Email verification required
- Role-based access control
- Protected routes based on user type

### 3. Tutoring Sessions
#### Database Schema
```sql
-- Sessions
create table public.sessions (
  id uuid default uuid_generate_v4(),
  tutor_id uuid references public.tutor_profiles,
  student_id uuid references public.profiles,
  subject_id uuid references public.subjects,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  status text check (status in ('scheduled', 'completed', 'cancelled')),
  price decimal,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (id)
);

-- Session payments
create table public.session_payments (
  id uuid default uuid_generate_v4(),
  session_id uuid references public.sessions,
  amount decimal,
  platform_fee decimal,
  tutor_payout decimal,
  payment_status text check (status in ('pending', 'completed', 'failed')),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (id)
);
```

#### Session Booking Flow
1. Tutors can initiate session booking from:
   - Student profiles
   - Chat conversations
   - Direct session creation
2. Session booking includes:
   - Date and time selection
   - Flexible duration options:
     - Preset durations (30min, 1hr, 1.5hr, 2hr)
     - Custom duration in 15-minute increments
     - Minimum duration of 15 minutes
   - Subject selection (from tutor's available subjects)
   - Rate management:
     - Default rate from tutor's profile
     - Adjustable per session
     - Real-time price calculation
     - Price = (Duration in hours × Hourly Rate)
3. Security:
   - Only tutors can create sessions
   - Tutors can only create sessions where they are the tutor
   - Students can view sessions they are part of
   - Tutors can view and manage their own sessions

### 4. Reviews & Ratings
#### Database Schema
```sql
-- Reviews
create table public.reviews (
  id uuid default uuid_generate_v4(),
  session_id uuid references public.sessions,
  student_id uuid references public.profiles,
  tutor_id uuid references public.tutor_profiles,
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (id)
);
```

### 5. Real-time Chat
#### Database Schema
```sql
-- Chat rooms
create table public.chat_rooms (
  id uuid default uuid_generate_v4(),
  created_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (id)
);

-- Chat messages
create table public.chat_messages (
  id uuid default uuid_generate_v4(),
  chat_room_id uuid references public.chat_rooms,
  sender_id uuid references public.profiles,
  content text,
  is_read boolean default false,
  read_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (id)
);

-- Message notifications
create table public.message_notifications (
  id uuid default uuid_generate_v4(),
  user_id uuid references public.profiles,
  message_id uuid references public.chat_messages,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  primary key (id)
);
```

### 6. Email Notifications
#### Implementation
- **Service**: Resend for transactional emails
- **Security**: Server-side API routes with authentication
- **Rate Limiting**: Prevents spam by checking message frequency

#### Use Cases
1. **Message Notifications**: Email alerts for new chat messages
2. **Session Updates**: Reminders and confirmations for tutoring sessions
3. **Account Verification**: Email verification for new registrations

#### API Endpoint
- `POST /api/notify-message` - Sends email notifications
- **Authentication**: Validates user session using Supabase Auth
- **Error Handling**: Graceful fallback for email delivery failures

## Frontend Structure

### Pages
1. `/` - Landing page
2. `/auth/*` - Authentication pages
3. `/dashboard` - User dashboard (different views for tutors/students)
4. `/tutors` - Tutor listing (student view)
5. `/tutors/[id]` - Tutor profile (student view)
6. `/sessions` - Session management (different views for tutors/students)
7. `/chat` - Chat interface (different views for tutors/students)
8. `/settings` - User settings
9. `/tutor-dashboard` - Tutor-specific dashboard
10. `/tutor-profile` - Tutor's own profile management
11. `/inbox` - Message inbox (different views for tutors/students)

### Components
1. `Layout/`
   - Header
   - Navigation
   - Footer
2. `Auth/`
   - LoginForm
   - RegisterForm
   - TutorRegistrationForm
   - StudentRegistrationForm
3. `Tutors/`
   - TutorCard
   - TutorList
   - SubjectFilter
   - TutorProfile
   - TutorAvailability
4. `Sessions/`
   - SessionCard
   - SessionForm
   - SessionCalendar
   - SessionDetails
   - SessionBookingModal
5. `Chat/`
   - ChatWindow
   - MessageList
   - MessageInput
   - ChatSidebar
   - ConversationList
6. `Reviews/`
   - ReviewForm
   - ReviewList
   - RatingStars
7. `Dashboard/`
   - TutorDashboard
   - UpcomingSessions
   - PastSessions
   - EarningsSummary
8. `Messages/`
   - InboxView
   - ConversationThread
   - MessageComposer
   - UnreadMessages

## API Endpoints

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

### Tutors
- `GET /api/tutors`
- `GET /api/tutors/[id]`
- `GET /api/tutors/subjects`

### Sessions
- `POST /api/sessions`
- `GET /api/sessions`
- `GET /api/sessions/[id]`
- `PATCH /api/sessions/[id]`

### Reviews
- `POST /api/reviews`
- `GET /api/reviews/tutor/[id]`

### Chat
- `GET /api/chat/rooms`
- `GET /api/chat/messages/[roomId]`
- `POST /api/chat/messages`
- `GET /api/chat/unread-count`
- `PATCH /api/chat/messages/[id]/read`
- `GET /api/chat/conversations` (different for tutors/students)

### Notifications
- `POST /api/notify-message` - Send email notifications

### Dashboard
- `GET /api/dashboard/tutor`
- `GET /api/dashboard/upcoming-sessions`
- `GET /api/dashboard/past-sessions`
- `GET /api/dashboard/earnings`

## Future Enhancements (Phase 2+)

1. **Tutor Verification System**
   - Document upload
   - Background check integration
   - Qualification verification

2. **Advanced Scheduling**
   - Calendar integration
   - Recurring sessions
   - Availability management

3. **Video Integration**
   - Zoom API integration
   - Session recording
   - Screen sharing

4. **Learning Materials**
   - File sharing
   - Resource library
   - Progress tracking

5. **Payment Integration**
   - Stripe payment processing
   - Subscription plans
   - Multiple currencies
   - Automated payouts

## Security Considerations

1. **Data Protection**
   - Encrypt sensitive data
   - Implement row-level security in Supabase
   - Regular security audits

2. **Email Security**
   - Server-side email delivery
   - Authentication validation for notifications
   - Rate limiting to prevent abuse
   - Secure API key management

3. **User Privacy**
   - GDPR compliance
   - Data retention policies
   - Privacy policy

## Deployment Strategy

1. **Environment Setup**
   - Development
   - Staging
   - Production

2. **CI/CD Pipeline**
   - GitHub Actions
   - Automated testing
   - Deployment automation

3. **Monitoring**
   - Error tracking
   - Performance monitoring
   - Usage analytics

## Initial Development Phases

### Phase 1 (Core Features)
1. Basic user authentication
2. Tutor and student profiles
   - Profile image upload
   - Image optimization
3. Subject management
4. Session booking
   - Flexible duration
   - Rate management
   - Price calculation
5. Basic chat functionality
   - Separate inbox views for tutors and students
   - Real-time messaging
   - Message notifications
6. Email notifications
   - Server-side email delivery with Resend
   - Authentication-protected API routes
   - Rate limiting to prevent spam
7. Payment processing
8. Simple review system
9. Role-specific dashboards

### Phase 2 (Enhancements)
1. Advanced scheduling
2. Video integration
3. Learning materials
4. Enhanced reviews
5. Analytics dashboard

### Phase 3 (Advanced Features)
1. Mobile app
2. Advanced analytics
3. AI-powered matching
4. Community features

## Design System

### Color Palette
```css
/* Primary Colors */
--primary-50: #f0f9ff;  /* Lightest blue */
--primary-100: #e0f2fe;
--primary-200: #bae6fd;
--primary-300: #7dd3fc;
--primary-400: #38bdf8;
--primary-500: #0ea5e9;  /* Main brand blue */
--primary-600: #0284c7;
--primary-700: #0369a1;
--primary-800: #075985;
--primary-900: #0c4a6e;  /* Darkest blue */

/* Secondary Colors */
--secondary-50: #fdf4ff;  /* Lightest purple */
--secondary-100: #fae8ff;
--secondary-200: #f5d0fe;
--secondary-300: #f0abfc;
--secondary-400: #e879f9;
--secondary-500: #d946ef;  /* Main accent purple */
--secondary-600: #c026d3;
--secondary-700: #a21caf;
--secondary-800: #86198f;
--secondary-900: #701a75;  /* Darkest purple */

/* Neutral Colors */
--neutral-50: #f8fafc;
--neutral-100: #f1f5f9;
--neutral-200: #e2e8f0;
--neutral-300: #cbd5e1;
--neutral-400: #94a3b8;
--neutral-500: #64748b;
--neutral-600: #475569;
--neutral-700: #334155;
--neutral-800: #1e293b;
--neutral-900: #0f172a;

/* Semantic Colors */
--success: #10b981;  /* Green */
--warning: #f59e0b;  /* Amber */
--error: #ef4444;    /* Red */
--info: #3b82f6;     /* Blue */
```

### Typography
```css
/* Font Families */
--font-primary: 'Inter', system-ui, -apple-system, sans-serif;
--font-heading: 'Poppins', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
--text-5xl: 3rem;      /* 48px */
```

### Spacing System
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

### Component Design

#### Buttons
```css
/* Primary Button */
.btn-primary {
  background-color: var(--primary-500);
  color: white;
  padding: var(--space-3) var(--space-6);
  border-radius: 0.5rem;
  font-weight: 600;
  transition: all 0.2s;
}

/* Secondary Button */
.btn-secondary {
  background-color: var(--secondary-500);
  color: white;
  padding: var(--space-3) var(--space-6);
  border-radius: 0.5rem;
  font-weight: 600;
  transition: all 0.2s;
}

/* Ghost Button */
.btn-ghost {
  background-color: transparent;
  color: var(--primary-500);
  padding: var(--space-3) var(--space-6);
  border-radius: 0.5rem;
  font-weight: 600;
  transition: all 0.2s;
}
```

#### Cards
```css
.card {
  background-color: white;
  border-radius: 1rem;
  padding: var(--space-6);
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  transition: all 0.2s;
}

.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
```

#### Form Elements
```css
.input {
  border: 1px solid var(--neutral-200);
  border-radius: 0.5rem;
  padding: var(--space-3) var(--space-4);
  transition: all 0.2s;
}

.input:focus {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 2px var(--primary-100);
}
```

### Design Principles

1. **Accessibility**
   - WCAG 2.1 AA compliance
   - High contrast ratios
   - Keyboard navigation
   - Screen reader support

2. **Responsive Design**
   - Mobile-first approach
   - Breakpoints:
     - sm: 640px
     - md: 768px
     - lg: 1024px
     - xl: 1280px
     - 2xl: 1536px

3. **Animation & Transitions**
   - Subtle hover effects
   - Smooth page transitions
   - Loading states
   - Micro-interactions

4. **Layout Grid**
   - 12-column grid system
   - Consistent spacing
   - Flexible containers
   - Responsive gutters

### Theme Implementation

1. **Light Theme (Default)**
   - White backgrounds
   - Dark text
   - Subtle shadows
   - High contrast

2. **Dark Theme**
   - Dark backgrounds
   - Light text
   - Glowing accents
   - Reduced contrast

### Component Library
- Built with Tailwind CSS
- Custom components extend base styles
- Consistent spacing and typography
- Reusable design patterns

### Design Assets
- Custom illustrations
- Icon set (Phosphor Icons)
- Loading animations
- Empty states
- Error states
- Success states

## Messaging System

### Direct Messaging
- Students can message tutors directly from their profile
- Messages are organized in chat rooms
- Each chat room can have multiple participants
- Messages support read receipts and timestamps
- Real-time notifications for new messages

### Chat Room Types
1. **Direct Messages**
   - One-on-one conversations between users
   - No session association required
   - Persistent chat history
   - Easy access from user profiles

2. **Session Chats**
   - Associated with specific tutoring sessions
   - Includes session context
   - Limited to session participants
   - Archived after session completion

### Security & Access Control
- Row Level Security (RLS) ensures:
  - Users can only access their own chat rooms
  - Messages are only visible to chat room participants
  - Users can only send messages as themselves
  - Chat room creation and participant management is properly controlled

### User Experience
- Clean, intuitive chat interface
- Real-time message delivery
- Message status indicators
- Easy navigation between conversations
- Mobile-responsive design

### Technical Implementation
1. **Database Structure**
   - `chat_rooms` table for room management
   - `chat_participants` for user relationships
   - `chat_messages` for message storage
   - `message_notifications` for real-time updates

2. **Real-time Features**
   - Supabase Realtime for instant updates
   - WebSocket connections for live messaging
   - Push notifications for offline users

3. **Performance Considerations**
   - Pagination for message history
   - Efficient message loading
   - Optimized real-time subscriptions
   - Proper cleanup of old messages 