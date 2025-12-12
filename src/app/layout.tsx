import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "DriverGuard AI",
    description: "Deteksi kantuk pengemudi berbasis AI Web",
    manifest: "/manifest.json", // <--- Tambahkan ini
    themeColor: "#000000", // <--- Tambahkan ini (opsional di Next 14, tapi aman ditaruh)
    viewport:
        "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0", // Mencegah zoom cubit
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>{children}</body>
        </html>
    );
}
