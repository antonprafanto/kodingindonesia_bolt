import { Card, CardContent } from '@/components/ui/Card';

export default function CourseDetail() {
  return (
    <div>
      <Card variant="bordered">
        <CardContent>
          <h1 className="text-2xl font-bold mb-4">Course Detail</h1>
          <p className="text-secondary-600">Detail course akan ditampilkan di sini.</p>
        </CardContent>
      </Card>
    </div>
  );
}
