"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, CheckCircle, Zap, MessageCircle, FileText, Bell } from "lucide-react";

/**
 * Benefit Animation Components
 * Three different animations to illustrate benefits:
 * 1. ClockToCheckAnimation - Faster process (3 phases)
 * 2. StepsLightingAnimation - Sequential steps (3 steps)
 * 3. PhoneServicesAnimation - Service icons popping (3 icons)
 */

// Animation 1: Clock to Checkmark (Faster Process)
export const ClockToCheckAnimation = () => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((prev) => (prev + 1) % 3);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-16 h-16">
      {/* Clock Phase */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          opacity: phase === 0 ? 1 : 0,
          scale: phase === 0 ? 1 : 0.5,
          rotate: phase === 0 ? 0 : -90,
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center">
          <Clock className="h-7 w-7 text-blue-500" />
        </div>
      </motion.div>

      {/* Transition Phase - Spinning */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          opacity: phase === 1 ? 1 : 0,
          rotate: phase === 1 ? 360 : 0,
          scale: phase === 1 ? [1, 1.2, 1] : 1,
        }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-green-500 flex items-center justify-center">
          <Zap className="h-7 w-7 text-white" />
        </div>
      </motion.div>

      {/* Checkmark Phase */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          opacity: phase === 2 ? 1 : 0,
          scale: phase === 2 ? [0.5, 1.1, 1] : 0.5,
        }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center">
          <CheckCircle className="h-7 w-7 text-white" />
        </div>
      </motion.div>

      {/* Success Ring */}
      <motion.div
        className="absolute inset-0"
        animate={{
          scale: phase === 2 ? [1, 1.3, 1.3] : 1,
          opacity: phase === 2 ? [0, 0.5, 0] : 0,
        }}
        transition={{ duration: 0.6 }}
      >
        <div className="w-full h-full rounded-full border-2 border-green-500" />
      </motion.div>
    </div>
  );
};

// Animation 2: Three Steps Lighting Up
export const StepsLightingAnimation = () => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 750);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2">
      {[0, 1, 2].map((step) => (
        <motion.div
          key={step}
          className="relative"
          animate={{
            scale: activeStep === step ? 1.1 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          {/* Step Box */}
          <motion.div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            animate={{
              backgroundColor: activeStep >= step ? "rgb(34 197 94)" : "rgb(226 232 240)",
            }}
            transition={{ duration: 0.3 }}
          >
            <motion.span
              className="text-sm font-bold"
              animate={{
                color: activeStep >= step ? "#ffffff" : "#94a3b8",
              }}
            >
              {step + 1}
            </motion.span>
          </motion.div>

          {/* Glow Effect */}
          <motion.div
            className="absolute inset-0 rounded-lg bg-green-500"
            animate={{
              opacity: activeStep === step ? [0, 0.3, 0] : 0,
              scale: activeStep === step ? [1, 1.3, 1.3] : 1,
            }}
            transition={{ duration: 0.5 }}
          />

          {/* Connector Line */}
          {step < 2 && (
            <motion.div
              className="absolute top-1/2 -right-2 w-2 h-0.5"
              animate={{
                backgroundColor: activeStep > step ? "rgb(34 197 94)" : "rgb(226 232 240)",
              }}
              transition={{ duration: 0.3 }}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
};

// Animation 3: Phone with Service Icons Popping
export const PhoneServicesAnimation = () => {
  const [visibleIcons, setVisibleIcons] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleIcons((prev) => (prev + 1) % 5);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  const services = [
    { icon: MessageCircle, color: "bg-blue-500", position: "top-1 left-1/2 -translate-x-1/2" },
    { icon: FileText, color: "bg-green-500", position: "bottom-3 left-1" },
    { icon: Bell, color: "bg-orange-500", position: "bottom-3 right-1" },
  ];

  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      {/* Phone Body */}
      <div className="relative w-10 h-14 bg-slate-200 dark:bg-slate-700 rounded-lg border-2 border-slate-300 dark:border-slate-600 overflow-hidden">
        {/* Phone Screen */}
        <div className="absolute inset-1 bg-white dark:bg-slate-800 rounded-sm flex items-center justify-center">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-primary" />
            </div>
          </motion.div>
        </div>
        {/* Phone Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-slate-300 dark:bg-slate-600 rounded-b-sm" />
      </div>

      {/* Service Icons - Popping Animation */}
      {services.map((service, index) => (
        <motion.div
          key={index}
          className={`absolute ${service.position}`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: visibleIcons > index ? [0, 1.2, 1] : 0,
            opacity: visibleIcons > index ? 1 : 0,
          }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <div className={`w-5 h-5 ${service.color} rounded-full flex items-center justify-center shadow-lg`}>
            <service.icon className="h-3 w-3 text-white" />
          </div>
        </motion.div>
      ))}

      {/* Connection Lines */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: -1 }}>
        {services.map((_, index) => (
          <motion.line
            key={index}
            x1="50%"
            y1="50%"
            x2={index === 0 ? "50%" : index === 1 ? "20%" : "80%"}
            y2={index === 0 ? "15%" : "85%"}
            stroke="rgb(59 130 246)"
            strokeWidth="1"
            strokeDasharray="2,2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{
              pathLength: visibleIcons > index ? 1 : 0,
              opacity: visibleIcons > index ? 0.3 : 0,
            }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </svg>
    </div>
  );
};
