# EduLearn - Platform Pembelajaran Online

Platform pembelajaran online yang komprehensif, modular, dan user-friendly dengan arsitektur full-stack menggunakan React, TypeScript, dan Supabase.

## Daftar Isi

- [Fitur](#fitur)
- [Teknologi](#teknologi)
- [Instalasi](#instalasi)
- [Struktur Database](#struktur-database)
- [Struktur Project](#struktur-project)
- [Panduan Penggunaan](#panduan-penggunaan)
- [API & Integration](#api--integration)
- [Security](#security)
- [Development](#development)
- [Deployment](#deployment)

## Fitur

### Panel Admin
- ✅ Dashboard dengan analytics dan metrics pembelajaran
- ✅ Course management (CRUD operations)
- ✅ User management dengan role-based access
- ⏳ Media upload system dengan compression
- ⏳ Quiz/exam builder dengan berbagai tipe soal
- ⏳ Student progress tracking dengan visualisasi data
- ⏳ Category & tagging system untuk organisasi konten

### Panel Instruktur
- ✅ Dashboard analytics untuk instruktur
- ✅ Course management untuk instruktur sendiri
- ⏳ Media upload dengan Supabase Storage
- ⏳ Quiz builder dengan question bank
- ⏳ Student progress monitoring
- ⏳ Revenue analytics

### Panel Siswa
- ✅ User registration/login dengan email
- ✅ Course catalog dengan filter dan search
- ⏳ Enrollment system
- ⏳ Learning interface dengan video player
- ⏳ Interactive quiz dengan instant feedback
- ⏳ Progress tracking dashboard
- ⏳ Certificate generation
- ⏳ User profile management

### Fitur Tambahan
- ⏳ Discussion forum per course dengan threading
- ⏳ Rating & review system dengan moderation
- ⏳ Email notification system (automated)
- ✅ Responsive design (mobile-first)
- ⏳ SEO-optimized landing pages
- ⏳ Multi-language support (i18n)

**Legend:** ✅ Implemented | ⏳ Planned | �� In Progress

## Teknologi

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **TailwindCSS** - Utility-first CSS framework
- **React Router v6** - Routing
- **TanStack Query** - Data fetching & caching
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **Lucide React** - Icon library
- **Recharts** - Data visualization

### Backend & Database
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Database
- **Row Level Security** - Database-level security
- **Supabase Auth** - Authentication system
- **Supabase Storage** - File storage
- **Supabase Realtime** - Real-time subscriptions

### Development Tools
- **ESLint** - Code linting
- **TypeScript Compiler** - Type checking
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## Instalasi

### Prerequisites
- Node.js 18.x atau lebih tinggi
- npm atau yarn
- Akun Supabase (sudah dikonfigurasi)

### Setup Project

1. **Clone repository**
```bash
git clone <repository-url>
cd learning-platform
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Variables**

File `.env` sudah dikonfigurasi dengan Supabase credentials:
```env
VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
VITE_SUPABASE_SUPABASE_ANON_KEY=<anon-key>
```

4. **Database Migration**

Database schema sudah diaplikasikan dengan migration files:
- `create_initial_schema.sql` - Membuat semua tabel
- `setup_row_level_security.sql` - Mengatur RLS policies

5. **Run Development Server**
```bash
npm run dev
```

Server akan berjalan di `http://localhost:5173`

6. **Build for Production**
```bash
npm run build
```

## Struktur Database

### Tables

#### 1. profiles
Extended user profiles dengan role-based access
- `id` (uuid) - User ID dari auth.users
- `email` (text) - Email address
- `full_name` (text) - Nama lengkap
- `avatar_url` (text) - URL foto profil
- `role` (enum) - student | instructor | admin
- `bio` (text) - Biografi user

#### 2. categories
Hierarchical course categories
- `id` (uuid)
- `name` (text)
- `slug` (text)
- `parent_id` (uuid) - Self-reference untuk subcategory

#### 3. courses
Main course information
- `id` (uuid)
- `title` (text)
- `slug` (text)
- `description` (text)
- `instructor_id` (uuid) - FK ke profiles
- `category_id` (uuid) - FK ke categories
- `level` (enum) - beginner | intermediate | advanced
- `price` (numeric)
- `is_published` (boolean)

#### 4. modules
Course content organization
- `id` (uuid)
- `course_id` (uuid)
- `title` (text)
- `order_index` (integer)

#### 5. lessons
Individual learning content
- `id` (uuid)
- `module_id` (uuid)
- `title` (text)
- `content` (text)
- `content_type` (enum) - video | text | quiz | document
- `video_url` (text)
- `duration_minutes` (integer)
- `order_index` (integer)
- `is_preview` (boolean)

#### 6. enrollments
Student course registrations
- `id` (uuid)
- `user_id` (uuid)
- `course_id` (uuid)
- `enrolled_at` (timestamp)
- `completed_at` (timestamp)
- `progress_percentage` (integer)

#### 7. lesson_progress
Granular lesson completion tracking
- `id` (uuid)
- `user_id` (uuid)
- `lesson_id` (uuid)
- `completed` (boolean)

#### 8-11. Quiz System
- **quizzes** - Quiz definitions
- **questions** - Quiz questions
- **answers** - Possible answers
- **quiz_attempts** - Student submissions

#### 12-15. Social Features
- **reviews** - Course ratings & reviews
- **discussions** - Course forums
- **certificates** - Course completion certificates
- **notifications** - User notifications

### Row Level Security (RLS)

Semua tabel dilindungi dengan RLS policies:

- **Students** dapat melihat published courses dan manage data mereka sendiri
- **Instructors** dapat manage courses dan content mereka sendiri
- **Admins** memiliki full access ke semua data
- **Public users** dapat melihat published courses tanpa login

## Struktur Project

```
learning-platform/
├── public/                    # Static assets
├── src/
│   ├── components/           # Reusable components
│   │   └── ui/              # UI components (Button, Input, Card)
│   ├── contexts/            # React contexts
│   │   └── AuthContext.tsx  # Authentication context
│   ├── layouts/             # Layout components
│   │   ├── StudentLayout.tsx
│   │   ├── InstructorLayout.tsx
│   │   └── AdminLayout.tsx
│   ├── lib/                 # Utilities & configurations
│   │   ├── supabase.ts      # Supabase client
│   │   └── database.types.ts # TypeScript types
│   ├── pages/               # Page components
│   │   ├── auth/            # Authentication pages
│   │   ├── student/         # Student pages
│   │   ├── instructor/      # Instructor pages
│   │   └── admin/           # Admin pages
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── .env                     # Environment variables
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── vite.config.ts           # Vite config
└── tailwind.config.js       # TailwindCSS config
```

## Panduan Penggunaan

### Registrasi & Login

1. **Registrasi User Baru**
   - Akses `/register`
   - Isi form dengan nama lengkap, email, dan password
   - Password minimal 6 karakter
   - Setelah registrasi berhasil, akan redirect ke login

2. **Login**
   - Akses `/login`
   - Masukkan email dan password
   - Sistem akan redirect sesuai role:
     - Student → `/student`
     - Instructor → `/instructor`
     - Admin → `/admin`

3. **Forgot Password**
   - Akses `/forgot-password`
   - Masukkan email terdaftar
   - Cek email untuk link reset password

### Role-Based Access

#### Student
- Dashboard pribadi dengan progress tracking
- Browse dan enroll courses
- Akses learning materials
- Take quizzes
- Participate in discussions
- View certificates

#### Instructor
- Create dan manage courses sendiri
- Upload learning materials
- Create quizzes dan assignments
- Monitor student progress
- Respond to discussions

#### Admin
- Full access ke semua features
- Manage all users
- Manage all courses
- Moderate reviews dan discussions
- View platform analytics

## API & Integration

### Supabase Client

```typescript
import { supabase } from '@/lib/supabase';

// Query example
const { data, error } = await supabase
  .from('courses')
  .select('*')
  .eq('is_published', true);

// Insert example
const { data, error } = await supabase
  .from('enrollments')
  .insert({
    user_id: userId,
    course_id: courseId
  });
```

### Authentication

```typescript
import { useAuth } from '@/contexts/AuthContext';

function Component() {
  const { user, profile, signIn, signOut } = useAuth();

  // Sign in
  await signIn(email, password);

  // Sign out
  await signOut();
}
```

## Security

### Authentication
- Email/password authentication dengan Supabase Auth
- Automatic session management
- Secure password hashing
- Email verification support

### Row Level Security
- Database-level security dengan RLS policies
- Role-based access control
- Automatic policy enforcement
- Protection against SQL injection

### Best Practices
- Input validation dengan Zod
- XSS protection
- CSRF protection
- Secure environment variables
- HTTPS-only in production

## Development

### Code Style
- TypeScript strict mode
- ESLint for code quality
- Prettier for formatting (recommended)
- Component-based architecture

### State Management
- React Context untuk global state
- TanStack Query untuk server state
- Local state dengan useState/useReducer

### Styling
- TailwindCSS utility classes
- Mobile-first responsive design
- Consistent color palette
- Reusable UI components

## Deployment

### Build Production

```bash
npm run build
```

Output akan ada di folder `dist/`

### Environment Variables

Pastikan environment variables sudah dikonfigurasi:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_SUPABASE_ANON_KEY`

### Deployment Platforms

**Recommended Platforms:**
- **Vercel** - Zero config deployment untuk Vite
- **Netlify** - Continuous deployment
- **Cloudflare Pages** - Edge deployment

**Deployment Steps (Vercel):**
1. Connect repository ke Vercel
2. Set environment variables
3. Deploy dengan `npm run build`

### Database Migrations

Database migrations sudah diaplikasikan ke Supabase instance. Untuk production:
1. Export migration files
2. Run migrations di production Supabase
3. Verify RLS policies

## Roadmap

### Phase 1 (Current)
- ✅ Basic authentication
- ✅ Database schema
- ✅ Role-based layouts
- ✅ Landing page

### Phase 2 (Next)
- Course CRUD operations
- Media upload system
- Quiz builder
- Learning interface

### Phase 3
- Discussion forums
- Review system
- Certificate generation
- Email notifications

### Phase 4
- Payment integration
- Advanced analytics
- Multi-language support
- Mobile app (React Native)

## Contributing

Untuk berkontribusi ke project ini:

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## License

This project is licensed under the MIT License.

## Support

Untuk bantuan atau pertanyaan:
- Email: support@edulearn.com
- Documentation: [Link to docs]
- Issue Tracker: [Link to issues]

---

**Built with ❤️ using React, TypeScript, and Supabase**
