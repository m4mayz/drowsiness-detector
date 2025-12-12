import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
    dest: "public", // Folder tujuan file service worker
    register: true, // Otomatis daftar service worker
    skipWaiting: true, // Update cache tanpa nunggu user tutup tab
    disable: process.env.NODE_ENV === "development", // Matikan PWA saat mode dev (biar gak bingung cache)
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
};

export default withPWA(nextConfig);
