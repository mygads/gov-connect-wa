"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Sun,
  Moon,
  MessageCircle,
  FileText,
  Bell,
  Clock,
  Phone,
  Mail,
  MapPin,
  Heart,
  LayoutDashboard,
  BarChart3,
  Users,
  Shield,
  AlertTriangle,
  Siren,
  Zap,
  Brain,
  Database,
  Globe,
  Building2,
  CalendarCheck,
  FileCheck,
  Map,
  Send,
  Headphones,
  Instagram,
  MessageSquare,
  Workflow,
  Network,
  Bot,
  RefreshCw,
  Building,
  Landmark,
  BadgeCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  WhatsAppIcon,
  ChatAnimation,
  HowItWorksAnimation,
  SolutionAnimation,
  FAQAnimation,
  ClockToCheckAnimation,
  StepsLightingAnimation,
  PhoneServicesAnimation,
  ProblemAnimation,
  LiveChatWidget,
} from "@/components/landing";
import { generateWhatsAppLink } from "@/lib/whatsapp";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const slideInLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0 },
};

const slideInRight = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

export default function LandingPage() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const whatsappLink = generateWhatsAppLink();

  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src={isDark ? "/logo-dashboard-dark.png" : "/logo-dashboard.png"}
                alt="GovConnect Logo"
                width={140}
                height={140}
                className="object-contain"
                priority
              />
            </Link>

            <div className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2 bg-muted/50 rounded-full px-2 py-1">
              {[
                { id: "tentang", label: "Tentang" },
                { id: "fitur", label: "Fitur" },
                { id: "use-case", label: "Use Case" },
                { id: "integrasi", label: "Integrasi" },
                { id: "faq", label: "FAQ" },
              ].map((item) => (
                <Link
                  key={item.id}
                  href={`#${item.id}`}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-background/80 px-4 py-2 rounded-full transition-all duration-200"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full w-9 h-9 hover:bg-muted transition-colors duration-200"
              >
                {isDark ? (
                  <Sun className="h-[1.1rem] w-[1.1rem] text-yellow-500" />
                ) : (
                  <Moon className="h-[1.1rem] w-[1.1rem] text-slate-600" />
                )}
              </Button>
              <Button asChild className="rounded-full bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-md shadow-secondary/20 px-6">
                <Link href="/login">Login</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-primary/5 pointer-events-none" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              variants={slideInLeft}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.6 }}
              className="text-center md:text-left"
            >
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-secondary/10 border border-secondary/20 rounded-full px-4 py-1.5 mb-6"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
                </span>
                <span className="text-sm font-medium text-secondary">AI-Powered Government Services</span>
              </motion.div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Menghubungkan{" "}
                <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                  Masyarakat & Pemerintah
                </span>{" "}
                dengan AI
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto md:mx-0">
                Platform automation berbasis AI yang memudahkan masyarakat mengakses layanan pemerintahan. 
                Dari knowledge base hingga pelaporan, semua dalam satu sistem terpusat.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Button size="lg" className="text-lg px-8 bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/25" asChild>
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Hubungi Kami
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 border-2" asChild>
                  <Link href="#fitur">Pelajari Lebih Lanjut</Link>
                </Button>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex flex-wrap gap-8 mt-10 justify-center md:justify-start"
              >
                {[
                  { value: "Multi-Level", label: "Kelurahan - Pusat" },
                  { value: "24/7", label: "AI Response" },
                  { value: "Real-time", label: "Data Integration" },
                ].map((stat, index) => (
                  <div key={index} className="text-center md:text-left">
                    <p className="text-2xl md:text-3xl font-bold text-secondary">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              variants={slideInRight}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -top-4 -left-4 w-20 h-20 bg-secondary/20 rounded-2xl rotate-12 blur-sm" />
              <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-primary/20 rounded-full blur-sm" />
              <ChatAnimation />
            </motion.div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="tentang" className="py-20 bg-gradient-to-b from-muted/50 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-4xl mx-auto mb-16"
          >
            <span className="inline-block text-sm font-semibold text-secondary bg-secondary/10 px-4 py-1.5 rounded-full mb-4">
              Tentang GovConnect
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Layanan Pemerintahan yang{" "}
              <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                Mudah & Cepat
              </span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              GovConnect adalah platform yang menghubungkan masyarakat dengan pemerintah melalui automation berbasis AI. 
              Tidak perlu lagi ribet ke kantor pemerintahan hanya untuk mendapatkan informasi. 
              Dengan knowledge base yang terintegrasi, masyarakat dapat mengakses informasi pemerintahan dengan mudah dan mendapatkan response yang cepat.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6"
          >
            {[
              { 
                icon: Brain, 
                title: "AI-Powered Knowledge Base", 
                desc: "Informasi pemerintahan yang mudah diakses masyarakat tanpa perlu datang ke kantor. Knowledge base dapat diupdate dan disesuaikan sesuai kebutuhan.", 
                color: "from-blue-500 to-cyan-500" 
              },
              { 
                icon: Database, 
                title: "Data Real-time", 
                desc: "Tidak hanya data statis, sistem dapat terhubung dengan database pemerintahan untuk mendapatkan data dinamis secara otomatis.", 
                color: "from-green-500 to-emerald-500" 
              },
              { 
                icon: Zap, 
                title: "Response Cepat 24/7", 
                desc: "AI assistant yang siap melayani masyarakat kapan saja dengan response yang cepat dan akurat.", 
                color: "from-orange-500 to-amber-500" 
              },
            ].map((item, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="group hover:shadow-xl transition-all duration-300 border-secondary/10 hover:border-secondary/30 overflow-hidden h-full">
                  <CardHeader className="relative">
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.color} opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:opacity-10 transition-opacity`} />
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 shadow-lg`}>
                      <item.icon className="h-7 w-7 text-white" />
                    </div>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fitur" className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block text-sm font-semibold text-secondary bg-secondary/10 px-4 py-1.5 rounded-full mb-4">
              Fitur Unggulan
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Solusi Lengkap{" "}
              <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                Layanan Pemerintahan
              </span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Platform terintegrasi untuk semua kebutuhan layanan pemerintahan dari tingkat kelurahan hingga pusat
            </p>
          </motion.div>

          <div className="flex justify-center mb-16">
            <SolutionAnimation />
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              { icon: AlertTriangle, title: "Pelaporan Masalah", desc: "Laporkan bencana, jalan rusak, lampu mati, dan masalah lainnya dengan mudah. Dilengkapi mapping lokasi dan alert prioritas untuk bencana.", gradient: "from-red-500 to-orange-500", bg: "from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30" },
              { icon: Map, title: "Mapping & Tracking", desc: "Visualisasi lokasi laporan pada peta. Memudahkan pemerintah untuk melihat sebaran masalah dan mengkoordinasikan penanganan.", gradient: "from-blue-500 to-cyan-500", bg: "from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30" },
              { icon: CalendarCheck, title: "Reservasi Layanan", desc: "Buat reservasi untuk datang ke layanan pemerintahan. Tidak perlu antre lama, cukup booking waktu yang tersedia.", gradient: "from-green-500 to-emerald-500", bg: "from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30" },
              { icon: FileCheck, title: "Pengajuan Surat & Layanan", desc: "Ajukan surat menyurat dan berbagai layanan pemerintahan dengan cepat. Proses yang biasanya berhari-hari menjadi lebih singkat.", gradient: "from-purple-500 to-violet-500", bg: "from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30" },
              { icon: Workflow, title: "Distribusi Tugas", desc: "Sistem distribusi tugas otomatis untuk petugas pemerintahan. Memastikan setiap laporan dan pengajuan ditangani dengan tepat.", gradient: "from-pink-500 to-rose-500", bg: "from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30" },
              { icon: LayoutDashboard, title: "Dashboard Terpusat", desc: "Kontrol semua layanan dari satu dashboard. Monitoring, analitik, dan manajemen dalam satu tempat.", gradient: "from-amber-500 to-yellow-500", bg: "from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30" },
            ].map((feature, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className={`h-full hover:shadow-2xl transition-all duration-300 border-0 bg-gradient-to-br ${feature.bg} group`}>
                  <CardHeader className="pb-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="h-7 w-7 text-white" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-case" className="py-20 md:py-28 bg-gradient-to-b from-muted/50 to-background relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-4 h-4 bg-secondary rounded-full" />
          <div className="absolute top-40 right-40 w-3 h-3 bg-primary rounded-full" />
          <div className="absolute bottom-40 left-1/4 w-2 h-2 bg-secondary rounded-full" />
          <div className="absolute bottom-20 right-1/3 w-3 h-3 bg-primary rounded-full" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block text-sm font-semibold text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-4">
              Use Cases
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Untuk Semua Tingkat{" "}
              <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                Layanan Pemerintahan
              </span>
            </h2>
            <p className="text-muted-foreground max-w-3xl mx-auto text-lg">
              GovConnect dapat disesuaikan untuk berbagai tingkat pemerintahan dan layanan publik. 
              Kami akan menyesuaikan sesuai kebutuhan spesifik setiap instansi.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          >
            {[
              { icon: Building, title: "Kelurahan", desc: "Layanan administrasi tingkat kelurahan, surat pengantar, dan informasi warga", gradient: "from-blue-500 to-cyan-500" },
              { icon: Building2, title: "Kecamatan", desc: "Koordinasi antar kelurahan, layanan kependudukan, dan perizinan tingkat kecamatan", gradient: "from-green-500 to-emerald-500" },
              { icon: Landmark, title: "Kabupaten/Kota", desc: "Layanan skala kabupaten/kota, perizinan usaha, dan koordinasi lintas kecamatan", gradient: "from-purple-500 to-violet-500" },
              { icon: BadgeCheck, title: "Instansi Khusus", desc: "Kepolisian, Dinas Kesehatan, Dinas Pendidikan, dan instansi pemerintah lainnya", gradient: "from-orange-500 to-amber-500" },
            ].map((item, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="h-full hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
                  <CardContent className="pt-6 text-center">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                      <item.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Example Use Cases */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-16"
          >
            <h3 className="text-2xl font-bold text-center mb-8">Contoh Layanan yang Dapat Diintegrasikan</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                "Pelaporan bencana alam dengan alert prioritas",
                "Laporan jalan rusak & infrastruktur",
                "Laporan lampu jalan mati",
                "Pengajuan surat keterangan domisili",
                "Pengajuan surat pengantar",
                "Reservasi layanan kependudukan",
                "Informasi jadwal pelayanan",
                "Tracking status pengajuan",
                "Informasi program pemerintah",
                "Pengaduan pelayanan publik",
                "Perizinan usaha mikro",
                "Dan layanan lainnya sesuai kebutuhan",
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="w-2 h-2 rounded-full bg-secondary shrink-0" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Integration Section */}
      <section id="integrasi" className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-4">
              <Network className="w-4 h-4" />
              Multi-Channel Integration
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Terhubung ke{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Semua Platform
              </span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Satu dashboard untuk mengontrol semua channel komunikasi. 
              Masyarakat dapat mengakses layanan dari platform yang mereka gunakan sehari-hari.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          >
            {[
              { icon: WhatsAppIcon, title: "WhatsApp", desc: "Layanan via WhatsApp Business API", gradient: "from-green-500 to-green-600", isCustomIcon: true },
              { icon: Instagram, title: "Instagram", desc: "Integrasi dengan Instagram DM", gradient: "from-pink-500 to-purple-500", isCustomIcon: false },
              { icon: Send, title: "Telegram", desc: "Bot Telegram untuk layanan", gradient: "from-blue-400 to-blue-600", isCustomIcon: false },
              { icon: Globe, title: "Website", desc: "Webchat popup di website pemerintah", gradient: "from-slate-500 to-slate-700", isCustomIcon: false },
            ].map((item, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="h-full hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
                  <CardContent className="pt-6 text-center">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                      {item.isCustomIcon ? (
                        <item.icon className="w-7 h-7 text-white" />
                      ) : (
                        <item.icon className="w-7 h-7 text-white" />
                      )}
                    </div>
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Centralized Control */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-16"
          >
            <Card className="border-secondary/20 bg-gradient-to-br from-secondary/5 to-primary/5">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-2xl font-bold mb-4">Kontrol Terpusat</h3>
                    <p className="text-muted-foreground mb-6">
                      Semua pesan dari berbagai channel masuk ke satu dashboard. 
                      Petugas dapat merespon, mendistribusikan tugas, dan memantau semua interaksi dari satu tempat.
                    </p>
                    <ul className="space-y-3">
                      {[
                        "Unified inbox untuk semua channel",
                        "Distribusi tugas otomatis ke petugas",
                        "Analitik dan reporting terpusat",
                        "Knowledge base yang dapat diupdate",
                        "Integrasi dengan sistem pemerintahan existing",
                      ].map((item, index) => (
                        <li key={index} className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center">
                            <BadgeCheck className="w-3 h-3 text-secondary" />
                          </div>
                          <span className="text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="relative">
                    <div className="absolute -inset-4 bg-gradient-to-r from-secondary/20 to-primary/20 rounded-2xl blur-xl opacity-50" />
                    <div className="relative bg-gradient-to-b from-muted to-background p-2 rounded-xl">
                      <Image
                        src="/dashboard.png"
                        alt="Dashboard Preview"
                        width={600}
                        height={400}
                        className="rounded-lg shadow-xl border border-border/50"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Emergency Alert Section */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-destructive/5 via-orange-500/5 to-background relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <motion.div
            className="absolute top-20 left-20 w-20 h-20 bg-destructive/20 rounded-full"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-20 right-20 w-16 h-16 bg-orange-500/20 rounded-full"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.7, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-destructive/20 border border-destructive/30 text-destructive px-4 py-1.5 rounded-full mb-4">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Siren className="w-4 h-4" />
              </motion.div>
              <span className="font-semibold text-sm">Fitur Darurat</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Alert{" "}
              <span className="text-destructive">Laporan Darurat</span>{" "}
              & Bencana
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Sistem notifikasi prioritas tinggi untuk laporan bencana dan keadaan darurat. 
              Laporan langsung diteruskan ke pusat untuk penanganan cepat.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-6 mb-12"
          >
            {[
              { icon: AlertTriangle, title: "Deteksi Otomatis", desc: "AI mendeteksi kata kunci darurat dalam laporan warga secara real-time", gradient: "from-orange-500 to-amber-500" },
              { icon: Siren, title: "Alert Prioritas", desc: "Notifikasi khusus dengan suara dan visual berbeda untuk petugas pusat", gradient: "from-red-500 to-rose-500" },
              { icon: Map, title: "Mapping Lokasi", desc: "Visualisasi lokasi bencana pada peta untuk koordinasi penanganan", gradient: "from-yellow-500 to-orange-500" },
            ].map((item, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="h-full hover:shadow-lg transition-all duration-300 border-destructive/20 hover:border-destructive/40">
                  <CardContent className="pt-6 text-center">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                      <item.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Emergency Alert Preview */}
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="relative w-full max-w-2xl mx-auto">
              <motion.div
                className="absolute -inset-4 bg-gradient-to-r from-destructive/20 to-orange-500/20 rounded-3xl blur-xl"
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              
              <Card className="relative border-destructive/30 bg-card/95 backdrop-blur-sm overflow-hidden">
                <div className="bg-gradient-to-r from-destructive to-orange-500 px-6 py-4">
                  <div className="flex items-center justify-center gap-3">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      <Siren className="w-8 h-8 text-white" />
                    </motion.div>
                    <div className="text-center">
                      <p className="text-white font-bold text-lg">LAPORAN DARURAT</p>
                      <p className="text-white/80 text-sm">Prioritas Tinggi • Langsung ke Pusat</p>
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                      </div>
                      <div>
                        <p className="font-semibold">Banjir di RT 03 RW 02</p>
                        <p className="text-sm text-muted-foreground">
                          Ketinggian air sudah mencapai 50cm dan terus naik. 
                          Beberapa rumah warga mulai terendam.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Jl. Melati No. 15, Kelurahan Sukamaju</span>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" className="bg-destructive hover:bg-destructive/90 flex-1">
                        <Zap className="w-4 h-4 mr-1" />
                        Tangani Sekarang
                      </Button>
                      <Button size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10">
                        Eskalasi
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-card border border-border shadow-lg rounded-xl px-4 py-2 flex items-center gap-2"
              >
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium">Tim Tanggap Aktif</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Dashboard Admin Section */}
      <section id="dashboard-admin" className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-4">
              <LayoutDashboard className="w-4 h-4" />
              Untuk Petugas Pemerintah
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Dashboard Admin untuk{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Pengelolaan Terpusat
              </span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Petugas pemerintah dapat memantau semua data laporan, pengajuan, 
              dan komunikasi masyarakat melalui satu dashboard yang terintegrasi.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          >
            {[
              { icon: BarChart3, title: "Statistik Real-time", desc: "Pantau data dan tren laporan secara langsung", gradient: "from-blue-500 to-cyan-500" },
              { icon: Users, title: "Manajemen Petugas", desc: "Distribusi tugas dan monitoring kinerja", gradient: "from-green-500 to-emerald-500" },
              { icon: Shield, title: "Keamanan Data", desc: "Enkripsi end-to-end dan akses terkontrol", gradient: "from-purple-500 to-violet-500" },
              { icon: RefreshCw, title: "Update Knowledge Base", desc: "Update informasi dan data secara real-time", gradient: "from-orange-500 to-amber-500" },
            ].map((item, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="h-full hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
                  <CardContent className="pt-6 text-center">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                      <item.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="relative w-full max-w-5xl mx-auto">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 rounded-3xl blur-xl opacity-50" />
              
              <div className="relative bg-gradient-to-b from-muted to-background p-2 rounded-2xl">
                <Image
                  src="/dashboard.png"
                  alt="Dashboard Admin Preview"
                  width={1200}
                  height={800}
                  className="rounded-xl shadow-2xl border border-border/50"
                />
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="absolute -bottom-4 -right-4 md:bottom-8 md:right-8 bg-card border border-border shadow-xl rounded-2xl px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">100%</p>
                    <p className="text-xs text-muted-foreground">Laporan Tertangani</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="manfaat" className="py-16 md:py-24 bg-gradient-to-b from-muted/50 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="inline-block text-sm font-semibold text-secondary bg-secondary/10 px-4 py-1.5 rounded-full mb-4">
              Keuntungan
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Manfaat untuk Semua Pihak</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              GovConnect memberikan manfaat baik untuk masyarakat maupun pemerintah
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-8"
          >
            {/* For Citizens */}
            <motion.div variants={fadeInUp}>
              <Card className="h-full bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-100 dark:border-blue-900/30">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl text-blue-700 dark:text-blue-400">Untuk Masyarakat</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {[
                      "Akses informasi pemerintahan 24/7 tanpa perlu ke kantor",
                      "Response cepat dari AI assistant",
                      "Pelaporan masalah dengan mudah dari smartphone",
                      "Tracking status pengajuan secara real-time",
                      "Reservasi layanan tanpa antre",
                      "Akses dari berbagai platform (WhatsApp, Telegram, dll)",
                    ].map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <BadgeCheck className="w-3 h-3 text-blue-500" />
                        </div>
                        <span className="text-sm text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* For Government */}
            <motion.div variants={fadeInUp}>
              <Card className="h-full bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-100 dark:border-green-900/30">
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4">
                    <Landmark className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl text-green-700 dark:text-green-400">Untuk Pemerintah</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {[
                      "Efisiensi pelayanan dengan automation AI",
                      "Dashboard terpusat untuk semua channel",
                      "Distribusi tugas otomatis ke petugas",
                      "Analitik dan reporting untuk pengambilan keputusan",
                      "Alert prioritas untuk laporan darurat",
                      "Integrasi dengan sistem existing",
                    ].map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <BadgeCheck className="w-3 h-3 text-green-500" />
                        </div>
                        <span className="text-sm text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Pertanyaan yang Sering Diajukan</h2>
            <p className="text-muted-foreground text-lg">
              Temukan jawaban untuk pertanyaan umum tentang GovConnect
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-12 items-start">
            <motion.div
              variants={slideInLeft}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="lg:col-span-2 flex justify-center items-center"
            >
              <FAQAnimation />
            </motion.div>

            <motion.div
              variants={slideInRight}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="lg:col-span-3"
            >
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-left">
                    Apa itu GovConnect?
                  </AccordionTrigger>
                  <AccordionContent>
                    GovConnect adalah platform yang menghubungkan masyarakat dengan pemerintah melalui automation berbasis AI. 
                    Platform ini menyediakan knowledge base, sistem pelaporan, pengajuan layanan, dan berbagai fitur lainnya 
                    yang dapat diakses dari berbagai channel seperti WhatsApp, Telegram, Instagram, dan website.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-left">
                    Untuk tingkat pemerintahan apa saja GovConnect bisa digunakan?
                  </AccordionTrigger>
                  <AccordionContent>
                    GovConnect dapat disesuaikan untuk semua tingkat pemerintahan mulai dari kelurahan, kecamatan, 
                    kabupaten/kota, hingga pusat. Juga dapat digunakan untuk instansi khusus seperti kepolisian, 
                    dinas kesehatan, dinas pendidikan, dan lainnya. Kami akan menyesuaikan sesuai kebutuhan spesifik setiap instansi.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-left">
                    Bagaimana dengan keamanan data?
                  </AccordionTrigger>
                  <AccordionContent>
                    Keamanan data adalah prioritas kami. Semua data dienkripsi end-to-end dan disimpan dengan standar keamanan tinggi. 
                    Akses ke dashboard dikontrol dengan sistem autentikasi yang ketat dan dapat disesuaikan sesuai struktur organisasi pemerintahan.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-left">
                    Apakah bisa diintegrasikan dengan sistem yang sudah ada?
                  </AccordionTrigger>
                  <AccordionContent>
                    Ya, GovConnect dirancang untuk dapat diintegrasikan dengan sistem pemerintahan yang sudah ada. 
                    Knowledge base dapat terhubung dengan database existing untuk mendapatkan data real-time, 
                    sehingga informasi yang diberikan ke masyarakat selalu up-to-date.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5">
                  <AccordionTrigger className="text-left">
                    Bagaimana cara memulai menggunakan GovConnect?
                  </AccordionTrigger>
                  <AccordionContent>
                    Hubungi tim kami untuk konsultasi kebutuhan. Kami akan melakukan assessment, 
                    menyesuaikan platform sesuai kebutuhan instansi Anda, melakukan setup dan training, 
                    hingga platform siap digunakan. Proses implementasi disesuaikan dengan kompleksitas kebutuhan.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-secondary/10 to-primary/10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-32 h-32 bg-secondary/20 rounded-full blur-2xl" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-primary/20 rounded-full blur-2xl" />
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Siap Meningkatkan{" "}
              <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                Layanan Pemerintahan
              </span>
              ?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
              Hubungi kami untuk konsultasi dan demo platform GovConnect. 
              Kami akan membantu menyesuaikan solusi sesuai kebutuhan instansi Anda.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 bg-secondary hover:bg-secondary/90 shadow-lg shadow-secondary/25" asChild>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="mr-2 h-5 w-5" />
                  Hubungi via WhatsApp
                </a>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 border-2" asChild>
                <a href="mailto:info@govconnect.id">
                  <Mail className="mr-2 h-5 w-5" />
                  Email Kami
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-muted/30 to-muted/50 border-t border-border/50 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-12 gap-8 mb-12">
            <div className="md:col-span-5">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <Image
                  src={isDark ? "/logo-dashboard-dark.png" : "/logo-dashboard.png"}
                  alt="GovConnect Logo"
                  width={140}
                  height={140}
                  className="object-contain"
                />
              </Link>
              <p className="text-muted-foreground mb-6 max-w-sm leading-relaxed">
                GovConnect adalah platform AI yang menghubungkan masyarakat dengan layanan pemerintahan 
                secara cepat, mudah, dan terintegrasi dari berbagai channel.
              </p>
              <div className="flex gap-3">
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-green-500/10 hover:bg-green-500/20 flex items-center justify-center text-green-600 transition-colors"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                </a>
                <a
                  href="mailto:info@govconnect.id"
                  className="w-10 h-10 rounded-full bg-secondary/10 hover:bg-secondary/20 flex items-center justify-center text-secondary transition-colors"
                >
                  <Mail className="h-5 w-5" />
                </a>
              </div>
            </div>

            <div className="md:col-span-3">
              <h4 className="font-semibold mb-4 text-foreground">Fitur</h4>
              <ul className="space-y-3 text-muted-foreground">
                <li>
                  <Link href="#fitur" className="hover:text-secondary transition-colors inline-flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary/50" />
                    Knowledge Base AI
                  </Link>
                </li>
                <li>
                  <Link href="#fitur" className="hover:text-secondary transition-colors inline-flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary/50" />
                    Pelaporan & Tracking
                  </Link>
                </li>
                <li>
                  <Link href="#fitur" className="hover:text-secondary transition-colors inline-flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary/50" />
                    Reservasi Layanan
                  </Link>
                </li>
                <li>
                  <Link href="#integrasi" className="hover:text-secondary transition-colors inline-flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary/50" />
                    Multi-Channel
                  </Link>
                </li>
              </ul>
            </div>

            <div className="md:col-span-4">
              <h4 className="font-semibold mb-4 text-foreground">Kontak</h4>
              <ul className="space-y-4 text-muted-foreground">
                <li className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                    <Phone className="h-4 w-4 text-secondary" />
                  </div>
                  <span>+62 896-6817-6764</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 text-secondary" />
                  </div>
                  <span>info@govconnect.id</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 text-secondary" />
                  </div>
                  <span>Jl. Telekomunikasi, Bandung</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-t border-border/50 pt-8 text-muted-foreground text-sm">
            <p>&copy; {new Date().getFullYear()} GovConnect. All rights reserved.</p>
            <p className="flex items-center gap-1">
              Powered by{" "}
              <a
                href="https://genfity.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary hover:underline font-medium"
              >
                Genfity Digital Solution
              </a>
            </p>
          </div>
        </div>
      </footer>

      {/* Live Chat Widget */}
      <LiveChatWidget isDark={isDark} />
    </div>
  );
}
