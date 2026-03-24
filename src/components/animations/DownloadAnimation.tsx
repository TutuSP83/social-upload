
import { motion, AnimatePresence } from 'framer-motion';
import { Download, CheckCircle } from 'lucide-react';

interface DownloadAnimationProps {
  isVisible: boolean;
  onComplete?: () => void;
  fileCount?: number;
}

export const DownloadAnimation = ({ isVisible, onComplete, fileCount = 1 }: DownloadAnimationProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0, y: -100 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0, y: 100 }}
          transition={{ duration: 0.5, ease: "backOut" }}
          onAnimationComplete={() => {
            if (onComplete) {
              setTimeout(onComplete, 1500);
            }
          }}
          className="fixed top-20 right-4 z-50 pointer-events-none"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-4 border border-green-200 dark:border-green-700">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{
                  y: [0, 10, 0]
                }}
                transition={{
                  duration: 1,
                  repeat: 2,
                  ease: "easeInOut"
                }}
                className="relative"
              >
                <Download className="h-8 w-8 text-green-600 dark:text-green-400" />
                
                {/* Arrow animation */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: [0, 1, 0], y: [0, 15, 30] }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute top-0 left-1/2 transform -translate-x-1/2"
                >
                  <div className="w-1 h-3 bg-green-500 rounded-full" />
                </motion.div>
              </motion.div>
              
              <div>
                <motion.h3 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="font-semibold text-green-800 dark:text-green-200"
                >
                  Download Iniciado!
                </motion.h3>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm text-green-600 dark:text-green-400"
                >
                  {fileCount} arquivo{fileCount > 1 ? 's' : ''} sendo baixado{fileCount > 1 ? 's' : ''}
                </motion.p>
              </div>
              
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1, type: "spring" }}
              >
                <CheckCircle className="h-6 w-6 text-green-500" />
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
