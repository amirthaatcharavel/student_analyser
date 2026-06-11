/**
 * History.jsx — Prediction history with search, filter, pagination, CSV export, and PDF download.
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { predictionAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const RESULT_BADGE = {
  High: 'bg-emerald-500/20 text-emerald-400',
  Medium: 'bg-amber-500/20 text-amber-400',
  Low: 'bg-red-500/20 text-red-400',
};

export default function History() {
  const [predictions, setPredictions] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const fetchPredictions = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (filter) params.filter = filter;
      if (search) params.search = search;
      const res = await predictionAPI.getAll(params);
      setPredictions(res.data.predictions);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load predictions');
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    fetchPredictions(1);
  }, [fetchPredictions]);

  const handleDelete = async (id) => {
    try {
      await predictionAPI.delete(id);
      toast.success('Prediction deleted');
      setDeleteId(null);
      fetchPredictions(pagination.page);
    } catch {
      toast.error('Delete failed');
    }
  };

  const exportCSV = () => {
    if (predictions.length === 0) { toast.error('No data to export'); return; }
    const headers = ['Date', 'Age', 'Gender', 'Attendance', 'GPA', 'LMS Logins', 'Study Hours', 'Assignment Rate', 'Engagement', 'Result', 'Confidence'];
    const rows = predictions.map((p) => [
      new Date(p.createdAt).toLocaleDateString(),
      p.age, p.gender, p.attendanceRate, p.priorGPA, p.lmsLogins,
      p.studyHours, p.assignmentRate, p.engagementScore, p.predictedResult, p.confidence,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `predictions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported!');
  };

  const exportPDF = async () => {
    if (predictions.length === 0) { toast.error('No data to export'); return; }
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.setTextColor(0, 229, 255);
      doc.text('Student Performance Predictions Report', 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

      autoTable(doc, {
        startY: 38,
        head: [['Date', 'Age', 'Gender', 'GPA', 'Attendance', 'Result', 'Confidence']],
        body: predictions.map((p) => [
          new Date(p.createdAt).toLocaleDateString(),
          p.age, p.gender, p.priorGPA, `${p.attendanceRate}%`,
          p.predictedResult, `${p.confidence}%`,
        ]),
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [0, 229, 255], fontSize: 9 },
        bodyStyles: { textColor: [50, 50, 50], fontSize: 8 },
        alternateRowStyles: { fillColor: [245, 245, 250] },
      });

      doc.save(`predictions_report_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF downloaded!');
    } catch {
      toast.error('PDF generation failed');
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-white">Prediction History</h1>
            <p className="text-gray-400 mt-1">{pagination.total} total predictions</p>
          </div>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={exportCSV}
              className="btn-secondary py-2 px-4 text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export CSV
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={exportPDF}
              className="btn-primary py-2 px-4 text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Download PDF
            </motion.button>
          </div>
        </motion.div>

        {/* Search & Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4 mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by gender or result..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="glass-input"
                id="history-search"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="glass-input w-full sm:w-48"
              id="history-filter"
            >
              <option value="" className="bg-primary-dark">All Results</option>
              <option value="High" className="bg-primary-dark">High</option>
              <option value="Medium" className="bg-primary-dark">Medium</option>
              <option value="Low" className="bg-primary-dark">Low</option>
            </select>
          </div>
        </motion.div>

        {/* Table */}
        {loading ? (
          <div className="py-20">
            <LoadingSpinner text="Loading predictions..." />
          </div>
        ) : predictions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-12 text-center"
          >
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-400 text-lg">No predictions found</p>
            <p className="text-gray-500 text-sm mt-1">Try adjusting your search or filter</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="text-left py-4 px-4 text-gray-400 font-medium">Date</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-medium">Age</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-medium">Gender</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-medium">GPA</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-medium">Attendance</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-medium">Study Hrs</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-medium">Result</th>
                    <th className="text-left py-4 px-4 text-gray-400 font-medium">Confidence</th>
                    <th className="text-right py-4 px-4 text-gray-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((p, i) => (
                    <motion.tr
                      key={p._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 px-4 text-gray-300">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-gray-300">{p.age}</td>
                      <td className="py-3 px-4 text-gray-300">{p.gender}</td>
                      <td className="py-3 px-4 text-gray-300">{p.priorGPA}</td>
                      <td className="py-3 px-4 text-gray-300">{p.attendanceRate}%</td>
                      <td className="py-3 px-4 text-gray-300">{p.studyHours}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${RESULT_BADGE[p.predictedResult]}`}>
                          {p.predictedResult}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-300">{p.confidence}%</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setDeleteId(p._id)}
                          className="text-gray-500 hover:text-red-400 transition-colors p-1"
                          title="Delete prediction"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-white/10">
                <p className="text-gray-500 text-sm">
                  Page {pagination.page} of {pagination.pages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchPredictions(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="px-3 py-1.5 rounded-lg text-sm border border-white/10 text-gray-400 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => fetchPredictions(pageNum)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          pagination.page === pageNum
                            ? 'bg-primary-cyan/20 text-primary-cyan border border-primary-cyan/30'
                            : 'border border-white/10 text-gray-400 hover:bg-white/5'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => fetchPredictions(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                    className="px-3 py-1.5 rounded-lg text-sm border border-white/10 text-gray-400 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={() => setDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-white mb-2">Delete Prediction?</h3>
              <p className="text-gray-400 text-sm mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="btn-secondary flex-1 py-2.5"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteId)}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-red-500/80 hover:bg-red-500 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
