import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Gift, Zap } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface MagicBoxProps {
  onOpen: () => void;
}

const MagicBox: React.FC<MagicBoxProps> = ({ onOpen }) => {
  const { t } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [isCharging, setIsCharging] = useState(false);

  const handleClick = () => {
    setIsCharging(true);
    setIsOpening(true);
    setTimeout(() => {
      onOpen();
    }, 1500);
  };

  return (
    <div className="relative flex justify-center">
      {/* Floating sparkles */}
      <div className="absolute inset-0 pointer-events-none" style={{ width: '400px', height: '200px', left: '-100px', top: '-50px' }}>
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${10 + (i * 8)}%`,
              top: `${10 + (i * 7)}%`,
            }}
            animate={{
              y: [-15, -30, -15],
              opacity: [0.2, 1, 0.2],
              scale: [0.5, 1.5, 0.5],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 2.5 + (i * 0.3),
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Sparkles className={`w-3 h-3 ${i % 3 === 0 ? 'text-yellow-300' : i % 3 === 1 ? 'text-pink-300' : 'text-purple-300'}`} />
          </motion.div>
        ))}
      </div>

      {/* Energy rings */}
      {isCharging && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute border-2 border-white/30 rounded-full"
              style={{
                width: `${100 + i * 30}px`,
                height: `${100 + i * 30}px`,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)'
              }}
              initial={{ scale: 0, opacity: 1 }}
              animate={{
                scale: [0, 2],
                opacity: [1, 0]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeOut"
              }}
            />
          ))}
        </div>
      )}

      {/* Magic Box */}
      <motion.div
        className="relative cursor-pointer group"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={handleClick}
        whileHover={{ scale: 1.1, rotateY: 10 }}
        whileTap={{ scale: 0.95 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Enhanced Box Shadow with multiple layers */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-purple-600/40 to-pink-600/40 rounded-3xl blur-2xl"
          animate={{
            scale: isHovered ? 1.3 : 1,
            opacity: isHovered ? 1 : 0.6,
          }}
          transition={{ duration: 0.4 }}
        />
        
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-red-500/20 rounded-3xl blur-xl"
          animate={{
            scale: isHovered ? 1.2 : 0.9,
            opacity: isHovered ? 0.8 : 0.3,
            rotate: isHovered ? 180 : 0,
          }}
          transition={{ duration: 0.6 }}
        />

        {/* Main Box with enhanced styling */}
        <motion.div
          className="relative bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-3xl p-12 shadow-2xl border border-white/20"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #ef4444 100%)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
          }}
          animate={{
            rotateY: isOpening ? 360 : 0,
            scale: isCharging ? [1, 1.1, 1] : 1,
          }}
          transition={{ 
            rotateY: { duration: 1.5, ease: "easeInOut" },
            scale: { duration: 0.5, repeat: isCharging ? Infinity : 0 }
          }}
        >
          {/* Enhanced Box Lid with gradient */}
          <motion.div
            className="absolute inset-x-0 top-0 h-6 bg-gradient-to-br from-purple-300 via-pink-300 to-red-300 rounded-t-3xl border-b border-white/20"
            animate={{
              rotateX: isOpening ? -90 : 0,
              transformOrigin: "bottom",
            }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />

          {/* Enhanced Gift Icon with energy effect */}
          <motion.div
            className="flex items-center justify-center relative"
            animate={{
              scale: isHovered ? 1.2 : 1,
              rotate: isOpening ? 720 : 0,
            }}
            transition={{ 
              scale: { duration: 0.3 },
              rotate: { duration: isOpening ? 1.5 : 0.3 }
            }}
          >
            {/* Energy glow behind icon */}
            <motion.div
              className="absolute inset-0 bg-white/30 rounded-full blur-lg"
              animate={{
                scale: isCharging ? [1, 1.5, 1] : 1,
                opacity: isCharging ? [0.3, 0.8, 0.3] : 0.3,
              }}
              transition={{
                duration: 1,
                repeat: isCharging ? Infinity : 0
              }}
            />
            
            <Gift className="w-20 h-20 text-white relative z-10" />
            
            {/* Electric sparks */}
            {isCharging && (
              <>
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-yellow-300 rounded-full"
                    style={{
                      left: '50%',
                      top: '50%',
                    }}
                    animate={{
                      x: Math.cos((i * 60) * Math.PI / 180) * 40,
                      y: Math.sin((i * 60) * Math.PI / 180) * 40,
                      scale: [0, 1, 0],
                      opacity: [1, 1, 0],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: "easeOut"
                    }}
                  />
                ))}
              </>
            )}
          </motion.div>

          {/* Enhanced Magical Glow with multiple layers */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-yellow-300/30 via-pink-300/20 to-transparent rounded-3xl"
            animate={{
              opacity: isHovered ? 1 : 0.5,
              scale: isHovered ? 1.1 : 1,
              rotate: [0, 5, -5, 0],
            }}
            transition={{ 
              opacity: { duration: 0.3 },
              scale: { duration: 0.3 },
              rotate: { duration: 2, repeat: Infinity }
            }}
          />
          
          {/* Inner glow */}
          <motion.div
            className="absolute inset-2 bg-gradient-to-br from-white/10 to-transparent rounded-2xl"
            animate={{
              opacity: isHovered ? 0.8 : 0.4,
            }}
            transition={{ duration: 0.3 }}
          />
          
          {/* Text overlay */}
          <motion.div
            className="absolute bottom-2 left-0 right-0 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-white text-sm font-bold tracking-wider">
              {t('magicBox.clickToStart')}
            </span>
          </motion.div>
        </motion.div>

        {/* Enhanced Opening Effect */}
        {isOpening && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Explosion particles */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute w-3 h-3 rounded-full ${
                  i % 4 === 0 ? 'bg-yellow-300' :
                  i % 4 === 1 ? 'bg-pink-300' :
                  i % 4 === 2 ? 'bg-purple-300' : 'bg-blue-300'
                }`}
                style={{
                  left: '50%',
                  top: '50%',
                }}
                animate={{
                  x: Math.cos((i * 18) * Math.PI / 180) * (150 + Math.random() * 100),
                  y: Math.sin((i * 18) * Math.PI / 180) * (150 + Math.random() * 100),
                  opacity: [1, 0],
                  scale: [0, 1.5, 0],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 1.5,
                  ease: "easeOut",
                  delay: i * 0.05,
                }}
              />
            ))}
            
            {/* Central energy burst */}
            <motion.div
              className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
              initial={{ scale: 0, opacity: 1 }}
              animate={{
                scale: [0, 3],
                opacity: [1, 0]
              }}
              transition={{
                duration: 1.5,
                ease: "easeOut"
              }}
            >
              <div className="w-20 h-20 bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 rounded-full blur-xl" />
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default MagicBox;