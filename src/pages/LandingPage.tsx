import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { BookOpen, Users, Award, TrendingUp, CheckCircle } from 'lucide-react';
import { useEffect } from 'react';

export default function LandingPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && profile) {
      if (profile.role === 'student') {
        navigate('/student');
      } else if (profile.role === 'instructor') {
        navigate('/instructor');
      } else if (profile.role === 'admin') {
        navigate('/admin');
      }
    }
  }, [user, profile, navigate]);

  const features = [
    {
      icon: BookOpen,
      title: 'Courses Berkualitas',
      description: 'Akses ribuan courses dari instruktur terbaik di berbagai bidang.',
    },
    {
      icon: Users,
      title: 'Komunitas Aktif',
      description: 'Bergabung dengan komunitas pembelajar dari seluruh dunia.',
    },
    {
      icon: Award,
      title: 'Sertifikat Resmi',
      description: 'Dapatkan sertifikat yang diakui setelah menyelesaikan course.',
    },
    {
      icon: TrendingUp,
      title: 'Progress Tracking',
      description: 'Pantau progress belajar Anda secara real-time.',
    },
  ];

  const benefits = [
    'Belajar kapan saja, di mana saja',
    'Materi selalu up-to-date',
    'Akses selamanya ke course yang dibeli',
    'Diskusi dengan instruktur',
    'Quiz interaktif',
    'Project-based learning',
  ];

  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">EduLearn</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/register">
                <Button>Daftar Sekarang</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-secondary-900 mb-6">
              Tingkatkan Skill Anda dengan<br />
              <span className="text-primary-600">Pembelajaran Online</span>
            </h1>
            <p className="text-xl text-secondary-600 mb-8 max-w-3xl mx-auto">
              Platform pembelajaran online terbaik dengan ribuan course berkualitas,
              instruktur berpengalaman, dan komunitas pembelajar yang aktif.
            </p>
            <div className="flex justify-center gap-4">
              <Link to="/register">
                <Button size="lg">Mulai Belajar Gratis</Button>
              </Link>
              <Link to="/student/courses">
                <Button variant="outline" size="lg">Jelajahi Course</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-secondary-900 mb-4">
              Mengapa Memilih EduLearn?
            </h2>
            <p className="text-lg text-secondary-600">
              Platform pembelajaran yang dirancang untuk kesuksesan Anda
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="text-center p-6 rounded-xl hover:shadow-lg transition-shadow"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                  <feature.icon className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-secondary-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-secondary-900 mb-6">
                Benefit yang Anda Dapatkan
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-success-600 mr-3 flex-shrink-0 mt-0.5" />
                    <p className="text-lg text-secondary-700">{benefit}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link to="/register">
                  <Button size="lg">Daftar Gratis Sekarang</Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">Statistik Platform</h3>
                <div className="space-y-6">
                  <div>
                    <p className="text-4xl font-bold">10,000+</p>
                    <p className="text-primary-100">Course Tersedia</p>
                  </div>
                  <div>
                    <p className="text-4xl font-bold">50,000+</p>
                    <p className="text-primary-100">Siswa Aktif</p>
                  </div>
                  <div>
                    <p className="text-4xl font-bold">1,000+</p>
                    <p className="text-primary-100">Instruktur Ahli</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-secondary-900 mb-6">
            Siap Memulai Pembelajaran?
          </h2>
          <p className="text-lg text-secondary-600 mb-8 max-w-2xl mx-auto">
            Bergabunglah dengan ribuan pembelajar yang telah meningkatkan skill mereka
            melalui platform kami.
          </p>
          <Link to="/register">
            <Button size="lg">Daftar Sekarang - Gratis</Button>
          </Link>
        </div>
      </section>

      <footer className="bg-secondary-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">EduLearn</h3>
              <p className="text-secondary-400">
                Platform pembelajaran online terbaik untuk meningkatkan skill dan pengetahuan Anda.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-secondary-400">
                <li><Link to="/student/courses" className="hover:text-white">Courses</Link></li>
                <li><Link to="/about" className="hover:text-white">Tentang Kami</Link></li>
                <li><Link to="/contact" className="hover:text-white">Kontak</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Dukungan</h4>
              <ul className="space-y-2 text-secondary-400">
                <li><Link to="/help" className="hover:text-white">Bantuan</Link></li>
                <li><Link to="/faq" className="hover:text-white">FAQ</Link></li>
                <li><Link to="/terms" className="hover:text-white">Syarat & Ketentuan</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Ikuti Kami</h4>
              <ul className="space-y-2 text-secondary-400">
                <li><a href="#" className="hover:text-white">Facebook</a></li>
                <li><a href="#" className="hover:text-white">Instagram</a></li>
                <li><a href="#" className="hover:text-white">LinkedIn</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-secondary-800 mt-8 pt-8 text-center text-secondary-400">
            <p>&copy; 2024 EduLearn. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
