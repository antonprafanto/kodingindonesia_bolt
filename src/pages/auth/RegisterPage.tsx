import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    if (password.length < 6) {
      setError('Password harus minimal 6 karakter.');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const { error } = await signUp(email, password, fullName);
      if (error) {
        if (error.message.includes('already registered')) {
          setError('Email sudah terdaftar. Silakan gunakan email lain atau login.');
        } else {
          setError('Terjadi kesalahan saat mendaftar. Silakan coba lagi.');
        }
      } else {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
        <Card variant="elevated" className="p-8 max-w-md w-full">
          <CardContent className="p-0 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-success-100 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-success-600" />
            </div>
            <h2 className="text-2xl font-bold text-secondary-900 mb-2">
              Pendaftaran Berhasil!
            </h2>
            <p className="text-secondary-600 mb-4">
              Akun Anda telah berhasil dibuat. Mengalihkan ke halaman login...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/">
            <h1 className="text-3xl font-bold text-primary-600 mb-2">EduLearn</h1>
          </Link>
          <p className="text-secondary-600">Buat akun baru untuk memulai belajar</p>
        </div>

        <Card variant="elevated" className="p-8">
          <CardContent className="p-0">
            {error && (
              <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg flex items-start">
                <AlertCircle className="h-5 w-5 text-error-600 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-error-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                type="text"
                label="Nama Lengkap"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <Input
                type="email"
                label="Email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                type="password"
                label="Password"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                helperText="Password harus minimal 6 karakter"
                required
              />

              <Input
                type="password"
                label="Konfirmasi Password"
                placeholder="Ulangi password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <div className="flex items-start">
                <input
                  type="checkbox"
                  className="mt-1 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                  required
                />
                <label className="ml-2 text-sm text-secondary-700">
                  Saya setuju dengan{' '}
                  <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
                    Syarat & Ketentuan
                  </a>{' '}
                  dan{' '}
                  <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
                    Kebijakan Privasi
                  </a>
                </label>
              </div>

              <Button type="submit" className="w-full" isLoading={isLoading}>
                Daftar
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-secondary-600">
                Sudah punya akun?{' '}
                <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                  Login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Link to="/" className="text-sm text-secondary-600 hover:text-secondary-900">
            Kembali ke beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
