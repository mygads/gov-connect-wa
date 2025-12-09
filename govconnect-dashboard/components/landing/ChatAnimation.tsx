"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, Paperclip, Smile, Image as ImageIcon, FileText, CheckCircle } from "lucide-react";

/**
 * ChatAnimation Component
 * Displays an animated chat conversation in the hero section
 * Shows a sequence of messages with auto-scroll and typing indicators
 */

interface Message {
  id: number;
  type: "bot" | "user";
  text: string;
  isImage?: boolean;
  isDocument?: boolean;
}

const allMessages: Omit<Message, "id">[] = [
  // Conversation 1: Laporan Jalan Rusak
  { type: "bot", text: "Halo! 👋 Selamat datang di GovConnect. Saya siap membantu Anda dengan layanan kelurahan. Ada yang bisa saya bantu?" },
  { type: "user", text: "Saya mau lapor jalan rusak di RT 05" },
  { type: "bot", text: "Baik, saya akan bantu proses laporan Anda. Mohon kirimkan foto lokasi kerusakan jalan 📸" },
  { type: "user", text: "📷 Foto jalan berlubang", isImage: true },
  { type: "bot", text: "Foto diterima! ✅ Mohon jelaskan lokasi lebih detail (nama jalan, dekat landmark apa?)" },
  { type: "user", text: "Jl. Melati No. 15, depan warung Pak Ahmad" },
  { type: "bot", text: "Laporan berhasil dikirim! 🎉\n\n📋 Nomor Laporan: #LAP-20241208-001\n📍 Lokasi: Jl. Melati No. 15\n⏱️ Estimasi: 2-3 hari kerja\n\nAnda akan mendapat notifikasi update status." },
  
  // Conversation 2: Pengajuan Surat
  { type: "user", text: "Saya juga mau ajukan surat keterangan domisili" },
  { type: "bot", text: "Tentu! Untuk pengajuan Surat Keterangan Domisili, saya butuh beberapa dokumen:\n\n1️⃣ Foto KTP\n2️⃣ Foto Kartu Keluarga\n3️⃣ Surat pengantar RT/RW" },
  { type: "user", text: "📄 Dokumen KTP & KK", isDocument: true },
  { type: "bot", text: "Dokumen diterima! ✅ Apakah Anda sudah memiliki surat pengantar dari RT/RW?" },
  { type: "user", text: "Sudah ada, ini fotonya" },
  { type: "user", text: "📄 Surat Pengantar RT", isDocument: true },
  { type: "bot", text: "Semua dokumen lengkap! 📝\n\nPengajuan Surat Keterangan Domisili Anda sedang diproses.\n\n📋 No. Pengajuan: #SKD2024015\n⏱️ Estimasi selesai: 1-2 hari kerja\n📍 Pengambilan: Kantor Kelurahan" },
  
  // Conversation 3: Informasi
  { type: "user", text: "Jam operasional kelurahan kapan ya?" },
  { type: "bot", text: "🕐 Jam Operasional Kelurahan:\n\nSenin - Kamis: 08.00 - 16.00\nJumat: 08.00 - 11.30\nSabtu - Minggu: Libur\n\n📞 Hotline: 021-12345678\n📍 Jl. Raya Kelurahan No. 1" },
  { type: "user", text: "Terima kasih banyak! 🙏" },
  { type: "bot", text: "Sama-sama! 😊 Senang bisa membantu.\n\nJika ada pertanyaan lain, jangan ragu untuk menghubungi saya kapan saja. GovConnect siap melayani 24/7! 💪" },
];

export const ChatAnimation = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new message arrives
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isTyping]);

  // Add messages one by one with delays
  useEffect(() => {
    if (currentIndex >= allMessages.length) {
      // Reset after all messages shown
      const resetTimeout = setTimeout(() => {
        setMessages([]);
        setCurrentIndex(0);
      }, 5000);
      return () => clearTimeout(resetTimeout);
    }

    const currentMessage = allMessages[currentIndex];
    const delay = currentMessage.type === "bot" ? 2000 : 1500;

    // Show typing indicator for bot messages
    if (currentMessage.type === "bot") {
      setIsTyping(true);
      const typingTimeout = setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [...prev, { ...currentMessage, id: currentIndex }]);
        setCurrentIndex((prev) => prev + 1);
      }, 1500);
      return () => clearTimeout(typingTimeout);
    } else {
      const messageTimeout = setTimeout(() => {
        setMessages((prev) => [...prev, { ...currentMessage, id: currentIndex }]);
        setCurrentIndex((prev) => prev + 1);
      }, delay);
      return () => clearTimeout(messageTimeout);
    }
  }, [currentIndex]);

  return (
    <motion.div
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
                <p className="text-white/80 text-xs">Online • Siap membantu 24/7</p>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div
            ref={chatContainerRef}
            className="p-4 space-y-3 bg-gradient-to-b from-muted/50 to-muted/20 h-[340px] overflow-y-auto scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <AnimatePresence mode="popLayout">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className={`flex ${msg.type === "user" ? "justify-end" : "gap-2"}`}
                >
                  {msg.type === "bot" && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-secondary to-secondary/70 flex items-center justify-center shrink-0 shadow-md">
                      <MessageCircle className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-3 py-2 max-w-[85%] shadow-sm ${
                      msg.type === "user"
                        ? "bg-secondary text-secondary-foreground rounded-br-sm"
                        : "bg-card border border-border/50 rounded-bl-sm"
                    }`}
                  >
                    {msg.isImage && (
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-16 h-12 bg-muted rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </div>
                    )}
                    {msg.isDocument && (
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-500" />
                        </div>
                      </div>
                    )}
                    <p className="text-xs leading-relaxed whitespace-pre-line">{msg.text}</p>
                    <div className={`flex items-center gap-1 mt-1 ${msg.type === "user" ? "justify-end" : ""}`}>
                      <p className={`text-[9px] ${msg.type === "user" ? "text-white/60" : "text-muted-foreground"}`}>
                        {new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      {msg.type === "user" && <CheckCircle className="w-3 h-3 text-white/60" />}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing Indicator */}
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex gap-2"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-secondary to-secondary/70 flex items-center justify-center shrink-0 shadow-md">
                    <MessageCircle className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="bg-card border border-border/50 rounded-2xl rounded-bl-sm px-3 py-2.5 shadow-sm">
                    <div className="flex gap-1">
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-secondary/60"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: 0 }}
                      />
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-secondary/60"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }}
                      />
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-secondary/60"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Chat Input */}
          <div className="p-3 border-t border-border/50 bg-card/80 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <Smile className="h-5 w-5" />
              </button>
              <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <Paperclip className="h-5 w-5" />
              </button>
              <div className="flex-1 bg-muted/50 rounded-full px-4 py-2">
                <motion.p
                  className="text-xs text-muted-foreground"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Ketik pesan...
                </motion.p>
              </div>
              <motion.button
                className="p-2 bg-secondary rounded-full text-white shadow-md"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Send className="h-4 w-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Notification Badge */}
      <motion.div
        className="absolute -top-3 -right-3 bg-red-500 text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center shadow-lg ring-4 ring-background"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {Math.min(messages.length, 9)}+
      </motion.div>

      {/* Decorative Glow */}
      <div className="absolute -inset-4 bg-gradient-to-r from-secondary/20 to-primary/20 rounded-[3rem] blur-2xl -z-10 opacity-60" />
    </motion.div>
  );
};
