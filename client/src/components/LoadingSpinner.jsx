/**
 * LoadingSpinner.jsx — Animated loading spinner with optional text.
 */
import { motion } from 'framer-motion';

export default function LoadingSpinner({ text = 'Loading...', size = 'md' }) {
  const sizes = {
    sm: 'w-6 h-6 border-2',
    md: 'w-12 h-12 border-4',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center gap-4"
    >
      <div className="relative">
        <div
          className={`${sizes[size]} rounded-full border-primary-cyan/20 border-t-primary-cyan animate-spin`}
        />
        <div
          className={`absolute inset-0 ${sizes[size]} rounded-full border-primary-purple/20 border-b-primary-purple animate-spin`}
          style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
        />
      </div>
      {text && (
        <p className="text-gray-400 text-sm font-medium animate-pulse">{text}</p>
      )}
    </motion.div>
  );
}
