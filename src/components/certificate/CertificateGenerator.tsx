import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Download, Award } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

interface CertificateGeneratorProps {
  courseId: string;
  courseTitle: string;
  userName: string;
  completionDate: string;
}

export default function CertificateGenerator({
  courseId,
  courseTitle,
  userName,
  completionDate,
}: CertificateGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);

  const generateCertificate = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 20;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 5;
    ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);

    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Certificate of Completion', canvas.width / 2, 150);

    ctx.fillStyle = '#64748b';
    ctx.font = '24px Arial';
    ctx.fillText('This is to certify that', canvas.width / 2, 250);

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 52px Arial';
    ctx.fillText(userName, canvas.width / 2, 340);

    ctx.fillStyle = '#64748b';
    ctx.font = '24px Arial';
    ctx.fillText('has successfully completed the course', canvas.width / 2, 420);

    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 36px Arial';
    ctx.fillText(courseTitle, canvas.width / 2, 500);

    ctx.fillStyle = '#64748b';
    ctx.font = '20px Arial';
    ctx.fillText(`Date of Completion: ${format(new Date(completionDate), 'MMMM dd, yyyy')}`, canvas.width / 2, 600);

    ctx.beginPath();
    ctx.moveTo(400, 680);
    ctx.lineTo(550, 680);
    ctx.stroke();
    ctx.fillStyle = '#64748b';
    ctx.font = '16px Arial';
    ctx.fillText('Instructor Signature', 475, 710);

    ctx.beginPath();
    ctx.moveTo(650, 680);
    ctx.lineTo(800, 680);
    ctx.stroke();
    ctx.fillText('Date', 725, 710);

    return canvas.toDataURL('image/png');
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const certificateData = generateCertificate();
      if (!certificateData) {
        throw new Error('Failed to generate certificate');
      }

      setCertificateUrl(certificateData);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('certificates').upsert({
        user_id: user.id,
        course_id: courseId,
        certificate_url: certificateData,
      } as any);
    } catch (error) {
      console.error('Error generating certificate:', error);
      alert('Error generating certificate. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!certificateUrl) return;

    const link = document.createElement('a');
    link.href = certificateUrl;
    link.download = `certificate-${courseTitle.replace(/\s+/g, '-').toLowerCase()}.png`;
    link.click();
  };

  return (
    <Card className="p-8">
      <div className="text-center">
        <Award className="w-16 h-16 text-primary-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-secondary-900 mb-2">
          Congratulations!
        </h3>
        <p className="text-secondary-600 mb-6">
          You have completed this course successfully
        </p>

        {certificateUrl ? (
          <div className="space-y-6">
            <div className="border-2 border-secondary-200 rounded-lg overflow-hidden">
              <img
                src={certificateUrl}
                alt="Certificate"
                className="w-full"
              />
            </div>
            <Button onClick={handleDownload} size="lg">
              <Download className="w-5 h-5 mr-2" />
              Download Certificate
            </Button>
          </div>
        ) : (
          <Button onClick={handleGenerate} disabled={generating} size="lg">
            {generating ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <Award className="w-5 h-5 mr-2" />
                Generate Certificate
              </>
            )}
          </Button>
        )}
      </div>
    </Card>
  );
}
