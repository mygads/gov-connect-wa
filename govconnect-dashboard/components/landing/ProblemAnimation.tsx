"use client";

import { motion } from "framer-motion";
import { Users, FileSignature, FileQuestion } from "lucide-react";

/**
 * ProblemAnimation Component
 * Animated icons showing common problems with government services
 */

export default function ProblemAnimation() {
  return (
    <div className="w-full max-w-4xl mx-auto p-8 flex flex-col md:flex-row justify-center items-center gap-12 md:gap-24">
      {/* Masalah 1: Antrean Panjang */}
      <div className="flex flex-col items-center gap-4">
        <motion.div
          className="relative"
          animate={{
            x: [0, -4, 4, -4, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.2, 0.4, 0.6, 1],
          }}
        >
          <div className="absolute -top-2 -right-2 w-3 h-3 bg-destructive rounded-full animate-pulse" />
          <Users className="w-16 h-16 text-primary" />
        </motion.div>
        <p className="text-sm font-medium text-muted-foreground text-center">
          Antrean Panjang
        </p>
      </div>

      {/* Masalah 2: Proses Manual */}
      <div className="flex flex-col items-center gap-4">
        <motion.div
          animate={{
            rotate: [0, -8, 8, -8, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        >
          <FileSignature className="w-16 h-16 text-secondary" />
        </motion.div>
        <p className="text-sm font-medium text-muted-foreground text-center">
          Proses Manual
        </p>
      </div>

      {/* Masalah 3: Informasi Tidak Jelas */}
      <div className="flex flex-col items-center gap-4">
        <motion.div
          animate={{
            opacity: [0.6, 1, 0.6],
            scale: [0.95, 1.05, 0.95],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.0,
          }}
        >
          <FileQuestion className="w-16 h-16 text-primary" />
        </motion.div>
        <p className="text-sm font-medium text-muted-foreground text-center">
          Informasi Buram
        </p>
      </div>
    </div>
  );
}
