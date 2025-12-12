"use client";

import React, { useRef, useEffect, useState } from "react";
import Script from "next/script";

// --- Helper: Hitung EAR (Eye Aspect Ratio) ---
const calculateEAR = (landmarks: any, indices: number[]) => {
    const p = (i: number) => landmarks[indices[i]];
    // Euclidean Distance Manual
    const dist = (p1: any, p2: any) =>
        Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

    // Jarak Vertikal
    const v1 = dist(p(1), p(5));
    const v2 = dist(p(2), p(4));
    // Jarak Horizontal
    const h = dist(p(0), p(3));

    return (v1 + v2) / (2.0 * h);
};

export default function Detector() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [status, setStatus] = useState("Memuat Model AI...");
    const [isDrowsy, setIsDrowsy] = useState(false);
    const [isModelLoaded, setIsModelLoaded] = useState(false);

    // Audio Ref
    const alarmRef = useRef<HTMLAudioElement | null>(null);

    // Logic Refs
    const closedFrameCounter = useRef(0);
    const cameraRef = useRef<any>(null); // Simpan instance camera
    const EAR_THRESHOLD = 0.25;
    const FRAMES_TO_ALARM = 15;

    useEffect(() => {
        // Setup Audio
        alarmRef.current = new Audio("/alarm.mp3");
        alarmRef.current.loop = true;

        return () => {
            // Cleanup saat pindah halaman
            if (alarmRef.current) {
                alarmRef.current.pause();
                alarmRef.current = null;
            }
            if (cameraRef.current) {
                cameraRef.current.stop();
            }
        };
    }, []);

    // Fungsi ini dipanggil setelah Script CDN selesai dimuat
    const initFaceMesh = () => {
        setStatus("Menunggu Izin Kamera...");

        // Akses Global Variable dari CDN
        const FaceMesh = (window as any).FaceMesh;
        const Camera = (window as any).Camera;
        const drawConnectors = (window as any).drawConnectors;
        const FACEMESH_TESSELATION = (window as any).FACEMESH_TESSELATION;

        const faceMesh = new FaceMesh({
            locateFile: (file: string) =>
                `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });

        faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });

        faceMesh.onResults((results: any) => {
            if (!canvasRef.current || !videoRef.current) return;

            const canvasCtx = canvasRef.current.getContext("2d");
            if (!canvasCtx) return;

            // Reset Canvas
            canvasCtx.save();
            canvasCtx.clearRect(
                0,
                0,
                canvasRef.current.width,
                canvasRef.current.height
            );
            canvasCtx.drawImage(
                results.image,
                0,
                0,
                canvasRef.current.width,
                canvasRef.current.height
            );

            if (
                results.multiFaceLandmarks &&
                results.multiFaceLandmarks.length > 0
            ) {
                const landmarks = results.multiFaceLandmarks[0];

                // Gambar Mesh Wajah
                if (drawConnectors) {
                    drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, {
                        color: "#C0C0C070",
                        lineWidth: 1,
                    });
                }

                // Indeks Mata (MediaPipe)
                const LEFT_EYE = [33, 160, 158, 133, 153, 144];
                const RIGHT_EYE = [362, 385, 387, 263, 373, 380];

                const leftEAR = calculateEAR(landmarks, LEFT_EYE);
                const rightEAR = calculateEAR(landmarks, RIGHT_EYE);
                const avgEAR = (leftEAR + rightEAR) / 2;

                // --- LOGIKA UTAMA ---
                if (avgEAR < EAR_THRESHOLD) {
                    closedFrameCounter.current += 1;
                    setStatus(`Mata Tertutup (${closedFrameCounter.current})`);

                    if (closedFrameCounter.current > FRAMES_TO_ALARM) {
                        setIsDrowsy(true);
                        if (alarmRef.current && alarmRef.current.paused) {
                            alarmRef.current
                                .play()
                                .catch((e) =>
                                    console.log("Audio play error", e)
                                );
                        }
                    }
                } else {
                    closedFrameCounter.current = 0;
                    setIsDrowsy(false);
                    setStatus(`Aman - EAR: ${avgEAR.toFixed(2)}`);

                    if (alarmRef.current && !alarmRef.current.paused) {
                        alarmRef.current.pause();
                        alarmRef.current.currentTime = 0;
                    }
                }
            }
            canvasCtx.restore();
        });

        // Setup Kamera
        if (videoRef.current) {
            const camera = new Camera(videoRef.current, {
                onFrame: async () => {
                    if (videoRef.current)
                        await faceMesh.send({ image: videoRef.current });
                },
                width: 640,
                height: 480,
            });
            cameraRef.current = camera;
            setIsModelLoaded(true);
        }
    };

    const handleStart = () => {
        // Trik Audio: User interaction trigger
        if (alarmRef.current) {
            alarmRef.current
                .play()
                .then(() => {
                    alarmRef.current?.pause();
                    alarmRef.current!.currentTime = 0;
                })
                .catch(() => {});
        }

        if (cameraRef.current) {
            cameraRef.current.start();
            setStatus("Sistem Aktif");
        }
    };

    return (
        <div
            className={`flex flex-col items-center justify-center p-4 rounded-xl transition-colors duration-300 ${
                isDrowsy ? "bg-red-900" : "bg-gray-800"
            }`}
        >
            {/* Load Script CDN secara berurutan */}
            <Script
                src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"
                strategy="lazyOnload"
            />
            <Script
                src="https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js"
                strategy="lazyOnload"
            />
            <Script
                src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js"
                strategy="lazyOnload"
            />
            <Script
                src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js"
                strategy="lazyOnload"
                onLoad={() => {
                    console.log("MediaPipe Loaded");
                    initFaceMesh();
                }}
            />

            {/* Container Video & Canvas */}
            <div className="relative w-full max-w-[640px] aspect-[4/3] bg-black rounded-lg overflow-hidden border-2 border-gray-600">
                <video
                    ref={videoRef}
                    className="absolute top-0 left-0 w-full h-full object-cover transform -scale-x-100 opacity-0"
                    playsInline
                />
                <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full object-cover transform -scale-x-100"
                    width={640}
                    height={480}
                />

                {isDrowsy && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-500/30 animate-pulse">
                        <h2 className="text-5xl font-black text-white drop-shadow-lg">
                            BANGUN!!!
                        </h2>
                    </div>
                )}
            </div>

            <div className="mt-6 text-center">
                <h2
                    className={`text-2xl font-bold mb-2 ${
                        isDrowsy ? "text-red-400" : "text-green-400"
                    }`}
                >
                    {status}
                </h2>

                {isModelLoaded && (
                    <button
                        onClick={handleStart}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-all"
                    >
                        MULAI SISTEM
                    </button>
                )}
            </div>
        </div>
    );
}
