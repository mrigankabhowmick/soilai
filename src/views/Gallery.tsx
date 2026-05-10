'use client';

import React, { useState, useRef } from 'react';
import { Image, Search, Download, Tag, MapPin, Calendar, Camera, Grid, List, X, HardDrive, Upload, Cloud, Loader2, CheckCircle, FolderOpen } from 'lucide-react';
import { supabase, supabaseUrl } from '../lib/supabase';

const MEDIA_DATA = [
  { id: 1, url: 'https://images.pexels.com/photos/1629660/pexels-photo-1629660.jpeg?auto=compress&w=600', thumb: 'https://images.pexels.com/photos/1629660/pexels-photo-1629660.jpeg?auto=compress&w=200', name: 'zone-a-survey-001.jpg', area: 'Zone A', crop: 'Wheat', date: '2024-01-15', size: 4.2, type: 'image', tags: ['wheat', 'healthy', 'NDVI'] },
  { id: 2, url: 'https://images.pexels.com/photos/974314/pexels-photo-974314.jpeg?auto=compress&w=600', thumb: 'https://images.pexels.com/photos/974314/pexels-photo-974314.jpeg?auto=compress&w=200', name: 'zone-b-crop-check.jpg', area: 'Zone B', crop: 'Corn', date: '2024-01-15', size: 3.8, type: 'image', tags: ['corn', 'pest-detected'] },
  { id: 3, url: 'https://images.pexels.com/photos/158028/bellingrath-gardens-alabama-landscape-scenic-158028.jpeg?auto=compress&w=600', thumb: 'https://images.pexels.com/photos/158028/bellingrath-gardens-alabama-landscape-scenic-158028.jpeg?auto=compress&w=200', name: 'overview-morning.jpg', area: 'Zone C', crop: 'Rice', date: '2024-01-14', size: 5.1, type: 'image', tags: ['rice', 'irrigation', 'water-level'] },
  { id: 4, url: 'https://images.pexels.com/photos/440731/pexels-photo-440731.jpeg?auto=compress&w=600', thumb: 'https://images.pexels.com/photos/440731/pexels-photo-440731.jpeg?auto=compress&w=200', name: 'thermal-scan-zone-a.jpg', area: 'Zone A', crop: 'Wheat', date: '2024-01-14', size: 2.9, type: 'image', tags: ['thermal', 'temperature'] },
  { id: 5, url: 'https://images.pexels.com/photos/2132180/pexels-photo-2132180.jpeg?auto=compress&w=600', thumb: 'https://images.pexels.com/photos/2132180/pexels-photo-2132180.jpeg?auto=compress&w=200', name: 'soil-analysis-zone-d.jpg', area: 'Zone D', crop: 'Soy', date: '2024-01-13', size: 3.3, type: 'image', tags: ['soy', 'soil', 'moisture'] },
  { id: 6, url: 'https://images.pexels.com/photos/442589/pexels-photo-442589.jpeg?auto=compress&w=600', thumb: 'https://images.pexels.com/photos/442589/pexels-photo-442589.jpeg?auto=compress&w=200', name: 'ndvi-analysis-full.jpg', area: 'Zone B', crop: 'Corn', date: '2024-01-13', size: 4.7, type: 'image', tags: ['NDVI', 'vegetation', 'analysis'] },
  { id: 7, url: 'https://images.pexels.com/photos/1170986/pexels-photo-1170986.jpeg?auto=compress&w=600', thumb: 'https://images.pexels.com/photos/1170986/pexels-photo-1170986.jpeg?auto=compress&w=200', name: 'irrigation-zone-c.jpg', area: 'Zone C', crop: 'Rice', date: '2024-01-12', size: 3.6, type: 'image', tags: ['irrigation', 'water'] },
  { id: 8, url: 'https://images.pexels.com/photos/1367192/pexels-photo-1367192.jpeg?auto=compress&w=600', thumb: 'https://images.pexels.com/photos/1367192/pexels-photo-1367192.jpeg?auto=compress&w=200', name: 'sunrise-overview.jpg', area: 'Zone A', crop: 'Wheat', date: '2024-01-12', size: 5.4, type: 'image', tags: ['overview', 'sunrise', 'timelapse'] },
];

type UploadFile = {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
};

