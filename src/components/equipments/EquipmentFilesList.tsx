import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useActivityLogger } from "@/hooks/useActivityLogger";
import { FileImage, FileText, Download, Trash2, RefreshCw } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface EquipmentFilesListProps {
  equipmentId?: string;
  companyId?: string;
  refreshTrigger?: number;
}

interface StorageFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, any>;
}

export const EquipmentFilesList: React.FC<EquipmentFilesListProps> = ({
  equipmentId,
  companyId,
  refreshTrigger
}) => {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(false);
  const { logActivity, logError } = useActivityLogger();

  const loadFiles = async () => {
    if (!equipmentId || !companyId) {
      console.log('Equipment ID or Company ID missing, skipping file load');
      return;
    }

    try {
      setLoading(true);
      console.log('Loading files for equipment:', equipmentId);

      // List files in the equipment folder
      const folderPath = `companies/${companyId}/equipment/${equipmentId}`;
      const { data, error } = await supabase.storage
        .from('floorplans')
        .list(folderPath, {
          limit: 100,
          offset: 0,
        });

      if (error) {
        console.error('Error loading files:', error);
        if (error.message.includes('not found')) {
          // Folder doesn't exist yet, which is normal
          setFiles([]);
          return;
        }
        throw error;
      }

      console.log('Files loaded:', data);
      setFiles(data || []);

      await logActivity({
        action: 'equipment_files_loaded',
        table_name: 'equipments',
        record_id: equipmentId,
        details: {
          filesCount: data?.length || 0,
          folderPath
        }
      });

    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('Erro ao carregar arquivos');
      await logError('equipment_files_load', error, {
        equipmentId,
        companyId
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [equipmentId, companyId, refreshTrigger]);

  const downloadFile = async (file: StorageFile) => {
    try {
      const filePath = `companies/${companyId}/equipment/${equipmentId}/${file.name}`;
      const { data: { publicUrl } } = supabase.storage
        .from('floorplans')
        .getPublicUrl(filePath);

      // Create a temporary link and click it to download
      const link = document.createElement('a');
      link.href = publicUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      await logActivity({
        action: 'equipment_file_downloaded',
        table_name: 'equipments',
        record_id: equipmentId,
        details: {
          fileName: file.name,
          fileSize: file.metadata?.size
        }
      });

      toast.success('Download iniciado');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Erro ao baixar arquivo');
      await logError('equipment_file_download', error, {
        fileName: file.name,
        equipmentId
      });
    }
  };

  const deleteFile = async (file: StorageFile) => {
    try {
      const filePath = `companies/${companyId}/equipment/${equipmentId}/${file.name}`;
      const { error } = await supabase.storage
        .from('floorplans')
        .remove([filePath]);

      if (error) {
        throw error;
      }

      setFiles(prev => prev.filter(f => f.name !== file.name));
      
      await logActivity({
        action: 'equipment_file_deleted',
        table_name: 'equipments',
        record_id: equipmentId,
        details: {
          fileName: file.name,
          fileSize: file.metadata?.size
        }
      });

      toast.success('Arquivo excluído com sucesso');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Erro ao excluir arquivo');
      await logError('equipment_file_delete', error, {
        fileName: file.name,
        equipmentId
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimetype: string) => {
    if (mimetype?.startsWith('image/')) {
      return <FileImage className="h-8 w-8 text-blue-500" />;
    }
    return <FileText className="h-8 w-8 text-red-500" />;
  };

  const getPublicUrl = (fileName: string): string => {
    const filePath = `companies/${companyId}/equipment/${equipmentId}/${fileName}`;
    const { data: { publicUrl } } = supabase.storage
      .from('floorplans')
      .getPublicUrl(filePath);
    return publicUrl;
  };

  if (!equipmentId || !companyId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="h-5 w-5" />
            Arquivos do Equipamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Salve o equipamento primeiro para visualizar e gerenciar arquivos.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileImage className="h-5 w-5" />
            Arquivos do Equipamento ({files.length})
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={loadFiles}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Carregando arquivos...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-8">
            <FileImage className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhum arquivo encontrado para este equipamento.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <div key={file.name} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="flex-shrink-0">
                  {getFileIcon(file.metadata?.mimetype)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Tamanho: {formatFileSize(file.metadata?.size || 0)}</p>
                    <p>Modificado: {new Date(file.updated_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadFile(file)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir arquivo</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o arquivo "{file.name}"? 
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteFile(file)}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                
                {file.metadata?.mimetype?.startsWith('image/') && (
                  <div className="w-full mt-3">
                    <img 
                      src={getPublicUrl(file.name)} 
                      alt={file.name}
                      className="max-w-full h-auto rounded border max-h-32 object-cover"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};