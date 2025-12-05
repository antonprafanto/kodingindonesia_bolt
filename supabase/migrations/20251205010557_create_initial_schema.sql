/*
  # Create Learning Platform Database Schema

  ## Overview
  Complete schema for an online learning platform with courses, lessons, quizzes, 
  discussions, reviews, and comprehensive user management.

  ## Tables Created

  ### 1. profiles
  Extended user profiles with role-based access control
  - `id` (uuid, primary key) - References auth.users
  - `email` (text) - User email address
  - `full_name` (text) - User's full name
  - `avatar_url` (text) - Profile picture URL
  - `role` (enum) - User role: student, instructor, or admin
  - `bio` (text) - User biography
  - Timestamps: created_at, updated_at

  ### 2. categories
  Hierarchical course categories for organization
  - `id` (uuid, primary key)
  - `name` (text) - Category name
  - `slug` (text) - URL-friendly identifier
  - `description` (text) - Category description
  - `parent_id` (uuid) - Self-referencing for subcategories
  - Timestamp: created_at

  ### 3. courses
  Main course information with instructor relationship
  - `id` (uuid, primary key)
  - `title` (text) - Course title
  - `slug` (text) - URL-friendly identifier
  - `description` (text) - Detailed course description
  - `thumbnail_url` (text) - Course thumbnail image
  - `instructor_id` (uuid) - Foreign key to profiles
  - `category_id` (uuid) - Foreign key to categories
  - `level` (enum) - beginner, intermediate, or advanced
  - `price` (numeric) - Course price (0 for free)
  - `is_published` (boolean) - Publication status
  - Timestamps: created_at, updated_at

  ### 4. modules
  Course content organization into modules/sections
  - `id` (uuid, primary key)
  - `course_id` (uuid) - Foreign key to courses
  - `title` (text) - Module title
  - `description` (text) - Module description
  - `order_index` (integer) - Display order
  - Timestamp: created_at

  ### 5. lessons
  Individual learning content units within modules
  - `id` (uuid, primary key)
  - `module_id` (uuid) - Foreign key to modules
  - `title` (text) - Lesson title
  - `content` (text) - Main lesson content
  - `content_type` (enum) - video, text, quiz, or document
  - `video_url` (text) - Video URL if applicable
  - `duration_minutes` (integer) - Estimated duration
  - `order_index` (integer) - Display order
  - `is_preview` (boolean) - Free preview availability
  - Timestamp: created_at

  ### 6. enrollments
  Student course registrations and progress tracking
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Foreign key to profiles
  - `course_id` (uuid) - Foreign key to courses
  - `enrolled_at` (timestamp) - Enrollment date
  - `completed_at` (timestamp) - Completion date if finished
  - `progress_percentage` (integer) - Overall progress 0-100

  ### 7. lesson_progress
  Granular tracking of individual lesson completion
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Foreign key to profiles
  - `lesson_id` (uuid) - Foreign key to lessons
  - `completed` (boolean) - Completion status
  - `completed_at` (timestamp) - Completion timestamp
  - Timestamp: created_at

  ### 8. quizzes
  Quiz/assessment definitions for lessons
  - `id` (uuid, primary key)
  - `lesson_id` (uuid) - Foreign key to lessons
  - `title` (text) - Quiz title
  - `description` (text) - Quiz description
  - `passing_score` (integer) - Minimum score to pass (0-100)
  - `time_limit_minutes` (integer) - Time limit if applicable
  - Timestamp: created_at

  ### 9. questions
  Individual quiz questions with multiple types
  - `id` (uuid, primary key)
  - `quiz_id` (uuid) - Foreign key to quizzes
  - `question_text` (text) - Question content
  - `question_type` (enum) - multiple_choice, true_false, essay, or matching
  - `points` (integer) - Points awarded
  - `order_index` (integer) - Display order
  - Timestamp: created_at

  ### 10. answers
  Possible answers for quiz questions
  - `id` (uuid, primary key)
  - `question_id` (uuid) - Foreign key to questions
  - `answer_text` (text) - Answer content
  - `is_correct` (boolean) - Correctness flag
  - `order_index` (integer) - Display order
  - Timestamp: created_at

  ### 11. quiz_attempts
  Student quiz submission records
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Foreign key to profiles
  - `quiz_id` (uuid) - Foreign key to quizzes
  - `score` (integer) - Achieved score percentage
  - `passed` (boolean) - Pass/fail status
  - `started_at` (timestamp) - Attempt start time
  - `completed_at` (timestamp) - Attempt completion time

  ### 12. reviews
  Course ratings and reviews with moderation
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Foreign key to profiles
  - `course_id` (uuid) - Foreign key to courses
  - `rating` (integer) - Star rating 1-5
  - `comment` (text) - Review text
  - `is_moderated` (boolean) - Moderation approval status
  - Timestamps: created_at, updated_at

  ### 13. discussions
  Course discussion forum with threading support
  - `id` (uuid, primary key)
  - `course_id` (uuid) - Foreign key to courses
  - `user_id` (uuid) - Foreign key to profiles
  - `parent_id` (uuid) - Self-referencing for replies
  - `title` (text) - Discussion title (for top-level posts)
  - `content` (text) - Discussion content
  - Timestamps: created_at, updated_at

  ### 14. certificates
  Generated course completion certificates
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Foreign key to profiles
  - `course_id` (uuid) - Foreign key to courses
  - `certificate_url` (text) - Generated certificate file URL
  - Timestamp: issued_at

  ### 15. notifications
  User notification queue system
  - `id` (uuid, primary key)
  - `user_id` (uuid) - Foreign key to profiles
  - `title` (text) - Notification title
  - `message` (text) - Notification content
  - `type` (text) - Notification type/category
  - `is_read` (boolean) - Read status
  - Timestamp: created_at

  ## Security
  Row Level Security (RLS) is enabled on all tables with appropriate policies
  defined in the next migration file.

  ## Indexes
  Indexes are created on foreign keys and frequently queried columns for
  optimal performance.
*/

