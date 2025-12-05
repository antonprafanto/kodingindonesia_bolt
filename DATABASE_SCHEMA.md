# Database Schema Documentation

Dokumentasi lengkap schema database untuk platform EduLearn.

## Overview

Database menggunakan PostgreSQL melalui Supabase dengan Row Level Security (RLS) enabled untuk semua tabel.

## Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   profiles   │───────│   courses    │───────│  categories  │
└──────────────┘       └──────────────┘       └──────────────┘
       │                      │                       │
       │                      │                  (self-ref)
       │                      │
       │               ┌──────────────┐
       │               │   modules    │
       │               └──────────────┘
       │                      │
       │               ┌──────────────┐
       │               │   lessons    │
       │               └──────────────┘
       │                      │
       │               ┌──────────────┐
       │               │   quizzes    │
       │               └──────────────┘
       │                      │
       │               ┌──────────────┐
       │               │  questions   │
       │               └──────────────┘
       │                      │
       │               ┌──────────────┐
       │               │   answers    │
       │               └──────────────┘
       │
       ├────────────┬──────────────┬─────────────┬──────────────┐
       │            │              │             │              │
┌──────────────┐ ┌──────────┐ ┌────────┐ ┌──────────────┐ ┌──────────────┐
│ enrollments  │ │ reviews  │ │discuss │ │certificates  │ │notifications │
└──────────────┘ └──────────┘ └────────┘ └──────────────┘ └──────────────┘
       │
┌──────────────────┐
│ lesson_progress  │
└──────────────────┘
```

## Tables

### 1. profiles

Extended user profiles with role-based access control.

```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  role user_role DEFAULT 'student' NOT NULL,
  bio text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
```

**Columns:**
- `id` - UUID, references auth.users (Supabase Auth)
- `email` - User email address (unique)
- `full_name` - User's full name
- `avatar_url` - URL to profile picture
- `role` - User role: 'student' | 'instructor' | 'admin'
- `bio` - User biography/description
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp (auto-updated)

**Indexes:**
- Primary key on `id`
- Unique index on `email`
- Index on `role` for filtering

**RLS Policies:**
- Anyone can view profiles
- Users can update own profile
- Admins can update any profile

---

### 2. categories

Hierarchical course categories for organization.

```sql
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
```

**Columns:**
- `id` - UUID primary key
- `name` - Category name (e.g., "Programming")
- `slug` - URL-friendly identifier (e.g., "programming")
- `description` - Category description
- `parent_id` - Parent category for subcategories (nullable)
- `created_at` - Creation timestamp

**Indexes:**
- Primary key on `id`
- Unique index on `slug`
- Index on `parent_id`

**RLS Policies:**
- Anyone can view categories
- Only admins can create/update/delete

---

### 3. courses

Main course information with instructor relationship.

```sql
CREATE TABLE courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  thumbnail_url text,
  instructor_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  level course_level DEFAULT 'beginner' NOT NULL,
  price numeric(10, 2) DEFAULT 0 NOT NULL,
  is_published boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
