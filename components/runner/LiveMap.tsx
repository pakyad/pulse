"use client";
import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom HTML Icons (Pulse Aesthetic - Task Numbers)
const pickupIcon = L.divIcon({
  className: 'custom-pickup-icon',
  html: `<div style="width: 32px; height: 32px; background-color: white; border-radius: 12px; color: #0f172a; font-family: sans-serif; font-weight: 900; font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); display: flex; align-items: center; justify-content: center; border: 1.5px solid #f1f5f9; position: relative; z-index: 10;">
          1
         </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const dropoffIcon = L.divIcon({
  className: 'custom-dropoff-icon',
  html: `<div style="width: 32px; height: 32px; background-color: #f8fafc; border-radius: 12px; color: #94a3b8; font-family: sans-serif; font-weight: 900; font-size: 14px; display: flex; align-items: center; justify-content: center; border: 1.5px solid #e2e8f0;">
          2
         </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function MapResizer() {
  const map = useMap();
  React.useEffect(() => {
    let isMounted = true;
    const timeoutId = setTimeout(() => {
      if (isMounted && map && map.getContainer()) {
        map.invalidateSize();
      }
    }, 200);
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
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
            <Marker position={runnerPos} icon={pickupIcon} />
            <Marker position={vendorPos} icon={dropoffIcon} />
            <Polyline 
              positions={[runnerPos, vendorPos]} 
              color="#cbd5e1" 
              weight={3} 
              dashArray="6, 8" 
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