-- Create custom types/enums
CREATE TYPE user_role AS ENUM ('student', 'instructor', 'admin');
CREATE TYPE course_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE content_type AS ENUM ('video', 'text', 'quiz', 'document');
CREATE TYPE question_type AS ENUM ('multiple_choice', 'true_false', 'essay', 'matching');

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  role user_role DEFAULT 'student' NOT NULL,
  bio text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
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

-- Create modules table
CREATE TABLE IF NOT EXISTS modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  order_index integer NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(course_id, order_index)
);

-- Create lessons table
CREATE TABLE IF NOT EXISTS lessons (
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

-- Create enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  enrolled_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz,
  progress_percentage integer DEFAULT 0 NOT NULL CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  UNIQUE(user_id, course_id)
);

-- Create lesson_progress table
CREATE TABLE IF NOT EXISTS lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
  completed boolean DEFAULT false NOT NULL,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, lesson_id)
);

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  passing_score integer DEFAULT 70 NOT NULL CHECK (passing_score >= 0 AND passing_score <= 100),
  time_limit_minutes integer,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  question_text text NOT NULL,
  question_type question_type NOT NULL,
  points integer DEFAULT 1 NOT NULL,
  order_index integer NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(quiz_id, order_index)
);

-- Create answers table
CREATE TABLE IF NOT EXISTS answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  answer_text text NOT NULL,
  is_correct boolean DEFAULT false NOT NULL,
  order_index integer NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create quiz_attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  score integer DEFAULT 0 NOT NULL CHECK (score >= 0 AND score <= 100),
  passed boolean DEFAULT false NOT NULL,
  started_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
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

-- Create discussions table
CREATE TABLE IF NOT EXISTS discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id uuid REFERENCES discussions(id) ON DELETE CASCADE,
  title text,
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  certificate_url text NOT NULL,
  issued_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, course_id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_category_id ON courses(category_id);
CREATE INDEX IF NOT EXISTS idx_courses_is_published ON courses(is_published);

CREATE INDEX IF NOT EXISTS idx_modules_course_id ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON lessons(module_id);

CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id ON lesson_progress(lesson_id);

CREATE INDEX IF NOT EXISTS idx_quizzes_lesson_id ON quizzes(lesson_id);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);

CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_course_id ON reviews(course_id);

CREATE INDEX IF NOT EXISTS idx_discussions_course_id ON discussions(course_id);
CREATE INDEX IF NOT EXISTS idx_discussions_user_id ON discussions(user_id);
CREATE INDEX IF NOT EXISTS idx_discussions_parent_id ON discussions(parent_id);

CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course_id ON certificates(course_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discussions_updated_at
  BEFORE UPDATE ON discussions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle user registration
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

-- Create trigger for new user registration
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION handle_new_user();
  END IF;
END $$;