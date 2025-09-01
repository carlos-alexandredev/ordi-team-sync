import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Settings, Brain, Database, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useActivityLogger } from "@/hooks/useActivityLogger";

interface AIConfig {
  provider: 'openai' | 'custom';
  model: string;
  custom_model?: string;
  assistant_id?: string;
  topK: number;
  similarity_threshold: number;
  kb_only: boolean;
  enable_fallback: boolean;
}

export function AISettings() {
  const [config, setConfig] = useState<AIConfig>({
    provider: 'openai',
    model: 'gpt-4o-mini',
    topK: 3,
    similarity_threshold: 0.7,
    kb_only: false,
    enable_fallback: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // First get the module ID
      const { data: moduleData, error: moduleError } = await supabase
        .from('system_modules')
        .select('id')
        .eq('name', 'faq')
        .single();

      // If no module found, use default settings
      if (moduleError || !moduleData) {
        console.log('FAQ module not found, using default settings');
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('module_settings')
        .select('*')
        .eq('module_id', moduleData.id)
        .in('key', ['ai_provider', 'ai_model', 'custom_model', 'assistant_id', 'topK', 'similarity_threshold', 'kb_only', 'enable_fallback']);

      if (error && error.code !== 'PGRST116') throw error;

      if (data && data.length > 0) {
        const settings = data.reduce((acc, setting) => {
          const value = setting.value_text || setting.value_number || setting.value_boolean;
          acc[setting.key] = value;
          return acc;
        }, {} as any);

        setConfig({
          provider: settings.ai_provider || 'openai',
          model: settings.ai_model || 'gpt-4o-mini',
          custom_model: settings.custom_model,
          assistant_id: settings.assistant_id,
          topK: settings.topK || 3,
          similarity_threshold: settings.similarity_threshold || 0.7,
          kb_only: settings.kb_only || false,
          enable_fallback: settings.enable_fallback !== false,
        });
      }
    } catch (error: any) {
      console.error('Error loading AI settings:', error);
      toast({
        title: "Erro ao carregar configurações",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Get or create module
      let moduleId;
      const { data: moduleData } = await supabase
        .from('system_modules')
        .select('id')
        .eq('name', 'faq')
        .single();

      if (moduleData) {
        moduleId = moduleData.id;
      } else {
        const { data: newModule, error: moduleError } = await supabase
          .from('system_modules')
          .insert({ 
            name: 'faq', 
            title: 'FAQ System', 
            url: '/faq',
            icon: 'help-circle',
            is_active: true 
          })
          .select('id')
          .single();
        
        if (moduleError) throw moduleError;
        moduleId = newModule.id;
      }

      // Prepare settings to save
      const settings = [
        { key: 'ai_provider', type: 'text', value_text: config.provider },
        { key: 'ai_model', type: 'text', value_text: config.model },
        { key: 'topK', type: 'number', value_number: config.topK },
        { key: 'similarity_threshold', type: 'number', value_number: config.similarity_threshold },
        { key: 'kb_only', type: 'boolean', value_boolean: config.kb_only },
        { key: 'enable_fallback', type: 'boolean', value_boolean: config.enable_fallback },
      ];

      if (config.custom_model) {
        settings.push({ key: 'custom_model', type: 'text', value_text: config.custom_model });
      }

      if (config.assistant_id) {
        settings.push({ key: 'assistant_id', type: 'text', value_text: config.assistant_id });
      }

      // Delete existing settings and insert new ones
      await supabase
        .from('module_settings')
        .delete()
        .eq('module_id', moduleId)
        .in('key', settings.map(s => s.key));

      const { error: insertError } = await supabase
        .from('module_settings')
        .insert(
          settings.map(setting => ({
            module_id: moduleId,
            ...setting,
          }))
        );

      if (insertError) throw insertError;

      await logActivity({
        action: "update_ai_settings",
        table_name: "module_settings",
        details: config
      });

      toast({
        title: "Configurações salvas",
        description: "As configurações da IA foram atualizadas com sucesso",
      });
    } catch (error: any) {
      console.error('Error saving AI settings:', error);
      toast({
        title: "Erro ao salvar configurações",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Carregando configurações...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configurações da IA
        </CardTitle>
        <CardDescription>
          Configure como a IA responde às perguntas dos usuários
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="provider">Provedor de IA</Label>
              <Select value={config.provider} onValueChange={(value: 'openai' | 'custom') => setConfig({ ...config, provider: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI (Padrão)</SelectItem>
                  <SelectItem value="custom">Modelo Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {config.provider === 'openai' && (
              <div>
                <Label htmlFor="model">Modelo OpenAI</Label>
                <Select value={config.model} onValueChange={(value) => setConfig({ ...config, model: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini (Recomendado)</SelectItem>
                    <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {config.provider === 'custom' && (
              <>
                <div>
                  <Label htmlFor="custom_model">Modelo Personalizado (Fine-tuned)</Label>
                  <Input
                    id="custom_model"
                    value={config.custom_model || ''}
                    onChange={(e) => setConfig({ ...config, custom_model: e.target.value })}
                    placeholder="ft:gpt-3.5-turbo:company:model:id"
                  />
                </div>
                <div>
                  <Label htmlFor="assistant_id">ID do Assistant (opcional)</Label>
                  <Input
                    id="assistant_id"
                    value={config.assistant_id || ''}
                    onChange={(e) => setConfig({ ...config, assistant_id: e.target.value })}
                    placeholder="asst_..."
                  />
                </div>
              </>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <Label>Número de FAQs para contexto: {config.topK}</Label>
              <Slider
                value={[config.topK]}
                onValueChange={([value]) => setConfig({ ...config, topK: value })}
                min={1}
                max={10}
                step={1}
                className="mt-2"
              />
            </div>

            <div>
              <Label>Limite de similaridade: {(config.similarity_threshold * 100).toFixed(0)}%</Label>
              <Slider
                value={[config.similarity_threshold]}
                onValueChange={([value]) => setConfig({ ...config, similarity_threshold: value })}
                min={0.1}
                max={1.0}
                step={0.1}
                className="mt-2"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Usar apenas base de conhecimento
              </Label>
              <p className="text-sm text-muted-foreground">
                Quando ativado, não usa IA como fallback
              </p>
            </div>
            <Switch
              checked={config.kb_only}
              onCheckedChange={(checked) => setConfig({ ...config, kb_only: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Permitir IA como fallback
              </Label>
              <p className="text-sm text-muted-foreground">
                Usa IA quando não encontra respostas na base de conhecimento
              </p>
            </div>
            <Switch
              checked={config.enable_fallback && !config.kb_only}
              onCheckedChange={(checked) => setConfig({ ...config, enable_fallback: checked })}
              disabled={config.kb_only}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={saveSettings} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar Configurações
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}