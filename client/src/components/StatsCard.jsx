/**
 * StatsCard.jsx — Glassmorphism stat card with gradient accent and animated counter.
 */
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function StatsCard({ title, value, icon, color = 'cyan', delay = 0 }) {
  const [displayValue, setDisplayValue] = useState(0);

  const colors = {
    cyan: {
      gradient: 'from-cyan-500 to-blue-500',
      shadow: 'shadow-neon-cyan',
      text: 'text-primary-cyan',
      bg: 'bg-cyan-500/10',
    },
    purple: {
      gradient: 'from-purple-500 to-pink-500',
      shadow: 'shadow-neon-purple',
      text: 'text-primary-purple',
      bg: 'bg-purple-500/10',
    },
    green: {
      gradient: 'from-emerald-500 to-green-500',
      shadow: '',
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    amber: {
      gradient: 'from-amber-500 to-orange-500',
      shadow: '',
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    red: {
      gradient: 'from-red-500 to-rose-500',
      shadow: '',
      text: 'text-red-400',
      bg: 'bg-red-500/10',
    },
  };

  const c = colors[color] || colors.cyan;

  // Animate counter
  useEffect(() => {
    const target = typeof value === 'number' ? value : parseInt(value) || 0;
    if (target === 0) { setDisplayValue(0); return; }

    const duration = 1500;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setDisplayValue(target);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="glass-card-hover p-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
          <p className={`text-3xl font-bold ${c.text}`}>{displayValue}</p>
        </div>
        <div className={`p-3 rounded-xl ${c.bg}`}>
          {icon || (
            <div className={`w-6 h-6 rounded bg-gradient-to-br ${c.gradient}`} />
          )}
        </div>
      </div>
      {/* Bottom gradient accent line */}
      <div className={`mt-4 h-1 rounded-full bg-gradient-to-r ${c.gradient} opacity-50`} />
    </motion.div>
  );
}
