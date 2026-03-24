
import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { NewFeedbackModal } from './NewFeedbackModal';
import { useIsMobile } from '@/hooks/use-mobile';

export const NewFeedbackButton = () => {
  const [showModal, setShowModal] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const isMobile = useIsMobile();

  return (
    <>
      <motion.button
        initial={{ scale: 0 }}
        animate={{ 
          scale: 1,
          x: isMobile && isMinimized ? -40 : 0,
          opacity: isMobile && isMinimized ? 0.7 : 1
        }}
        transition={{ 
          delay: 2, 
          type: "spring", 
          stiffness: 260, 
          damping: 20,
          x: { type: "spring", stiffness: 300, damping: 25 }
        }}
        whileHover={{ scale: isMobile ? 1.05 : 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          if (isMobile && !isMinimized) {
            setIsMinimized(true);
            setTimeout(() => setIsMinimized(false), 2000);
          }
          setShowModal(true);
        }}
        className={`fixed z-40 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ${
          isMobile 
            ? 'bottom-20 right-4 p-2 w-12 h-12 flex items-center justify-center' 
            : 'bottom-6 right-6 p-4'
        }`}
        title="Enviar feedback"
      >
        <MessageCircle className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} />
      </motion.button>

      <NewFeedbackModal open={showModal} onOpenChange={setShowModal} />
    </>
  );
};