function SDCardPanel() {
  const [scanning, setScanning] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [scanResult, setScanResult] = useState<Record<string, unknown> | null>(null);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [showPanel, setShowPanel] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const scanSDCard = async () => {
    setScanning(true);
    try {
      // Try the File System Access API (Chrome/Edge only)
      if ('showDirectoryPicker' in window) {
        try {
          const dirHandle = await (window as any).showDirectoryPicker();
          const files: File[] = [];
          for await (const entry of (dirHandle as any).values()) {
            if (entry.kind === 'file') {
              const fileHandle = entry as any;
              const file = await fileHandle.getFile();
              if (/\.(jpg|jpeg|png|webp|mp4|mov|dng|avi)$/i.test(file.name)) {
                files.push(file);
              }
            }
          }
          if (files.length > 0) {
            setUploadFiles(files.map(f => ({ file: f, progress: 0, status: 'pending' as const })));
            setScanResult({
              total_files: files.length,
              total_size_mb: (files.reduce((s, f) => s + f.size, 0) / 1024 / 1024).toFixed(1),
              source: 'sd_card_direct',
            });
          } else {
            setScanResult({ total_files: 0, total_size_mb: '0', source: 'sd_card_direct', message: 'No media files found in selected folder.' });
          }
        } catch (err) {
          // User cancelled directory picker
          if ((err as Error).name !== 'AbortError') {
            // Fallback to edge function scan
            await fetchScanResult();
          }
        }
      } else {
        // Browser doesn't support File System Access API — use edge function
        await fetchScanResult();
      }
    } finally {
      setScanning(false);
    }
  };

  const fetchScanResult = async () => {
    const res = await fetch(`${supabaseUrl}/functions/v1/media-upload?action=sd-card-scan`, {
      headers: { 'Authorization': `Bearer ${supabaseKey}` },
    });
    const data = await res.json();
    setScanResult(data.simulated_scan || data);
  };

  const uploadToCloud = async () => {
    if (uploadFiles.length === 0) return;
    setUploading(true);

    const updatedFiles = [...uploadFiles];

    for (let i = 0; i < updatedFiles.length; i++) {
      updatedFiles[i] = { ...updatedFiles[i], status: 'uploading', progress: 0 };
      setUploadFiles([...updatedFiles]);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const filePath = `${user.id}/${Date.now()}-${updatedFiles[i].file.name}`;
        const { error } = await supabase.storage
          .from('drone-media')
          .upload(filePath, updatedFiles[i].file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (error) throw error;

        // Also insert into media_files table
        await supabase.from('media_files').insert({
          user_id: user.id,
          file_name: updatedFiles[i].file.name,
          file_url: supabase.storage.from('drone-media').getPublicUrl(filePath).data.publicUrl,
          file_type: updatedFiles[i].file.type.startsWith('video') ? 'video' : 'image',
          file_size_mb: +(updatedFiles[i].file.size / 1024 / 1024).toFixed(2),
          ai_tags: [],
        });

        updatedFiles[i] = { ...updatedFiles[i], status: 'done', progress: 100 };
      } catch (err) {
        updatedFiles[i] = { ...updatedFiles[i], status: 'error', error: (err as Error).message };
      }
      setUploadFiles([...updatedFiles]);
    }
    setUploading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploadFiles(Array.from(files).map(f => ({ file: f, progress: 0, status: 'pending' as const })));
  };

  const doneCount = uploadFiles.filter(f => f.status === 'done').length;
  const totalCount = uploadFiles.length;

  return (
    <div className="bg-gray-900/60 border border-gray-800/50 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium text-white">SD Card & Cloud Sync</span>
        </div>
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="text-xs text-gray-500 hover:text-gray-300 border border-gray-700/50 px-2 py-1 rounded-lg transition-colors"
        >
          {showPanel ? 'Hide' : 'Open'}
        </button>
      </div>

      {showPanel && (
        <div className="space-y-4 border-t border-gray-800/50 pt-4">
          {/* Scan SD Card */}
          <div>
            <div className="text-xs text-gray-400 mb-2">Step 1: Scan SD Card</div>
            <div className="flex gap-2">
              <button
                onClick={scanSDCard}
                disabled={scanning}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderOpen className="w-4 h-4" />}
                {scanning ? 'Scanning...' : 'Scan SD Card'}
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-all flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Select Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">
              {typeof window !== 'undefined' && 'showDirectoryPicker' in window
                ? 'Your browser supports direct SD card scanning via File System Access API.'
                : 'Direct SD scan not supported in this browser. Use "Select Files" or scan for instructions.'}
            </p>
          </div>

          {/* Scan result */}
          {scanResult && (
            <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-3">
              <div className="flex items-center gap-1.5 text-xs text-green-400 mb-2">
                <CheckCircle className="w-3 h-3" />
                <span>Scan Complete</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="text-white font-medium">{scanResult.total_files as number}</div>
                  <div className="text-gray-500">Files</div>
                </div>
                <div>
                  <div className="text-white font-medium">{scanResult.total_size_mb as string} MB</div>
                  <div className="text-gray-500">Total Size</div>
                </div>
                <div>
                  <div className="text-white font-medium capitalize">{(scanResult.source as string || 'simulated').replace('_', ' ')}</div>
                  <div className="text-gray-500">Source</div>
                </div>
              </div>
            </div>
          )}

          {/* Upload queue */}
          {uploadFiles.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">Step 2: Upload to Cloud</span>
                <span className="text-xs text-gray-500">{doneCount}/{totalCount} done</span>
              </div>

              {/* Progress overview */}
              <div className="w-full h-1.5 bg-gray-800 rounded-full mb-3">
                <div
                  className="h-1.5 bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%` }}
                />
              </div>

              {/* File list */}
              <div className="space-y-1.5 max-h-40 overflow-y-auto mb-3">
                {uploadFiles.map((uf, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {uf.status === 'done' ? <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" /> :
                     uf.status === 'uploading' ? <Loader2 className="w-3 h-3 text-blue-400 animate-spin flex-shrink-0" /> :
                     uf.status === 'error' ? <X className="w-3 h-3 text-red-400 flex-shrink-0" /> :
                     <div className="w-3 h-3 rounded-full bg-gray-700 flex-shrink-0" />}
                    <span className="text-gray-300 truncate flex-1">{uf.file.name}</span>
                    <span className="text-gray-600 flex-shrink-0">{(uf.file.size / 1024 / 1024).toFixed(1)} MB</span>
                  </div>
                ))}
              </div>

              <button
                onClick={uploadToCloud}
                disabled={uploading || doneCount === totalCount}
                className="w-full py-2.5 rounded-xl text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                {uploading ? `Uploading ${doneCount}/${totalCount}...` : doneCount === totalCount ? 'All Uploaded!' : `Upload ${totalCount - doneCount} Files to Cloud`}
              </button>
            </div>
          )}

          {/* Physical connection guide */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
            <span className="text-xs text-emerald-400 font-semibold block mb-3">How to Connect Your SD Card</span>
            <div className="space-y-3">
              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 text-xs text-emerald-400 font-bold">1</div>
                <div>
                  <p className="text-xs text-gray-300 font-medium">Remove SD card from drone</p>
                  <p className="text-xs text-gray-500 mt-0.5">Power off your drone, then eject the microSD card from the camera slot.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 text-xs text-emerald-400 font-bold">2</div>
                <div>
                  <p className="text-xs text-gray-300 font-medium">Insert SD card into your computer</p>
                  <p className="text-xs text-gray-500 mt-0.5">Use your laptop's SD slot, a USB card reader, or a microSD adapter. The drive should appear in your file explorer.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 text-xs text-emerald-400 font-bold">3</div>
                <div>
                  <p className="text-xs text-gray-300 font-medium">Click "Scan SD Card" above</p>
                  <p className="text-xs text-gray-500 mt-0.5">Your browser will ask you to select a folder. Choose the SD card drive (e.g. D:\ or /media/sdcard). All JPG, MP4, and DNG files will be detected.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 text-xs text-emerald-400 font-bold">4</div>
                <div>
                  <p className="text-xs text-gray-300 font-medium">Upload to cloud</p>
                  <p className="text-xs text-gray-500 mt-0.5">Click "Upload to Cloud" to sync files to your Supabase storage. They'll appear in the gallery from any device.</p>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-emerald-500/10">
              <p className="text-xs text-gray-500">
                <strong className="text-gray-400">Browser support:</strong> Direct SD scan works in Chrome and Edge. In Firefox/Safari, use "Select Files" to manually pick files from the SD card.
              </p>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {['JPG', 'PNG', 'WEBP', 'MP4', 'MOV', 'DNG'].map(fmt => (
                <span key={fmt} className="text-[9px] bg-gray-700/50 text-gray-400 px-1.5 py-0.5 rounded-full">{fmt}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Gallery() {
  const [search, setSearch] = useState('');
  const [filterArea, setFilterArea] = useState('all');
  const [filterCrop, setFilterCrop] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selected, setSelected] = useState<typeof MEDIA_DATA[0] | null>(null);

  const areas = ['all', ...Array.from(new Set(MEDIA_DATA.map(m => m.area)))];
  const crops = ['all', ...Array.from(new Set(MEDIA_DATA.map(m => m.crop)))];

  const filtered = MEDIA_DATA.filter(m => {
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !m.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))) return false;
    if (filterArea !== 'all' && m.area !== filterArea) return false;
    if (filterCrop !== 'all' && m.crop !== filterCrop) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Storage analytics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Files', value: MEDIA_DATA.length, icon: Image },
          { label: 'Used Storage', value: '38.2 GB', icon: Camera },
          { label: 'AI Tagged', value: `${MEDIA_DATA.length}`, icon: Tag },
          { label: 'Locations', value: '4 Zones', icon: MapPin },
        ].map(s => (
          <div key={s.label} className="bg-gray-900/60 border border-gray-800/50 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
              <s.icon className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <div className="text-lg font-bold text-white">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* SD Card & Cloud Sync Panel */}
      <SDCardPanel />

      {/* Storage bar */}
      <div className="bg-gray-900/60 border border-gray-800/50 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">Storage Usage – SD Card (16 GB)</span>
          <span className="text-xs text-gray-400">38.2 / 64 GB (Cloud)</span>
        </div>
        <div className="flex gap-1 h-2 rounded-full overflow-hidden">
          <div className="bg-green-500 rounded-l-full" style={{ width: '45%' }} title="Images" />
          <div className="bg-blue-500" style={{ width: '25%' }} title="Videos" />
          <div className="bg-yellow-500" style={{ width: '12%' }} title="Reports" />
          <div className="bg-gray-800 flex-1 rounded-r-full" />
        </div>
        <div className="flex gap-4 mt-2">
          {[['Images', 'bg-green-500', '45%'],['Videos', 'bg-blue-500','25%'],['Reports', 'bg-yellow-500','12%'],['Free', 'bg-gray-700','18%']].map(([l,c,v]) => (
            <div key={l} className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-sm ${c}`} />
              <span className="text-xs text-gray-500">{l} {v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or AI tag..."
            className="w-full bg-gray-900/60 border border-gray-800/50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50"
          />
        </div>
        <select
          value={filterArea}
          onChange={e => setFilterArea(e.target.value)}
          className="bg-gray-900/60 border border-gray-800/50 rounded-xl px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-green-500/50"
        >
          {areas.map(a => <option key={a} value={a}>{a === 'all' ? 'All Areas' : a}</option>)}
        </select>
        <select
          value={filterCrop}
          onChange={e => setFilterCrop(e.target.value)}
          className="bg-gray-900/60 border border-gray-800/50 rounded-xl px-3 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-green-500/50"
        >
          {crops.map(c => <option key={c} value={c}>{c === 'all' ? 'All Crops' : c}</option>)}
        </select>
        <div className="flex border border-gray-800/50 rounded-xl overflow-hidden">
          <button onClick={() => setViewMode('grid')} className={`px-3 py-2.5 ${viewMode === 'grid' ? 'bg-green-500/20 text-green-400' : 'text-gray-500 hover:text-gray-300'} transition-colors`}>
            <Grid className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('list')} className={`px-3 py-2.5 ${viewMode === 'list' ? 'bg-green-500/20 text-green-400' : 'text-gray-500 hover:text-gray-300'} transition-colors`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(item => (
            <div
              key={item.id}
              className="bg-gray-900/60 border border-gray-800/50 rounded-2xl overflow-hidden group cursor-pointer hover:border-green-500/30 transition-all"
              onClick={() => setSelected(item)}
            >
              <div className="relative aspect-video overflow-hidden">
                <img src={item.thumb} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center">
                    <Download className="w-3 h-3 text-white" />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="text-xs font-medium text-white truncate">{item.name}</p>
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                  <MapPin className="w-3 h-3" />
                  <span>{item.area}</span>
                  <span className="mx-1">·</span>
                  <span>{item.crop}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-[9px] bg-green-500/10 text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-900/60 border border-gray-800/50 rounded-2xl overflow-hidden">
          <div className="divide-y divide-gray-800/50">
            {filtered.map(item => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-800/30 cursor-pointer transition-colors" onClick={() => setSelected(item)}>
                <img src={item.thumb} alt={item.name} className="w-12 h-10 object-cover rounded-lg flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.name}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    <span>{item.area}</span>
                    <span>·</span>
                    <span>{item.crop}</span>
                    <span>·</span>
                    <span>{item.date}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 hidden sm:flex">
                  {item.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-[9px] bg-green-500/10 text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
                <span className="text-xs text-gray-600">{item.size} MB</span>
                <button className="text-gray-600 hover:text-green-400 transition-colors">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <img src={selected.url} alt={selected.name} className="w-full aspect-video object-cover" />
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-white">{selected.name}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{selected.area}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{selected.date}</span>
                    <span>{selected.size} MB</span>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-600 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {selected.tags.map(tag => (
                  <span key={tag} className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <button className="flex items-center gap-1.5 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-xl text-sm transition-all">
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