```

**Columns:**
- `id` - UUID primary key
- `title` - Course title
- `slug` - URL-friendly identifier
- `description` - Detailed course description
- `thumbnail_url` - Course thumbnail image URL
- `instructor_id` - Foreign key to profiles (instructor)
- `category_id` - Foreign key to categories
- `level` - Course difficulty: 'beginner' | 'intermediate' | 'advanced'
- `price` - Course price (0 for free)
- `is_published` - Publication status (draft vs published)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp (auto-updated)

**Indexes:**
- Primary key on `id`
- Unique index on `slug`
- Index on `instructor_id`
- Index on `category_id`
- Index on `is_published`

**RLS Policies:**
- Anyone can view published courses
- Instructors can view own courses (published or not)
- Instructors can create courses
- Instructors can update/delete own courses
- Admins have full access

---

### 4. modules

Course content organization into modules/sections.

```sql
CREATE TABLE modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  order_index integer NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(course_id, order_index)
);
```

**Columns:**
- `id` - UUID primary key
- `course_id` - Foreign key to courses
- `title` - Module title (e.g., "Introduction to React")
- `description` - Module description
- `order_index` - Display order within course
- `created_at` - Creation timestamp

**Constraints:**
- Unique constraint on (course_id, order_index)

**Indexes:**
- Primary key on `id`
- Index on `course_id`

**RLS Policies:**
- Anyone can view modules from published courses
- Instructors can manage modules in own courses
- Admins have full access

---

### 5. lessons

Individual learning content units within modules.

```sql
CREATE TABLE lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES modules(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  content_type content_type NOT NULL,
  video_url text,
  duration_minutes integer,
  order_index integer NOT NULL,
  is_preview boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(module_id, order_index)
);
```

**Columns:**
- `id` - UUID primary key
- `module_id` - Foreign key to modules
- `title` - Lesson title
- `content` - Main lesson content (text, HTML, or markdown)
- `content_type` - Type: 'video' | 'text' | 'quiz' | 'document'
- `video_url` - Video URL if content_type is 'video'
- `duration_minutes` - Estimated duration in minutes
- `order_index` - Display order within module
- `is_preview` - Whether lesson is free preview
- `created_at` - Creation timestamp

**Constraints:**
- Unique constraint on (module_id, order_index)

**Indexes:**
- Primary key on `id`
- Index on `module_id`

**RLS Policies:**
- Anyone can view lessons from published courses
- Instructors can manage lessons in own courses
- Admins have full access

---

### 6. enrollments

Student course registrations and progress tracking.

```sql
CREATE TABLE enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  enrolled_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz,
  progress_percentage integer DEFAULT 0 NOT NULL CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  UNIQUE(user_id, course_id)
);
```

**Columns:**
- `id` - UUID primary key
- `user_id` - Foreign key to profiles (student)
- `course_id` - Foreign key to courses
- `enrolled_at` - Enrollment timestamp
- `completed_at` - Course completion timestamp (nullable)
- `progress_percentage` - Overall progress (0-100)

**Constraints:**
- Unique constraint on (user_id, course_id) - one enrollment per student per course
- Check constraint on progress_percentage (0-100)

**Indexes:**
- Primary key on `id`
- Index on `user_id`
- Index on `course_id`

**RLS Policies:**
- Students can view own enrollments
- Instructors can view enrollments for own courses
- Students can enroll in published courses
- Students can update own enrollment progress

---

### 7. lesson_progress

Granular tracking of individual lesson completion.

```sql
CREATE TABLE lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
  completed boolean DEFAULT false NOT NULL,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, lesson_id)
);
```

**Columns:**
- `id` - UUID primary key
- `user_id` - Foreign key to profiles (student)
- `lesson_id` - Foreign key to lessons
- `completed` - Completion status
- `completed_at` - Completion timestamp (nullable)
- `created_at` - First access timestamp

**Constraints:**
- Unique constraint on (user_id, lesson_id)

**Indexes:**
- Primary key on `id`
- Index on `user_id`
- Index on `lesson_id`

**RLS Policies:**
- Students can view and update own progress
- Instructors can view progress for own course students
- Admins have full access

---

### 8. quizzes

Quiz/assessment definitions for lessons.

```sql
CREATE TABLE quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  passing_score integer DEFAULT 70 NOT NULL CHECK (passing_score >= 0 AND passing_score <= 100),
  time_limit_minutes integer,
  created_at timestamptz DEFAULT now() NOT NULL
);
```

**Columns:**
- `id` - UUID primary key
- `lesson_id` - Foreign key to lessons
- `title` - Quiz title
- `description` - Quiz description/instructions
- `passing_score` - Minimum score to pass (0-100)
- `time_limit_minutes` - Time limit (nullable for untimed)
- `created_at` - Creation timestamp

**Constraints:**
- Check constraint on passing_score (0-100)

**Indexes:**
- Primary key on `id`
- Index on `lesson_id`

**RLS Policies:**
- Anyone can view quizzes from published courses
- Instructors can manage quizzes in own courses
- Admins have full access

---

### 9. questions

Individual quiz questions with multiple types.

```sql
CREATE TABLE questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  question_text text NOT NULL,
  question_type question_type NOT NULL,
  points integer DEFAULT 1 NOT NULL,
  order_index integer NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(quiz_id, order_index)
);
```

**Columns:**
- `id` - UUID primary key
- `quiz_id` - Foreign key to quizzes
- `question_text` - Question content
- `question_type` - Type: 'multiple_choice' | 'true_false' | 'essay' | 'matching'
- `points` - Points awarded for correct answer
- `order_index` - Display order within quiz
- `created_at` - Creation timestamp

**Constraints:**
- Unique constraint on (quiz_id, order_index)

**Indexes:**
- Primary key on `id`
- Index on `quiz_id`

**RLS Policies:**
- Anyone can view questions from published courses
- Instructors can manage questions in own courses
- Admins have full access

---

### 10. answers

Possible answers for quiz questions.

```sql
CREATE TABLE answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  answer_text text NOT NULL,
  is_correct boolean DEFAULT false NOT NULL,
  order_index integer NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
