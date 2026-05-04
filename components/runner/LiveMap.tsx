"use client";
import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom HTML Icons (Pulse Aesthetic)
const runnerIcon = L.divIcon({
  className: 'custom-runner-icon',
  html: `<div style="width: 20px; height: 20px; background-color: #007AFF; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); position: relative;">
          <div style="position: absolute; inset: -4px; border-radius: 50%; background-color: #007AFF; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.5;"></div>
         </div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const vendorIcon = L.divIcon({
  className: 'custom-vendor-icon',
  html: `<div style="width: 28px; height: 28px; background-color: #34C759; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
          <div style="width: 10px; height: 10px; background-color: white; border-radius: 50%;"></div>
         </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function MapResizer() {
  const map = useMap();
  React.useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [map]);
  return null;
}

interface LiveMapProps {
  hasActiveJob: boolean;
}

export default function LiveMap({ hasActiveJob }: LiveMapProps) {
  const center: [number, number] = [3.1587, 101.7005]; // UniKL MIIT
  
  // Hardcoded offset coordinates to match the CSS map's visual
  const runnerPos: [number, number] = [3.1578, 101.6985];
  const vendorPos: [number, number] = [3.1595, 101.7020];

  return (
    <div className="absolute inset-0 z-0 m-0 p-0 overflow-hidden">
      <MapContainer 
        center={center} 
        zoom={16} 
        zoomControl={false} 
        attributionControl={false}
        dragging={false} 
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        style={{ height: '100%', width: '100%', zIndex: 0, margin: 0, padding: 0 }}
      >
        <MapResizer />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        {hasActiveJob && (
          <>
            <Marker position={runnerPos} icon={runnerIcon} />
            <Marker position={vendorPos} icon={vendorIcon} />
            <Polyline 
              positions={[runnerPos, vendorPos]} 
              color="#3b82f6" 
              weight={4} 
              dashArray="8, 12" 
              lineCap="round"
            />
          </>
        )}
      </MapContainer>
      
      {/* Fallback ping animation style since Tailwind animations don't work inside leaflet html string sometimes */}
      <style>{`
        @keyframes ping {
          0% { transform: scale(1); opacity: 0.5; }
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
