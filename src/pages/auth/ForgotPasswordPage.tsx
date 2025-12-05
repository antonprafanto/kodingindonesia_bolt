import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { error } = await resetPassword(email);
      if (error) {
        setError('Terjadi kesalahan. Pastikan email Anda terdaftar.');
      } else {
        setSuccess(true);
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
              Email Terkirim!
            </h2>
            <p className="text-secondary-600 mb-6">
              Kami telah mengirimkan link reset password ke email Anda.
              Silakan cek inbox atau folder spam Anda.
            </p>
            <Link to="/login">
              <Button className="w-full">
                Kembali ke Login
              </Button>
            </Link>
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
          <p className="text-secondary-600">Reset password Anda</p>
        </div>

        <Card variant="elevated" className="p-8">
          <CardContent className="p-0">
            <div className="mb-6">
              <Link
                to="/login"
                className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Kembali ke login
              </Link>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg flex items-start">
                <AlertCircle className="h-5 w-5 text-error-600 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-error-800">{error}</p>
              </div>
            )}

            <div className="mb-6">
              <h2 className="text-xl font-bold text-secondary-900 mb-2">
                Lupa Password?
              </h2>
              <p className="text-sm text-secondary-600">
                Masukkan email yang terdaftar dan kami akan mengirimkan link
                untuk reset password Anda.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                type="email"
                label="Email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Button type="submit" className="w-full" isLoading={isLoading}>
                Kirim Link Reset Password
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-secondary-600">
                Ingat password Anda?{' '}
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
