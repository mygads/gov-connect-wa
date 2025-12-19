import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import Link from "next/link";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata = {
    title: "Layanan Publik Online - GovConnect",
    description: "Form pengaduan dan reservasi layanan pemerintah secara online",
};

export default function FormLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/20 dark:from-slate-950 dark:via-blue-950/20 dark:to-teal-950/10`}>
            {/* Minimal Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/50 dark:border-slate-700/50">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/form" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-300">
                            <span className="text-white font-bold text-lg">G</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-slate-800 dark:text-white">GovConnect</h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Layanan Publik Online</p>
                        </div>
                    </Link>

                    <nav className="flex items-center gap-4">
                        <Link
                            href="/form/laporan"
                            className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                            Buat Laporan
                        </Link>
                        <Link
                            href="/form/reservasi"
                            className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                        >
                            Reservasi
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-8">
                {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200/50 dark:border-slate-700/50 mt-auto">
                <div className="max-w-4xl mx-auto px-4 py-6 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        © 2024 GovConnect. Layanan Pemerintahan Digital.
                    </p>
                </div>
            </footer>
        </div>
    );
}
