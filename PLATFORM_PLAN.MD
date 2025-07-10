# TeachGenie Tutoring Platform Plan

## Tech Stack
- **Frontend**: Next.js 14 (App Router)
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Email**: Resend
- **Payment Processing**: Stripe Connect (destination charges)
- **Deployment**: Vercel
- **File Storage**: Supabase Storage
- **Styling**: Tailwind CSS

## Core Features (Phase 1) - ✅ COMPLETED

### 1. User Management ✅
- User profiles with role-based access (student/tutor)
- Tutor profiles with bio, hourly rate, verification status
- Subject management with many-to-many relationships
- Profile image upload and management

### 2. Authentication & Authorization ✅
- Separate registration flows for tutors and students
- Email verification required
- Role-based access control
- Protected routes based on user type

### 3. Tutoring Sessions ✅
- Session booking with flexible duration options
- Real-time pricing calculation
- Session status management (scheduled, completed, cancelled)
- Payment integration with platform fees
- **Enhanced Session Management**:
  - Advanced filtering (time, status, payment, subject)
  - Search functionality (by name or subject)
  - Smart pagination (12 sessions per page)
  - Mobile-responsive design
  - Real-time status updates

### 4. Reviews & Ratings ✅
- Student reviews for tutors
- Rating system (1-5 stars)
- Review moderation and display

### 5. Real-time Chat ✅
- Direct messaging between users
- Session-associated chats
- Message notifications and read receipts
- Real-time updates via Supabase Realtime

### 6. Email Notifications ✅
- Server-side email delivery with Resend
- Authentication-protected API routes
- Rate limiting to prevent spam
- Message notifications, session updates, account verification

### 7. Payment System ✅
- **Stripe Connect Integration**:
  - Destination charges for automatic platform fee handling
  - Tutor onboarding with Express dashboard
  - One-time login links for Stripe dashboard access
  - Real-time payment status tracking
  - Secure webhook processing

## Frontend Structure

### Pages
- `/` - Landing page
- `/auth/*` - Authentication pages
- `/dashboard` - User dashboard (role-specific views)
- `/tutors` - Tutor listing and profiles
- `/sessions` - Enhanced session management with filtering and pagination
- `/chat` - Chat interface
- `/inbox` - Message inbox
- `/payments` - Payment management for tutors
- `/stripe-dashboard` - Express dashboard access for tutors
- `/settings` - User settings

### Components
- **Layout**: Header, Navigation, Footer
- **Auth**: LoginForm, RegisterForm, Role-specific forms
- **Tutors**: TutorCard, TutorList, SubjectFilter, TutorProfile
- **Sessions**: 
  - SessionCard - Individual session display with actions
  - SessionFilters - Advanced filtering and search (mobile-responsive)
  - SessionPagination - Smart pagination with responsive design
  - SessionForm, SessionCalendar
- **Chat**: ChatWindow, MessageList, MessageInput
- **Reviews**: ReviewForm, ReviewList, RatingStars
- **Dashboard**: Role-specific dashboards and summaries
- **Payments**: PaymentForm, PaymentWrapper, TutorPayments

## API Endpoints

