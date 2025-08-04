import { UseFormReturn } from "react-hook-form";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText, Image, File } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AttachmentsTabProps {
  form: UseFormReturn<any>;
}

interface Attachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

export function AttachmentsTab({ form }: AttachmentsTabProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const attachments: Attachment[] = form.watch("attachments") || [];

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const newAttachments: Attachment[] = [];

      for (const file of Array.from(files)) {
        // Validar tamanho do arquivo (máximo 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "Arquivo muito grande",
            description: `${file.name} excede o limite de 10MB.`,
            variant: "destructive"
          });
          continue;
        }

        // Gerar nome único para o arquivo
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        // Upload para o Supabase Storage
        const { data, error } = await supabase.storage
          .from('order-attachments')
          .upload(fileName, file);

        if (error) {
          console.error('Erro no upload:', error);
          toast({
            title: "Erro no upload",
            description: `Falha ao enviar ${file.name}.`,
            variant: "destructive"
          });
          continue;
        }

        // Obter URL pública do arquivo
        const { data: urlData } = supabase.storage
          .from('order-attachments')
          .getPublicUrl(fileName);

        newAttachments.push({
          name: file.name,
          url: urlData.publicUrl,
          type: file.type,
          size: file.size
        });
      }

      // Atualizar o formulário com os novos anexos
      const currentAttachments = form.getValues("attachments") || [];
      form.setValue("attachments", [...currentAttachments, ...newAttachments]);

      if (newAttachments.length > 0) {
        toast({
          title: "Upload concluído",
          description: `${newAttachments.length} arquivo(s) enviado(s) com sucesso.`
        });
      }
    } catch (error) {
      console.error("Erro no upload:", error);
      toast({
        title: "Erro no upload",
        description: "Ocorreu um erro inesperado.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      // Limpar o input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (index: number) => {
    const currentAttachments = form.getValues("attachments") || [];
    const newAttachments = currentAttachments.filter((_: any, i: number) => i !== index);
    form.setValue("attachments", newAttachments);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    if (type === 'application/pdf') {
      return <FileText className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Anexos da Tarefa</h3>
        <div className="text-sm text-muted-foreground">
          {attachments.length} arquivo(s) anexado(s)
        </div>
      </div>

      {/* Área de upload */}
      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
        <Upload className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Arraste arquivos aqui ou clique para selecionar
          </p>
          <p className="text-xs text-muted-foreground">
            Máximo 10MB por arquivo. Formatos aceitos: imagens, PDFs, documentos
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleFileSelect}
          disabled={uploading}
          className="mt-4"
        >
          {uploading ? "Enviando..." : "Selecionar Arquivos"}
        </Button>
      </div>

      {/* Input de arquivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.xls"
      />

      {/* Lista de anexos */}
      {attachments.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Arquivos Anexados:</h4>
          <div className="space-y-2">
            {attachments.map((attachment, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50"
              >
                <div className="text-muted-foreground">
                  {getFileIcon(attachment.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {attachment.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(attachment.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAttachment(index)}
                  className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Informações importantes */}
      <div className="bg-muted/50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Informações Importantes:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Arquivos são armazenados de forma segura no Supabase Storage</li>
          <li>• Tamanho máximo por arquivo: 10MB</li>
          <li>• Os anexos ficam disponíveis para o técnico durante a execução</li>
          <li>• Formatos recomendados: JPG, PNG, PDF, DOC, XLS</li>
        </ul>
      </div>
    </div>
  );
}