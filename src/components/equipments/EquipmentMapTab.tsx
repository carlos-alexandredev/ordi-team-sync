import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Navigation, AlertCircle } from "lucide-react";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAdminMaster } from "@/hooks/useAdminMaster";

interface Equipment {
  id?: string;
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
  setFormData: (data: EquipmentFormData) => void;
  equipment?: Equipment | null;
}

export const EquipmentMapTab: React.FC<EquipmentMapTabProps> = ({
  formData,
  setFormData,
  equipment
}) => {
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [marker, setMarker] = useState<mapboxgl.Marker | null>(null);
  const [mapboxToken, setMapboxToken] = useState("");
  const [needsToken, setNeedsToken] = useState(false);
  const [loadingToken, setLoadingToken] = useState(true);
  const mapContainer = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { isAdminMaster } = useAdminMaster();

  useEffect(() => {
    loadMapboxToken();
  }, []);

  const loadMapboxToken = async () => {
    try {
      const { data } = await supabase.rpc('get_public_setting', { 
        setting_key: 'mapbox_public_token' 
      });
      
      if (data && data.trim() !== '') {
        setMapboxToken(data);
        setNeedsToken(false);
      } else {
        setNeedsToken(true);
      }
    } catch (error) {
      console.error('Erro ao carregar token do Mapbox:', error);
      setNeedsToken(true);
    } finally {
      setLoadingToken(false);
    }
  };

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || needsToken || loadingToken) return;

    mapboxgl.accessToken = mapboxToken;

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [formData.longitude || -46.6333, formData.latitude || -23.5505],
      zoom: formData.latitude && formData.longitude ? 15 : 10
    });

    mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');

    if (formData.latitude && formData.longitude) {
      const newMarker = new mapboxgl.Marker({ draggable: true })
        .setLngLat([formData.longitude, formData.latitude])
        .addTo(mapInstance);

      newMarker.on('dragend', () => {
        const lngLat = newMarker.getLngLat();
        setFormData({
          ...formData,
          latitude: lngLat.lat,
          longitude: lngLat.lng
        });
      });

      setMarker(newMarker);
    }

    mapInstance.on('click', (e) => {
      const { lng, lat } = e.lngLat;

      if (marker) {
        marker.setLngLat([lng, lat]);
      } else {
        const newMarker = new mapboxgl.Marker({ draggable: true })
          .setLngLat([lng, lat])
          .addTo(mapInstance);

        newMarker.on('dragend', () => {
          const lngLat = newMarker.getLngLat();
          setFormData({
            ...formData,
            latitude: lngLat.lat,
            longitude: lngLat.lng
          });
        });

        setMarker(newMarker);
      }

      setFormData({
        ...formData,
        latitude: lat,
        longitude: lng
      });
    });

    setMap(mapInstance);

    return () => {
      mapInstance.remove();
    };
  }, [mapboxToken, needsToken, loadingToken]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocalização não suportada",
        description: "Seu navegador não suporta geolocalização.",
        variant: "destructive"
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        setFormData({
          ...formData,
          latitude,
          longitude
        });

        if (map) {
          map.flyTo({
            center: [longitude, latitude],
            zoom: 15
          });

          if (marker) {
            marker.setLngLat([longitude, latitude]);
          } else {
            const newMarker = new mapboxgl.Marker({ draggable: true })
              .setLngLat([longitude, latitude])
              .addTo(map);

            newMarker.on('dragend', () => {
              const lngLat = newMarker.getLngLat();
              setFormData({
                ...formData,
                latitude: lngLat.lat,
                longitude: lngLat.lng
              });
            });

            setMarker(newMarker);
          }
        }

        toast({
          title: "Localização obtida",
          description: "Localização atual definida com sucesso!"
        });
      },
      (error) => {
        toast({
          title: "Erro de geolocalização",
          description: "Não foi possível obter sua localização.",
          variant: "destructive"
        });
      }
    );
  };

  const handleCoordinateChange = (field: 'latitude' | 'longitude', value: string) => {
    const numValue = value ? parseFloat(value) : null;
    const updatedFormData = {
      ...formData,
      [field]: numValue
    };
    
    setFormData(updatedFormData);

    if (map && updatedFormData.latitude && updatedFormData.longitude) {
      map.flyTo({
        center: [updatedFormData.longitude, updatedFormData.latitude],
        zoom: 15
      });

      if (marker) {
        marker.setLngLat([updatedFormData.longitude, updatedFormData.latitude]);
      } else {
        const newMarker = new mapboxgl.Marker({ draggable: true })
          .setLngLat([updatedFormData.longitude, updatedFormData.latitude])
          .addTo(map);

        newMarker.on('dragend', () => {
          const lngLat = newMarker.getLngLat();
          setFormData({
            ...formData,
            latitude: lngLat.lat,
            longitude: lngLat.lng
          });
        });

        setMarker(newMarker);
      }
    }
  };

  if (loadingToken) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando configurações do mapa...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (needsToken) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Configuração de Mapa Necessária
          </CardTitle>
          <CardDescription>
            {isAdminMaster 
              ? "Configure o token do Mapbox nas configurações administrativas para habilitar mapas interativos."
              : "O administrador precisa configurar o token do Mapbox para habilitar esta funcionalidade."
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isAdminMaster && (
            <Button 
              variant="outline" 
              onClick={() => window.open('/settings?tab=map', '_blank')}
            >
              Ir para Configurações de Mapa
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Localização GPS
          </CardTitle>
          <CardDescription>
            Defina a localização exata do equipamento usando coordenadas GPS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={formData.latitude || ''}
                onChange={(e) => handleCoordinateChange('latitude', e.target.value)}
                placeholder="Ex: -23.5505"
              />
            </div>
            <div>
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={formData.longitude || ''}
                onChange={(e) => handleCoordinateChange('longitude', e.target.value)}
                placeholder="Ex: -46.6333"
              />
            </div>
          </div>

          <Button type="button" onClick={getCurrentLocation} variant="outline" className="w-full">
            <Navigation className="h-4 w-4 mr-2" />
            Usar Localização Atual
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mapa Interativo</CardTitle>
          <CardDescription>
            Clique no mapa para definir a localização ou arraste o marcador
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            ref={mapContainer}
            className="w-full h-64 rounded-lg border"
          />
          <p className="text-sm text-muted-foreground mt-2">
            💡 Dica: Clique em qualquer lugar do mapa para posicionar o equipamento ou arraste o marcador vermelho
          </p>
        </CardContent>
      </Card>
    </div>
  );
};