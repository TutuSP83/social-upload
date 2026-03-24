
import { motion } from 'framer-motion';
import { EnhancedHeader } from '@/components/layout/EnhancedHeader';
import { FeedbackList } from '@/components/feedback/FeedbackList';
import { FeedbackButton } from '@/components/feedback/FeedbackButton';
import { useIsMobile } from '@/hooks/use-mobile';

export const FeedbackPage = () => {
  const isMobile = useIsMobile();

  console.log('FeedbackPage render');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-purple-950 dark:via-pink-950 dark:to-blue-950">
      <EnhancedHeader activeTab="feedback" onTabChange={() => {}} />
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`${
          isMobile 
            ? 'pt-2 pb-4 px-2' 
            : 'max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8'
        }`}
      >
        <FeedbackList />
      </motion.main>
      
      <FeedbackButton />
    </div>
  );
};
