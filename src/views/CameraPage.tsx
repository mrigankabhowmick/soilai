'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera, Maximize2, Minimize2, Sun, Thermometer, Eye,
  Circle, Square, RotateCcw, ZoomIn, ZoomOut, Flashlight,
  Download, Settings, Wifi, Battery, Layers, Monitor, Smartphone,
  Loader2, CheckCircle, X, Upload, Brain, Sparkles, Activity, Droplets, Wind, Leaf as LeafIcon,
  FileDown, RotateCw, Navigation, BarChart3, PieChart, List, AlertTriangle, LayoutGrid, Droplet, Zap, Bug, Target, TrendingUp
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type VisionMode = 'normal' | 'thermal' | 'night' | 'ndvi';
type FeedSource = 'drone' | 'laptop';

// DRONE_FEEDS removed

function FeedOverlay({ mode, tick }: { mode: VisionMode; tick: number }) {
  return null;
}

function LaptopCameraFeed({ visionMode, tick, onSnapshot }: { visionMode: VisionMode; tick: number; onSnapshot: (dataUrl: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraStatus, setCameraStatus] = useState<'off' | 'requesting' | 'on' | 'error'>('off');
  const [errorMsg, setErrorMsg] = useState('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraStatus('off');
  }, []);

  const startCamera = useCallback(async (deviceId?: string) => {
    setCameraStatus('requesting');
    setErrorMsg('');
    stopCamera();

    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Explicitly call play to ensure it starts
        try {
          await videoRef.current.play();
        } catch (e) {
          console.error("Autoplay blocked or failed:", e);
        }
      }

      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter(d => d.kind === 'videoinput');
      setDevices(videoDevices);
      
      if (!deviceId && videoDevices.length > 0) {
        setSelectedDevice(videoDevices[0].deviceId);
      }

      setCameraStatus('on');
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraStatus('error');
      const name = (err as DOMException).name;
      if (name === 'NotAllowedError') {
        setErrorMsg('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (name === 'NotFoundError') {
        setErrorMsg('No camera found. Please check your hardware connection.');
      } else {
        setErrorMsg(`Camera error: ${(err as Error).message}`);
      }
    }
  }, [facingMode, stopCamera]);

  const switchDevice = async (deviceId: string) => {
    setSelectedDevice(deviceId);
    await startCamera(deviceId);
  };

  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    onSnapshot(dataUrl);
  };

  useEffect(() => {
    startCamera();
    return () => { stopCamera(); };
  }, [startCamera, stopCamera]);

  const videoFilter = 'none';

  return (
    <div className="space-y-3">
      {/* Camera controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {cameraStatus === 'on' ? (
          <button
            onClick={stopCamera}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all"
          >
            <X className="w-3 h-3" />
            Stop Camera
          </button>
        ) : (
          <button
            onClick={() => startCamera(selectedDevice || undefined)}
            disabled={cameraStatus === 'requesting'}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-all disabled:opacity-50"
          >
            {cameraStatus === 'requesting' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Monitor className="w-3 h-3" />}
            {cameraStatus === 'requesting' ? 'Connecting...' : 'Start Camera'}
          </button>
        )}

        {cameraStatus === 'on' && (
          <>
            <button
              onClick={takeSnapshot}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-all"
            >
              <Camera className="w-3 h-3" />
              Snapshot
            </button>
            {devices.length > 1 && (
              <select
                value={selectedDevice}
                onChange={e => switchDevice(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded-xl px-2 py-2 text-xs text-gray-300 focus:outline-none focus:border-green-500/50"
              >
                {devices.map(d => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Camera ${devices.indexOf(d) + 1}`}
                  </option>
                ))}
              </select>
            )}
          </>
        )}
      </div>

      {/* Video feed */}
      <div className="relative bg-gray-900 border border-gray-800/50 rounded-2xl overflow-hidden">
        <div className="relative" style={{ paddingBottom: '56.25%' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover ${cameraStatus === 'on' ? 'opacity-100' : 'opacity-0'}`}
            style={{ filter: videoFilter }}
          />
          {cameraStatus === 'on' && (
            <>
              <FeedOverlay mode={visionMode} tick={tick} />
              {/* Live indicator */}
              <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 rounded-lg px-2.5 py-1.5">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs text-white font-mono">LIVE</span>
                <span className="text-xs text-gray-400 font-mono ml-1">Camera</span>
              </div>
              {/* Timestamp */}
              <div className="absolute bottom-3 right-3 bg-black/60 rounded-lg px-2.5 py-1.5 text-xs text-gray-400 font-mono">
                {new Date().toLocaleTimeString()}
              </div>
              {/* Crosshair */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-16 h-16">
                  <div className="absolute top-0 left-1/2 w-px h-4 bg-white/30 -translate-x-1/2" />
                  <div className="absolute bottom-0 left-1/2 w-px h-4 bg-white/30 -translate-x-1/2" />
                  <div className="absolute left-0 top-1/2 h-px w-4 bg-white/30 -translate-y-1/2" />
                  <div className="absolute right-0 top-1/2 h-px w-4 bg-white/30 -translate-y-1/2" />
                  <div className="absolute inset-1/4 border border-white/20 rounded-sm" />
                </div>
              </div>
            </>
          )}

          {cameraStatus !== 'on' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
              {cameraStatus === 'error' ? (
                <div className="text-center px-6">
                  <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-3">
                    <Camera className="w-6 h-6 text-red-400" />
                  </div>
                  <p className="text-sm text-red-400 mb-1">Camera Error</p>
                  <p className="text-xs text-gray-500 max-w-xs">{errorMsg}</p>
                </div>
              ) : cameraStatus === 'requesting' ? (
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-green-400 animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Requesting camera access...</p>
                  <p className="text-xs text-gray-600 mt-1">Click "Allow" in the browser prompt</p>
                </div>
              ) : (
                <div className="text-center px-6">
                  <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-3">
                    <Monitor className="w-6 h-6 text-green-400" />
                  </div>
                  <p className="text-sm text-gray-300 mb-1">Camera</p>
                  <p className="text-xs text-gray-500 max-w-xs">Click "Start Camera" to connect your webcam. You can take snapshots and apply AI vision filters.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hidden canvas for snapshots */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

function AIAnalysisModal({ image, onDismiss }: { image: string; onDismiss: () => void }) {
  const [analyzing, setAnalyzing] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setAnalyzing(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (analyzing) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-gray-950 border border-gray-800 rounded-3xl w-full max-w-2xl overflow-hidden p-12 text-center">
          <div className="relative mb-8 flex justify-center">
            <div className="absolute inset-0 bg-green-500/20 blur-3xl animate-pulse rounded-full" />
            <Brain className="w-16 h-16 text-green-400 animate-bounce relative z-10" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">AI Neural Engine Active</h3>
          <p className="text-gray-500 mb-8">Processing zonal data and spectral analysis...</p>
          <div className="w-full bg-gray-900 h-2 rounded-full overflow-hidden mb-2">
            <div className="bg-green-500 h-full animate-[progress_3s_ease-in-out]" style={{ width: '100%' }} />
          </div>
          <div className="flex justify-between text-[10px] text-gray-600 font-mono">
            <span>ZONAL MAPPING</span>
            <span>88% CONFIDENCE</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#f8fafc] w-full max-w-6xl my-8 rounded-[32px] overflow-hidden shadow-2xl animate-fade-in border border-white">
        {/* Header */}
        <div className="px-8 py-6 flex items-center justify-between bg-white border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Analysis Report</h2>
              <p className="text-xs text-slate-400 font-medium tracking-wide">ID: SG-2026-0510-94</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">
              <FileDown className="w-4 h-4" />
              Download PDF Report
            </button>
            <button onClick={() => setAnalyzing(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all">
              <RotateCw className="w-4 h-4 text-emerald-500" />
              Analyze New Image
            </button>
            <button onClick={onDismiss} className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all ml-2">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Top Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Activity className="w-12 h-12 text-emerald-600" />
              </div>
              <div className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold mb-2">Health Score</div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-black text-slate-800 leading-none">82</span>
                <span className="text-slate-400 font-bold mb-1">/100</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-bold text-emerald-600">Good - Vegetative</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Growth & Yield</div>
                <LeafIcon className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="space-y-1">
                <div className="text-[11px] font-medium text-slate-500">Prediction: <span className="text-slate-800 font-bold">85% of target</span></div>
                <div className="text-[11px] font-medium text-slate-500">Height: <span className="text-slate-800 font-bold">45cm - 55cm</span></div>
                <div className="text-[11px] font-medium text-slate-500">Uniformity: <span className="text-slate-800 font-bold">88%</span></div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Environment</div>
                <Droplet className="w-4 h-4 text-blue-500" />
              </div>
              <div className="space-y-1">
                <div className="text-[11px] font-medium text-slate-500">Water Stress: <span className="text-blue-600 font-bold">Mild</span></div>
                <div className="text-[11px] font-medium text-slate-500">Soil Dryness: <span className="text-orange-500 font-bold">Medium</span></div>
                <div className="text-[11px] font-medium text-slate-500">Sunlight: <span className="text-yellow-600 font-bold">High</span></div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Telemetry</div>
                <Navigation className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="space-y-1">
                <div className="text-[11px] font-medium text-slate-500">Altitude: <span className="text-slate-800 font-bold">Medium (30m)</span></div>
                <div className="text-[11px] font-medium text-slate-500">Heading: <span className="text-slate-800 font-bold">North-West</span></div>
                <div className="text-[11px] font-medium text-slate-500">Quality: <span className="text-emerald-600 font-bold">High</span></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content (Left) */}
            <div className="lg:col-span-2 space-y-8">
              {/* Heatmap Card */}
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <LayoutGrid className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Field Health Heatmap</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 aspect-[2/1] mb-6">
                  <div className="bg-emerald-400/80 rounded-2xl flex items-center justify-center text-emerald-900/50 font-black text-4xl">ZONE A</div>
                  <div className="bg-emerald-400/80 rounded-2xl flex items-center justify-center text-emerald-900/50 font-black text-4xl">ZONE B</div>
                  <div className="bg-orange-400/80 rounded-2xl flex items-center justify-center text-orange-900/50 font-black text-4xl">ZONE C</div>
                  <div className="bg-rose-400/80 rounded-2xl flex items-center justify-center text-rose-900/50 font-black text-4xl">ZONE D</div>
                </div>
                <div className="flex items-center gap-6">
                  {[
                    { color: 'bg-emerald-400', label: 'Healthy' },
                    { color: 'bg-orange-400', label: 'Stressed' },
                    { color: 'bg-rose-400', label: 'Critical' },
                  ].map(l => (
                    <div key={l.label} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-sm ${l.color}`} />
                      <span className="text-[11px] font-bold text-slate-500 uppercase">{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Plan */}
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Agronomic Action Plan</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { title: 'Irrigation Strategy', desc: 'Increase water delivery in Zone C by 15% for next 48 hours.', icon: Droplet, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { title: 'Fertilizer Application', desc: 'Apply localized Nitrogen-rich fertilizer in Zone B.', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { title: 'Pest & Disease Control', desc: 'No active pests found. Preventive neem oil spray recommended.', icon: Bug, color: 'text-rose-500', bg: 'bg-rose-50' },
                    { title: 'Weed Management', desc: 'Manual weeding recommended for Zone D patches.', icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50' },
                  ].map(action => (
                    <div key={action.title} className="p-5 rounded-2xl border border-slate-50 bg-[#fafbfc]">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-8 h-8 ${action.bg} rounded-lg flex items-center justify-center`}>
                          <action.icon className={`w-4 h-4 ${action.color}`} />
                        </div>
                        <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{action.title}</h4>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">{action.desc}</p>
                    </div>
                  ))}
                  <div className="md:col-span-2 p-5 rounded-2xl border border-slate-50 bg-[#fafbfc] flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Target className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Next Scan Suggestion</h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">Re-scan in 3 days after irrigation cycle to monitor recovery in Zone C.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Zonal Analysis Table */}
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <List className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Zonal Analysis</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100">
                        {['Zone', 'Status', 'Health', 'Dominant Issue', 'Notes'].map(h => (
                          <th key={h} className="text-left py-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {[
                        { z: 'A', s: 'Healthy', h: '95', i: 'None', n: 'Optimal growth zone' },
                        { z: 'B', s: 'Stressed', h: '78', i: 'Nitrogen Def.', n: 'Requires fertilizer' },
                        { z: 'C', s: 'Stressed', h: '62', i: 'Water Stress', n: 'Increase irrigation' },
                        { z: 'D', s: 'Critical', h: '45', i: 'Fungal/Pests', n: 'Immediate attention' },
                      ].map(row => (
                        <tr key={row.z} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 text-xs font-black text-slate-800">{row.z}</td>
                          <td className="py-4">
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                              row.s === 'Healthy' ? 'bg-emerald-50 text-emerald-600' : 
                              row.s === 'Stressed' ? 'bg-orange-50 text-orange-600' : 'bg-rose-50 text-rose-600'
                            }`}>{row.s}</span>
                          </td>
                          <td className="py-4 text-xs font-bold text-slate-600">{row.h}%</td>
                          <td className="py-4 text-xs font-medium text-slate-500">{row.i}</td>
                          <td className="py-4 text-xs font-medium text-slate-400 italic">{row.n}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Sidebar (Right) */}
            <div className="space-y-8">
              {/* Donut Chart */}
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-6">Area Coverage</h3>
                <div className="flex justify-center mb-8 relative">
                   {/* Simplified SVG Donut Chart */}
                   <svg viewBox="0 0 36 36" className="w-48 h-48">
                    <path className="text-amber-900" strokeDasharray="100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="text-orange-500" strokeDasharray="85 100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="text-emerald-500" strokeDasharray="65 100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="text-amber-500" strokeDasharray="25 100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                   </svg>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { color: 'bg-amber-900', label: 'Bare Soil' },
                    { color: 'bg-orange-500', label: 'Dry' },
                    { color: 'bg-emerald-500', label: 'Healthy' },
                    { color: 'bg-amber-500', label: 'Stressed' },
                    { color: 'bg-indigo-500', label: 'Weeds' },
                  ].map(l => (
                    <div key={l.label} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${l.color}`} />
                      <span className="text-[10px] font-bold text-slate-500 uppercase whitespace-nowrap">{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detections */}
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-6">Detections</h3>
                <div className="space-y-4 mb-6">
                  {[
                    { label: 'Weeds Detected', val: '5% coverage', color: 'text-orange-600', bg: 'bg-orange-50', icon: AlertTriangle },
                    { label: 'Disease Detected', val: 'None', color: 'text-slate-400', bg: 'bg-slate-50', icon: CheckCircle },
                    { label: 'Pests Detected', val: 'None', color: 'text-slate-400', bg: 'bg-slate-50', icon: CheckCircle },
                  ].map(d => (
                    <div key={d.label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <d.icon className={`w-3 h-3 ${d.color}`} />
                        <span className="text-xs font-bold text-slate-800">{d.label}</span>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded ${d.bg} ${d.color} uppercase`}>{d.val}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <div className="text-[10px] font-black text-slate-400 uppercase mb-3">Anomalies</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-rose-500">
                      <AlertTriangle className="w-3 h-3" />
                      <span className="text-[10px] font-bold uppercase">Minor nitrogen deficiency in Zone B</span>
                    </div>
                    <div className="flex items-center gap-2 text-rose-500">
                      <AlertTriangle className="w-3 h-3" />
                      <span className="text-[10px] font-bold uppercase">Localized dry patch in Zone C</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Object Counts */}
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-6">Object Counts</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Plants', val: 'Approx. 1280' },
                    { label: 'Weeds', val: 'Approx. 50' },
                    { label: 'Bare Patches', val: '4' },
                    { label: 'Waterlogged', val: '0' },
                  ].map(o => (
                    <div key={o.label} className="flex items-center justify-between pb-2 border-b border-slate-50">
                      <span className="text-xs font-medium text-slate-500">{o.label}</span>
                      <span className="text-xs font-black text-slate-800 font-mono tracking-tighter">{o.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Confidence */}
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-6">AI Confidence</h3>
                <div className="space-y-5">
                  {[
                    { label: 'Crop Health', val: 92 },
                    { label: 'Weed Detection', val: 88 },
                    { label: 'Zonal Mapping', val: 96 },
                    { label: 'Species ID', val: 74 },
                  ].map(c => (
                    <div key={c.label}>
                      <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase mb-2">
                        <span>{c.label}</span>
                        <span>{c.val}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${c.val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SnapshotGallery({ snapshots, onDismiss, onAnalyze }: { snapshots: string[]; onDismiss: (i: number) => void; onAnalyze: (img: string) => void }) {
  const [saving, setSaving] = useState<number | null>(null);
  const [saved, setSaved] = useState<Set<number>>(new Set());

  const saveToCloud = async (index: number) => {
    setSaving(index);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const res = await fetch(snapshots[index]);
      const blob = await res.blob();
      const file = new File([blob], `snapshot-${Date.now()}.jpg`, { type: 'image/jpeg' });

      const filePath = `${user.id}/${Date.now()}-snapshot.jpg`;
      const { error } = await supabase.storage
        .from('drone-media')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (error) throw error;

      await supabase.from('media_files').insert({
        user_id: user.id,
        file_name: file.name,
        file_url: supabase.storage.from('drone-media').getPublicUrl(filePath).data.publicUrl,
        file_type: 'image',
        file_size_mb: +(blob.size / 1024 / 1024).toFixed(2),
        ai_tags: [],
      });

      setSaved(prev => new Set(prev).add(index));
    } catch {
      // Silently fail — user might not be authenticated
    } finally {
      setSaving(null);
    }
  };

  const download = (index: number) => {
    const a = document.createElement('a');
    a.href = snapshots[index];
    a.download = `soilguard-snapshot-${index + 1}.jpg`;
    a.click();
  };

  if (snapshots.length === 0) return null;

  return (
    <div className="bg-gray-900/60 border border-gray-800/50 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Camera className="w-4 h-4 text-green-400" />
        <span className="text-sm font-medium text-white">Captured Snapshots</span>
        <span className="text-xs text-gray-500 ml-auto">{snapshots.length} captured</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {snapshots.map((snap, i) => (
          <div key={i} className="relative group rounded-xl overflow-hidden border border-gray-800/50">
            <img src={snap} alt={`Snapshot ${i + 1}`} className="w-full aspect-video object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                onClick={() => onAnalyze(snap)}
                className="w-8 h-8 bg-blue-500/80 rounded-lg flex items-center justify-center text-white hover:bg-blue-500 transition-colors"
                title="AI Analyze"
              >
                <Brain className="w-4 h-4" />
              </button>
              <button
                onClick={() => download(i)}
                className="w-8 h-8 bg-gray-500/80 rounded-lg flex items-center justify-center text-white hover:bg-gray-500 transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => saveToCloud(i)}
                disabled={saving === i || saved.has(i)}
                className="w-8 h-8 bg-blue-500/80 rounded-lg flex items-center justify-center text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
                title="Save to cloud"
              >
                {saving === i ? <Loader2 className="w-4 h-4 animate-spin" /> :
                 saved.has(i) ? <CheckCircle className="w-4 h-4" /> :
                 <Upload className="w-4 h-4" />}
              </button>
              <button
                onClick={() => onDismiss(i)}
                className="w-8 h-8 bg-red-500/80 rounded-lg flex items-center justify-center text-white hover:bg-red-500 transition-colors"
                title="Remove"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {saved.has(i) && (
              <div className="absolute top-1.5 right-1.5 bg-green-500 rounded-full p-0.5">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CameraPage() {
  const [visionMode, setVisionMode] = useState<VisionMode>('normal');
  const [fullscreen, setFullscreen] = useState(false);
  const [tick, setTick] = useState(0);
  const [snapshots, setSnapshots] = useState<string[]>([]);
  const [analysisImage, setAnalysisImage] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // fmt removed

  // FEED_IMAGES removed

  const handleSnapshot = (dataUrl: string) => {
    setSnapshots(prev => [dataUrl, ...prev]);
  };

  const dismissSnapshot = (index: number) => {
    setSnapshots(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Source selector removed - only laptop camera available */}

      <div className={`${fullscreen ? 'fixed inset-0 z-50 bg-black flex flex-col p-4 gap-4' : ''}`}>
        <div className="flex gap-4 flex-col lg:flex-row">
          {/* Main Feed Area */}
          <div className="flex-1 space-y-4">
            <LaptopCameraFeed visionMode={visionMode} tick={tick} onSnapshot={handleSnapshot} />

            {/* Vision mode controls */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex gap-1.5">
                {(['normal', 'thermal', 'night', 'ndvi'] as VisionMode[]).map(m => (
                  <button
                    key={m}
                    onClick={() => setVisionMode(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      visionMode === m
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'text-gray-500 hover:text-gray-300 border border-gray-700/50'
                    }`}
                  >
                    {m === 'ndvi' ? 'NDVI' : m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex-1" />
            </div>

            {/* Snapshot gallery */}
            <SnapshotGallery snapshots={snapshots} onDismiss={dismissSnapshot} onAnalyze={setAnalysisImage} />

            {/* AI Analysis Modal */}
            {analysisImage && (
              <AIAnalysisModal image={analysisImage} onDismiss={() => setAnalysisImage(null)} />
            )}
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-64 space-y-4">
            {/* Feed Selector removed */}


            <TorchPanel />

            {/* AI Features */}
            <div className="bg-gray-900/60 border border-gray-800/50 rounded-2xl p-4">
              <div className="text-sm font-medium text-white mb-3">AI Features</div>
              <div className="space-y-2">
                {[
                  { label: 'Image Stabilization', active: true },
                  { label: 'Object Tracking', active: true },
                  { label: 'Motion Detection', active: false },
                  { label: 'Auto Exposure', active: true },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{item.label}</span>
                    <div className={`w-7 h-4 rounded-full transition-colors ${item.active ? 'bg-green-500' : 'bg-gray-700'}`}>
                      <div className={`w-3 h-3 rounded-full bg-white m-0.5 transition-transform ${item.active ? 'translate-x-3' : 'translate-x-0'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TorchPanel() {
  const [on, setOn] = useState(false);
  const [brightness, setBrightness] = useState(80);
  const [sos, setSos] = useState(false);

  return (
    <div className="bg-gray-900/60 border border-gray-800/50 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-4 h-4 ${on ? 'text-yellow-400' : 'text-gray-600'} transition-colors`}>
          <Sun className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium text-white">Torch Control</span>
      </div>
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => { setOn(!on); if (sos) setSos(false); }}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all border ${
            on ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'border-gray-700 text-gray-500 hover:text-gray-300'
          }`}
        >
          {on ? 'ON' : 'OFF'}
        </button>
        <button
          onClick={() => { setSos(!sos); if (!sos) setOn(true); }}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all border ${
            sos ? 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse' : 'border-gray-700 text-gray-500 hover:text-gray-300'
          }`}
        >
          SOS
        </button>
      </div>
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Brightness</span>
          <span>{brightness}%</span>
        </div>
        <input
          type="range"
          min={10}
          max={100}
          value={brightness}
          onChange={e => setBrightness(+e.target.value)}
          disabled={!on}
          className="w-full accent-yellow-400 disabled:opacity-40"
        />
      </div>
    </div>
  );
}
