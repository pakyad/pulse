"use client";
import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom HTML Icons (Pulse Zero-Black Aesthetic)
const runnerIcon = L.divIcon({
  className: 'custom-runner-icon',
  html: `<div style="width: 26px; height: 26px; background-color: #0f172a; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.15); position: relative;">
          <div style="position: absolute; inset: -6px; border-radius: 50%; background-color: #0f172a; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.2;"></div>
         </div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

const dropoffIcon = L.divIcon({
  className: 'custom-dropoff-icon',
  html: `<div style="width: 32px; height: 32px; background-color: #10b981; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 12px rgba(16,185,129,0.3); display: flex; align-items: center; justify-content: center;">
          <div style="width: 10px; height: 10px; background-color: white; border-radius: 50%;"></div>
         </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
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
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted && map && map.getContainer()) {
        map.invalidateSize();
      }
    }, 300);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
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
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        <Marker position={dropoffPos} icon={dropoffIcon} />
        
        {runnerPos && (
          <>
            <Marker position={runnerPos} icon={runnerIcon} />
            <Polyline 
              positions={[runnerPos, dropoffPos]} 
              color="#0f172a" 
              weight={4} 
              dashArray="6, 8" 
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
