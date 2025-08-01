import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, File, Image, Video, X, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  orderId?: string;
  callId?: string;
  onUploadComplete?: () => void;
  maxFiles?: number;
  acceptedTypes?: string[];
}

interface UploadedFile {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  orderId,
  callId,
  onUploadComplete,
  maxFiles = 5,
  acceptedTypes = ['image/*', 'video/*', 'application/pdf']
}) => {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const loadFiles = async () => {
    if (!orderId && !callId) return;

    try {
      if (orderId) {
        const { data, error } = await supabase
          .from('order_attachments')
          .select('*')
          .eq('order_id', orderId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setFiles(data || []);
      } else if (callId) {
        const { data, error } = await supabase
          .from('call_attachments')
          .select('*')
          .eq('call_id', callId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setFiles(data || []);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar arquivos",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  React.useEffect(() => {
    loadFiles();
  }, [orderId, callId]);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const uploadFiles = async (selectedFiles: FileList) => {
    if (!orderId && !callId) {
      toast({
        title: "Erro",
        description: "ID da ordem ou chamado é obrigatório",
        variant: "destructive"
      });
      return;
    }

    if (files.length + selectedFiles.length > maxFiles) {
      toast({
        title: "Limite excedido",
        description: `Máximo de ${maxFiles} arquivos permitidos`,
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${orderId || callId}/${fileName}`;

        // Upload para o Storage
        const { error: uploadError } = await supabase.storage
          .from('order-attachments')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Obter URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('order-attachments')
          .getPublicUrl(filePath);

        // Salvar no banco
        if (orderId) {
          const { error: dbError } = await supabase
            .from('order_attachments')
            .insert([{
              order_id: orderId,
              file_name: file.name,
              file_url: publicUrl,
              file_type: file.type,
              file_size: file.size,
              uploaded_by: user.id
            }]);
          
          if (dbError) throw dbError;
        } else if (callId) {
          const { error: dbError } = await supabase
            .from('call_attachments')
            .insert([{
              call_id: callId,
              file_name: file.name,
              file_url: publicUrl,
              file_type: file.type,
              file_size: file.size,
              uploaded_by: user.id
            }]);
          
          if (dbError) throw dbError;
        }
      }

      toast({
        title: "Sucesso",
        description: `${selectedFiles.length} arquivo(s) enviado(s) com sucesso!`
      });

      loadFiles();
      onUploadComplete?.();
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (file: UploadedFile) => {
    try {
      // Remover do Storage
      const pathParts = file.file_url.split('/');
      const filePath = pathParts.slice(-2).join('/');
      
      await supabase.storage
        .from('order-attachments')
        .remove([filePath]);

      // Remover do banco
      const table = orderId ? 'order_attachments' : 'call_attachments';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', file.id);

      if (error) throw error;

      toast({
        title: "Arquivo removido",
        description: "Arquivo removido com sucesso!"
      });

      loadFiles();
    } catch (error: any) {
      toast({
        title: "Erro ao remover",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (fileType.startsWith('video/')) return <Video className="h-4 w-4" />;
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
    <div className="space-y-4">
      <Card className="p-4">
        <div className="text-center">
          <Button
            onClick={handleFileSelect}
            disabled={uploading || files.length >= maxFiles}
            className="mb-4"
          >
            <Upload className="mr-2 h-4 w-4" />
            {uploading ? 'Enviando...' : 'Selecionar Arquivos'}
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={(e) => e.target.files && uploadFiles(e.target.files)}
            className="hidden"
          />
          
          <p className="text-sm text-muted-foreground">
            Máximo {maxFiles} arquivos. Formatos aceitos: imagens, vídeos, PDF
          </p>
        </div>
      </Card>

      {files.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Arquivos Anexados</h3>
          <div className="space-y-2">
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center space-x-2 flex-1">
                  {getFileIcon(file.file_type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.file_size)} • {new Date(file.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(file.file_url, '_blank')}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteFile(file)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};