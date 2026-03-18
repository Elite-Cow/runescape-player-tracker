import { motion } from "framer-motion";

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export default function LoadingSpinner({ size = 40, className = "" }: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
      >
        <defs>
          <linearGradient id="spinner-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c8a84b" />
            <stop offset="100%" stopColor="#e8c86b" />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(200,168,75,0.1)" strokeWidth="3" />
        <motion.circle
          cx="20" cy="20" r="16"
          fill="none"
          stroke="url(#spinner-grad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="75 25"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.svg>
    </div>
  );
}
