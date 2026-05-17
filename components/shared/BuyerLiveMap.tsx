"use client";
import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom HTML Icons (Pulse Amber/Emerald Aesthetic)
const runnerIcon = L.divIcon({
  className: 'custom-runner-icon',
  html: `<div style="width: 22px; height: 22px; background-color: #f59e0b; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(245,158,11,0.4); position: relative;">
          <div style="position: absolute; inset: -4px; border-radius: 50%; background-color: #f59e0b; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.4;"></div>
         </div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const dropoffIcon = L.divIcon({
  className: 'custom-dropoff-icon',
  html: `<div style="width: 28px; height: 28px; background-color: #10b981; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(16,185,129,0.3); display: flex; align-items: center; justify-content: center;">
          <div style="width: 10px; height: 10px; background-color: white; border-radius: 50%;"></div>
         </div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function MapController({ runnerPos, dropoffPos }: any) {
  const map = useMap();
  
  React.useEffect(() => {
    if (runnerPos && dropoffPos) {
      const bounds = L.latLngBounds([runnerPos, dropoffPos]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (dropoffPos) {
      map.setView(dropoffPos, 16);
    }
  }, [map, runnerPos, dropoffPos]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 300);
    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

interface BuyerLiveMapProps {
  runnerLocation?: { latitude: number; longitude: number } | null;
}

export default function BuyerLiveMap({ runnerLocation }: BuyerLiveMapProps) {
  const dropoffPos: [number, number] = [3.1594, 101.6998]; // Default UniKL MIIT Drop-off
  const runnerPos: [number, number] | null = runnerLocation 
    ? [runnerLocation.latitude, runnerLocation.longitude] 
    : null;

  return (
    <div className="absolute inset-0 z-0 m-0 p-0 overflow-hidden w-full h-full bg-[#f8fafc]">
      <MapContainer 
        center={dropoffPos} 
        zoom={16} 
        zoomControl={false} 
        attributionControl={false}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        <Marker position={dropoffPos} icon={dropoffIcon} />
        
        {runnerPos && (
          <>
            <Marker position={runnerPos} icon={runnerIcon} />
            <Polyline 
              positions={[runnerPos, dropoffPos]} 
              color="#f59e0b" 
              weight={4} 
              dashArray="8, 12" 
              lineCap="round"
            />
            <MapController runnerPos={runnerPos} dropoffPos={dropoffPos} />
          </>
        )}
      </MapContainer>
      
      <style>{`
        @keyframes ping {
          0% { transform: scale(1); opacity: 0.5; }
          75%, 100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
