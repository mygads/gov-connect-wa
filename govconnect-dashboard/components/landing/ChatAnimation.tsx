"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Send, Paperclip, Smile } from "lucide-react";

/**
 * ChatAnimation Component
 * Displays an animated chat conversation in the hero section
 * Shows a sequence of messages with typing indicators and auto-restart
 */

interface Message {
  type: "bot" | "user";
  text: string;
  delay: number;
}

export const ChatAnimation = () => {
  const [key, setKey] = useState(0);

  useEffect(() => {
    // Reset animation every 10 seconds
    const interval = setInterval(() => {
      setKey((prev) => prev + 1);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const messages: Message[] = [
    { type: "bot", text: "Halo! 👋 Selamat datang di GovConnect. Ada yang bisa saya bantu?", delay: 0.5 },
    { type: "user", text: "Saya mau lapor jalan rusak di RT 05", delay: 2 },
    { type: "bot", text: "Baik, saya akan bantu proses laporan Anda. Mohon kirimkan foto lokasi 📸", delay: 3.5 },
    { type: "user", text: "📷 [Foto jalan rusak]", delay: 5 },
    { type: "bot", text: "Laporan berhasil dikirim! ✅ Nomor tiket: #GC2024001", delay: 6.5 },
  ];

  return (
    <motion.div 
      key={key} 
      className="relative w-full max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Phone Frame */}
      <div className="relative bg-card border-2 border-border/50 rounded-[2.5rem] shadow-2xl overflow-hidden p-2">
        {/* Phone Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-background rounded-b-2xl z-10" />
        
        {/* Inner Screen */}
        <div className="bg-background rounded-[2rem] overflow-hidden">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-secondary to-secondary/80 px-4 py-4 pt-8 flex items-center gap-3">
            <motion.div 
              className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-2 ring-white/30"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <MessageCircle className="h-5 w-5 text-white" />
            </motion.div>
            <div className="flex-1">
              <p className="text-white font-semibold">GovConnect Bot</p>
              <div className="flex items-center gap-1.5">
                <motion.div 
                  className="w-2 h-2 rounded-full bg-green-400"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <p className="text-white/80 text-xs">Online • Siap membantu</p>
              </div>
            </div>
          </div>
          
          {/* Chat Messages */}
          <div className="p-4 space-y-4 bg-gradient-to-b from-muted/50 to-muted/20 min-h-[320px] max-h-[320px] overflow-hidden">
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: msg.delay, duration: 0.4, ease: "easeOut" }}
                className={`flex ${msg.type === "user" ? "justify-end" : "gap-2"}`}
              >
                {msg.type === "bot" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-secondary/70 flex items-center justify-center shrink-0 shadow-md">
                    <MessageCircle className="h-4 w-4 text-white" />
                  </div>
                )}
                <div className={`rounded-2xl px-4 py-2.5 max-w-[80%] shadow-sm ${
                  msg.type === "user" 
                    ? "bg-secondary text-secondary-foreground rounded-br-md" 
                    : "bg-card border border-border/50 rounded-bl-md"
                }`}>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  <p className={`text-[10px] mt-1 ${msg.type === "user" ? "text-white/60" : "text-muted-foreground"}`}>
                    {msg.type === "user" ? "Terkirim ✓✓" : ""}
                  </p>
                </div>
              </motion.div>
            ))}

            {/* Typing Indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 8, duration: 0.3 }}
              className="flex gap-2"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-secondary/70 flex items-center justify-center shrink-0 shadow-md">
                <MessageCircle className="h-4 w-4 text-white" />
              </div>
              <div className="bg-card border border-border/50 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex gap-1.5">
                  <motion.div 
                    className="w-2 h-2 rounded-full bg-secondary/60"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                  />
                  <motion.div 
                    className="w-2 h-2 rounded-full bg-secondary/60"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                  />
                  <motion.div 
                    className="w-2 h-2 rounded-full bg-secondary/60"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Chat Input */}
          <div className="p-3 border-t border-border/50 bg-card/80 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                <Smile className="h-5 w-5" />
              </button>
              <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                <Paperclip className="h-5 w-5" />
              </button>
              <div className="flex-1 bg-muted/50 rounded-full px-4 py-2.5">
                <motion.p 
                  className="text-sm text-muted-foreground"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Ketik pesan...
                </motion.p>
              </div>
              <motion.button
                className="p-2.5 bg-secondary rounded-full text-white shadow-md"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Send className="h-4 w-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <motion.div
        className="absolute -top-3 -right-3 bg-red-500 text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center shadow-lg ring-4 ring-background"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        1
      </motion.div>
      
      {/* Decorative Glow */}
      <div className="absolute -inset-4 bg-gradient-to-r from-secondary/20 to-primary/20 rounded-[3rem] blur-2xl -z-10 opacity-60" />
    </motion.div>
  );
};