### Authentication
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`

### Tutors
- `GET /api/tutors`, `GET /api/tutors/[id]`, `GET /api/tutors/subjects`

### Sessions
- `POST /api/sessions`, `GET /api/sessions`, `GET /api/sessions/[id]`, `PATCH /api/sessions/[id]`

### Reviews
- `POST /api/reviews`, `GET /api/reviews/tutor/[id]`

### Chat
- `GET /api/chat/rooms`, `GET /api/chat/messages/[roomId]`, `POST /api/chat/messages`
- `GET /api/chat/unread-count`, `PATCH /api/chat/messages/[id]/read`

### Notifications
- `POST /api/notify-message` - Send email notifications

### Payments (Stripe Connect)
- `POST /api/payments/create-intent` - Creates payment intent with destination charges
- `POST /api/stripe/onboard-tutor` - Initiates tutor Stripe Connect onboarding
- `POST /api/stripe/create-login-link` - Generates Express dashboard login links
- `POST /api/webhooks/stripe` - Handles Stripe webhook events
- `GET /api/stripe/tutor-status` - Checks tutor onboarding status

## Messaging System

### Direct Messaging
- Students can message tutors directly from profiles
- Messages organized in chat rooms with multiple participants
- Read receipts, timestamps, and real-time notifications

### Chat Room Types
1. **Direct Messages**: One-on-one conversations, persistent history
2. **Session Chats**: Session-associated, limited to participants

### Security & Access Control
- RLS policies ensure users only access their own chat rooms
- Messages only visible to chat room participants
- Proper user authentication and authorization

## Legal Compliance

### Terms of Service & Privacy Policy
- Markdown-based legal documents with server-side rendering
- Required agreement during user registration
- Public access to legal documents without authentication
- Version control for audit trail

### Legal Documents
1. **Terms of Service** (`TERMS.md`)
   - User eligibility, marketplace nature, payment policies
   - User conduct, dispute resolution, DMCA policy

2. **Privacy Policy** (`PRIVACY.md`)
   - Data collection, sharing policies, user rights
   - Security measures, children's privacy, update procedures

### Technical Implementation
- Server-side HTML generation from Markdown using `marked` library
- Tailwind Typography for consistent formatting
- Public routes `/TERMS` and `/PRIVACY`
- Checkbox agreement required for registration

### Compliance Requirements
- Explicit user consent with checkbox confirmation
- Public access to legal documents
- Version control for document changes
- GDPR-compliant data handling practices

## Enhanced Session Management (Latest Implementation)

### Advanced Filtering System
- **Time-based filters**: Upcoming, Past, All sessions
- **Status filters**: Scheduled, Completed, Cancelled
- **Payment filters**: Paid, Pending, Failed
- **Subject filters**: Dynamically populated from user's sessions
- **Search functionality**: Search by tutor name, student name, or subject name

### Smart Pagination
- **12 sessions per page** (configurable)
- **Intelligent page navigation** with ellipsis for large page counts
- **Previous/Next navigation** with proper disabled states
- **Page information** showing current range
- **Automatic page reset** when filters change

### Mobile-Responsive Design
- **Collapsible advanced filters** for clean mobile interface
- **Responsive grid layouts** that adapt to screen size
- **Touch-friendly controls** with appropriate sizing
- **Optimized spacing** for mobile devices
- **Progressive disclosure** of advanced features

### Performance Optimizations
- **Client-side filtering** with `useMemo` for instant feedback
- **Efficient pagination** using array slicing
- **Smart data fetching** - fetch once, filter client-side
- **Responsive design** that works on all devices

## Future Enhancements (Phase 2+)

1. **Tutor Verification System**
   - Document upload and background checks
   - Qualification verification

2. **Advanced Scheduling**
   - Calendar integration and recurring sessions
   - Availability management

3. **Video Integration**
   - Zoom API integration and session recording
   - Screen sharing capabilities

4. **Enhanced Payment Features**
   - Subscription plans and recurring payments
   - Advanced payout scheduling
   - Payment analytics and reporting

5. **Learning Materials**
   - File sharing and resource library
   - Progress tracking

6. **Advanced Session Features**
   - Session notes and materials
   - Session templates
   - Bulk session operations
   - Export functionality

## Security Considerations

1. **Data Protection**
   - Row-level security in Supabase
   - Encrypted data transmission
   - Regular security audits

2. **Email Security**
   - Server-side email delivery
   - Authentication validation
   - Rate limiting and abuse prevention

3. **User Privacy**
   - GDPR compliance
   - Data retention policies
   - Privacy policy enforcement

4. **Payment Security**
   - Stripe Connect for secure payment processing
   - Webhook signature verification
   - Server-side payment validation
   - PCI compliance through Stripe

## Development Phases

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

### Phase 1 (Core Features) ✅ COMPLETED
1. Basic user authentication ✅
2. Tutor and student profiles ✅
   - Profile image upload ✅
   - Image optimization ✅
3. Subject management ✅
4. Session booking ✅
   - Flexible duration ✅
   - Rate management ✅
   - Price calculation ✅
5. Basic chat functionality ✅
   - Separate inbox views for tutors and students ✅
   - Real-time messaging ✅
   - Message notifications ✅
6. Email notifications ✅
   - Server-side email delivery with Resend ✅
   - Authentication-protected API routes ✅
   - Rate limiting to prevent spam ✅
7. Payment processing ✅
   - Stripe Connect integration ✅
   - Platform fee handling ✅
   - Tutor onboarding ✅
8. Simple review system ✅
9. Role-specific dashboards ✅
10. **Enhanced Session Management** ✅
    - Advanced filtering and search ✅
    - Smart pagination ✅
    - Mobile-responsive design ✅
    - Real-time updates ✅

### Phase 2 (Enhancements) - IN PROGRESS
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

## Legal Compliance

### Terms of Service & Privacy Policy
- **Implementation**: Markdown-based legal documents with server-side rendering
- **Integration**: Required agreement during user registration
- **Accessibility**: Public access to legal documents without authentication
- **Version Control**: Legal documents tracked in Git for audit trail

### Legal Documents
1. **Terms of Service** (`TERMS.md`)
   - User eligibility requirements (18+ or parent/guardian consent)
   - Marketplace nature and independent contractor status
   - Payment and refund policies
   - User conduct and content guidelines
   - Dispute resolution and arbitration procedures
   - DMCA policy and copyright protection
   - Indemnification and liability limitations

2. **Privacy Policy** (`PRIVACY.md`)
   - Data collection and usage practices
   - Information sharing policies
   - User rights and choices (access, correction, deletion)
   - Data security measures
   - Children's privacy protection (COPPA compliance)
   - Policy update procedures and notification methods

### Technical Implementation
- **Rendering**: Server-side HTML generation from Markdown using `marked` library
- **Styling**: Tailwind Typography plugin for consistent legal document formatting
- **Routes**: `/TERMS` and `/PRIVACY` pages for public access
- **Registration**: Checkbox agreement required for account creation
- **Storage**: Legal documents stored as Markdown files in version control

### Compliance Requirements
1. **User Consent**
   - Explicit agreement to Terms of Service and Privacy Policy
   - Checkbox confirmation during registration
   - Clear indication of agreement requirement

2. **Document Accessibility**
   - Public access to legal documents
   - No authentication required to view terms
   - Clear navigation to legal pages

3. **Update Procedures**
   - Version control for document changes
   - User notification of policy updates
   - Continued use constitutes acceptance of new terms

4. **Data Protection**
   - GDPR-compliant data handling practices
   - User rights for data access and deletion
   - Secure data storage and transmission

### Future Legal Considerations
1. **Regional Compliance**
   - GDPR (European Union)
   - CCPA (California)
   - COPPA (Children's Privacy)
   - State-specific privacy laws

2. **Industry-Specific Requirements**
   - Educational platform regulations
   - Payment processing compliance
   - Background check requirements for tutors

3. **Document Management**
   - Automated legal document versioning
   - User notification system for updates
   - Legal document analytics and tracking 