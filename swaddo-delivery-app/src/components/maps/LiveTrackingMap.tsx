import React, { useEffect, useRef, useState } from 'react';
import { BaseMap } from './Map';
import { MarkerF, PolylineF } from '@react-google-maps/api';

interface LiveTrackingMapProps {
  apiKey: string;
  riderLoc: { lat: number; lng: number } | null;
  userLoc: { lat: number; lng: number };
  storeLoc: { lat: number; lng: number };
  stageIndex: number;
  routePolyline?: string;
  className?: string;
}

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  apiKey,
  riderLoc,
  userLoc,
  storeLoc,
  stageIndex,
  routePolyline,
  className = "w-full h-full"
}) => {
  const mapRef = useRef<any>(null);
  const [path, setPath] = useState<{lat: number, lng: number}[]>([]);

  // Decode polyline string to array of points
  useEffect(() => {
    if (routePolyline && window.google) {
      try {
        const decodedPath = window.google.maps.geometry.encoding.decodePath(routePolyline);
        setPath(decodedPath.map((p: any) => ({ lat: p.lat(), lng: p.lng() })));
      } catch (err) {
        console.error("Failed to decode polyline", err);
      }
    }
  }, [routePolyline]);

  // Fit bounds to show relevant markers
  useEffect(() => {
    if (!mapRef.current || !window.google) return;
    
    const bounds = new window.google.maps.LatLngBounds();
    let pointsCount = 0;

    if (riderLoc && stageIndex >= 2) {
      bounds.extend(riderLoc);
      pointsCount++;
    }
    
    if (stageIndex < 2) {
      bounds.extend(storeLoc);
      pointsCount++;
    } else {
      bounds.extend(userLoc);
      pointsCount++;
    }

    if (path.length > 0) {
      path.forEach(p => bounds.extend(p));
      pointsCount += path.length;
    }

    if (pointsCount > 0) {
      mapRef.current.fitBounds(bounds);
      if (pointsCount === 1) {
        mapRef.current.setZoom(15);
      } else {
        // add padding
        mapRef.current.panToBounds(bounds, 50);
      }
    }
  }, [riderLoc, userLoc, storeLoc, stageIndex, path]);

  return (
    <BaseMap 
      apiKey={apiKey} 
      center={riderLoc || storeLoc} 
      zoom={14} 
      className={className}
      onLoad={(map) => { mapRef.current = map; }}
    >
      {/* Route Line */}
      {path.length > 0 && (
        <PolylineF
          path={path}
          options={{
            strokeColor: "#primary", // Can change to theme color
            strokeOpacity: 0.8,
            strokeWeight: 4,
          }}
        />
      )}

      {/* Rider Marker */}
      {riderLoc && stageIndex >= 2 && (
        <MarkerF
          position={riderLoc}
          icon={{
            url: '/images/scooter.png',
            scaledSize: window.google ? new window.google.maps.Size(40, 40) : undefined,
            anchor: window.google ? new window.google.maps.Point(20, 20) : undefined,
          }}
          zIndex={100}
        />
      )}

      {/* Customer Location */}
      {stageIndex >= 2 && (
        <MarkerF
          position={userLoc}
          icon={{
            url: '/images/home-icon.png',
            scaledSize: window.google ? new window.google.maps.Size(40, 44) : undefined,
            anchor: window.google ? new window.google.maps.Point(20, 44) : undefined,
          }}
          zIndex={10}
        />
      )}

      {/* Store Location */}
      {stageIndex < 2 && (
        <MarkerF
          position={storeLoc}
          icon={{
            url: '/images/store-icon.png',
            scaledSize: window.google ? new window.google.maps.Size(40, 44) : undefined,
            anchor: window.google ? new window.google.maps.Point(20, 44) : undefined,
          }}
          zIndex={10}
        />
      )}
    </BaseMap>
  );
};
