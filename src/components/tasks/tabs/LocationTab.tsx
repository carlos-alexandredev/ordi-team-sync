import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, ExternalLink } from "lucide-react";

interface LocationTabProps {
  form: UseFormReturn<any>;
}

export function LocationTab({ form }: LocationTabProps) {
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  
  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, name")
      .eq("role", "cliente")
      .eq("active", true);
    
    if (data) setClients(data);
  };

  const extractFromGoogleMaps = () => {
    const url = form.getValues("googleMapsUrl");
    if (!url) return;

    // Extrair coordenadas da URL do Google Maps
    // Exemplo: https://maps.google.com/?q=-23.5505,-46.6333
    const coordsMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (coordsMatch) {
      const lat = parseFloat(coordsMatch[1]);
      const lng = parseFloat(coordsMatch[2]);
      form.setValue("latitude", lat);
      form.setValue("longitude", lng);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue("latitude", position.coords.latitude);
          form.setValue("longitude", position.coords.longitude);
        },
        (error) => {
          console.error("Erro ao obter localização:", error);
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-muted/50 p-4 rounded-lg">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Mapa Interativo
        </h3>
        <div className="h-64 bg-background rounded border flex items-center justify-center text-muted-foreground">
          Mapa será implementado aqui (Leaflet)
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endereço</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Rua, número, bairro, cidade..." 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="clientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Buscar cliente..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="latitude"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Latitude</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="any"
                  placeholder="-23.5505" 
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="longitude"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Longitude</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="any"
                  placeholder="-46.6333" 
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="flex gap-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={getCurrentLocation}
          className="flex items-center gap-2"
        >
          <MapPin className="h-4 w-4" />
          Usar Localização Atual
        </Button>
      </div>

      <div className="space-y-4">
        <FormField
          control={form.control}
          name="googleMapsUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL Google Maps</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input 
                    placeholder="https://maps.google.com/..." 
                    {...field} 
                  />
                </FormControl>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={extractFromGoogleMaps}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  Extrair
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Busca via Here e Foursquare</h4>
        <Input placeholder="Digite para buscar lugares..." />
        <p className="text-sm text-muted-foreground mt-2">
          Funcionalidade será implementada futuramente
        </p>
      </div>
    </div>
  );
}