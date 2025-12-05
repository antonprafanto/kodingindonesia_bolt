import { Card, CardContent } from '@/components/ui/Card';
import { Search } from 'lucide-react';

export default function CourseCatalog() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900">Course Catalog</h1>
        <p className="text-secondary-600 mt-2">Jelajahi ribuan course berkualitas</p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
          <input
            type="text"
            placeholder="Cari course..."
            className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <Card variant="bordered">
        <CardContent>
          <p className="text-secondary-600">Belum ada course tersedia.</p>
        </CardContent>
      </Card>
    </div>
  );
}
