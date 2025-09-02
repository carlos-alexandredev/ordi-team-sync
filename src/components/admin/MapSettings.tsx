import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Save, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function MapSettings() {
  const [mapboxToken, setMapboxToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadMapboxToken();
  }, []);

  const loadMapboxToken = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'mapbox_public_token')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setMapboxToken(data.value || "");
      }
    } catch (error: any) {
      console.error('Erro ao carregar token do Mapbox:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações do mapa.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveMapboxToken = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: 'mapbox_public_token',
          value: mapboxToken,
          description: 'Token público do Mapbox para mapas interativos'
        }, {
          onConflict: 'key'
        });

      if (error) throw error;

      // Update localStorage and dispatch event for real-time update
      localStorage.setItem('mapbox_token', mapboxToken);
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('mapbox_token_updated', {
        detail: { token: mapboxToken }
      }));

      toast({
        title: "Sucesso",
        description: "Token do Mapbox salvo com sucesso!"
      });
    } catch (error: any) {
      console.error('Erro ao salvar token do Mapbox:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar token do Mapbox.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Configurações do Mapa
        </CardTitle>
        <CardDescription>
          Configure o token público do Mapbox para habilitar mapas interativos nos equipamentos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="mapbox-token">Token Público do Mapbox</Label>
          <Input
            id="mapbox-token"
            type="password"
            value={mapboxToken}
            onChange={(e) => setMapboxToken(e.target.value)}
            placeholder="pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV..."
            disabled={loading}
          />
          <p className="text-sm text-muted-foreground">
            Este token será usado para exibir mapas interativos na seção de equipamentos.
            O token deve começar com "pk." e é seguro para uso público.
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" asChild>
            <a 
              href="https://account.mapbox.com/access-tokens/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Obter Token no Mapbox
            </a>
          </Button>

          <Button onClick={saveMapboxToken} disabled={saving || loading}>
            {saving ? (
              <>
                <Save className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Token
              </>
            )}
          </Button>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Como obter seu token do Mapbox:</h4>
          <ol className="text-sm text-muted-foreground space-y-1">
            <li>1. Acesse <strong>mapbox.com</strong> e crie uma conta gratuita</li>
            <li>2. Vá para <strong>Account → Access tokens</strong></li>
            <li>3. Copie seu <strong>Default public token</strong></li>
            <li>4. Cole o token no campo acima e salve</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}