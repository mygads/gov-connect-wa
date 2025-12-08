"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Zap, CheckCircle } from "lucide-react";

/**
 * FAQAnimation Component
 * Shows question to answer animation with search particle effects
 * Includes lightbulb reveal animation
 */

export const FAQAnimation = () => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((prev) => (prev + 1) % 4);
    }, 750);
    return () => clearInterval(interval);
  }, []);

  // Floating particles for search visualization
  const particles = [
    { x: -20, delay: 0 },
    { x: 0, delay: 0.2 },
    { x: 20, delay: 0.4 },
  ];

  return (
    <div className="relative w-48 h-40 flex items-center justify-center">
      {/* Background glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl bg-blue-500/10"
        animate={{
          opacity: phase === 3 ? [0.1, 0.3, 0.1] : 0.1,
        }}
        transition={{ duration: 1, repeat: Infinity }}
      />

      {/* FAQ Card */}
      <motion.div
        className="relative bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-4 w-36"
        initial={{ y: 10, opacity: 0 }}
        animate={{
          y: 0,
          opacity: 1,
          scale: phase === 3 ? [1, 1.02, 1] : 1,
        }}
        transition={{ duration: 0.5 }}
      >
        {/* Icon Container - Question Mark / Lightbulb */}
        <div className="flex justify-center mb-3">
          <div className="relative w-12 h-12">
            {/* Question Mark Phase */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{
                opacity: phase < 2 ? 1 : 0,
                rotate: phase === 1 ? 360 : 0,
                scale: phase < 2 ? 1 : 0.5,
              }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white text-xl font-bold">?</span>
              </div>
            </motion.div>

            {/* Lightbulb Phase */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{
                opacity: phase >= 2 ? 1 : 0,
                scale: phase >= 2 ? [0.5, 1.1, 1] : 0.5,
              }}
              transition={{ duration: 0.4 }}
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                {/* Glow effect for lightbulb */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-green-400"
                  animate={{
                    opacity: phase === 3 ? [0, 0.5, 0] : 0,
                    scale: phase === 3 ? [1, 1.5, 1.5] : 1,
                  }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full bg-green-400"
                  animate={{
                    opacity: phase === 3 ? [0, 0.3, 0] : 0,
                    scale: phase === 3 ? [1, 1.8, 1.8] : 1,
                  }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Fake text lines */}
        <div className="space-y-2">
          <motion.div
            className="h-2 rounded-full"
            animate={{
              backgroundColor: phase >= 2 ? "rgb(34 197 94)" : "rgb(226 232 240)",
              width: phase >= 2 ? "100%" : "60%",
            }}
            transition={{ duration: 0.3 }}
          />
          <motion.div
            className="h-2 rounded-full"
            animate={{
              backgroundColor: phase >= 3 ? "rgb(34 197 94)" : "rgb(226 232 240)",
              width: phase >= 3 ? "100%" : "80%",
            }}
            transition={{ duration: 0.3, delay: 0.1 }}
          />
          <motion.div
            className="h-2 w-1/2 rounded-full"
            animate={{
              backgroundColor: phase >= 3 ? "rgb(34 197 94)" : "rgb(226 232 240)",
            }}
            transition={{ duration: 0.3, delay: 0.2 }}
          />
        </div>
      </motion.div>

      {/* Floating Search Particles */}
      {particles.map((particle, index) => (
        <motion.div
          key={index}
          className="absolute bottom-4"
          style={{ left: `calc(50% + ${particle.x}px)` }}
          animate={{
            y: phase < 2 ? [0, -30, -60] : -60,
            opacity: phase < 2 ? [0.8, 0.5, 0] : 0,
          }}
          transition={{
            duration: 1,
            repeat: phase < 2 ? Infinity : 0,
            delay: particle.delay,
          }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
        </motion.div>
      ))}

      {/* Search dots moving up */}
      <motion.div
        className="absolute left-4 bottom-8"
        animate={{
          y: phase < 2 ? [0, -20, -40] : -40,
          opacity: phase < 2 ? [0.6, 0.3, 0] : 0,
        }}
        transition={{ duration: 1.2, repeat: phase < 2 ? Infinity : 0 }}
      >
        <div className="w-1 h-1 rounded-full bg-secondary" />
      </motion.div>

      <motion.div
        className="absolute right-4 bottom-10"
        animate={{
          y: phase < 2 ? [0, -25, -50] : -50,
          opacity: phase < 2 ? [0.6, 0.3, 0] : 0,
        }}
        transition={{ duration: 1.4, repeat: phase < 2 ? Infinity : 0, delay: 0.3 }}
      >
        <div className="w-1 h-1 rounded-full bg-green-400" />
      </motion.div>

      {/* Success checkmark */}
      <motion.div
        className="absolute -top-2 -right-2"
        animate={{
          scale: phase === 3 ? [0, 1.2, 1] : 0,
          opacity: phase === 3 ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
          <CheckCircle className="h-4 w-4 text-white" />
        </div>
      </motion.div>
    </div>
  );
};
