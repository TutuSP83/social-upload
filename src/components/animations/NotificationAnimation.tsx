
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Gift, Share, Trash2, FolderPlus } from 'lucide-react';

interface NotificationAnimationProps {
  isVisible: boolean;
  type: 'received' | 'shared' | 'deleted' | 'folder_created';
  message: string;
  onComplete?: () => void;
}

export const NotificationAnimation = ({ 
  isVisible, 
  type, 
  message, 
  onComplete 
}: NotificationAnimationProps) => {
  const getIcon = () => {
    switch (type) {
      case 'received': return Gift;
      case 'shared': return Share;
      case 'deleted': return Trash2;
      case 'folder_created': return FolderPlus;
      default: return Bell;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'received': return {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-700',
        icon: 'text-blue-600 dark:text-blue-400',
        text: 'text-blue-800 dark:text-blue-200'
      };
      case 'shared': return {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        border: 'border-purple-200 dark:border-purple-700',
        icon: 'text-purple-600 dark:text-purple-400',
        text: 'text-purple-800 dark:text-purple-200'
      };
      case 'deleted': return {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-700',
        icon: 'text-red-600 dark:text-red-400',
        text: 'text-red-800 dark:text-red-200'
      };
      case 'folder_created': return {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-700',
        icon: 'text-green-600 dark:text-green-400',
        text: 'text-green-800 dark:text-green-200'
      };
      default: return {
        bg: 'bg-gray-50 dark:bg-gray-900/20',
        border: 'border-gray-200 dark:border-gray-700',
        icon: 'text-gray-600 dark:text-gray-400',
        text: 'text-gray-800 dark:text-gray-200'
      };
    }
  };

  const Icon = getIcon();
  const colors = getColors();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 300, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 300, scale: 0.8 }}
          transition={{ 
            type: "spring", 
            damping: 20, 
            stiffness: 300 
          }}
          onAnimationComplete={() => {
            if (onComplete) {
              setTimeout(onComplete, 3000);
            }
          }}
          className="fixed top-20 right-4 z-50 pointer-events-none"
        >
          <motion.div
            animate={{
              y: [0, -5, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className={`${colors.bg} ${colors.border} rounded-lg shadow-2xl p-4 border max-w-xs`}
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{
                  rotate: [0, 15, -15, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 0.6,
                  repeat: 2
                }}
              >
                <Icon className={`h-8 w-8 ${colors.icon}`} />
              </motion.div>
              
              <div className="flex-1">
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className={`text-sm font-medium ${colors.text}`}
                >
                  {message}
                </motion.p>
              </div>
            </div>
            
            {/* Sparkle effects */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                  x: [0, Math.random() * 40 - 20],
                  y: [0, Math.random() * 40 - 20]
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.3,
                  repeat: Infinity,
                  repeatDelay: 1
                }}
                className="absolute"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`
                }}
              >
                <div className="w-1 h-1 bg-yellow-400 rounded-full" />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
