
import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { FeedbackModal } from './FeedbackModal';

export const FeedbackButton = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 2, type: "spring", stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
        title="Enviar feedback"
      >
        <MessageCircle className="h-6 w-6" />
      </motion.button>

      <FeedbackModal open={showModal} onOpenChange={setShowModal} />
    </>
  );
};
