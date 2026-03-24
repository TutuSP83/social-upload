import { motion, AnimatePresence } from 'framer-motion';

interface RocketAnimationProps {
  isVisible: boolean;
  onComplete?: () => void;
  position?: { x: number; y: number };
}

export const RocketAnimation = ({ isVisible, onComplete, position }: RocketAnimationProps) => {
  // console.log('🚀 FOGUETE SIMPLES SOBRE ARQUIVOS - Visível:', isVisible);
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999999,
            pointerEvents: 'none',
            width: '100vw',
            height: '100vh',
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
            exit={{ 
            opacity: 0, 
            scale: 0.3,
            transition: { duration: 0.5, ease: "easeInOut" }
          }}
        >
          {/* FOGUETE QUE REALMENTE VOA */}
          <motion.div
            initial={{ 
              x: window.innerWidth / 2, 
              y: window.innerHeight / 2 
            }}
            animate={(() => {
              // DIFERENTES CANTOS IMPOSSÍVEIS - ALÉM DA REALIDADE
              const directions = [
                // Canto superior direito - ALÉM DA EXISTÊNCIA
                { x: window.innerWidth * 5000, y: -window.innerHeight * 4000 },
                // Canto superior esquerdo - ALÉM DA EXISTÊNCIA
                { x: -window.innerWidth * 5000, y: -window.innerHeight * 4000 },
                // Canto inferior direito - ALÉM DA EXISTÊNCIA
                { x: window.innerWidth * 5000, y: window.innerHeight * 4500 },
                // Canto inferior esquerdo - ALÉM DA EXISTÊNCIA
                { x: -window.innerWidth * 5000, y: window.innerHeight * 4500 },
                // Extrema direita - DIMENSÃO IMPOSSÍVEL
                { x: window.innerWidth * 8000, y: window.innerHeight / 2 },
                // Extrema esquerda - DIMENSÃO IMPOSSÍVEL
                { x: -window.innerWidth * 8000, y: window.innerHeight / 2 },
                // Extremo topo - COSMOS INFINITO
                { x: window.innerWidth / 2, y: -window.innerHeight * 6000 },
                // Extremo fundo - COSMOS INFINITO
                { x: window.innerWidth / 2, y: window.innerHeight * 7000 },
                // Diagonal superior direita ETERNIDADE ABSOLUTA
                { x: window.innerWidth * 10000, y: -window.innerHeight * 8000 },
                // Diagonal superior esquerda ETERNIDADE ABSOLUTA
                { x: -window.innerWidth * 10000, y: -window.innerHeight * 8000 },
                // Diagonal inferior direita ETERNIDADE ABSOLUTA
                { x: window.innerWidth * 10000, y: window.innerHeight * 9000 },
                // Diagonal inferior esquerda ETERNIDADE ABSOLUTA
                { x: -window.innerWidth * 10000, y: window.innerHeight * 9000 }
              ];
              
              // Escolhe direção baseada no timestamp para ser diferente a cada upload
              const directionIndex = Math.floor(Date.now() / 1000) % directions.length;
              return directions[directionIndex];
            })()}
            transition={{
              duration: 3,     // 3 segundos - velocidade normal e agradável
              ease: "easeOut", // Acelera no final
              repeat: 0        // SÓ UMA VEZ - SAI E NÃO VOLTA
            }}
            style={{
              position: 'absolute',
              width: '60px',
              height: '60px',
              zIndex: 999999,
            }}
          >
            {/* FOGUETE COM ROTAÇÃO SUAVE */}
            <motion.div
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              {/* FOGUETE 🚀 */}
              <div 
                style={{
                  fontSize: '50px',
                  position: 'relative',
                  zIndex: 10,
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                }}
              >
                🚀
              </div>
            </motion.div>

            {/* FUMAÇA SAINDO DO FOGUETE - BEM VISÍVEL */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={`smoke-${i}`}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '70%',
                  width: `${8 + (i * 3)}px`,
                  height: `${8 + (i * 3)}px`,
                  background: `rgba(${150 + i * 5}, ${150 + i * 5}, ${150 + i * 5}, ${0.8 - i * 0.05})`,
                  borderRadius: '50%',
                  filter: 'blur(2px)',
                  transform: 'translate(-50%, -50%)',
                }}
                animate={{
                  x: [0, -15 - (i * 4), -30 - (i * 6), -45 - (i * 8)],
                  y: [0, 8 + (i * 2), 16 + (i * 4), 24 + (i * 6)],
                  scale: [0.8, 1.2, 1.8, 2.5],
                  opacity: [0.8, 0.6, 0.3, 0],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: "easeOut",
                }}
              />
            ))}

            {/* PARTÍCULAS DE FOGO LARANJA */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`fire-${i}`}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '65%',
                  width: '6px',
                  height: '6px',
                  background: ['#ff6b35', '#f7931e', '#ffbe0b'][i % 3],
                  borderRadius: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
                animate={{
                  x: [0, -12 - (i * 3), -24 - (i * 5)],
                  y: [0, 6 + (i * 2), 12 + (i * 3)],
                  scale: [1.2, 0.8, 0],
                  opacity: [1, 0.7, 0],
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  delay: i * 0.08,
                  ease: "easeOut",
                }}
              />
            ))}

            {/* RASTRO BRILHANTE */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={`trail-${i}`}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '60%',
                  width: '4px',
                  height: '4px',
                  background: '#ffd700',
                  borderRadius: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
                animate={{
                  x: [0, -8 - (i * 2), -16 - (i * 3)],
                  y: [0, 4 + i, 8 + (i * 2)],
                  scale: [1, 0.5, 0],
                  opacity: [1, 0.5, 0],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: "easeOut",
                }}
              />
            ))}
          </motion.div>

          {/* INDICADOR DE UPLOAD */}
          <motion.div
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(0, 0, 0, 0.8)',
              color: '#ffd700',
              padding: '12px 20px',
              borderRadius: '25px',
              border: '2px solid #ffd700',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 4px 20px rgba(255, 215, 0, 0.3)',
            }}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                🚀
              </motion.div>
              Upload em progresso...
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};