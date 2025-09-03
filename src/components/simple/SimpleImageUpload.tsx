import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const SimpleImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      const file = event.target.files?.[0];
      if (!file) return;

      // Verificar se é imagem
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor selecione uma imagem');
        return;
      }

      console.log('Iniciando upload:', file.name, file.type);

      // Upload direto para o bucket
      const fileName = `${Date.now()}_${file.name}`;
      
      const { data, error } = await supabase.storage
        .from('floorplans')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Erro no upload:', error);
        toast.error(`Erro no upload: ${error.message}`);
        return;
      }

      console.log('Upload concluído:', data);

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('floorplans')
        .getPublicUrl(fileName);

      setImageUrl(publicUrl);
      toast.success('Imagem enviada com sucesso!');

    } catch (error) {
      console.error('Erro geral:', error);
      toast.error('Erro inesperado no upload');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-xl font-semibold">Upload Simples de Imagem</h2>
      
      <div className="space-y-2">
        <Input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          disabled={uploading}
        />
        
        <Button disabled={uploading} className="w-full">
          {uploading ? 'Enviando...' : 'Selecionar Imagem'}
        </Button>
      </div>

      {imageUrl && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Imagem enviada:</p>
          <img 
            src={imageUrl} 
            alt="Uploaded" 
            className="max-w-full h-auto rounded border"
            style={{ maxHeight: '300px' }}
          />
          <p className="text-xs break-all">{imageUrl}</p>
        </div>
      )}
    </div>
  );
};