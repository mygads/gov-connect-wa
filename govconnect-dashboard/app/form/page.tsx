"use client";

import Link from "next/link";
import { FileText, Calendar, ArrowRight, Shield, Clock, CheckCircle } from "lucide-react";

export default function FormLandingPage() {
    return (
        <div className="space-y-12">
            {/* Hero Section */}
            <section className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium">
                    <Shield className="w-4 h-4" />
                    Layanan Resmi Pemerintah
                </div>

                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white leading-tight">
                    Layanan Publik
                    <span className="bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent"> Online</span>
                </h1>

                <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                    Sampaikan laporan pengaduan atau lakukan reservasi layanan pemerintah dengan mudah dan cepat, tanpa perlu datang ke kantor.
                </p>
            </section>

            {/* Service Cards */}
            <section className="grid md:grid-cols-2 gap-6">
                {/* Laporan Card */}
                <Link
                    href="/form/laporan"
                    className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-8 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-1"
                >
                    <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -translate-y-20 translate-x-20 group-hover:scale-150 transition-transform duration-500" />

                    <div className="relative space-y-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <FileText className="w-7 h-7 text-white" />
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                Buat Laporan
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300">
                                Laporkan masalah infrastruktur, fasilitas umum, atau layanan publik. Tim kami akan segera menindaklanjuti.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2 text-sm">
                            <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                Jalan Rusak
                            </span>
                            <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                Lampu Mati
                            </span>
                            <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                Sampah
                            </span>
                            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
                                +3 lainnya
                            </span>
                        </div>

                        <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium group-hover:gap-3 gap-2 transition-all">
                            Mulai Laporan
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </Link>

                {/* Reservasi Card */}
                <Link
                    href="/form/reservasi"
                    className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-8 hover:shadow-2xl hover:shadow-teal-500/10 transition-all duration-500 hover:-translate-y-1"
                >
                    <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-teal-500/10 to-transparent rounded-full -translate-y-20 translate-x-20 group-hover:scale-150 transition-transform duration-500" />

                    <div className="relative space-y-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/30">
                            <Calendar className="w-7 h-7 text-white" />
                        </div>

                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                Reservasi Layanan
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300">
                                Buat janji untuk mengurus surat-surat dan dokumen resmi. Pilih waktu yang sesuai dengan jadwal Anda.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2 text-sm">
                            <span className="px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300">
                                Surat Domisili
                            </span>
                            <span className="px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300">
                                SKTM
                            </span>
                            <span className="px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300">
                                SKCK
                            </span>
                            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300">
                                +8 lainnya
                            </span>
                        </div>

                        <div className="flex items-center text-teal-600 dark:text-teal-400 font-medium group-hover:gap-3 gap-2 transition-all">
                            Lihat Layanan
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </Link>
            </section>

            {/* Features */}
            <section className="grid grid-cols-3 gap-6">
                <div className="text-center space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">Cepat & Mudah</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Proses hanya beberapa menit</p>
                </div>

                <div className="text-center space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                        <Shield className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">Aman & Terpercaya</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Data dijamin kerahasiaannya</p>
                </div>

                <div className="text-center space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">Dapat Dilacak</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Pantau status pengajuan</p>
                </div>
            </section>
        </div>
    );
}