```

**Columns:**
- `id` - UUID primary key
- `question_id` - Foreign key to questions
- `answer_text` - Answer content
- `is_correct` - Whether this is correct answer
- `order_index` - Display order
- `created_at` - Creation timestamp

**Indexes:**
- Primary key on `id`
- Index on `question_id`

**RLS Policies:**
- Anyone can view answers from published courses
- Instructors can manage answers in own courses
- Admins have full access

---

### 11. quiz_attempts

Student quiz submission records.

```sql
CREATE TABLE quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  score integer DEFAULT 0 NOT NULL CHECK (score >= 0 AND score <= 100),
  passed boolean DEFAULT false NOT NULL,
  started_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz
);
```

**Columns:**
- `id` - UUID primary key
- `user_id` - Foreign key to profiles (student)
- `quiz_id` - Foreign key to quizzes
- `score` - Achieved score percentage (0-100)
- `passed` - Whether score >= passing_score
- `started_at` - Attempt start timestamp
- `completed_at` - Attempt completion timestamp (nullable)

**Constraints:**
- Check constraint on score (0-100)

**Indexes:**
- Primary key on `id`
- Index on `user_id`
- Index on `quiz_id`

**RLS Policies:**
- Students can view and create own attempts
- Instructors can view attempts for own courses
- Admins have full access

---

### 12. reviews

Course ratings and reviews with moderation.

```sql
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  is_moderated boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, course_id)
);
```

**Columns:**
- `id` - UUID primary key
- `user_id` - Foreign key to profiles (reviewer)
- `course_id` - Foreign key to courses
- `rating` - Star rating (1-5)
- `comment` - Review text (nullable)
- `is_moderated` - Moderation approval status
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp (auto-updated)

**Constraints:**
- Unique constraint on (user_id, course_id) - one review per user per course
- Check constraint on rating (1-5)

**Indexes:**
- Primary key on `id`
- Index on `user_id`
- Index on `course_id`

**RLS Policies:**
- Anyone can view moderated reviews
- Users can view own reviews (even if not moderated)
- Students can create reviews for enrolled courses
- Users can update own reviews
- Admins can moderate all reviews

---

### 13. discussions

Course discussion forum with threading support.

```sql
CREATE TABLE discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id uuid REFERENCES discussions(id) ON DELETE CASCADE,
  title text,
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
```

**Columns:**
- `id` - UUID primary key
- `course_id` - Foreign key to courses
- `user_id` - Foreign key to profiles (author)
- `parent_id` - Parent discussion for replies (nullable)
- `title` - Discussion title (for top-level posts)
- `content` - Discussion content
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp (auto-updated)

**Indexes:**
- Primary key on `id`
- Index on `course_id`
- Index on `user_id`
- Index on `parent_id`

**RLS Policies:**
- Enrolled students can view course discussions
- Enrolled students can create discussions
- Authors can update/delete own discussions
- Instructors can view all discussions in own courses
- Admins have full access

---

### 14. certificates

Generated course completion certificates.

```sql
CREATE TABLE certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  certificate_url text NOT NULL,
  issued_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, course_id)
);
```

**Columns:**
- `id` - UUID primary key
- `user_id` - Foreign key to profiles (student)
- `course_id` - Foreign key to courses
- `certificate_url` - Generated certificate file URL
- `issued_at` - Issue timestamp

**Constraints:**
- Unique constraint on (user_id, course_id) - one certificate per student per course

**Indexes:**
- Primary key on `id`
- Index on `user_id`
- Index on `course_id`

**RLS Policies:**
- Students can view own certificates
- Instructors can view certificates for own courses
- System can create certificates
- Admins have full access

---

### 15. notifications

User notification queue system.

```sql
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
```

**Columns:**
- `id` - UUID primary key
- `user_id` - Foreign key to profiles (recipient)
- `title` - Notification title
- `message` - Notification content
- `type` - Notification type/category
- `is_read` - Read status
- `created_at` - Creation timestamp

**Indexes:**
- Primary key on `id`
- Index on `user_id`
- Index on `is_read`

**RLS Policies:**
- Users can view own notifications
- System can create notifications
- Users can update own notifications (mark as read)
- Users can delete own notifications

---

## Custom Types (Enums)

```sql
CREATE TYPE user_role AS ENUM ('student', 'instructor', 'admin');
CREATE TYPE course_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE content_type AS ENUM ('video', 'text', 'quiz', 'document');
CREATE TYPE question_type AS ENUM ('multiple_choice', 'true_false', 'essay', 'matching');
```

## Functions

### update_updated_at_column()

Automatically updates the `updated_at` timestamp when a row is modified.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### handle_new_user()

Automatically creates a profile when a new user registers via Supabase Auth.

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Triggers

- `update_profiles_updated_at` - Auto-update profiles.updated_at
- `update_courses_updated_at` - Auto-update courses.updated_at
- `update_reviews_updated_at` - Auto-update reviews.updated_at
- `update_discussions_updated_at` - Auto-update discussions.updated_at
- `on_auth_user_created` - Auto-create profile on user registration

## Best Practices

### Querying

1. **Use indexes** - All foreign keys are indexed
2. **Filter by published status** - Always check `is_published` for courses
3. **Use pagination** - Limit results with `limit()` and `offset()`
4. **Select specific columns** - Don't use `select('*')` unless needed

### Security

1. **RLS is mandatory** - Never disable RLS on production
2. **Validate on client** - Don't rely solely on RLS
3. **Use parameterized queries** - Prevents SQL injection
4. **Audit sensitive operations** - Log admin actions

### Performance

1. **Optimize JOIN queries** - Minimize nested queries
2. **Use database functions** - Complex calculations on server
3. **Cache frequently accessed data** - Use React Query
4. **Monitor slow queries** - Use Supabase dashboard

---

**Last Updated:** 2024-12-05
