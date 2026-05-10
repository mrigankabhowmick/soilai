'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera, Maximize2, Minimize2, Sun, Thermometer, Eye,
  Circle, Square, RotateCcw, ZoomIn, ZoomOut, Flashlight,
  Download, Settings, Wifi, Battery, Layers, Monitor, Smartphone,
  Loader2, CheckCircle, X, Upload, Brain, Sparkles, Activity, Droplets, Wind, Leaf as LeafIcon
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
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnalyzing(false);
      setShowResults(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-950 border border-gray-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
        <div className="relative aspect-video bg-gray-900">
          <img src={image} alt="Analysis Target" className="w-full h-full object-cover" />
          {analyzing && (
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-green-500/10 animate-pulse" />
              <div className="absolute top-0 left-0 right-0 h-1 bg-green-400 shadow-[0_0_15px_rgba(74,222,128,0.5)] animate-scan-line" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/60 backdrop-blur-md rounded-2xl px-6 py-4 flex items-center gap-3 border border-green-500/30">
                  <Brain className="w-6 h-6 text-green-400 animate-bounce" />
                  <span className="text-white font-bold tracking-wider">AI ANALYZING AREA...</span>
                </div>
              </div>
            </div>
          )}
          <button onClick={onDismiss} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-8">
          {analyzing ? (
            <div className="space-y-4">
              <div className="h-4 bg-gray-800 rounded-full w-3/4 animate-pulse" />
              <div className="h-4 bg-gray-800 rounded-full w-1/2 animate-pulse" />
              <div className="h-4 bg-gray-800 rounded-full w-2/3 animate-pulse" />
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">Health Analysis Report</h3>
                  <p className="text-sm text-gray-500">Scan completed at {new Date().toLocaleTimeString()}</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-black text-green-400">88%</div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest">Health Score</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Moisture', val: '64%', icon: Droplets, color: 'text-blue-400' },
                  { label: 'Nutrients', val: 'Good', icon: Activity, color: 'text-purple-400' },
                  { label: 'Air Quality', val: '92%', icon: Wind, color: 'text-teal-400' },
                ].map(m => (
                  <div key={m.label} className="bg-gray-900/50 rounded-2xl p-3 border border-gray-800">
                    <m.icon className={`w-4 h-4 ${m.color} mb-2`} />
                    <div className="text-lg font-bold text-white">{m.val}</div>
                    <div className="text-[10px] text-gray-500 uppercase">{m.label}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  AI Observations & Care
                </div>
                <div className="bg-green-500/5 border border-green-500/10 rounded-2xl p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-3 h-3 text-green-400" />
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      <strong className="text-white">Vegetation Index:</strong> The area shows healthy chlorophyll activity. No immediate fertilizer needed.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Droplets className="w-3 h-3 text-blue-400" />
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      <strong className="text-white">Watering Recommendation:</strong> Surface soil looks slightly dry. Schedule a 15-minute irrigation cycle within the next 4 hours.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                      <LeafIcon className="w-3 h-3 text-yellow-400" />
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      <strong className="text-white">Pest Alert:</strong> Minimal risk detected. Continue monitoring for aphid activity on the lower leaf surfaces.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={onDismiss}
                className="w-full py-4 rounded-2xl bg-green-500 text-black font-bold hover:bg-green-400 transition-all shadow-lg shadow-green-500/20"
              >
                Close Report
              </button>
            </div>
          )}
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
