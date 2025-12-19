"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Users, FileText, Loader2, AlertCircle } from "lucide-react";
import {
    graphqlFetch,
    GET_SERVICES,
    Service,
} from "@/lib/graphql-client";

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    administrasi: {
        bg: "bg-blue-100 dark:bg-blue-900/30",
        text: "text-blue-700 dark:text-blue-300",
        border: "border-blue-200 dark:border-blue-800",
    },
    perizinan: {
        bg: "bg-purple-100 dark:bg-purple-900/30",
        text: "text-purple-700 dark:text-purple-300",
        border: "border-purple-200 dark:border-purple-800",
    },
    kependudukan: {
        bg: "bg-teal-100 dark:bg-teal-900/30",
        text: "text-teal-700 dark:text-teal-300",
        border: "border-teal-200 dark:border-teal-800",
    },
    sosial: {
        bg: "bg-orange-100 dark:bg-orange-900/30",
        text: "text-orange-700 dark:text-orange-300",
        border: "border-orange-200 dark:border-orange-800",
    },
};

const CATEGORY_NAMES: Record<string, string> = {
    administrasi: "Administrasi",
    perizinan: "Perizinan",
    kependudukan: "Kependudukan",
    sosial: "Sosial",
};

export default function ReservasiPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    useEffect(() => {
        loadServices();
    }, []);

    async function loadServices() {
        try {
            const data = await graphqlFetch<{ services: Service[] }>(GET_SERVICES);
            setServices(data.services.filter(s => s.is_active && s.is_online_available));
        } catch (err: any) {
            setError(err.message || "Gagal memuat layanan");
        } finally {
            setLoading(false);
        }
    }

    // Group services by category
    const servicesByCategory = services.reduce((acc, service) => {
        if (!acc[service.category]) {
            acc[service.category] = [];
        }
        acc[service.category].push(service);
        return acc;
    }, {} as Record<string, Service[]>);

    const categories = Object.keys(servicesByCategory);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-xl mx-auto">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-red-700 dark:text-red-300">Gagal Memuat Layanan</p>
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    Reservasi Layanan
                </h1>
                <p className="text-slate-600 dark:text-slate-300 mt-2">
                    Pilih layanan yang Anda butuhkan untuk membuat janji
                </p>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setActiveCategory(null)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === null
                            ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                        }`}
                >
                    Semua
                </button>
                {categories.map((cat) => {
                    const colors = CATEGORY_COLORS[cat] || CATEGORY_COLORS.administrasi;
                    return (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === cat
                                    ? `${colors.bg} ${colors.text}`
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                                }`}
                        >
                            {CATEGORY_NAMES[cat] || cat}
                        </button>
                    );
                })}
            </div>

            {/* Services Grid */}
            <div className="space-y-8">
                {categories
                    .filter((cat) => activeCategory === null || cat === activeCategory)
                    .map((category) => (
                        <div key={category} className="space-y-4">
                            {/* Category Header */}
                            {activeCategory === null && (
                                <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                                    <span
                                        className={`w-3 h-3 rounded-full ${CATEGORY_COLORS[category]?.bg || "bg-slate-300"
                                            }`}
                                    />
                                    {CATEGORY_NAMES[category] || category}
                                </h2>
                            )}

                            {/* Services */}
                            <div className="grid md:grid-cols-2 gap-4">
                                {servicesByCategory[category].map((service) => {
                                    const colors = CATEGORY_COLORS[service.category] || CATEGORY_COLORS.administrasi;
                                    return (
                                        <Link
                                            key={service.code}
                                            href={`/form/reservasi/${service.code}`}
                                            className="group bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-lg hover:shadow-teal-500/5 hover:border-teal-300 dark:hover:border-teal-700 transition-all duration-300"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}
                                                        >
                                                            {service.code}
                                                        </span>
                                                    </div>

                                                    <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                                        {service.name}
                                                    </h3>

                                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                                                        {service.description}
                                                    </p>

                                                    <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500 pt-2">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {service.estimated_duration} menit
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Users className="w-3.5 h-3.5" />
                                                            Kuota: {service.daily_quota}/hari
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <FileText className="w-3.5 h-3.5" />
                                                            {service.requirements?.length || 0} syarat
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex-shrink-0">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center group-hover:bg-teal-100 dark:group-hover:bg-teal-900/30 transition-colors">
                                                        <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all" />
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
            </div>

            {/* Empty State */}
            {services.length === 0 && (
                <div className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">
                        Tidak ada layanan yang tersedia saat ini
                    </p>
                </div>
            )}
        </div>
    );
}
