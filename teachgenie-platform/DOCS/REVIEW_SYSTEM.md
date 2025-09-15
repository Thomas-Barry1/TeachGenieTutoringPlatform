# Review System Documentation

## Overview
The TeachGenie review system allows students to provide feedback on completed tutoring sessions. The system has been enhanced to prevent multiple reviews per session and allow limited editing capabilities.

## Features

### 1. **One Review Per Session**
- Students can only submit one review per completed session
- Database-level unique constraint prevents duplicate reviews
- Clear error messages when attempting to submit duplicate reviews

### 2. **Review Editing**
- Students can edit their reviews at any time
- No time restrictions on editing or updating feedback
- Visual indicators show when reviews have been modified

### 3. **Review Validation**
- Only students who participated in the session can review it
- Only completed sessions can be reviewed
- Proper authentication and authorization checks

### 4. **User Experience**
- Dynamic button text based on review status:
  - "Write a Review" for new reviews
  - "Edit Review" for existing reviews
- Loading states and clear error messages
- Responsive design for all screen sizes

## Database Schema

### Reviews Table
```sql
CREATE TABLE public.reviews (
  id UUID DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES public.sessions,
  student_id UUID REFERENCES public.profiles,
  tutor_id UUID REFERENCES public.tutor_profiles,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (id),
  UNIQUE(session_id, student_id) -- Prevent multiple reviews per session per student
);
```

### Key Constraints
- **Unique Constraint**: `(session_id, student_id)` prevents multiple reviews
- **Rating Range**: 1-5 stars only
- **Foreign Keys**: Links to sessions, students, and tutors

## Row Level Security (RLS) Policies

### View Policy
```sql
CREATE POLICY "View all reviews"
  ON public.reviews FOR SELECT
  USING (true);
```
- All authenticated users can view reviews
- Public access for tutor profiles and listings

### Create Policy
```sql
CREATE POLICY "Create session review"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = student_id AND
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = reviews.session_id
      AND sessions.student_id = auth.uid()
      AND sessions.status = 'completed'
    )
  );
```
- Only the student who participated in the session can create a review
- Session must be completed

### Update Policy
```sql
CREATE POLICY "Update own review"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = student_id);
```
- Students can only edit their own reviews
- No time restrictions on editing

### Delete Policy
```sql
CREATE POLICY "Delete own review"
  ON public.reviews FOR DELETE
  USING (auth.uid() = student_id);
```
- Students can only delete their own reviews
- No time restrictions on deletion

## API Endpoints

### Review Creation/Update
- **Route**: `/reviews/?sessionId={sessionId}`
- **Method**: GET (form), POST (submit)
- **Authentication**: Required
- **Authorization**: Student must be session participant

### Review Display
- **Route**: `/tutors/[id]` (tutor profile page)
- **Method**: GET
- **Authentication**: Not required
- **Authorization**: Public access

## Frontend Components

### ReviewPage Component
- **Location**: `src/app/reviews/page.tsx`
- **Features**:
  - Loads session and existing review data
  - Handles both creation and editing modes
  - Validates editing permissions
  - Provides clear user feedback

### SessionCard Component
- **Location**: `src/components/sessions/SessionCard.tsx`
- **Features**:
  - Checks for existing reviews
  - Shows appropriate button text
  - Handles loading states
  - Links to review page

## User Flow

### Creating a New Review
1. Student completes a tutoring session
2. Session status changes to "completed"
3. Student sees "Write a Review" button in session card
4. Student clicks button and is taken to review form
5. Student fills out rating and comment
6. Review is submitted and stored in database
7. Student is redirected to dashboard

### Editing an Existing Review
1. Student visits review page for a session they've already reviewed
2. System detects existing review and loads it into form
3. Form shows "Edit Review" title and existing data
4. Student can modify rating and comment at any time
5. Updated review is saved with new `updated_at` timestamp

### Viewing Reviews
1. Reviews are displayed on tutor profile pages
2. Reviews show student name, rating, comment, and timestamp
3. Reviews are sorted by creation date (newest first)
4. Average rating and review count are calculated for tutor summaries

## Error Handling

### Common Error Scenarios
1. **Duplicate Review**: Clear message explaining one review per session
2. **Unauthorized Access**: Redirect to login or dashboard
3. **Session Not Found**: Clear error message with navigation option
4. **Network Errors**: Graceful fallback with retry options

### Error Messages
- "You have already reviewed this session"
- "You can only review sessions you participated in"
- "Can only review completed sessions"
- "Failed to submit review" (with retry option)

## Performance Considerations

### Database Indexes
```sql
CREATE INDEX IF NOT EXISTS idx_reviews_tutor_id ON public.reviews(tutor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_session_id ON public.reviews(session_id);
CREATE INDEX IF NOT EXISTS idx_reviews_student_id ON public.reviews(student_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at);
```

### Frontend Optimizations
- Lazy loading of review data
- Efficient review checking in SessionCard
- Proper error boundaries and loading states
- Optimized re-renders with React hooks

## Security Features

### Data Protection
- Row Level Security ensures users only access their own reviews
- Input validation on rating and comment fields
- SQL injection prevention through parameterized queries
- XSS prevention through proper content sanitization

### Access Control
- Authentication required for all review operations
- Authorization checks ensure proper user permissions
- Session validation prevents unauthorized access
- Rate limiting prevents spam reviews

## Migration Guide

### For Existing Databases
Run the migration script to add constraints and fields:
```sql
-- Execute the migration script in src/lib/supabase/migrations/add_review_constraints.sql
```

### Migration Steps
1. Add `updated_at` column to reviews table
2. Set `updated_at = created_at` for existing reviews
3. Remove duplicate reviews (keep most recent)
4. Add unique constraint on `(session_id, student_id)`
5. Add new RLS policies for editing and deletion (no time restrictions)

## Future Enhancements

### Planned Features
1. **Review Moderation**: Admin tools for managing inappropriate reviews
2. **Review Responses**: Allow tutors to respond to reviews
3. **Review Analytics**: Detailed metrics and insights
4. **Review Templates**: Predefined review categories
5. **Review Notifications**: Email alerts for new reviews

### Technical Improvements
1. **Review Caching**: Improve performance for frequently viewed reviews
2. **Review Search**: Advanced filtering and search capabilities
3. **Review Export**: Data export functionality for analytics
4. **Review API**: RESTful API for external integrations

## Testing

### Unit Tests
- Review creation and validation logic
- Editing permission checks
- Error handling scenarios
- Database constraint testing

### Integration Tests
- End-to-end review flow
- Authentication and authorization
- Database operations
- UI component interactions

### Manual Testing Checklist
- [ ] Create new review for completed session
- [ ] Attempt to create duplicate review (should fail)
- [ ] Edit review immediately after creation (should succeed)
- [ ] Edit review after extended time period (should succeed)
- [ ] View reviews on tutor profile
- [ ] Test error scenarios and edge cases 