import { Download } from 'lucide-react';
import { getExportUrl } from '@/lib/api';

export default function ExportButton({ entity, label = 'Export CSV' }) {
  const handleExport = () => {
    const url = getExportUrl(entity);
    const a = document.createElement('a');
    a.href = url;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <button
      data-testid={`export-${entity}-btn`}
      onClick={handleExport}
      className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 text-neutral-300 text-xs uppercase tracking-wider font-medium transition-colors rounded-md"
    >
      <Download className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
