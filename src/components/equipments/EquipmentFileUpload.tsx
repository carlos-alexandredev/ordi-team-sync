import React, { useState, useCallback, useRef, DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useActivityLogger } from "@/hooks/useActivityLogger";
import { Upload, FileImage, FileText, X, CloudUpload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EquipmentFileUploadProps {
  equipmentId?: string;
  companyId?: string;
  onFileUploaded?: (fileUrl: string, fileName: string, fileType: string) => void;
}

interface UploadedFile {
  name: string;
  url: string;
  type: string;
  size: number;
  dimensions?: { width: number; height: number };
}

export const EquipmentFileUpload: React.FC<EquipmentFileUploadProps> = ({
  equipmentId,
  companyId,
  onFileUploaded
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const { logActivity, logError } = useActivityLogger();
  const inputRef = useRef<HTMLInputElement>(null);

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        resolve({ width: 0, height: 0 });
        return;
      }

      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => resolve({ width: 0, height: 0 });
      img.src = URL.createObjectURL(file);
    });
  };

  const generateFilePath = (file: File): string => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    if (equipmentId && companyId) {
      return `companies/${companyId}/equipment/${equipmentId}/${timestamp}_${randomId}_${sanitizedName}`;
    }
    return `temp/${timestamp}_${randomId}_${sanitizedName}`;
  };

  const validateFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return 'Tipo de arquivo não suportado. Use imagens (JPEG, PNG, GIF, WebP) ou PDF.';
    }

    if (file.size > maxSize) {
      return 'Arquivo muito grande. Tamanho máximo: 10MB.';
    }

    return null;
  };

  const handleDrag = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (uploading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    // Handle multiple files
    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        toast.error(`${file.name}: ${validationError}`);
        continue;
      }

      await processFileUpload(file);
    }
  }, [uploading]);

  const processFileUpload = async (file: File) => {
    try {
      setUploading(true);
      setUploadProgress(0);

      console.log('Iniciando upload:', file.name, file.type, `${(file.size / 1024 / 1024).toFixed(2)}MB`);

      // Get image dimensions if it's an image
      const dimensions = await getImageDimensions(file);
      
      // Generate organized file path
      const filePath = generateFilePath(file);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const { data, error } = await supabase.storage
        .from('floorplans')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) {
        console.error('Erro no upload:', error);
        toast.error(`Erro no upload de ${file.name}: ${error.message}`);
        await logError('file_upload', error, {
          fileName: file.name,
          fileSize: file.size,
          equipmentId,
          companyId
        });
        return;
      }

      console.log('Upload concluído:', data);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('floorplans')
        .getPublicUrl(data.path);

      const uploadedFile: UploadedFile = {
        name: file.name,
        url: publicUrl,
        type: file.type,
        size: file.size,
        dimensions: dimensions.width > 0 ? dimensions : undefined
      };

      setUploadedFiles(prev => [...prev, uploadedFile]);
      
      // Log successful upload
      await logActivity({
        action: 'file_upload_success',
        table_name: 'equipments',
        record_id: equipmentId,
        details: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          filePath: data.path,
          dimensions
        }
      });

      toast.success(`${file.type.startsWith('image/') ? 'Imagem' : 'Arquivo'} ${file.name} enviado com sucesso!`);
      
      if (onFileUploaded) {
        onFileUploaded(publicUrl, file.name, file.type);
      }

    } catch (error) {
      console.error('Erro geral:', error);
      toast.error(`Erro inesperado no upload de ${file.name}`);
      await logError('file_upload_general', error, {
        equipmentId,
        companyId,
        fileName: file.name
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Handle multiple files
    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        toast.error(`${file.name}: ${validationError}`);
        continue;
      }

      await processFileUpload(file);
    }

    // Reset input
    if (event.target) {
      event.target.value = '';
    }
  }, [equipmentId, companyId, onFileUploaded, logActivity, logError]);

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div 
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center space-y-4 transition-colors cursor-pointer",
          dragActive 
            ? "border-primary bg-primary/5 border-solid" 
            : "border-muted-foreground/25 hover:border-muted-foreground/40",
          uploading && "pointer-events-none opacity-60"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <div className="flex flex-col items-center">
          {dragActive ? (
            <CloudUpload className="h-16 w-16 text-primary animate-bounce" />
          ) : (
            <Upload className="h-12 w-12 text-muted-foreground" />
          )}
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium">
              {dragActive ? "Solte os arquivos aqui" : "Upload de Arquivos"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {dragActive 
                ? "Solte para fazer upload" 
                : "Arraste arquivos aqui ou clique para selecionar"
              }
            </p>
            <p className="text-xs text-muted-foreground">
              Imagens (JPEG, PNG, GIF, WebP) ou PDFs - Máximo 10MB cada
            </p>
          </div>
        </div>
        
        <Input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
          onChange={handleFileUpload}
          disabled={uploading}
          className="hidden"
          multiple
        />
        
        {uploading && (
          <div className="space-y-2 pt-4">
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-sm text-muted-foreground">
              Enviando... {uploadProgress}%
            </p>
          </div>
        )}
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Arquivos Enviados ({uploadedFiles.length})</h4>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setUploadedFiles([])}
            >
              Limpar lista
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {uploadedFiles.map((file, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-0">
                  {file.type.startsWith('image/') && (
                    <div className="aspect-video relative overflow-hidden">
                      <img 
                        src={file.url} 
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {file.type.startsWith('image/') ? (
                          <FileImage className="h-6 w-6 text-blue-500" />
                        ) : (
                          <FileText className="h-6 w-6 text-red-500" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{file.name}</p>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>{formatFileSize(file.size)}</p>
                          {file.dimensions && (
                            <p>{file.dimensions.width} × {file.dimensions.height}px</p>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="flex-shrink-0 h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};