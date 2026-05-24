'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import * as reportService from '@/lib/services/report.service';
import { formatDate } from '@/lib/utils';
import type { Report } from '@/lib/types';
import { FileText, Download, Trash2, Plus } from 'lucide-react';

const REPORT_TYPE_LABELS: Record<string, string> = {
  formulation_summary: 'Formulation Summary',
  stability_report: 'Stability Report',
  comparison: 'Comparison Report',
  regulatory_draft: 'Regulatory Draft',
};

export default function ReportsPage() {
  const { org } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (org?.$id) loadReports();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org]);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const result = await reportService.listReports(org!.$id);
      setReports(result.items);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (report: Report) => {
    if (!confirm('Delete this report?')) return;
    try {
      await reportService.deleteReport(report.$id, report.file_id);
      loadReports();
    } catch (error) {
      console.error('Failed to delete report:', error);
    }
  };

  const handleDownload = (report: Report) => {
    const url = reportService.getReportDownloadUrl(report.file_id);
    window.open(url, '_blank');
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">{total} report{total !== 1 ? 's' : ''} generated</p>
        </div>
      </div>

      <div style={{
        padding: 'var(--space-4)', background: 'var(--color-bg-tertiary)',
        borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-6)',
        fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)',
      }}>
        💡 <strong>Tip:</strong> You can generate reports directly from any formulation detail page using the &quot;Export PDF&quot; button.
        Reports are automatically saved here for future access.
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 72 }} />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <FileText size={36} />
          </div>
          <h3 className="empty-state-title">No reports yet</h3>
          <p className="empty-state-description">
            Generate your first report from a formulation detail page. PDF reports include
            complete recipe data, stability analysis, and professional formatting.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <p className="table-scroll-hint" style={{ padding: '12px 16px 0' }}>Swipe left to see more →</p>
          <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Generated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.$id}>
                  <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <FileText size={16} style={{ color: 'var(--color-brand)' }} />
                      {report.title}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-info">
                      {REPORT_TYPE_LABELS[report.report_type] || report.report_type}
                    </span>
                  </td>
                  <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
                    {formatDate(report.generated_at)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDownload(report)}>
                        <Download size={14} /> Download
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleDelete(report)}
                        style={{ color: 'var(--color-danger)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
}
