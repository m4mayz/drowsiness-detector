"use client";

import React, { useRef, useEffect, useState } from "react";
import Script from "next/script";

// --- Helper: Calculate EAR (Eye Aspect Ratio) ---
const calculateEAR = (landmarks: any, indices: number[]) => {
    const p = (i: number) => landmarks[indices[i]];
    // Euclidean Distance Manual
    const dist = (p1: any, p2: any) =>
        Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

    // Vertical Distance
    const v1 = dist(p(1), p(5));
    const v2 = dist(p(2), p(4));
    // Horizontal Distance
    const h = dist(p(0), p(3));

    return (v1 + v2) / (2.0 * h);
};

interface DetectorProps {
    onStop: () => void;
}

export default function Detector({ onStop }: DetectorProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [status, setStatus] = useState("Loading AI Model...");
    const [isDrowsy, setIsDrowsy] = useState(false);
    const [showPopup, setShowPopup] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [videoDimensions, setVideoDimensions] = useState({
        width: 720,
        height: 1280,
    });

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

        // Check if MediaPipe is already loaded (for remount cases)
        const checkMediaPipeLoaded = () => {
            if (
                (window as any).FaceMesh &&
                (window as any).Camera &&
                (window as any).drawConnectors &&
                (window as any).FACEMESH_TESSELATION
            ) {
                console.log("MediaPipe already loaded, initializing...");
                initFaceMesh();
            }
        };

        // Small delay to ensure DOM is ready
        setTimeout(checkMediaPipeLoaded, 100);

        return () => {
            // Cleanup on unmount
            if (alarmRef.current) {
                alarmRef.current.pause();
                alarmRef.current = null;
            }
            if (cameraRef.current) {
                cameraRef.current.stop();
            }
            // Exit fullscreen on cleanup
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
            }
        };
    }, []);

    // This function is called after CDN Script is loaded
    const initFaceMesh = () => {
        setStatus("Waiting for Camera Permission...");

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

                // --- MAIN LOGIC ---
                if (avgEAR < EAR_THRESHOLD) {
                    closedFrameCounter.current += 1;
                    setStatus(`Eyes Closed (${closedFrameCounter.current})`);

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
                    setStatus(`Safe - EAR: ${avgEAR.toFixed(2)}`);

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
            const video = videoRef.current;

            const camera = new Camera(video, {
                onFrame: async () => {
                    if (videoRef.current)
                        await faceMesh.send({ image: videoRef.current });
                },
                facingMode: "user",
            });

            // Listen for video metadata to get actual resolution
            video.addEventListener("loadedmetadata", () => {
                const width = video.videoWidth;
                const height = video.videoHeight;
                console.log(`Camera resolution: ${width}x${height}`);
                setVideoDimensions({ width, height });
            });

            cameraRef.current = camera;
        }
    };

    const handleOkClick = async () => {
        setShowPopup(false);

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

        // Request fullscreen
        try {
            await document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } catch (err) {
            console.log("Fullscreen request failed", err);
        }

        if (cameraRef.current) {
            cameraRef.current.start();
            setStatus("System Active");
        }
    };

    const handleStop = async () => {
        // Stop camera
        if (cameraRef.current) {
            cameraRef.current.stop();
        }

        // Stop alarm
        if (alarmRef.current && !alarmRef.current.paused) {
            alarmRef.current.pause();
            alarmRef.current.currentTime = 0;
        }

        // Exit fullscreen
        if (document.fullscreenElement) {
            await document.exitFullscreen().catch(() => {});
        }

        // Return to home page
        onStop();
    };

    return (
        <div className="fixed inset-0 bg-black">
            {/* Load Script CDN */}
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

            {/* Instruction Popup */}
            {showPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-md p-8">
                    <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-3xl p-10 max-w-md w-full text-center border-2 border-purple-500/30 shadow-2xl backdrop-blur-xl">
                        {/* Phone Icon */}
                        <div className="mb-8 flex justify-center">
                            <div className="p-6 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-3xl border border-purple-400/50">
                                <svg
                                    className="w-20 h-20 text-purple-300"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                                    />
                                </svg>
                            </div>
                        </div>

                        <h2 className="font-poppins text-3xl font-bold text-white mb-3">
                            Setup Instructions
                        </h2>
                        <div className="w-20 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto mb-6 rounded-full"></div>
                        <p className="text-gray-300 mb-10 leading-relaxed text-lg">
                            Place your phone in portrait mode on the car
                            dashboard with the camera facing your face.
                        </p>

                        <button
                            onClick={handleOkClick}
                            className="px-12 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-lg font-bold rounded-2xl transition-all w-full shadow-xl hover:shadow-purple-500/50 hover:scale-105"
                        >
                            <span className="flex items-center justify-center gap-2">
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                                OK, Let's Go
                            </span>
                        </button>
                    </div>
                </div>
            )}

            {/* Fullscreen Camera View */}
            <div className="relative w-full h-full bg-black">
                <video
                    ref={videoRef}
                    className="absolute top-0 left-0 w-full h-full object-contain transform -scale-x-100 opacity-0"
                    playsInline
                />
                <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full object-contain transform -scale-x-100"
                    width={videoDimensions.width}
                    height={videoDimensions.height}
                />

                {/* Drowsiness Alert Overlay */}
                {isDrowsy && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-red-600/60 to-orange-600/60 animate-pulse">
                        <div className="relative">
                            <div className="absolute inset-0 blur-3xl bg-red-500/50 scale-150"></div>
                            <h2 className="font-poppins relative text-5xl md:text-7xl font-bold text-white drop-shadow-2xl tracking-wider">
                                ⚠️ WAKE UP!
                            </h2>
                        </div>
                        <p className="font-poppins mt-4 text-2xl md:text-3xl text-white/90 drop-shadow-lg">
                            Drowsiness Detected
                        </p>
                    </div>
                )}

                {/* Status Overlay */}
                {!showPopup && (
                    <div className="absolute top-0 left-0 right-0 p-4">
                        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-lg rounded-2xl px-6 py-5 border border-white/10 shadow-2xl">
                            <div className="flex items-center justify-center gap-3">
                                {!isDrowsy ? (
                                    <div className="flex items-center justify-center w-3 h-3">
                                        <span className="absolute w-3 h-3 bg-green-400 rounded-full animate-ping"></span>
                                        <span className="relative w-3 h-3 bg-green-500 rounded-full"></span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center w-3 h-3">
                                        <span className="absolute w-3 h-3 bg-red-400 rounded-full animate-ping"></span>
                                        <span className="relative w-3 h-3 bg-red-500 rounded-full"></span>
                                    </div>
                                )}
                                <h2
                                    className={`font-poppins text-xl md:text-2xl font-bold text-center ${
                                        isDrowsy
                                            ? "text-red-400"
                                            : "text-green-400"
                                    }`}
                                >
                                    {status}
                                </h2>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stop Button */}
                {!showPopup && (
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                        <button
                            onClick={handleStop}
                            className="group w-full px-8 py-5 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white text-xl font-bold rounded-2xl transition-all shadow-2xl hover:shadow-red-500/50 hover:scale-105 flex items-center justify-center gap-3"
                        >
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
                                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                                />
                            </svg>
                            <span className="font-poppins">Stop Detection</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
