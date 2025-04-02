import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const dotVariants = {
  fall: (i) => ({
    y: [-20, 0],
    opacity: [0, 1],
    transition: { delay: i * 0.3, duration: 0.8, ease: 'easeOut' },
  }),
  bounce: (i) => ({
    y: [0, -8, 0],
    opacity: [1, 1, 1],
    transition: { delay: i * 0.3, duration: 1.2, ease: 'easeInOut' },
  }),
  fadeIn: (i) => ({
    opacity: [0, 1, 0],
    transition: { delay: i * 0.4, duration: 1.5, ease: 'easeInOut' },
  }),
  slideLeft: (i) => ({
    x: [30, 0],
    opacity: [0, 1],
    transition: { delay: i * 0.3, duration: 1, ease: 'easeOut' },
  }),
  wave: (i) => ({
    scale: [1, 1.6, 1],
    opacity: [1, 0.4, 1],
    transition: { delay: i * 0.4, duration: 1.2, ease: 'easeInOut' },
  }),
  pulseColor: (i) => ({
    color: ['#22d3ee', '#3b82f6', '#f472b6'],
    opacity: [0.4, 1, 0.4],
    transition: { delay: i * 0.4, duration: 1.8, ease: 'easeInOut' },
  }),
  scalePop: (i) => ({
    scale: [1, 1.4, 1],
    opacity: [0.6, 1, 0.6],
    transition: { delay: i * 0.3, duration: 1, ease: 'easeOut' },
  }),
  swirl: (i) => ({
    rotate: [0, 360],
    scale: [1, 1.2, 1],
    opacity: [0.7, 1, 0.7],
    transition: { delay: i * 0.2, duration: 1.6, ease: 'easeInOut' },
  }),
};

const animationTypes = Object.keys(dotVariants);

const AnimatedBackground = ({ loadingText, subText, progress }) => {
  const hasAnimatedTitle = useRef(false);
  const [dotAnimation, setDotAnimation] = useState('fall');
  const percentage = progress?.total > 0 ? (progress.current / progress.total) * 100 : 0;

  useEffect(() => {
    hasAnimatedTitle.current = true;

    let timeout;

    const changeAnimation = () => {
      const next = animationTypes[Math.floor(Math.random() * animationTypes.length)];
      setDotAnimation(next);
      timeout = setTimeout(changeAnimation, 5000); // zen pace
    };

    changeAnimation();

    return () => clearTimeout(timeout);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 z-50 pointer-events-none bg-black/80"
      initial={{ opacity: 1, scale: 1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{
        opacity: 0,
        scale: 1.1,
        backgroundColor: "#ffffff",
        transition: { duration: 1, ease: "easeInOut" },
      }}
    >
      <div className="absolute inset-0 z-0 pointer-events-none bg-black/80">
        <div className="w-full h-full relative">
          <div className="absolute top-1/3 w-full flex flex-col items-center z-10">
            {loadingText && (
              <motion.div
                className="text-white text-xl font-medium mb-2 flex gap-1 justify-center"
                initial={!hasAnimatedTitle.current ? { opacity: 0, y: -10 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {loadingText}
                <span className="inline-flex">
                  {[...Array(3)].map((_, i) => (
                    <motion.span
                      key={`${dotAnimation}-${i}`}
                      className="inline-block"
                      animate={dotVariants[dotAnimation](i)}
                      style={{ display: 'inline-block', marginLeft: '2px' }}
                    >
                      .
                    </motion.span>
                  ))}
                </span>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {subText && (
                <motion.div
                  key={subText}
                  className="text-white text-sm font-normal mb-2 mx-2 text-center"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.4 }}
                >
                  {subText}
                </motion.div>
              )}
            </AnimatePresence>

            {progress && (
              <div className="w-2/3 h-2 bg-gray-700 rounded overflow-hidden mt-1">
                <div
                  className="h-full bg-cyan-400 transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            )}
          </div>

          <motion.div
            className="absolute w-64 h-64 rounded-full bg-cyan-400/20 blur-3xl shadow-lg drop-shadow-neon"
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
          />

          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border border-cyan-500/30"
              initial={{ scale: 0.5, opacity: 0.9 }}
              animate={{ scale: 3.5, opacity: 0 }}
              transition={{
                duration: 4,
                repeat: Infinity,
                repeatDelay: 0.5,
                delay: i * 1.2,
                ease: 'easeOut',
              }}
              style={{
                top: '50%',
                left: '50%',
                width: '400px',
                height: '400px',
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default AnimatedBackground;
