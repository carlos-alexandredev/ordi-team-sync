import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface SimpleFileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
}

export const SimpleFileUpload: React.FC<SimpleFileUploadProps> = ({
  onFileSelect,
  accept = "image/*",
  maxSize = 10 * 1024 * 1024 // 10MB default
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > maxSize) {
      alert(`Arquivo muito grande. Tamanho máximo: ${Math.round(maxSize / 1024 / 1024)}MB`);
      return;
    }

    onFileSelect(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
      <p className="text-lg font-medium mb-2">Fazer upload da planta baixa</p>
      <p className="text-sm text-muted-foreground mb-4">
        Selecione uma imagem (PNG, JPG, etc.) - Máximo {Math.round(maxSize / 1024 / 1024)}MB
      </p>
      
      <Button type="button" onClick={handleClick}>
        Selecionar Arquivo
      </Button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};