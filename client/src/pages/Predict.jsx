/**
 * Predict.jsx — Prediction form with animated result card.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { predictionAPI } from '../services/api';
import toast from 'react-hot-toast';

const RESULT_COLORS = {
  High: { bg: 'from-emerald-500/20 to-green-500/20', border: 'border-emerald-500/30', text: 'text-emerald-400', ring: '#10b981' },
  Medium: { bg: 'from-amber-500/20 to-orange-500/20', border: 'border-amber-500/30', text: 'text-amber-400', ring: '#f59e0b' },
  Low: { bg: 'from-red-500/20 to-rose-500/20', border: 'border-red-500/30', text: 'text-red-400', ring: '#ef4444' },
};

const INSIGHTS = {
  High: [
    'Student demonstrates strong academic engagement patterns.',
    'Current metrics suggest consistent high performance trajectory.',
    'Recommendation: Continue current study habits and engagement level.',
  ],
  Medium: [
    'Student shows moderate engagement with room for improvement.',
    'Increasing study hours and LMS activity could boost performance.',
    'Recommendation: Focus on assignment completion rate and class attendance.',
  ],
  Low: [
    'Student may need additional academic support and intervention.',
    'Low engagement metrics suggest risk of underperformance.',
    'Recommendation: Seek tutoring, increase study hours, and improve attendance.',
  ],
};

export default function Predict() {
  const [form, setForm] = useState({
    age: '',
    gender: 'Male',
    attendanceRate: '',
    priorGPA: '',
    lmsLogins: '',
    studyHours: '',
    assignmentRate: '',
    engagementScore: '',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.age || form.age < 15 || form.age > 60) errs.age = 'Age must be 15–60';
    if (!form.attendanceRate || form.attendanceRate < 0 || form.attendanceRate > 100) errs.attendanceRate = '0–100%';
    if (!form.priorGPA || form.priorGPA < 0 || form.priorGPA > 4) errs.priorGPA = '0.0–4.0';
    if (!form.lmsLogins || form.lmsLogins < 0) errs.lmsLogins = 'Must be ≥ 0';
    if (!form.studyHours || form.studyHours < 0 || form.studyHours > 100) errs.studyHours = '0–100 hrs';
    if (!form.assignmentRate || form.assignmentRate < 0 || form.assignmentRate > 100) errs.assignmentRate = '0–100%';
    if (form.engagementScore === '' || form.engagementScore < 0 || form.engagementScore > 100) errs.engagementScore = '0–100';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setResult(null);
    try {
      const res = await predictionAPI.create(form);
      setResult(res.data.prediction);
      toast.success('Prediction complete!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Prediction failed. Is the ML service running?');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const handleReset = () => {
    setResult(null);
    setForm({
      age: '', gender: 'Male', attendanceRate: '', priorGPA: '',
      lmsLogins: '', studyHours: '', assignmentRate: '', engagementScore: '',
    });
  };

  const resultStyle = result ? RESULT_COLORS[result.predictedResult] : null;
  const insights = result ? INSIGHTS[result.predictedResult] : [];

  const fields = [
    { name: 'age', label: 'Age', type: 'number', placeholder: 'e.g. 20', min: 15, max: 60 },
    { name: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female'] },
    { name: 'attendanceRate', label: 'Attendance Rate (%)', type: 'number', placeholder: 'e.g. 85.5', min: 0, max: 100, step: '0.01' },
    { name: 'priorGPA', label: 'Prior GPA', type: 'number', placeholder: 'e.g. 3.2', min: 0, max: 4, step: '0.01' },
    { name: 'lmsLogins', label: 'LMS Logins', type: 'number', placeholder: 'e.g. 150', min: 0 },
    { name: 'studyHours', label: 'Study Hours/Week', type: 'number', placeholder: 'e.g. 20', min: 0, max: 100, step: '0.1' },
    { name: 'assignmentRate', label: 'Assignment Submission (%)', type: 'number', placeholder: 'e.g. 90', min: 0, max: 100, step: '0.01' },
    { name: 'engagementScore', label: 'Engagement Score', type: 'number', placeholder: 'e.g. 65', min: 0, max: 100, step: '0.01' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-white">Predict Performance</h1>
          <p className="text-gray-400 mt-1">Enter student data to predict academic performance</p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3"
          >
            <div className="glass-card p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  {fields.map((field) => (
                    <div key={field.name}>
                      <label htmlFor={`predict-${field.name}`} className="block text-sm font-medium text-gray-300 mb-2">
                        {field.label}
                      </label>
                      {field.type === 'select' ? (
                        <select
                          id={`predict-${field.name}`}
                          name={field.name}
                          value={form[field.name]}
                          onChange={handleChange}
                          className="glass-input"
                        >
                          {field.options.map((opt) => (
                            <option key={opt} value={opt} className="bg-primary-dark">{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          id={`predict-${field.name}`}
                          name={field.name}
                          type={field.type}
                          value={form[field.name]}
                          onChange={handleChange}
                          placeholder={field.placeholder}
                          min={field.min}
                          max={field.max}
                          step={field.step}
                          className={`glass-input ${errors[field.name] ? 'border-red-500/50' : ''}`}
                        />
                      )}
                      {errors[field.name] && (
                        <p className="text-red-400 text-xs mt-1">{errors[field.name]}</p>
                      )}
                    </div>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3.5 text-lg disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Predicting...
                    </span>
                  ) : (
                    <>
                      Predict Performance
                      <svg className="inline-block w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </>
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>

          {/* Result Panel */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, x: 20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5 }}
                  className={`glass-card p-6 border ${resultStyle.border}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${resultStyle.bg} rounded-2xl`} />
                  <div className="relative z-10">
                    {/* Result Badge */}
                    <div className="text-center mb-6">
                      <p className="text-gray-400 text-sm mb-2">Predicted Performance</p>
                      <div className={`inline-flex items-center px-6 py-3 rounded-2xl text-2xl font-bold ${resultStyle.text} bg-white/5 border ${resultStyle.border}`}>
                        {result.predictedResult}
                      </div>
                    </div>

                    {/* Confidence Circle */}
                    <div className="flex justify-center mb-6">
                      <div className="relative w-32 h-32">
                        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                          <circle cx="60" cy="60" r="50" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
                          <motion.circle
                            cx="60" cy="60" r="50"
                            stroke={resultStyle.ring}
                            strokeWidth="8"
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 50}`}
                            initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - result.confidence / 100) }}
                            transition={{ duration: 1.5, ease: 'easeOut' }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className={`text-2xl font-bold ${resultStyle.text}`}>
                            {result.confidence}%
                          </span>
                          <span className="text-gray-400 text-xs">Confidence</span>
                        </div>
                      </div>
                    </div>

                    {/* Probabilities */}
                    {result.probabilities && (
                      <div className="space-y-2 mb-6">
                        <p className="text-gray-400 text-sm font-medium">Probability Breakdown</p>
                        {Object.entries(result.probabilities).map(([label, prob]) => (
                          <div key={label} className="flex items-center gap-3">
                            <span className="text-gray-300 text-sm w-16">{label}</span>
                            <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${prob}%` }}
                                transition={{ duration: 1, delay: 0.5 }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: RESULT_COLORS[label]?.ring }}
                              />
                            </div>
                            <span className="text-gray-400 text-sm w-12 text-right">{prob}%</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Insights */}
                    <div className="space-y-2 mb-6">
                      <p className="text-gray-400 text-sm font-medium">Performance Insights</p>
                      {insights.map((insight, i) => (
                        <motion.p
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 + i * 0.2 }}
                          className="text-gray-300 text-sm flex items-start gap-2"
                        >
                          <span className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0`} style={{ backgroundColor: resultStyle.ring }} />
                          {insight}
                        </motion.p>
                      ))}
                    </div>

                    <button onClick={handleReset} className="btn-secondary w-full py-2.5 text-sm">
                      Make Another Prediction
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-card p-8 text-center h-full flex flex-col items-center justify-center min-h-[400px]"
                >
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-cyan/10 to-primary-purple/10 border border-white/10 flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-lg font-medium mb-2">No Prediction Yet</p>
                  <p className="text-gray-500 text-sm">Fill in the form and click predict to see results</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
