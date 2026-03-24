
import { motion } from 'framer-motion';

export const AnimatedLogo = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="relative flex flex-col items-center mb-8"
    >
      <motion.div
        className="relative"
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.3 }}
      >
        <motion.h1
          className="text-5xl md:text-7xl lg:text-8xl font-black bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 dark:from-purple-400 dark:via-pink-400 dark:to-blue-400 bg-clip-text text-transparent drop-shadow-2xl"
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            backgroundSize: '300% 300%',
            textShadow: '0 0 30px rgba(147, 51, 234, 0.5)',
          }}
        >
          FILE ROCKET
        </motion.h1>
        
        <motion.div
          className="absolute -inset-2 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 rounded-2xl blur-xl opacity-30 dark:opacity-50"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.6, 0.3],
            rotate: [0, 2, -2, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.div>
      
      <motion.div
        className="mt-3 relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <motion.span
          className="text-lg md:text-xl font-bold bg-gradient-to-r from-gray-600 to-gray-800 dark:from-gray-300 dark:to-gray-100 bg-clip-text text-transparent tracking-wider"
          animate={{
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          by TUTU
        </motion.span>
        
        <motion.div
          className="absolute -inset-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg blur opacity-20"
          animate={{
            scale: [0.8, 1.1, 0.8],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.div>

      {/* Efeitos de partículas decorativas */}
      <motion.div
        className="absolute top-0 left-1/4 w-2 h-2 bg-purple-400 rounded-full opacity-70"
        animate={{
          y: [-20, -40, -20],
          opacity: [0.7, 0.3, 0.7],
          scale: [1, 1.5, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          delay: 0.5,
        }}
      />
      
      <motion.div
        className="absolute top-10 right-1/4 w-1.5 h-1.5 bg-pink-400 rounded-full opacity-60"
        animate={{
          y: [-15, -35, -15],
          opacity: [0.6, 0.2, 0.6],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          delay: 1,
        }}
      />
      
      <motion.div
        className="absolute -top-5 right-1/3 w-1 h-1 bg-blue-400 rounded-full opacity-50"
        animate={{
          y: [-10, -25, -10],
          opacity: [0.5, 0.1, 0.5],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          delay: 1.5,
        }}
      />
    </motion.div>
  );
};
