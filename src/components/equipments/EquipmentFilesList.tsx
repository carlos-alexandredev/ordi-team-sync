import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useActivityLogger } from "@/hooks/useActivityLogger";
import { FileImage, FileText, Download, Trash2, RefreshCw, Search, Filter, Grid, List, Check, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

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
  const [filteredFiles, setFilteredFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);
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

  // Search and filter effect
  useEffect(() => {
    let filtered = files;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(file => 
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply file type filter
    if (fileTypeFilter !== 'all') {
      filtered = filtered.filter(file => {
        const isImage = file.metadata?.mimetype?.startsWith('image/');
        const isPdf = file.metadata?.mimetype === 'application/pdf';
        
        switch (fileTypeFilter) {
          case 'images':
            return isImage;
          case 'pdfs':
            return isPdf;
          default:
            return true;
        }
      });
    }

    setFilteredFiles(filtered);
  }, [files, searchQuery, fileTypeFilter]);

  const toggleFileSelection = (fileName: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(fileName)) {
      newSelection.delete(fileName);
    } else {
      newSelection.add(fileName);
    }
    setSelectedFiles(newSelection);
  };

  const toggleAllSelection = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map(f => f.name)));
    }
  };

  const deleteBatchFiles = async () => {
    if (selectedFiles.size === 0) return;

    try {
      const filePaths = Array.from(selectedFiles).map(fileName => 
        `companies/${companyId}/equipment/${equipmentId}/${fileName}`
      );

      const { error } = await supabase.storage
        .from('floorplans')
        .remove(filePaths);

      if (error) throw error;

      setFiles(prev => prev.filter(f => !selectedFiles.has(f.name)));
      setSelectedFiles(new Set());
      setBatchDeleteOpen(false);

      await logActivity({
        action: 'equipment_files_batch_deleted',
        table_name: 'equipments',
        record_id: equipmentId,
        details: {
          filesCount: selectedFiles.size,
          fileNames: Array.from(selectedFiles)
        }
      });

      toast.success(`${selectedFiles.size} arquivos excluídos com sucesso`);
    } catch (error) {
      console.error('Error deleting batch files:', error);
      toast.error('Erro ao excluir arquivos em lote');
      await logError('equipment_files_batch_delete', error, {
        equipmentId,
        filesCount: selectedFiles.size
      });
    }
  };

  const downloadBatchFiles = async () => {
    if (selectedFiles.size === 0) return;

    for (const fileName of selectedFiles) {
      const file = files.find(f => f.name === fileName);
      if (file) {
        await downloadFile(file);
      }
    }

    toast.success(`Download de ${selectedFiles.size} arquivos iniciado`);
  };

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

  useEffect(() => {
    loadFiles();
  }, [equipmentId, companyId, refreshTrigger]);

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
        
        {/* Search and filters */}
        {files.length > 0 && (
          <div className="space-y-4 pt-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar arquivos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="images">Imagens</SelectItem>
                  <SelectItem value="pdfs">PDFs</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-r-none"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-l-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Batch operations */}
            {filteredFiles.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedFiles.size === filteredFiles.length}
                    onCheckedChange={toggleAllSelection}
                  />
                  <span className="text-sm font-medium">
                    {selectedFiles.size === 0 
                      ? `${filteredFiles.length} arquivos` 
                      : `${selectedFiles.size} selecionados`
                    }
                  </span>
                  {selectedFiles.size > 0 && (
                    <Badge variant="secondary">{selectedFiles.size}</Badge>
                  )}
                </div>
                
                {selectedFiles.size > 0 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadBatchFiles}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    
                    <AlertDialog open={batchDeleteOpen} onOpenChange={setBatchDeleteOpen}>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir arquivos selecionados</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir {selectedFiles.size} arquivos selecionados? 
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={deleteBatchFiles}>
                            Excluir {selectedFiles.size} arquivos
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFiles(new Set())}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
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
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-8">
            <Search className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhum arquivo encontrado com os filtros aplicados.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                setSearchQuery('');
                setFileTypeFilter('all');
              }}
            >
              Limpar filtros
            </Button>
          </div>
        ) : (
          <div className={cn(
            "space-y-3",
            viewMode === 'grid' && "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 space-y-0"
          )}>
            {filteredFiles.map((file) => (
              <div 
                key={file.name} 
                className={cn(
                  "border rounded-lg transition-colors",
                  selectedFiles.has(file.name) && "bg-primary/5 border-primary",
                  viewMode === 'list' ? "flex items-start gap-3 p-3" : "overflow-hidden"
                )}
              >
                {viewMode === 'list' ? (
                  <>
                    <Checkbox
                      checked={selectedFiles.has(file.name)}
                      onCheckedChange={() => toggleFileSelection(file.name)}
                      className="mt-1"
                    />
                    
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
                  </>
                ) : (
                  <>
                    {file.metadata?.mimetype?.startsWith('image/') && (
                      <div className="aspect-video relative overflow-hidden">
                        <img 
                          src={getPublicUrl(file.name)} 
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                        <Checkbox
                          checked={selectedFiles.has(file.name)}
                          onCheckedChange={() => toggleFileSelection(file.name)}
                          className="absolute top-2 left-2 bg-white"
                        />
                      </div>
                    )}
                    
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        {!file.metadata?.mimetype?.startsWith('image/') && (
                          <Checkbox
                            checked={selectedFiles.has(file.name)}
                            onCheckedChange={() => toggleFileSelection(file.name)}
                          />
                        )}
                        
                        <div className="flex-shrink-0">
                          {getFileIcon(file.metadata?.mimetype)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{file.name}</p>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>{formatFileSize(file.metadata?.size || 0)}</p>
                            <p>{new Date(file.updated_at).toLocaleDateString('pt-BR')}</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadFile(file)}
                            className="h-8 w-8 p-0"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                <Trash2 className="h-3 w-3" />
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
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};