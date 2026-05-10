'use client';

import React, { useState } from 'react';
import { Settings, User, Bell, Shield, Cpu, Globe, Save } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function SettingsPage() {
  const { profile, theme, setTheme } = useApp();
  const [farmName, setFarmName] = useState(profile?.farm_name || '');
  const [notifications, setNotifications] = useState({
    pestAlert: true, moistureAlert: true, weatherAlert: true, flightComplete: false,
  });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Profile */}
      <div className="bg-gray-900/60 border border-gray-800/50 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <User className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium text-white">Farm Profile</span>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Farm Name</label>
            <input
              value={farmName}
              onChange={e => setFarmName(e.target.value)}
              className="w-full bg-gray-800/70 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Role</label>
            <input
              value={profile?.role || 'farmer'}
              readOnly
              className="w-full bg-gray-800/40 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-gray-900/60 border border-gray-800/50 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Bell className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium text-white">Notifications</span>
        </div>
        <div className="space-y-3">
          {Object.entries(notifications).map(([key, val]) => {
            const labels: Record<string, string> = {
              pestAlert: 'Pest Detection Alerts',
              moistureAlert: 'Soil Moisture Alerts',
              weatherAlert: 'Weather Warnings',
              flightComplete: 'Flight Completion Notifications',
            };
            return (
              <div key={key} className="flex items-center justify-between py-2 border-b border-gray-800/30 last:border-0">
                <span className="text-sm text-gray-300">{labels[key]}</span>
                <button
                  onClick={() => setNotifications(prev => ({ ...prev, [key]: !val }))}
                  className={`w-10 h-5 rounded-full transition-colors ${val ? 'bg-green-500' : 'bg-gray-700'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full m-0.5 transition-transform ${val ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-gray-900/60 border border-gray-800/50 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Globe className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium text-white">Appearance</span>
        </div>
        <div className="flex gap-3">
          {(['dark', 'light'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all ${
                theme === t ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'border-gray-700 text-gray-500 hover:text-gray-300'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)} Mode
            </button>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="bg-gray-900/60 border border-gray-800/50 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Shield className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium text-white">Security</span>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Encrypted Drone Communication', status: 'Active', color: 'text-green-400 bg-green-500/10' },
            { label: 'Two-Factor Authentication', status: 'Disabled', color: 'text-gray-500 bg-gray-800/50' },
            { label: 'Activity Logging', status: 'Active', color: 'text-green-400 bg-green-500/10' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-800/30 last:border-0">
              <span className="text-sm text-gray-300">{item.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${item.color}`}>{item.status}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all border ${
          saved
            ? 'bg-green-500 text-white border-green-500'
            : 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30'
        }`}
      >
        <Save className="w-4 h-4" />
        {saved ? 'Saved!' : 'Save Changes'}
      </button>
    </div>
  );
}
