import React, { useState, useEffect, useRef } from 'react';
import { BaseMap } from './Map';
import { MarkerF } from '@react-google-maps/api';

interface LocationPickerMapProps {
  apiKey: string;
  initialLocation?: { lat: number; lng: number };
  onLocationSelect: (lat: number, lng: number) => void;
  className?: string;
}

export const LocationPickerMap: React.FC<LocationPickerMapProps> = ({
  apiKey,
  initialLocation,
  onLocationSelect,
  className = "w-full h-[400px] rounded-xl overflow-hidden"
}) => {
  const [center, setCenter] = useState(initialLocation || { lat: 20.5937, lng: 78.9629 });
  const [markerPos, setMarkerPos] = useState(initialLocation || { lat: 20.5937, lng: 78.9629 });
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (initialLocation) {
      setCenter(initialLocation);
      setMarkerPos(initialLocation);
    }
  }, [initialLocation]);

  const handleDragEnd = (e: any) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarkerPos({ lat, lng });
    onLocationSelect(lat, lng);
  };

  const handleClick = (e: any) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarkerPos({ lat, lng });
    onLocationSelect(lat, lng);
  };

  return (
    <BaseMap 
      apiKey={apiKey} 
      center={center} 
      zoom={16} 
      className={className}
      onClick={handleClick}
      onLoad={(map) => { mapRef.current = map; }}
    >
      <MarkerF 
        position={markerPos} 
        draggable={true}
        onDragEnd={handleDragEnd}
        animation={window.google?.maps?.Animation?.DROP}
      />
    </BaseMap>
  );
};
