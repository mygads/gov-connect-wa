"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Send,
    Calendar,
    Clock,
    FileText,
    CheckCircle,
    AlertCircle,
    Loader2,
    Info,
    ChevronRight
} from "lucide-react";
import {
    graphqlFetch,
    GET_SERVICE,
    GET_AVAILABLE_SLOTS,
    CREATE_RESERVATION,
    Service,
    AvailableSlots,
    CitizenQuestion,
    CreateReservationInput,
    CreateReservationResponse,
} from "@/lib/graphql-client";

interface PageProps {
    params: Promise<{ serviceCode: string }>;
}

export default function ReservationFormPage({ params }: PageProps) {
    const { serviceCode } = use(params);
    const router = useRouter();

    const [service, setService] = useState<Service | null>(null);
    const [availableSlots, setAvailableSlots] = useState<AvailableSlots | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<{
        reservation_id: string;
        queue_number: number;
        message: string
    } | null>(null);

    // Form state
    const [step, setStep] = useState(1); // 1: Date, 2: Time, 3: Data, 4: Review
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [selectedTime, setSelectedTime] = useState<string>("");
    const [formData, setFormData] = useState<Record<string, string>>({
        nama_lengkap: "",
        nik: "",
        alamat: "",
        no_hp: "",
    });

    useEffect(() => {
        loadService();
    }, [serviceCode]);

    async function loadService() {
        try {
            const data = await graphqlFetch<{ service: Service }>(GET_SERVICE, { code: serviceCode });
            setService(data.service);
        } catch (err: any) {
            setError(err.message || "Gagal memuat layanan");
        } finally {
            setLoading(false);
        }
    }

    async function loadSlots(date: string) {
        setLoadingSlots(true);
        setSelectedTime("");
        try {
            const data = await graphqlFetch<{ availableSlots: AvailableSlots }>(
                GET_AVAILABLE_SLOTS,
                { serviceCode, date }
            );
            setAvailableSlots(data.availableSlots);
        } catch (err: any) {
            setError(err.message || "Gagal memuat slot waktu");
        } finally {
            setLoadingSlots(false);
        }
    }

    function handleDateChange(date: string) {
        setSelectedDate(date);
        loadSlots(date);
        setStep(2);
    }

    function handleTimeSelect(time: string) {
        setSelectedTime(time);
        setStep(3);
    }

    function updateFormData(field: string, value: string) {
        setFormData(prev => ({ ...prev, [field]: value }));
    }

    function isFormComplete() {
        if (!service) return false;

        // Check common required fields
        if (!formData.nama_lengkap || !formData.nik || !formData.alamat || !formData.no_hp) {
            return false;
        }

        // Check service-specific required fields
        for (const q of service.citizen_questions || []) {
            if (q.required && !formData[q.field]) {
                return false;
            }
        }

        return true;
    }

    async function handleSubmit() {
        if (!service || !isFormComplete()) return;

        setError(null);
        setSubmitting(true);

        try {
            // Prepare additional data (service-specific questions)
            const additionalData: Record<string, string> = {};
            for (const q of service.citizen_questions || []) {
                if (formData[q.field]) {
                    additionalData[q.field] = formData[q.field];
                }
            }

            const input: CreateReservationInput = {
                service_code: serviceCode,
                reservation_date: selectedDate,
                reservation_time: selectedTime,
                nama_lengkap: formData.nama_lengkap,
                nik: formData.nik,
                alamat: formData.alamat,
                no_hp: formData.no_hp,
                additional_data: Object.keys(additionalData).length > 0
                    ? JSON.stringify(additionalData)
                    : undefined,
            };

            const data = await graphqlFetch<{ createReservation: CreateReservationResponse }>(
                CREATE_RESERVATION,
                { input }
            );

            if (data.createReservation.success) {
                setSuccess({
                    reservation_id: data.createReservation.reservation_id!,
                    queue_number: data.createReservation.queue_number!,
                    message: data.createReservation.message!,
                });
            } else {
                setError(data.createReservation.error || "Gagal membuat reservasi");
            }
        } catch (err: any) {
            setError(err.message || "Terjadi kesalahan");
        } finally {
            setSubmitting(false);
        }
    }

    // Generate next 14 days
    const availableDates = Array.from({ length: 14 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i + 1); // Start from tomorrow
        return date.toISOString().split('T')[0];
    });

    function formatDate(dateStr: string) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
            </div>
        );
    }

    if (!service) {
        return (
            <div className="max-w-xl mx-auto">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-red-700 dark:text-red-300">Layanan Tidak Ditemukan</p>
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                            Layanan dengan kode "{serviceCode}" tidak tersedia.
                        </p>
                        <Link href="/form/reservasi" className="text-sm text-red-700 dark:text-red-300 underline mt-2 inline-block">
                            Kembali ke daftar layanan
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="max-w-xl mx-auto">
                <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center space-y-6">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                        <CheckCircle className="w-10 h-10 text-white" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            Reservasi Berhasil!
                        </h1>
                        <p className="text-slate-600 dark:text-slate-300">{success.message}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-100 dark:bg-slate-700/50 rounded-xl p-4">
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">ID Reservasi</p>
                            <p className="text-lg font-mono font-bold text-teal-600 dark:text-teal-400">
                                {success.reservation_id}
                            </p>
                        </div>
                        <div className="bg-slate-100 dark:bg-slate-700/50 rounded-xl p-4">
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Nomor Antrian</p>
                            <p className="text-3xl font-bold text-teal-600 dark:text-teal-400">
                                {success.queue_number}
                            </p>
                        </div>
                    </div>

                    <div className="bg-teal-50 dark:bg-teal-900/20 rounded-xl p-4 text-left">
                        <h3 className="font-semibold text-teal-800 dark:text-teal-200 mb-2">Detail Reservasi</h3>
                        <div className="space-y-1 text-sm text-teal-700 dark:text-teal-300">
                            <p><strong>Layanan:</strong> {service.name}</p>
                            <p><strong>Tanggal:</strong> {formatDate(selectedDate)}</p>
                            <p><strong>Waktu:</strong> {selectedTime}</p>
                        </div>
                    </div>

                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Simpan ID dan nomor antrian ini. Harap datang 15 menit sebelum waktu reservasi.
                    </p>

                    <div className="flex gap-4">
                        <Link
                            href="/form"
                            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
                        >
                            Kembali
                        </Link>
                        <Link
                            href="/form/reservasi"
                            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-teal-800 transition-colors font-medium"
                        >
                            Buat Reservasi Lagi
                        </Link>
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
                    href="/form/reservasi"
                    className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali ke daftar layanan
                </Link>

                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    {service.name}
                </h1>
                <p className="text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">
                    {service.description}
                </p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
                {[
                    { num: 1, label: "Tanggal" },
                    { num: 2, label: "Waktu" },
                    { num: 3, label: "Data" },
                    { num: 4, label: "Kirim" },
                ].map((s, i) => (
                    <div key={s.num} className="flex items-center">
                        <button
                            onClick={() => s.num < step && setStep(s.num)}
                            disabled={s.num > step}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${step === s.num
                                    ? "bg-teal-600 text-white"
                                    : step > s.num
                                        ? "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 cursor-pointer hover:bg-teal-200 dark:hover:bg-teal-900/50"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                                }`}
                        >
                            {step > s.num ? <CheckCircle className="w-4 h-4" /> : s.num}
                            <span className="hidden sm:inline">{s.label}</span>
                        </button>
                        {i < 3 && (
                            <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-1" />
                        )}
                    </div>
                ))}
            </div>

            {/* Step 1: Date Selection */}
            {step === 1 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-teal-600" />
                        Pilih Tanggal
                    </h2>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {availableDates.map((date) => (
                            <button
                                key={date}
                                onClick={() => handleDateChange(date)}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${selectedDate === date
                                        ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20"
                                        : "border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-700 bg-white dark:bg-slate-800/50"
                                    }`}
                            >
                                <p className="font-medium text-slate-900 dark:text-white">
                                    {new Date(date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' })}
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {new Date(date).toLocaleDateString('id-ID', { month: 'short' })}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 2: Time Selection */}
            {step === 2 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-teal-600" />
                        Pilih Waktu - {formatDate(selectedDate)}
                    </h2>

                    {loadingSlots ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                        </div>
                    ) : !availableSlots?.is_open ? (
                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                            <p className="text-amber-700 dark:text-amber-300">
                                Kantor tutup pada hari ini. Silakan pilih tanggal lain.
                            </p>
                            <button
                                onClick={() => setStep(1)}
                                className="text-sm text-amber-700 dark:text-amber-300 underline mt-2"
                            >
                                Pilih tanggal lain
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                                {availableSlots?.slots.map((slot) => (
                                    <button
                                        key={slot.time}
                                        onClick={() => slot.available && handleTimeSelect(slot.time)}
                                        disabled={!slot.available}
                                        className={`p-3 rounded-xl border-2 text-center transition-all ${selectedTime === slot.time
                                                ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20"
                                                : slot.available
                                                    ? "border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-700 bg-white dark:bg-slate-800/50"
                                                    : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 opacity-50 cursor-not-allowed"
                                            }`}
                                    >
                                        <p className={`font-medium ${slot.available ? "text-slate-900 dark:text-white" : "text-slate-400 dark:text-slate-600"}`}>
                                            {slot.time}
                                        </p>
                                        {slot.available && slot.remaining !== undefined && (
                                            <p className="text-xs text-slate-500">
                                                {slot.remaining} slot
                                            </p>
                                        )}
                                        {!slot.available && (
                                            <p className="text-xs text-red-500">Penuh</p>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setStep(1)}
                                className="text-sm text-slate-500 hover:text-teal-600 transition-colors"
                            >
                                ← Pilih tanggal lain
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Step 3: Form Data */}
            {step === 3 && (
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-teal-600" />
                        Lengkapi Data
                    </h2>

                    {/* Common Questions */}
                    <div className="space-y-4">
                        <h3 className="font-medium text-slate-700 dark:text-slate-200">Data Diri</h3>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                Nama Lengkap <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.nama_lengkap}
                                onChange={(e) => updateFormData("nama_lengkap", e.target.value)}
                                placeholder="Nama sesuai KTP"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                NIK (16 digit) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.nik}
                                onChange={(e) => updateFormData("nik", e.target.value.replace(/\D/g, '').slice(0, 16))}
                                placeholder="3373123456789012"
                                required
                                maxLength={16}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all font-mono"
                            />
                            {formData.nik && formData.nik.length !== 16 && (
                                <p className="text-xs text-amber-600">NIK harus 16 digit ({formData.nik.length}/16)</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                Alamat <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.alamat}
                                onChange={(e) => updateFormData("alamat", e.target.value)}
                                placeholder="Alamat lengkap sesuai KTP"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                No. HP <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="tel"
                                value={formData.no_hp}
                                onChange={(e) => updateFormData("no_hp", e.target.value)}
                                placeholder="08123456789"
                                required
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>

                    {/* Service-Specific Questions */}
                    {service.citizen_questions && service.citizen_questions.length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <h3 className="font-medium text-slate-700 dark:text-slate-200">
                                Informasi Tambahan untuk {service.name}
                            </h3>

                            {service.citizen_questions.map((q) => (
                                <div key={q.field} className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                                        {q.question} {q.required && <span className="text-red-500">*</span>}
                                    </label>

                                    {q.type === 'select' && q.options ? (
                                        <select
                                            value={formData[q.field] || ""}
                                            onChange={(e) => updateFormData(q.field, e.target.value)}
                                            required={q.required}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                        >
                                            <option value="">Pilih...</option>
                                            {q.options.map((opt) => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type={q.type === 'number' ? 'number' : q.type === 'date' ? 'date' : 'text'}
                                            value={formData[q.field] || ""}
                                            onChange={(e) => updateFormData(q.field, e.target.value)}
                                            required={q.required}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-4 pt-4">
                        <button
                            onClick={() => setStep(2)}
                            className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
                        >
                            ← Kembali
                        </button>
                        <button
                            onClick={() => setStep(4)}
                            disabled={!isFormComplete()}
                            className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-medium shadow-lg shadow-teal-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Lanjut ke Review
                        </button>
                    </div>
                </div>
            )}

            {/* Step 4: Review & Submit */}
            {step === 4 && (
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-teal-600" />
                        Review & Kirim
                    </h2>

                    <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700">
                        {/* Service */}
                        <div className="p-4">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Layanan</p>
                            <p className="font-medium text-slate-900 dark:text-white">{service.name}</p>
                        </div>

                        {/* Date & Time */}
                        <div className="p-4 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Tanggal</p>
                                <p className="font-medium text-slate-900 dark:text-white">{formatDate(selectedDate)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Waktu</p>
                                <p className="font-medium text-slate-900 dark:text-white">{selectedTime}</p>
                            </div>
                        </div>

                        {/* Personal Data */}
                        <div className="p-4 space-y-2">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Data Diri</p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <span className="text-slate-500">Nama:</span>{" "}
                                    <span className="text-slate-900 dark:text-white">{formData.nama_lengkap}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500">NIK:</span>{" "}
                                    <span className="text-slate-900 dark:text-white font-mono">{formData.nik}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500">No. HP:</span>{" "}
                                    <span className="text-slate-900 dark:text-white">{formData.no_hp}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500">Alamat:</span>{" "}
                                    <span className="text-slate-900 dark:text-white">{formData.alamat}</span>
                                </div>
                            </div>
                        </div>

                        {/* Additional Data */}
                        {service.citizen_questions && service.citizen_questions.length > 0 && (
                            <div className="p-4 space-y-2">
                                <p className="text-sm text-slate-500 dark:text-slate-400">Informasi Tambahan</p>
                                <div className="space-y-1 text-sm">
                                    {service.citizen_questions.map((q) => (
                                        formData[q.field] && (
                                            <div key={q.field}>
                                                <span className="text-slate-500">{q.field.replace(/_/g, ' ')}:</span>{" "}
                                                <span className="text-slate-900 dark:text-white">{formData[q.field]}</span>
                                            </div>
                                        )
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Requirements Info */}
                    {service.requirements && service.requirements.length > 0 && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                            <div className="flex items-start gap-3">
                                <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-amber-800 dark:text-amber-200">Dokumen yang Perlu Dibawa</p>
                                    <ul className="mt-2 space-y-1 text-sm text-amber-700 dark:text-amber-300">
                                        {service.requirements.map((req, i) => (
                                            <li key={i}>• {req}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => setStep(3)}
                            className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
                        >
                            ← Edit Data
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="flex-1 py-4 px-6 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold shadow-lg shadow-teal-500/30 hover:shadow-teal-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Mengirim...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Kirim Reservasi
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
