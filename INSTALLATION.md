# Installation Guide - EduLearn Platform

Panduan lengkap untuk setup dan instalasi platform pembelajaran EduLearn.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Development Setup](#development-setup)
3. [Database Setup](#database-setup)
4. [Environment Configuration](#environment-configuration)
5. [Running the Application](#running-the-application)
6. [Troubleshooting](#troubleshooting)

## System Requirements

### Minimum Requirements
- **Node.js**: v18.0.0 atau lebih tinggi
- **npm**: v9.0.0 atau lebih tinggi (atau yarn v1.22.0+)
- **RAM**: 4GB minimum
- **Storage**: 500MB untuk dependencies dan build
- **Browser**: Chrome, Firefox, Safari, atau Edge (versi terbaru)

### Recommended Requirements
- **Node.js**: v20.x (LTS)
- **RAM**: 8GB atau lebih
- **Storage**: 2GB free space
- **Internet**: Stable connection untuk Supabase

## Development Setup

### 1. Install Node.js

**macOS (menggunakan Homebrew):**
```bash
brew install node@20
```

**Windows:**
Download installer dari [nodejs.org](https://nodejs.org)

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Verify installation:
```bash
node --version  # Should show v18.x or higher
npm --version   # Should show v9.x or higher
```

### 2. Clone Repository

```bash
# HTTPS
git clone https://github.com/your-org/edulearn-platform.git

# SSH
git clone git@github.com:your-org/edulearn-platform.git

cd edulearn-platform
```

### 3. Install Dependencies

```bash
npm install
```

Ini akan menginstall semua dependencies yang diperlukan:
- React & React DOM
- TypeScript
- Vite
- TailwindCSS
- Supabase Client
- TanStack Query
- React Router
- Dan lainnya...

**Troubleshooting Dependencies:**

Jika mengalami error saat install:

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

## Database Setup

Platform ini menggunakan Supabase sebagai backend. Database schema sudah diaplikasikan.

### Verify Database Tables

1. Login ke [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda
3. Navigate ke "Table Editor"
4. Verify bahwa tables berikut sudah ada:
   - profiles
   - categories
   - courses
   - modules
   - lessons
   - enrollments
   - lesson_progress
   - quizzes
   - questions
   - answers
   - quiz_attempts
   - reviews
   - discussions
   - certificates
   - notifications

### Migration Files

Migration files tersedia di:
- `create_initial_schema` - Membuat semua tabel dan relationships
- `setup_row_level_security` - Setup RLS policies

Jika perlu re-apply migrations:
1. Backup data existing
2. Run migrations melalui Supabase SQL Editor
3. Verify tables dan policies

### Seed Data (Optional)

Untuk development, Anda bisa create seed data:

```sql
-- Insert sample categories
INSERT INTO categories (name, slug, description) VALUES
  ('Programming', 'programming', 'Learn programming languages and frameworks'),
  ('Design', 'design', 'UI/UX and graphic design courses'),
  ('Business', 'business', 'Business and entrepreneurship courses');

-- Insert sample admin user (setelah register via UI)
UPDATE profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

## Environment Configuration

### 1. Environment Variables

File `.env` sudah dikonfigurasi dengan Supabase credentials:

```env
VITE_SUPABASE_URL=https://0ec90b57d6e95fcbda19832f.supabase.co
VITE_SUPABASE_SUPABASE_ANON_KEY=<your-anon-key>
```

### 2. Supabase Configuration

**Authentication Settings:**

1. Login ke Supabase Dashboard
2. Navigate ke "Authentication" → "Settings"
3. Configure:
   - Enable Email provider
   - Disable email confirmation (atau enable jika diinginkan)
   - Set Site URL: `http://localhost:5173` (development)
   - Add Redirect URLs:
     - `http://localhost:5173/**`
     - `https://your-domain.com/**` (production)

**Storage Configuration:**

1. Navigate ke "Storage"
2. Create buckets:
   - `course-thumbnails` - Public bucket
   - `course-videos` - Public bucket
   - `course-documents` - Public bucket
   - `user-avatars` - Public bucket

**Storage Policies:**

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'course-videos');

-- Allow public read access
CREATE POLICY "Public can view uploads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'course-videos');
```

## Running the Application

### Development Mode

```bash
npm run dev
```

Application akan berjalan di:
- **URL**: http://localhost:5173
- **Hot reload**: Enabled
- **Source maps**: Enabled

### Build for Production

```bash
npm run build
```

Output akan ada di `dist/` folder.

### Preview Production Build

```bash
npm run build
npm run preview
```

Preview server akan berjalan di http://localhost:4173

### Run Linter

```bash
npm run lint
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
Error: Port 5173 is already in use
```

**Solution:**
```bash
# Kill process using port
lsof -ti:5173 | xargs kill -9

# Or specify different port
npm run dev -- --port 3000
```

#### 2. Supabase Connection Error

```bash
Error: Invalid Supabase credentials
```

**Solution:**
- Verify `.env` file exists
- Check Supabase URL dan anon key
- Ensure project is not paused
- Check internet connection

#### 3. TypeScript Errors

```bash
Error: Cannot find module '@/components/...'
```

**Solution:**
```bash
# Restart TypeScript server in VS Code
# Or rebuild
npm run build
```

#### 4. Database Policy Errors

```bash
Error: Row Level Security policy violation
```

**Solution:**
- Verify RLS policies applied
- Check user authentication
- Verify user role in profiles table

#### 5. Module Not Found

```bash
Error: Cannot find module 'xxx'
```

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Getting Help

Jika masih mengalami masalah:

1. Check [README.md](./README.md) untuk informasi umum
2. Review error messages carefully
3. Check browser console untuk frontend errors
4. Check Supabase logs untuk backend errors
5. Search existing issues di GitHub
6. Create new issue dengan detail lengkap

## Next Steps

Setelah instalasi sukses:

1. **Create Admin User**
   - Register via UI
   - Update role ke 'admin' via SQL

2. **Create Sample Data**
   - Add categories
   - Create sample courses
   - Test enrollment flow

3. **Explore Features**
   - Student dashboard
   - Instructor panel
   - Admin panel

4. **Development Workflow**
   - Create feature branch
   - Make changes
   - Test thoroughly
   - Create pull request

## Production Checklist

Sebelum deploy ke production:

- [ ] Update environment variables
- [ ] Setup production Supabase project
- [ ] Apply database migrations
- [ ] Configure authentication settings
- [ ] Setup storage buckets dan policies
- [ ] Enable HTTPS
- [ ] Configure domain
- [ ] Setup monitoring
- [ ] Test all features
- [ ] Backup database

---

**Happy coding! 🚀**
