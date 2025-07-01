'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LimitWarningProps {
  show: boolean;
  onClose?: () => void;
  message?: string;
}

export function LimitWarning({ 
  show, 
  onClose,
  message = "You've reached your monthly generation limit"
}: LimitWarningProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      // Auto-hide after 5 seconds if no onClose provided
      if (!onClose) {
        const timer = setTimeout(() => setIsVisible(false), 5000);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 right-4 z-50"
        >
          <div className="bg-red-500/10 backdrop-blur-lg border border-red-500/20 rounded-lg shadow-lg shadow-red-500/10 p-4 min-w-[300px]">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </motion.div>
              </div>
              <div className="flex-1">
                <p className="text-red-100 font-medium">{message}</p>
                <p className="text-red-300/80 text-sm mt-1">
                  Your limit will reset at the start of next month
                </p>
              </div>
              {onClose && (
                <button
                  onClick={() => {
                    setIsVisible(false);
                    onClose();
                  }}
                  className="flex-shrink-0 text-red-400 hover:text-red-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 