import { Card, CardContent } from '@/components/ui/Card';

export default function LearningInterface() {
  return (
    <div>
      <Card variant="bordered">
        <CardContent>
          <h1 className="text-2xl font-bold mb-4">Learning Interface</h1>
          <p className="text-secondary-600">Interface pembelajaran akan ditampilkan di sini.</p>
        </CardContent>
      </Card>
    </div>
  );
}
