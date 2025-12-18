"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Sun, Moon, MessageCircle, Phone, Mail, MapPin, LayoutDashboard, BarChart3,
  Users, Shield, AlertTriangle, Siren, Zap, Brain, Database, Globe, Building2,
  CalendarCheck, FileCheck, Map, Send, Instagram, Workflow, Network, RefreshCw,
  Building, Landmark, BadgeCheck, Clock, TrendingDown, Sparkles, Play,
  CheckCircle2, ArrowRight, Menu, X, ChevronRight, Rocket, Target, Award,
  Headphones, LineChart, Settings, Lock, Layers, GitBranch, Activity,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { WhatsAppIcon, ChatAnimation, SolutionAnimation, FAQAnimation, LiveChatWidget } from "@/components/landing";
import { generateWhatsAppLink } from "@/lib/whatsapp";

const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
const fadeInLeft = { hidden: { opacity: 0, x: -30 }, visible: { opacity: 1, x: 0, transition: { duration: 0.5 } } };
const fadeInRight = { hidden: { opacity: 0, x: 30 }, visible: { opacity: 1, x: 0, transition: { duration: 0.5 } } };
const scaleIn = { hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } } };
const staggerContainer = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const staggerItem = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function LandingPage() {
  const [isDark, setIsDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const whatsappLink = generateWhatsAppLink();
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const navItems = [
    { id: "tentang", label: "Tentang" },
    { id: "fitur", label: "Fitur" },
    { id: "demo", label: "Demo" },
    { id: "manfaat", label: "Manfaat" },
    { id: "faq", label: "FAQ" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 overflow-x-hidden">
      {/* Progress Bar */}
      <motion.div className="fixed top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-secondary via-primary to-secondary z-[60] origin-left" style={{ scaleX: scrollYProgress }} />

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-background/95 backdrop-blur-xl shadow-sm border-b border-border/50" : "bg-background/70 backdrop-blur-xl border-b border-border/40"}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center shrink-0">
              <Image src={isDark ? "/logo-dashboard-dark.png" : "/logo-dashboard.png"} alt="GovConnect" width={100} height={100} className="object-contain" priority />
            </Link>
            <div className="hidden md:flex items-center gap-0.5 bg-muted/50 rounded-full px-1.5 py-0.5">
              {navItems.map((item) => (
                <Link key={item.id} href={`#${item.id}`} className="text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-background/80 px-3 py-1.5 rounded-full transition-all">
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full w-8 h-8">
                {isDark ? <Sun className="h-4 w-4 text-yellow-500" /> : <Moon className="h-4 w-4 text-slate-600" />}
              </Button>
              <Button asChild size="sm" className="hidden sm:flex rounded-full bg-secondary hover:bg-secondary/90 text-xs px-4 h-8">
                <Link href="/login">Login</Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden rounded-full w-8 h-8">
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
        {/* Mobile Menu */}
        <motion.div initial={false} animate={mobileMenuOpen ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }} className="md:hidden overflow-hidden bg-background/95 backdrop-blur-xl border-b border-border/50">
          <div className="px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <Link key={item.id} href={`#${item.id}`} onClick={() => setMobileMenuOpen(false)} className="block text-sm text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg hover:bg-muted transition-all">
                {item.label}
              </Link>
            ))}
            <Button asChild size="sm" className="w-full mt-2 rounded-full bg-secondary text-xs">
              <Link href="/login">Login Dashboard</Link>
            </Button>
          </div>
        </motion.div>
      </nav>

      {/* Hero Section - Compact */}
      <section className="relative pt-20 pb-12 md:pt-24 md:pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-primary/5 pointer-events-none" />
        <motion.div className="absolute top-16 left-5 w-48 h-48 bg-secondary/10 rounded-full blur-3xl pointer-events-none" animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.4, 0.3] }} transition={{ duration: 6, repeat: Infinity }} />
        <motion.div className="absolute bottom-5 right-5 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.4, 0.3] }} transition={{ duration: 8, repeat: Infinity }} />
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div variants={fadeInLeft} initial="hidden" animate="visible" className="text-center lg:text-left">
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="inline-flex items-center gap-1.5 bg-secondary/10 border border-secondary/20 rounded-full px-3 py-1 mb-4">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-secondary"></span>
                </span>
                <span className="text-xs font-medium text-secondary">AI-Powered Government Services</span>
              </motion.div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight mb-3">
                Menghubungkan{" "}
                <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">Masyarakat & Pemerintah</span>{" "}
                dengan AI
              </h1>
              <p className="text-sm md:text-base text-muted-foreground mb-5 max-w-lg mx-auto lg:mx-0">
                Platform automation berbasis AI untuk layanan pemerintahan. Knowledge base cerdas, pelaporan real-time, dan multi-channel dalam satu sistem.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2.5 justify-center lg:justify-start mb-6">
                <Button size="sm" className="text-sm px-5 h-9 bg-secondary hover:bg-secondary/90 shadow-md group" asChild>
                  <Link href="#demo">
                    <Play className="mr-1.5 h-3.5 w-3.5" />Lihat Demo<ChevronRight className="ml-1 h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </Button>
                <Button size="sm" variant="outline" className="text-sm px-5 h-9 group" asChild>
                  <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                    <WhatsAppIcon className="mr-1.5 h-3.5 w-3.5" />Hubungi Kami
                  </a>
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-6">
                {[
                  { value: "24/7", label: "Online", icon: Clock },
                  { value: "Multi-Level", label: "Pemerintahan", icon: Building2 },
                  { value: "Real-time", label: "Terintegrasi", icon: Activity },
                ].map((stat, i) => (
                  <div key={i} className="text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start gap-1 mb-0.5">
                      <stat.icon className="w-3 h-3 text-secondary" />
                      <p className="text-base sm:text-lg font-bold text-secondary">{stat.value}</p>
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={fadeInRight} initial="hidden" animate="visible" className="relative hidden lg:block">
              <ChatAnimation />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-6 bg-muted/30 border-y border-border/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8">
            {[
              { icon: Building, label: "Kelurahan" },
              { icon: Building2, label: "Kecamatan" },
              { icon: Landmark, label: "Kabupaten/Kota" },
              { icon: Shield, label: "Kepolisian" },
              { icon: BadgeCheck, label: "Dinas Pemerintah" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 text-muted-foreground/60 hover:text-foreground transition-colors">
                <item.icon className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="tentang" className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center max-w-3xl mx-auto mb-10">
            <motion.span variants={staggerItem} className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary bg-secondary/10 px-3 py-1 rounded-full mb-3">
              <Sparkles className="w-3 h-3" />Tentang GovConnect
            </motion.span>
            <motion.h2 variants={staggerItem} className="text-xl sm:text-2xl md:text-3xl font-bold mb-3">
              Solusi <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">Transformasi Digital</span> Layanan Pemerintahan
            </motion.h2>
            <motion.p variants={staggerItem} className="text-sm text-muted-foreground">
              Platform yang menghubungkan masyarakat dengan pemerintah melalui AI. Knowledge base terintegrasi dengan database pemerintahan untuk data real-time.
            </motion.p>
          </motion.div>

          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: Brain, title: "AI Knowledge Base", desc: "Informasi pemerintahan yang mudah diakses, dapat diupdate dan terhubung database.", color: "from-blue-500 to-cyan-500" },
              { icon: Database, title: "Data Real-time", desc: "Terhubung dengan service pemerintahan untuk data dinamis otomatis.", color: "from-green-500 to-emerald-500" },
              { icon: Zap, title: "Response 24/7", desc: "AI assistant siap melayani kapan saja dengan response cepat dan akurat.", color: "from-orange-500 to-amber-500" },
            ].map((item, i) => (
              <motion.div key={i} variants={staggerItem}>
                <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-secondary/50 h-full">
                  <div className={`h-0.5 bg-gradient-to-r ${item.color}`} />
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-2 shadow-md`}>
                      <item.icon className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-sm font-semibold">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fitur" className="py-12 md:py-16 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-10">
            <motion.span variants={staggerItem} className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary bg-secondary/10 px-3 py-1 rounded-full mb-3">
              <Layers className="w-3 h-3" />Fitur Unggulan
            </motion.span>
            <motion.h2 variants={staggerItem} className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
              Solusi Lengkap <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">Layanan Pemerintahan</span>
            </motion.h2>
            <motion.p variants={staggerItem} className="text-sm text-muted-foreground max-w-xl mx-auto">
              Platform terintegrasi untuk semua kebutuhan layanan pemerintahan
            </motion.p>
          </motion.div>

          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Brain, title: "Akses Informasi Cepat", desc: "Akses informasi layanan pemerintahan dengan cepat melalui AI.", gradient: "from-blue-500 to-cyan-500", bg: "from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30" },
              { icon: AlertTriangle, title: "Pelaporan Masalah", desc: "Laporkan bencana, jalan rusak, lampu mati dengan mapping lokasi.", gradient: "from-red-500 to-orange-500", bg: "from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30" },
              { icon: Map, title: "Mapping & Tracking", desc: "Visualisasi lokasi laporan pada peta untuk koordinasi.", gradient: "from-green-500 to-emerald-500", bg: "from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30" },
              { icon: CalendarCheck, title: "Reservasi Layanan", desc: "Booking waktu layanan tanpa perlu antre lama.", gradient: "from-purple-500 to-violet-500", bg: "from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30" },
              { icon: FileCheck, title: "Pengajuan Surat", desc: "Ajukan surat dan layanan dengan proses lebih cepat.", gradient: "from-pink-500 to-rose-500", bg: "from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30" },
              { icon: Workflow, title: "Distribusi Tugas", desc: "Sistem distribusi tugas otomatis untuk petugas.", gradient: "from-amber-500 to-yellow-500", bg: "from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30" },
            ].map((f, i) => (
              <motion.div key={i} variants={staggerItem} whileHover={{ y: -4 }}>
                <Card className={`h-full border-0 bg-gradient-to-br ${f.bg} group`}>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-2 shadow-md group-hover:scale-105 transition-transform`}>
                      <f.icon className="h-4 w-4 text-white" />
                    </div>
                    <CardTitle className="text-sm font-semibold">{f.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-12 md:py-16 bg-gradient-to-b from-secondary/5 to-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-8">
            <motion.span variants={staggerItem} className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary bg-secondary/10 px-3 py-1 rounded-full mb-3">
              <Play className="w-3 h-3" />Live Demo
            </motion.span>
            <motion.h2 variants={staggerItem} className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
              Coba Langsung <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">Demo GovConnect</span>
            </motion.h2>
            <motion.p variants={staggerItem} className="text-sm text-muted-foreground max-w-xl mx-auto">
              Contoh implementasi layanan kelurahan. Coba via webchat atau WhatsApp.
            </motion.p>
          </motion.div>

          <motion.div variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <Card className="border-secondary/30 bg-gradient-to-br from-card to-secondary/5 overflow-hidden">
              <CardContent className="p-4 md:p-6">
                <div className="grid lg:grid-cols-2 gap-6 items-center">
                  <div>
                    <div className="inline-flex items-center gap-1.5 bg-green-500/20 text-green-600 dark:text-green-400 px-2.5 py-1 rounded-full text-xs font-medium mb-4">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      Demo Aktif
                    </div>
                    <h3 className="text-lg font-bold mb-2">Contoh: Layanan Kelurahan</h3>
                    <p className="text-xs text-muted-foreground mb-4">Demo implementasi GovConnect dengan fitur:</p>
                    <ul className="space-y-2 mb-5">
                      {["Akses informasi layanan masyarakat", "Pelaporan masalah (jalan rusak, lampu mati)", "Reservasi layanan kelurahan", "Pengajuan surat dan dokumen", "Tracking status pengajuan"].map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-xs h-8" asChild>
                        <a href="https://wa.me/6289668176764" target="_blank" rel="noopener noreferrer">
                          <WhatsAppIcon className="mr-1.5 h-3.5 w-3.5" />Coba via WhatsApp
                        </a>
                      </Button>
                      <Button size="sm" variant="outline" className="border-secondary text-xs h-8">
                        <MessageCircle className="mr-1.5 h-3.5 w-3.5" />Coba Webchat
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">* Webchat di pojok kanan bawah</p>
                  </div>
                  <div className="relative hidden lg:block">
                    <div className="absolute -inset-2 bg-gradient-to-r from-secondary/20 to-green-500/20 rounded-xl blur-lg opacity-50" />
                    <Image src="/dashboard.png" alt="Dashboard Demo" width={500} height={300} className="relative rounded-lg shadow-lg border border-border/50" />
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-green-600 text-white shadow-lg rounded-lg px-3 py-1.5 flex items-center gap-2">
                      <WhatsAppIcon className="w-4 h-4" />
                      <span className="text-xs font-medium">+62 896-6817-6764</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="manfaat" className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-8">
            <motion.span variants={staggerItem} className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary bg-secondary/10 px-3 py-1 rounded-full mb-3">
              <Award className="w-3 h-3" />Keunggulan
            </motion.span>
            <motion.h2 variants={staggerItem} className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
              Mengapa <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">GovConnect?</span>
            </motion.h2>
          </motion.div>

          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {[
              { icon: Clock, title: "24/7", desc: "Online setiap saat", gradient: "from-blue-500 to-cyan-500" },
              { icon: TrendingDown, title: "50%+", desc: "Hemat biaya", gradient: "from-green-500 to-emerald-500" },
              { icon: Zap, title: "< 3 detik", desc: "Response cepat", gradient: "from-orange-500 to-amber-500" },
              { icon: Users, title: "4+ Channel", desc: "Multi-platform", gradient: "from-purple-500 to-violet-500" },
            ].map((item, i) => (
              <motion.div key={i} variants={staggerItem} whileHover={{ y: -3 }}>
                <Card className="h-full text-center border-border/50 hover:border-secondary/50 transition-all">
                  <CardContent className="pt-4 pb-3 px-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mx-auto mb-2 shadow-md`}>
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <p className={`text-lg font-bold bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}>{item.title}</p>
                    <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-2 gap-4">
            {[
              { title: "Untuk Pemerintah", icon: Landmark, color: "blue", items: ["Efisiensi dengan automation AI", "Dashboard terpusat semua channel", "Distribusi tugas otomatis", "Analitik untuk keputusan", "Alert laporan darurat", "Hemat biaya operasional"] },
              { title: "Untuk Masyarakat", icon: Users, color: "green", items: ["Akses informasi 24/7", "Response cepat dari AI", "Pelaporan mudah via HP", "Tracking status real-time", "Reservasi tanpa antre", "Multi-platform akses"] },
            ].map((section, i) => (
              <motion.div key={i} variants={staggerItem}>
                <Card className={`h-full bg-gradient-to-br from-${section.color}-50 to-${section.color === "blue" ? "cyan" : "emerald"}-50 dark:from-${section.color}-950/30 dark:to-${section.color === "blue" ? "cyan" : "emerald"}-950/30 border-${section.color}-200/50 dark:border-${section.color}-800/30`}>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br from-${section.color}-500 to-${section.color === "blue" ? "cyan" : "emerald"}-500 flex items-center justify-center shadow-md`}>
                        <section.icon className="w-4 h-4 text-white" />
                      </div>
                      <CardTitle className={`text-sm font-semibold text-${section.color}-700 dark:text-${section.color}-400`}>{section.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <ul className="space-y-1.5">
                      {section.items.map((item, j) => (
                        <li key={j} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle2 className={`w-3 h-3 text-${section.color}-500 shrink-0`} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Use Cases & Integration */}
      <section id="use-case" className="py-12 md:py-16 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-8">
            <motion.span variants={staggerItem} className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full mb-3">
              <Target className="w-3 h-3" />Use Cases
            </motion.span>
            <motion.h2 variants={staggerItem} className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
              Untuk Semua <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">Tingkat Pemerintahan</span>
            </motion.h2>
          </motion.div>

          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {[
              { icon: Building, title: "Kelurahan", gradient: "from-blue-500 to-cyan-500" },
              { icon: Building2, title: "Kecamatan", gradient: "from-green-500 to-emerald-500" },
              { icon: Landmark, title: "Kabupaten/Kota", gradient: "from-purple-500 to-violet-500" },
              { icon: BadgeCheck, title: "Instansi Khusus", gradient: "from-orange-500 to-amber-500" },
            ].map((item, i) => (
              <motion.div key={i} variants={staggerItem} whileHover={{ y: -3 }}>
                <Card className="h-full text-center border-border/50 hover:border-primary/30 transition-all">
                  <CardContent className="pt-4 pb-3 px-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mx-auto mb-2 shadow-md`}>
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-xs font-semibold">{item.title}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Integration Channels */}
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-8">
            <h3 className="text-sm font-semibold text-center mb-4">Multi-Channel Integration</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: WhatsAppIcon, title: "WhatsApp", gradient: "from-green-500 to-green-600" },
                { icon: Instagram, title: "Instagram", gradient: "from-pink-500 to-purple-500" },
                { icon: Send, title: "Telegram", gradient: "from-blue-400 to-blue-600" },
                { icon: Globe, title: "Website", gradient: "from-slate-500 to-slate-700" },
              ].map((item, i) => (
                <Card key={i} className="text-center border-border/50 hover:border-primary/30 transition-all">
                  <CardContent className="py-3 px-3">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center mx-auto mb-1.5 shadow-md`}>
                      <item.icon className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-xs font-medium">{item.title}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <Card className="border-secondary/20 bg-gradient-to-br from-secondary/5 to-primary/5">
              <CardContent className="p-4 md:p-6">
                <div className="grid lg:grid-cols-2 gap-6 items-center">
                  <div>
                    <h3 className="text-base font-bold mb-2">Kontrol Terpusat</h3>
                    <p className="text-xs text-muted-foreground mb-4">Semua channel dalam satu dashboard untuk monitoring dan response.</p>
                    <ul className="space-y-2">
                      {[
                        { icon: LayoutDashboard, text: "Unified inbox semua channel" },
                        { icon: GitBranch, text: "Distribusi tugas otomatis" },
                        { icon: LineChart, text: "Analitik terpusat" },
                        { icon: RefreshCw, text: "Knowledge base real-time" },
                      ].map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs">
                          <div className="w-5 h-5 rounded bg-secondary/20 flex items-center justify-center shrink-0">
                            <item.icon className="w-3 h-3 text-secondary" />
                          </div>
                          <span>{item.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="relative hidden lg:block">
                    <div className="absolute -inset-2 bg-gradient-to-r from-secondary/20 to-primary/20 rounded-xl blur-lg opacity-50" />
                    <Image src="/dashboard.png" alt="Dashboard" width={450} height={280} className="relative rounded-lg shadow-lg border border-border/50" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Emergency Alert */}
      <section className="py-12 md:py-16 bg-gradient-to-b from-destructive/5 to-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-8">
            <motion.div variants={staggerItem} className="inline-flex items-center gap-1.5 bg-destructive/20 border border-destructive/30 text-destructive px-3 py-1 rounded-full mb-3">
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                <Siren className="w-3 h-3" />
              </motion.div>
              <span className="text-xs font-semibold">Fitur Darurat</span>
            </motion.div>
            <motion.h2 variants={staggerItem} className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
              Alert <span className="text-destructive">Laporan Darurat</span> & Bencana
            </motion.h2>
            <motion.p variants={staggerItem} className="text-sm text-muted-foreground max-w-xl mx-auto">
              Notifikasi prioritas tinggi untuk laporan bencana, langsung ke pusat.
            </motion.p>
          </motion.div>

          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-3 gap-3 mb-8">
            {[
              { icon: AlertTriangle, title: "Deteksi Otomatis", desc: "AI deteksi kata kunci darurat", gradient: "from-orange-500 to-amber-500" },
              { icon: Siren, title: "Alert Prioritas", desc: "Notifikasi khusus petugas", gradient: "from-red-500 to-rose-500" },
              { icon: Map, title: "Mapping Lokasi", desc: "Visualisasi lokasi bencana", gradient: "from-yellow-500 to-orange-500" },
            ].map((item, i) => (
              <motion.div key={i} variants={staggerItem} whileHover={{ y: -3 }}>
                <Card className="h-full text-center border-destructive/20 hover:border-destructive/40 transition-all">
                  <CardContent className="pt-4 pb-3 px-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mx-auto mb-2 shadow-md`}>
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-xs font-semibold mb-0.5">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-8">
            <motion.span variants={staggerItem} className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary bg-secondary/10 px-3 py-1 rounded-full mb-3">
              <Headphones className="w-3 h-3" />FAQ
            </motion.span>
            <motion.h2 variants={staggerItem} className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">Pertanyaan Umum</motion.h2>
          </motion.div>

          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <Accordion type="single" collapsible className="space-y-2">
              {[
                { q: "Apa itu GovConnect?", a: "Platform yang menghubungkan masyarakat dengan pemerintah melalui AI. Menyediakan knowledge base, pelaporan, pengajuan layanan via WhatsApp, Telegram, Instagram, dan website." },
                { q: "Untuk tingkat pemerintahan apa saja?", a: "Semua tingkat: kelurahan, kecamatan, kabupaten/kota, hingga pusat. Juga instansi khusus seperti kepolisian, dinas kesehatan, dll." },
                { q: "Bisa terhubung database existing?", a: "Ya, knowledge base dapat diintegrasikan dengan database pemerintahan untuk data dinamis real-time." },
                { q: "Bagaimana keamanan data?", a: "Data dienkripsi end-to-end dengan standar keamanan tinggi. Akses dikontrol sesuai struktur organisasi." },
                { q: "Bagaimana cara memulai?", a: "Hubungi tim kami untuk konsultasi. Kami akan assessment, setup, training hingga siap digunakan. Coba demo terlebih dahulu." },
              ].map((item, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border border-border/50 rounded-lg px-3 data-[state=open]:border-secondary/50">
                  <AccordionTrigger className="text-left hover:no-underline py-3 text-sm font-medium">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-xs text-muted-foreground pb-3">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-gradient-to-b from-secondary/10 to-primary/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.div variants={staggerItem}>
              <Rocket className="w-10 h-10 text-secondary mx-auto mb-4" />
            </motion.div>
            <motion.h2 variants={staggerItem} className="text-xl sm:text-2xl md:text-3xl font-bold mb-3">
              Siap <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">Transformasi Digital</span>?
            </motion.h2>
            <motion.p variants={staggerItem} className="text-sm text-muted-foreground mb-5 max-w-lg mx-auto">
              Hubungi kami untuk konsultasi dan demo platform GovConnect.
            </motion.p>
            <motion.div variants={staggerItem} className="flex flex-col sm:flex-row gap-2.5 justify-center">
              <Button size="sm" className="text-sm px-5 h-9 bg-secondary hover:bg-secondary/90 shadow-md" asChild>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon className="mr-1.5 h-3.5 w-3.5" />Hubungi via WhatsApp
                </a>
              </Button>
              <Button size="sm" variant="outline" className="text-sm px-5 h-9" asChild>
                <a href="mailto:info@govconnect.id">
                  <Mail className="mr-1.5 h-3.5 w-3.5" />Email Kami
                </a>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/30 border-t border-border/50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div>
              <Image src={isDark ? "/logo-dashboard-dark.png" : "/logo-dashboard.png"} alt="GovConnect" width={100} height={100} className="object-contain mb-3" />
              <p className="text-xs text-muted-foreground mb-3 max-w-xs">Platform AI yang menghubungkan masyarakat dengan layanan pemerintahan.</p>
              <div className="flex gap-2">
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-green-500/10 hover:bg-green-500/20 flex items-center justify-center text-green-600 transition-colors">
                  <WhatsAppIcon className="h-4 w-4" />
                </a>
                <a href="mailto:info@govconnect.id" className="w-8 h-8 rounded-full bg-secondary/10 hover:bg-secondary/20 flex items-center justify-center text-secondary transition-colors">
                  <Mail className="h-4 w-4" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold mb-3">Fitur</h4>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {["Knowledge Base AI", "Pelaporan & Tracking", "Reservasi Layanan", "Multi-Channel"].map((item, i) => (
                  <li key={i}><Link href="#fitur" className="hover:text-secondary transition-colors">{item}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold mb-3">Kontak</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2"><Phone className="h-3 w-3 text-secondary" />+62 896-6817-6764</li>
                <li className="flex items-center gap-2"><Mail className="h-3 w-3 text-secondary" />info@govconnect.id</li>
                <li className="flex items-center gap-2"><MapPin className="h-3 w-3 text-secondary" />Bandung, Indonesia</li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 border-t border-border/50 pt-4 text-[10px] text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} GovConnect. All rights reserved.</p>
            <p>Powered by <a href="https://genfity.com" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline">Genfity Digital Solution</a></p>
          </div>
        </div>
      </footer>

      <LiveChatWidget isDark={isDark} />
    </div>
  );
}
