"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Camera, MapPin, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";
import {
    graphqlFetch,
    GET_COMPLAINT_CATEGORIES,
    CREATE_COMPLAINT,
    ComplaintCategory,
    CreateComplaintInput,
    CreateComplaintResponse,
} from "@/lib/graphql-client";

export default function LaporanFormPage() {
    const router = useRouter();
    const [categories, setCategories] = useState<ComplaintCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<{ complaint_id: string; message: string } | null>(null);

    // Form state
    const [formData, setFormData] = useState<CreateComplaintInput>({
        kategori: "",
        deskripsi: "",
        alamat: "",
        rt_rw: "",
        foto_url: "",
        nama_pelapor: "",
        no_hp: "",
    });

    useEffect(() => {
        loadCategories();
    }, []);

    async function loadCategories() {
        try {
            const data = await graphqlFetch<{ complaintCategories: ComplaintCategory[] }>(
                GET_COMPLAINT_CATEGORIES
            );
            setCategories(data.complaintCategories);
        } catch (err) {
            // Fallback categories if API fails
            setCategories([
                { code: 'jalan_rusak', name: 'Jalan Rusak', description: 'Kerusakan jalan, lubang, retak', icon: '🛣️' },
                { code: 'lampu_mati', name: 'Lampu Mati', description: 'Penerangan jalan umum mati', icon: '💡' },
                { code: 'sampah', name: 'Sampah', description: 'Masalah sampah menumpuk', icon: '🗑️' },
                { code: 'drainase', name: 'Drainase', description: 'Saluran air tersumbat/rusak', icon: '🌊' },
                { code: 'pohon_tumbang', name: 'Pohon Tumbang', description: 'Pohon tumbang/berbahaya', icon: '🌳' },
                { code: 'fasilitas_rusak', name: 'Fasilitas Rusak', description: 'Kerusakan fasilitas umum', icon: '🏗️' },
            ]);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            const data = await graphqlFetch<{ createComplaint: CreateComplaintResponse }>(
                CREATE_COMPLAINT,
                { input: formData }
            );

            if (data.createComplaint.success) {
                setSuccess({
                    complaint_id: data.createComplaint.complaint_id!,
                    message: data.createComplaint.message!,
                });
            } else {
                setError(data.createComplaint.error || "Gagal membuat laporan");
            }
        } catch (err: any) {
            setError(err.message || "Terjadi kesalahan");
        } finally {
            setSubmitting(false);
        }
    }

    function updateForm(field: keyof CreateComplaintInput, value: string) {
        setFormData((prev) => ({ ...prev, [field]: value }));
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (success) {
        return (
            <div className="max-w-xl mx-auto">
                <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center space-y-6">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                        <CheckCircle className="w-10 h-10 text-white" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Laporan Berhasil Dibuat!
                        </h1>
                        <p className="text-slate-600 dark:text-slate-300">{success.message}</p>
                    </div>

                    <div className="bg-slate-100 dark:bg-slate-700/50 rounded-xl p-4">
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">ID Laporan Anda</p>
                        <p className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400">
                            {success.complaint_id}
                        </p>
                    </div>

                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Simpan ID ini untuk memantau status laporan Anda. Tim kami akan segera menindaklanjuti.
                    </p>

                    <div className="flex gap-4">
                        <Link
                            href="/form"
                            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
                        >
                            Kembali
                        </Link>
                        <button
                            onClick={() => {
                                setSuccess(null);
                                setFormData({
                                    kategori: "",
                                    deskripsi: "",
                                    alamat: "",
                                    rt_rw: "",
                                    foto_url: "",
                                    nama_pelapor: "",
                                    no_hp: "",
                                });
                            }}
                            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition-colors font-medium"
                        >
                            Buat Laporan Lagi
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/form"
                    className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                </Link>

                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    Buat Laporan
                </h1>
                <p className="text-slate-600 dark:text-slate-300 mt-2">
                    Sampaikan laporan Anda dan kami akan segera menindaklanjuti
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Category Selection */}
                <div className="space-y-3">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Kategori Laporan <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {categories.map((cat) => (
                            <button
                                key={cat.code}
                                type="button"
                                onClick={() => updateForm("kategori", cat.code)}
                                className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${formData.kategori === cat.code
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/10"
                                        : "border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-slate-800/50"
                                    }`}
                            >
                                <span className="text-2xl mb-2 block">{cat.icon}</span>
                                <span className="font-medium text-slate-900 dark:text-white text-sm">
                                    {cat.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Deskripsi Masalah <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={formData.deskripsi}
                        onChange={(e) => updateForm("deskripsi", e.target.value)}
                        placeholder="Jelaskan masalah yang Anda temukan dengan detail..."
                        rows={4}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    />
                </div>

                {/* Location */}
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                            <MapPin className="w-4 h-4 inline mr-1" />
                            Alamat Lokasi
                        </label>
                        <input
                            type="text"
                            value={formData.alamat || ""}
                            onChange={(e) => updateForm("alamat", e.target.value)}
                            placeholder="Jl. Contoh No. 123..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                            RT/RW
                        </label>
                        <input
                            type="text"
                            value={formData.rt_rw || ""}
                            onChange={(e) => updateForm("rt_rw", e.target.value)}
                            placeholder="001/002"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                {/* Photo URL */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        <Camera className="w-4 h-4 inline mr-1" />
                        URL Foto (opsional)
                    </label>
                    <input
                        type="url"
                        value={formData.foto_url || ""}
                        onChange={(e) => updateForm("foto_url", e.target.value)}
                        placeholder="https://example.com/foto.jpg"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <p className="text-xs text-slate-500">
                        Upload foto ke layanan seperti Imgur atau Google Drive, lalu paste link-nya di sini
                    </p>
                </div>

                {/* Reporter Info */}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-6 space-y-4">
                    <h3 className="font-semibold text-slate-900 dark:text-white">Data Pelapor</h3>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                                Nama Lengkap <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.nama_pelapor}
                                onChange={(e) => updateForm("nama_pelapor", e.target.value)}
                                placeholder="Nama sesuai KTP"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                                No. HP <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                value={formData.no_hp}
                                onChange={(e) => updateForm("no_hp", e.target.value)}
                                placeholder="08123456789"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={submitting || !formData.kategori || !formData.deskripsi || !formData.nama_pelapor || !formData.no_hp}
                    className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-blue-500/30 flex items-center justify-center gap-2"
                >
                    {submitting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Mengirim...
                        </>
                    ) : (
                        <>
                            <Send className="w-5 h-5" />
                            Kirim Laporan
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
