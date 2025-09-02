import React, { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Satellite, Navigation } from "lucide-react";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Equipment {
  latitude?: number | null;
  longitude?: number | null;
}

interface EquipmentFormData {
  name: string;
  model: string;
  serial_number: string;
  location: string;
  location_detail: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
  observations: string;
}

interface EquipmentMapTabProps {
  formData: EquipmentFormData;
  setFormData: React.Dispatch<React.SetStateAction<EquipmentFormData>>;
  equipment?: Equipment | null;
}

export const EquipmentMapTab: React.FC<EquipmentMapTabProps> = ({
  formData,
  setFormData,
  equipment
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [needsToken, setNeedsToken] = useState(false);

  useEffect(() => {
    // Try to get token from environment or check if we need to ask user
    checkMapboxToken();
  }, []);

  useEffect(() => {
    if (mapboxToken && mapContainer.current && !map.current) {
      initializeMap();
    }
  }, [mapboxToken]);

  const checkMapboxToken = async () => {
    // For now, we'll ask the user to input the token
    // In a real implementation, this would come from Supabase secrets
    setNeedsToken(true);
  };

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    const initialLat = equipment?.latitude || formData.latitude || -23.5505;
    const initialLng = equipment?.longitude || formData.longitude || -46.6333;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-v9',
      center: [initialLng, initialLat],
      zoom: 15
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add marker if coordinates exist
    if ((equipment?.latitude && equipment?.longitude) || (formData.latitude && formData.longitude)) {
      addMarker(initialLat, initialLng);
    }

    // Handle map clicks to place marker
    map.current.on('click', (e) => {
      const { lat, lng } = e.lngLat;
      addMarker(lat, lng);
      updateCoordinates(lat, lng);
    });
  };

  const addMarker = (lat: number, lng: number) => {
    if (!map.current) return;

    // Remove existing marker
    if (marker.current) {
      marker.current.remove();
    }

    // Add new marker
    marker.current = new mapboxgl.Marker({
      color: '#ef4444',
      draggable: true
    })
      .setLngLat([lng, lat])
      .addTo(map.current);

    // Handle marker drag
    marker.current.on('dragend', () => {
      if (!marker.current) return;
      const lngLat = marker.current.getLngLat();
      updateCoordinates(lngLat.lat, lngLat.lng);
    });
  };

  const updateCoordinates = (lat: number, lng: number) => {
    setFormData({
      ...formData,
      latitude: Number(lat.toFixed(8)),
      longitude: Number(lng.toFixed(8))
    });
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          if (map.current) {
            map.current.flyTo({
              center: [lng, lat],
              zoom: 18
            });
            addMarker(lat, lng);
            updateCoordinates(lat, lng);
          }
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          alert('Erro ao obter localização atual');
        }
      );
    } else {
      alert('Geolocalização não suportada pelo navegador');
    }
  };

  const handleCoordinateChange = (field: 'latitude' | 'longitude', value: string) => {
    const numValue = value === '' ? null : Number(value);
    const newFormData = { ...formData, [field]: numValue };
    setFormData(newFormData);

    // Update map center and marker if both coordinates are valid
    if (newFormData.latitude && newFormData.longitude && map.current) {
      map.current.flyTo({
        center: [newFormData.longitude, newFormData.latitude],
        zoom: 15
      });
      addMarker(newFormData.latitude, newFormData.longitude);
    }
  };

  if (needsToken) {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Token do Mapbox Necessário</h4>
          <p className="text-sm text-blue-700 mb-4">
            Para usar o mapa satelital, você precisa de um token público do Mapbox.
            Visite <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="underline">mapbox.com</a> 
            para criar uma conta gratuita e obter seu token.
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="mapbox-token">Token Público do Mapbox</Label>
            <Input
              id="mapbox-token"
              type="text"
              placeholder="pk.eyJ1IjoiZXhhbXBsZSI6..."
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
            />
            <Button 
              onClick={() => setNeedsToken(false)}
              disabled={!mapboxToken.startsWith('pk.')}
              size="sm"
            >
              Continuar
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Inserir Coordenadas Manualmente</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                placeholder="-23.5505"
                value={equipment?.latitude || formData.latitude || ''}
                onChange={(e) => handleCoordinateChange('latitude', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                placeholder="-46.6333"
                value={equipment?.longitude || formData.longitude || ''}
                onChange={(e) => handleCoordinateChange('longitude', e.target.value)}
              />
            </div>
          </div>

          <Button onClick={getCurrentLocation} variant="outline" className="w-full">
            <Navigation className="h-4 w-4 mr-2" />
            Usar Localização Atual
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button onClick={getCurrentLocation} variant="outline" size="sm">
          <Navigation className="h-4 w-4 mr-2" />
          Localização Atual
        </Button>
        
        <Button onClick={() => setNeedsToken(true)} variant="outline" size="sm">
          <Satellite className="h-4 w-4 mr-2" />
          Alterar Token
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="latitude">Latitude</Label>
          <Input
            id="latitude"
            type="number"
            step="any"
            placeholder="-23.5505"
            value={equipment?.latitude || formData.latitude || ''}
            onChange={(e) => handleCoordinateChange('latitude', e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="longitude">Longitude</Label>
          <Input
            id="longitude"
            type="number"
            step="any"
            placeholder="-46.6333"
            value={equipment?.longitude || formData.longitude || ''}
            onChange={(e) => handleCoordinateChange('longitude', e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div 
          ref={mapContainer} 
          className="w-full h-96"
          style={{ minHeight: '400px' }}
        />
      </div>

      <div className="bg-muted/50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-4 w-4" />
          <span className="font-medium">Como usar:</span>
        </div>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Clique no mapa para posicionar o equipamento</li>
          <li>• Arraste o marcador vermelho para ajustar a posição</li>
          <li>• Use "Localização Atual" para GPS automático</li>
          <li>• Insira coordenadas manualmente se necessário</li>
        </ul>
      </div>
    </div>
  );
};