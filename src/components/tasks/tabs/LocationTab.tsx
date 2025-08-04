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
      {/* Mapa Interativo */}
      <div className="bg-muted/50 p-4 rounded-lg">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Mapa Interativo
        </h3>
        <div className="h-64 bg-background rounded border flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <MapPin className="h-12 w-12 mx-auto mb-2 text-muted-foreground/50" />
            <p>Mapa será implementado aqui (Leaflet)</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cliente */}
        <FormField
          control={form.control}
          name="clientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                  <span className="text-white text-xs">C</span>
                </div>
                Cliente
              </FormLabel>
              <div className="flex gap-2">
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Busca de clientes cadastrados" />
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
                <Button type="button" variant="outline" size="sm">
                  Cadastrar cliente
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Endereço */}
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

        {/* Latitude */}
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

        {/* Longitude */}
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

      {/* URL Google Maps */}
      <FormField
        control={form.control}
        name="googleMapsUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                <span className="text-white text-xs">G</span>
              </div>
              URL Google Maps
            </FormLabel>
            <div className="flex gap-2">
              <FormControl>
                <Input 
                  placeholder="URL do Google Maps" 
                  {...field} 
                />
              </FormControl>
              <Button 
                type="button" 
                variant="outline"
                onClick={extractFromGoogleMaps}
                className="flex items-center gap-2 text-blue-600"
              >
                Extrair
              </Button>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Here */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
            <span className="text-white text-xs">H</span>
          </div>
          <span className="font-medium">Here</span>
        </div>
        <Input placeholder="Busca de endereços via here maps" />
      </div>

      {/* Foursquare */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
            <span className="text-white text-xs">F</span>
          </div>
          <span className="font-medium">Foursquare</span>
        </div>
        <Input placeholder="Cidade" />
        <Input placeholder="Busca por local" />
      </div>
    </div>
  );
}