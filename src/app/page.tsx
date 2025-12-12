import Detector from "@/components/Detector";

export default function Home() {
    return (
        <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
            <h1 className="text-3xl md:text-5xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
                Driver Drowsiness Guard
            </h1>

            <p className="text-gray-400 mb-8 max-w-lg text-center">
                Sistem pendeteksi kantuk berbasis AI (On-Device). Pastikan wajah
                terlihat jelas dan volume HP menyala.
            </p>

            <div className="w-full max-w-4xl">
                <Detector />
            </div>
        </main>
    );
}
