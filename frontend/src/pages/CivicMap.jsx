import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import L from 'leaflet';
import {
  MapPin,
  Filter,
  Layers,
  AlertTriangle,
  Building,
  ShieldCheck,
  Info,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// Fix Leaflet default marker icons in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const getSeverityColor = (sev) => {
  switch (sev) {
    case 'Critical': return '#ef4444'; // Red
    case 'High': return '#f97316';     // Orange
    case 'Medium': return '#eab308';   // Yellow
    default: return '#3b82f6';         // Blue
  }
};

const createCustomPin = (severity) => {
  const color = getSeverityColor(severity);
  return L.divIcon({
    className: 'custom-map-marker',
    html: `<div style="background-color: ${color}; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
};

export default function CivicMap() {
  const { t } = useLanguage();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  const [markers, setMarkers] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [loading, setLoading] = useState(true);

  // Initialize Map
  useEffect(() => {
    if (!mapInstanceRef.current && mapContainerRef.current) {
      // Default to Center of India (Nagpur/Hyderabad coordinates)
      const map = L.map(mapContainerRef.current).setView([20.5937, 78.9629], 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | CivicConnect Governance',
        maxZoom: 19
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Fetch Markers
  useEffect(() => {
    fetchMarkers();
  }, [selectedCategory, selectedSeverity, selectedStatus]);

  const fetchMarkers = async () => {
    try {
      setLoading(true);
      let url = '/api/v1/grievances/map/locations?';
      if (selectedCategory) url += `category=${encodeURIComponent(selectedCategory)}&`;
      if (selectedSeverity) url += `severity=${encodeURIComponent(selectedSeverity)}&`;
      if (selectedStatus) url += `status=${encodeURIComponent(selectedStatus)}&`;

      const res = await axios.get(url);
      const data = res.data || [];
      setMarkers(data);

      if (mapInstanceRef.current && markersLayerRef.current) {
        markersLayerRef.current.clearLayers();

        const bounds = [];
        data.forEach((item) => {
          if (item.latitude && item.longitude) {
            const marker = L.marker([item.latitude, item.longitude], {
              icon: createCustomPin(item.severity)
            });

            const popupContent = `
              <div style="font-family: system-ui; max-width: 240px; padding: 4px;">
                <div style="font-size: 10px; font-weight: bold; color: #64748b; margin-bottom: 2px;">
                  ${item.ticket_number} • <span style="color: ${getSeverityColor(item.severity)}; font-weight: bold;">${item.severity}</span>
                </div>
                <h4 style="font-size: 13px; font-weight: bold; margin: 0 0 4px 0; color: #0f172a;">${item.title}</h4>
                <div style="font-size: 11px; color: #475569; margin-bottom: 6px;">${item.category} • ${item.department}</div>
                ${item.image_url ? `<img src="${item.image_url}" style="width: 100%; height: 90px; object-fit: cover; border-radius: 6px; margin-bottom: 6px;" />` : ''}
                <div style="font-size: 10px; color: #64748b;">${item.address || 'Location on map'}</div>
              </div>
            `;
            marker.bindPopup(popupContent);
            markersLayerRef.current.addLayer(marker);
            bounds.push([item.latitude, item.longitude]);
          }
        });

        if (bounds.length > 0) {
          mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
      }
    } catch (err) {
      console.error('Error fetching map markers:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'Potholes',
    'Road cracks',
    'Damaged roads',
    'Water leakage',
    'Waterlogging',
    'Drainage problems',
    'Garbage accumulation',
    'Overflowing dustbins',
    'Broken streetlights',
    'Electrical hazards'
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs font-semibold text-blue-400 bg-blue-950/60 px-3 py-1 rounded-full border border-blue-800/60 mb-2">
              <MapPin size={13} />
              <span>Geospatial Infrastructure Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {t('nav_map')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Real-time interactive map of verified civic grievances, hazardous infrastructure, and ongoing repair works.
            </p>
          </div>

          {/* Privacy Disclaimer Pill */}
          <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-2xl flex items-center space-x-2.5 text-xs text-slate-300">
            <Info size={16} className="text-blue-400 shrink-0" />
            <span className="text-[11px]">
              Privacy Protected: Exact doorstep coordinates are fuzzed (~50m) to prevent disclosure of private homes.
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 pt-6 border-t border-slate-800 flex flex-wrap items-center gap-3">
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2"
            >
              <option value="">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2"
            >
              <option value="">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* Legend */}
          <div className="flex items-center space-x-3 text-xs ml-auto">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              <span className="text-slate-400 text-[11px]">Critical</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
              <span className="text-slate-400 text-[11px]">High</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
              <span className="text-slate-400 text-[11px]">Medium</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span className="text-slate-400 text-[11px]">Standard</span>
            </span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl h-[650px] relative">
        <div ref={mapContainerRef} className="w-full h-full z-10" />
      </div>
    </div>
  );
}
