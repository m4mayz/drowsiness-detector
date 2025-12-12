"use client";

import Detector from "@/components/Detector";
import { useState } from "react";

export default function Home() {
    const [isStarted, setIsStarted] = useState(false);

    if (isStarted) {
        return <Detector onStop={() => setIsStarted(false)} />;
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div
                    className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"
                    style={{ animationDelay: "1s" }}
                ></div>
            </div>

            <div className="relative z-10 flex flex-col items-center">
                {/* Icon/Logo */}
                <div className="mb-8 p-6 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-3xl backdrop-blur-sm border border-purple-500/30">
                    <svg
                        className="w-20 h-20 text-purple-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                    </svg>
                </div>

                <h1 className="font-poppins text-5xl md:text-6xl font-black mb-4 text-center tracking-tight">
                    <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                        Driver Drowsiness
                    </span>
                </h1>
                <h2 className="font-poppins text-3xl md:text-4xl font-bold mb-8 text-center">
                    <span className="text-white/90">Detection System</span>
                </h2>

                <p className="text-gray-300 text-center mb-12 max-w-md px-4 leading-relaxed">
                    AI-powered real-time monitoring to keep you safe on the road
                </p>

                <button
                    onClick={() => setIsStarted(true)}
                    className="group relative px-12 py-5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xl font-bold rounded-2xl transition-all duration-300 shadow-2xl hover:shadow-purple-500/50 hover:scale-105 overflow-hidden"
                >
                    <span className="relative z-10 flex items-center gap-3">
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                            />
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        Start Drive
                    </span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                </button>
            </div>
        </main>
    );
}
