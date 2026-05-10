'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wifi, Radio, Zap, Shield, Info, CheckCircle, 
  AlertCircle, Loader2, Cpu, Signal, Smartphone,
  Activity, Settings, Link2, Share2, Globe, Server
} from 'lucide-react';

type ConnectionProtocol = 'dji-wifi' | 'rf-ufo' | 'mavlink' | 'wifi-direct';
type ConnectionStatus = 'disconnected' | 'scanning' | 'connecting' | 'connected' | 'error';

interface LinkMetric {
  label: string;
  value: string;
  unit: string;
  color: string;
}

export default function Connectivity() {
  const [protocol, setProtocol] = useState<ConnectionProtocol>('dji-wifi');
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [signal, setSignal] = useState(0);
  const [latency, setLatency] = useState(0);
  const [packets, setPackets] = useState({ sent: 0, received: 0 });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (status === 'connected') {
      const id = setInterval(() => {
        setTick(t => t + 1);
        setSignal(90 + Math.sin(Date.now() / 1000) * 5);
        setLatency(20 + Math.random() * 10);
        setPackets(p => ({ sent: p.sent + 5, received: p.received + 4 }));
      }, 1000);
      return () => clearInterval(id);
    }
  }, [status]);

  const handleConnect = () => {
    setStatus('scanning');
    setTimeout(() => {
      setStatus('connecting');
      setTimeout(() => {
        setStatus('connected');
        setSignal(92);
        setLatency(24);
      }, 1500);
    }, 2000);
  };

  const handleDisconnect = () => {
    setStatus('disconnected');
    setSignal(0);
    setLatency(0);
  };

  const protocols: { id: ConnectionProtocol, label: string, icon: any, desc: string }[] = [
    { 
      id: 'dji-wifi', 
      label: 'DJI Wi-Fi Link', 
      icon: Wifi, 
      desc: 'Direct connection to DJI Air units or drone hotspots via 2.4/5.8GHz Wi-Fi.' 
    },
    { 
      id: 'rf-ufo', 
      label: 'RF UFO Direct', 
      icon: Radio, 
      desc: 'High-frequency radio link for ultra-low latency telemetry and control.' 
    },
    { 
      id: 'mavlink', 
      label: 'MAVLink Hub', 
      icon: Server, 
      desc: 'Industry standard UDP/TCP connection for ArduPilot and PX4 systems.' 
    },
    { 
      id: 'wifi-direct', 
      label: 'Wi-Fi Direct', 
      icon: Globe, 
      desc: 'Peer-to-peer wireless connection for legacy drone models.' 
    },
  ];

  const metrics: LinkMetric[] = [
    { label: 'Signal Strength', value: signal.toFixed(0), unit: 'dBm', color: 'text-green-400' },
    { label: 'Link Latency', value: latency.toFixed(0), unit: 'ms', color: 'text-blue-400' },
    { label: 'Downlink Speed', value: (signal * 0.8).toFixed(1), unit: 'Mb/s', color: 'text-purple-400' },
    { label: 'Packet Loss', value: (100 - signal).toFixed(1), unit: '%', color: 'text-orange-400' },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Column: Protocol Selection */}
        <div className="w-full md:w-80 space-y-4">
          <div className="bg-gray-900/60 border border-gray-800/50 rounded-2xl p-5 backdrop-blur-xl">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-green-400" />
              Connection Protocol
            </h2>
            <div className="space-y-2">
              {protocols.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    if (status === 'disconnected') setProtocol(p.id);
                  }}
                  disabled={status !== 'disconnected'}
                  className={`w-full text-left p-4 rounded-xl border transition-all group ${
                    protocol === p.id
                      ? 'bg-green-500/10 border-green-500/30 text-green-400'
                      : 'border-gray-800/50 text-gray-500 hover:border-gray-700 hover:bg-gray-800/30'
                  } disabled:opacity-50`}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <p.icon className={`w-5 h-5 ${protocol === p.id ? 'text-green-400' : 'text-gray-600 group-hover:text-gray-400'}`} />
                    <span className="text-sm font-bold">{p.label}</span>
                  </div>
                  <p className="text-[10px] leading-relaxed opacity-60">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-300">Secure Link</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              All connectivity links are AES-256 encrypted. Ensure your drone hardware supports secure handshake protocols.
            </p>
          </div>
        </div>

        {/* Right Column: Connection Dashboard */}
        <div className="flex-1 space-y-6">
          {/* Main Control Card */}
          <div className="bg-gray-900/60 border border-gray-800/50 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 blur-[80px] -mr-32 -mt-32 rounded-full" />
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-500 ${
                status === 'connected' ? 'bg-green-500/20 border-2 border-green-500/30' :
                status === 'error' ? 'bg-red-500/20 border-2 border-red-500/30' :
                'bg-gray-800 border-2 border-gray-700'
              }`}>
                {status === 'connected' ? <CheckCircle className="w-10 h-10 text-green-400" /> :
                 status === 'scanning' || status === 'connecting' ? <Loader2 className="w-10 h-10 text-green-400 animate-spin" /> :
                 status === 'error' ? <AlertCircle className="w-10 h-10 text-red-400" /> :
                 <Signal className="w-10 h-10 text-gray-500" />}
              </div>

              <h1 className="text-2xl font-bold text-white mb-2">
                {status === 'disconnected' ? 'Ready to Connect' :
                 status === 'scanning' ? 'Scanning for Hardware...' :
                 status === 'connecting' ? 'Establishing Link...' :
                 status === 'connected' ? 'Link Established' : 'Connection Error'}
              </h1>
              <p className="text-gray-400 text-sm max-w-sm mb-8">
                {status === 'disconnected' ? `Confirm your drone is powered on and transmitting via ${protocols.find(p => p.id === protocol)?.label}.` :
                 status === 'connected' ? `Stable connection detected on ${protocol.toUpperCase()} link. Hardware is synced and ready for flight.` :
                 'Please check your hardware status and try again.'}
              </p>

              <div className="flex gap-4 w-full max-w-xs">
                {status === 'connected' ? (
                  <button
                    onClick={handleDisconnect}
                    className="w-full py-4 rounded-2xl bg-red-500/10 text-red-400 border border-red-400/20 font-bold hover:bg-red-500/20 transition-all"
                  >
                    Terminate Link
                  </button>
                ) : (
                  <button
                    onClick={handleConnect}
                    disabled={status !== 'disconnected'}
                    className="w-full py-4 rounded-2xl bg-green-500 text-black font-bold hover:bg-green-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {status === 'disconnected' ? <Zap className="w-4 h-4 fill-current" /> : <Loader2 className="w-4 h-4 animate-spin" />}
                    {status === 'disconnected' ? 'Connect Drone' : 'Initializing...'}
                  </button>
                )}
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 border-t border-gray-800/50 pt-8">
              {metrics.map((m) => (
                <div key={m.label} className="text-center">
                  <div className={`text-xl font-mono font-bold ${status === 'connected' ? m.color : 'text-gray-600'}`}>
                    {status === 'connected' ? m.value : '--'}
                    <span className="text-[10px] ml-0.5 opacity-60">{m.unit}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Setup Guide Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-900/40 border border-gray-800/50 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Info className="w-4 h-4 text-green-400" />
                {protocol === 'dji-wifi' ? 'DJI Wi-Fi Guide' : 
                 protocol === 'rf-ufo' ? 'RF UFO Setup' : 'Hardware Instructions'}
              </h3>
              <ul className="space-y-4">
                {[
                  { title: 'Power On', desc: 'Ensure your drone and controller are fully charged.' },
                  { title: 'Enable Transmit', desc: 'Toggle the physical RF switch on the drone chassis.' },
                  { title: 'Handshake', desc: 'Hold the "Link" button for 3 seconds until LED flashes blue.' },
                ].map((step, i) => (
                  <li key={i} className="flex gap-4">
                    <div className="w-6 h-6 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0 text-xs text-green-400 font-bold border border-gray-700">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-xs text-white font-medium">{step.title}</p>
                      <p className="text-[10px] text-gray-500 mt-1">{step.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-900/40 border border-gray-800/50 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                Live Diagnostics
              </h3>
              <div className="space-y-4">
                <div className="h-24 flex items-end gap-1 px-2">
                  {[...Array(20)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`flex-1 rounded-t-sm transition-all duration-500 ${status === 'connected' ? 'bg-green-500/40' : 'bg-gray-800'}`}
                      style={{ height: status === 'connected' ? `${30 + Math.random() * 70}%` : '10%' }}
                    />
                  ))}
                </div>
                <div className="flex justify-between items-center px-1">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase">Packets Sent</span>
                    <span className={`text-xs font-mono ${status === 'connected' ? 'text-white' : 'text-gray-600'}`}>
                      {status === 'connected' ? packets.sent : '0'}
                    </span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] text-gray-500 uppercase">Packets Received</span>
                    <span className={`text-xs font-mono ${status === 'connected' ? 'text-white' : 'text-gray-600'}`}>
                      {status === 'connected' ? packets.received : '0'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
