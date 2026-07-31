import React from 'react';
import { GoogleMap, useLoadScript } from "@react-google-maps/api";
import { Loader2 } from 'lucide-react';

interface BaseMapProps {
  apiKey: string;
  children?: React.ReactNode;
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  onClick?: (e: any) => void;
  onLoad?: (map: any) => void;
}

const mapStyles = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
];

export const BaseMap: React.FC<BaseMapProps> = ({ 
  apiKey, 
  children, 
  center = { lat: 20.5937, lng: 78.9629 }, 
  zoom = 15, 
  className = "w-full h-full min-h-[300px]",
  onClick,
  onLoad
}) => {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries: ["places", "geometry"]
  });

  if (loadError) return <div className="flex items-center justify-center p-4 bg-red-50 text-red-500 rounded-lg">Error loading maps</div>;
  if (!isLoaded) return <div className="flex flex-col items-center justify-center h-full min-h-[300px] bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-primary" /><p className="mt-2 text-sm text-gray-500">Loading map...</p></div>;

  return (
    <div className={className}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={center}
        zoom={zoom}
        onClick={onClick}
        onLoad={onLoad}
        options={{
          styles: mapStyles,
          disableDefaultUI: true,
          zoomControl: false,
          fullscreenControl: false,
        }}
      >
        {children}
      </GoogleMap>
    </div>
  );
};
