/**
 * Profile.jsx — User profile page with account details and recent predictions.
 */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { predictionAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const RESULT_BADGE = {
  High: 'bg-emerald-500/20 text-emerald-400',
  Medium: 'bg-amber-500/20 text-amber-400',
  Low: 'bg-red-500/20 text-red-400',
};

export default function Profile() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentPredictions, setRecentPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await predictionAPI.getDashboard();
        setStats(res.data.stats);
        setRecentPredictions(res.data.recentPredictions || []);
      } catch (err) {
        console.error('Profile fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Generate initials avatar
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <LoadingSpinner text="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white">Profile</h1>
          <p className="text-gray-400 mt-1">Your account information</p>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-8 mb-6"
        >
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-cyan to-primary-purple flex items-center justify-center text-3xl font-bold text-white shadow-neon-cyan">
              {initials}
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold text-white">{user?.name}</h2>
              <p className="text-gray-400 mt-1">{user?.email}</p>
              <p className="text-gray-500 text-sm mt-2">
                Member since {new Date(user?.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: stats?.total || 0, color: 'text-primary-cyan' },
            { label: 'High', value: stats?.high || 0, color: 'text-emerald-400' },
            { label: 'Medium', value: stats?.medium || 0, color: 'text-amber-400' },
            { label: 'Low', value: stats?.low || 0, color: 'text-red-400' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="glass-card p-5 text-center"
            >
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-gray-400 text-sm mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Recent Predictions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Recent Predictions</h3>
          {recentPredictions.length > 0 ? (
            <div className="space-y-3">
              {recentPredictions.map((p, i) => (
                <motion.div
                  key={p._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-cyan/20 to-primary-purple/20 flex items-center justify-center text-primary-cyan text-sm font-bold">
                      {p.age}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">
                        {p.gender} • GPA: {p.priorGPA} • Attendance: {p.attendanceRate}%
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {new Date(p.createdAt).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${RESULT_BADGE[p.predictedResult]}`}>
                      {p.predictedResult}
                    </span>
                    <span className="text-gray-400 text-sm">{p.confidence}%</span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No predictions yet</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
