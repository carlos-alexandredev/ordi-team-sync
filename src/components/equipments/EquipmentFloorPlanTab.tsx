import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SimpleFileUpload } from "./SimpleFileUpload";
import { Upload, Eye, Move, Save, Building2, Download } from "lucide-react";
import { Canvas as FabricCanvas, FabricImage, Circle, Text, Group } from 'fabric';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';

interface Equipment {
  id?: string;
  name?: string;
  serial_number?: string;
  friendly_id?: number;
}

interface FloorPlan {
  id: string;
  name: string;
  image_url: string;
  image_width: number;
  image_height: number;
}

interface EquipmentFloorPlanTabProps {
  equipment?: Equipment | null;
  companyId?: string;
}

export const EquipmentFloorPlanTab: React.FC<EquipmentFloorPlanTabProps> = ({
  equipment,
  companyId
}) => {
  console.log('EquipmentFloorPlanTab rendered with:', { 
    equipment: equipment?.id, 
    companyId, 
    hasCompanyId: !!companyId 
  });
  
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [selectedFloorPlan, setSelectedFloorPlan] = useState<string>('');
  const [uploadMode, setUploadMode] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [equipmentPosition, setEquipmentPosition] = useState<{x: number, y: number} | null>(null);
  const [planName, setPlanName] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    console.log('Loading floor plans for companyId:', companyId);
    loadFloorPlans();
  }, [companyId]);

  // Auto-load equipment's most recent floor plan position when component loads
  useEffect(() => {
    if (equipment?.id && floorPlans.length > 0) {
      loadMostRecentEquipmentPosition();
    }
  }, [equipment?.id, floorPlans]);

  // Initialize canvas whenever selectedFloorPlan changes (not just in edit mode)
  useEffect(() => {
    if (selectedFloorPlan) {
      initializeFabricCanvas();
    }
    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [selectedFloorPlan]);


  const loadFloorPlans = async () => {
    if (!companyId) {
      console.log('No companyId provided, skipping floor plans load');
      return;
    }

    try {
      console.log('Fetching floor plans for company:', companyId);
      
      const { data, error } = await supabase
        .from('floorplans')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      console.log('Floor plans query result:', { data, error });

      if (error) throw error;
      setFloorPlans(data || []);
      console.log('Floor plans loaded:', data?.length || 0, 'items');
    } catch (error) {
      console.error('Erro ao carregar plantas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar plantas baixas",
        variant: "destructive"
      });
    }
  };

  const loadMostRecentEquipmentPosition = async () => {
    if (!equipment?.id) return;

    try {
      const { data, error } = await supabase
        .from('equipment_floorplan_positions')
        .select('floorplan_id, x_position, y_position')
        .eq('equipment_id', equipment.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSelectedFloorPlan(data.floorplan_id);
        setEquipmentPosition({ x: data.x_position, y: data.y_position });
      }
    } catch (error) {
      console.error('Erro ao carregar posição mais recente:', error);
    }
  };

  const loadEquipmentPosition = async () => {
    if (!equipment?.id || !selectedFloorPlan) return { x: 0, y: 0 };

    try {
      const { data, error } = await supabase
        .from('equipment_floorplan_positions')
        .select('x_position, y_position')
        .eq('equipment_id', equipment.id)
        .eq('floorplan_id', selectedFloorPlan)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        const position = { x: data.x_position, y: data.y_position };
        setEquipmentPosition(position);
        return position;
      }
      return null;
    } catch (error) {
      console.error('Erro ao carregar posição:', error);
      return null;
    }
  };

  const initializeFabricCanvas = async () => {
    if (!canvasRef.current || !selectedFloorPlan) return;

    const selectedPlan = floorPlans.find(p => p.id === selectedFloorPlan);
    if (!selectedPlan) return;

    // Initialize canvas
    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
      selection: editMode // Only allow selection in edit mode
    });

    fabricCanvasRef.current = canvas;

    // Load floor plan image
    try {
      // Load image using fetch to avoid CORS issues
      const response = await fetch(selectedPlan.image_url);
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      
      const image = await FabricImage.fromURL(imageUrl);
    
      // Scale image to fit canvas
      const scaleX = 800 / selectedPlan.image_width;
      const scaleY = 600 / selectedPlan.image_height;
      const scale = Math.min(scaleX, scaleY);
      
      image.scale(scale);
      image.set({
        left: 0,
        top: 0,
        selectable: false,
        evented: false
      });
      
      canvas.add(image);

      // Load existing position if any
      const position = await loadEquipmentPosition();
      
      if (position) {
        addEquipmentMarkerWithLabel(position.x * scale, position.y * scale);
      }

      canvas.renderAll();
      
      // Clean up blob URL
      if (imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
    } catch (error) {
      console.error('Erro ao carregar imagem:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar planta baixa",
        variant: "destructive"
      });
    }

    // Handle canvas clicks to place equipment marker (only in edit mode)
    if (editMode) {
      canvas.on('mouse:down', (event) => {
        if (!event.pointer) return;
        
        // Remove existing equipment markers
        const objects = canvas.getObjects();
        objects.forEach(obj => {
          if ((obj as any).equipmentMarker) {
            canvas.remove(obj);
          }
        });

        // Add new marker at click position
        addEquipmentMarkerWithLabel(event.pointer.x, event.pointer.y);
        canvas.renderAll();
      });
    }
  };

  const addEquipmentMarkerWithLabel = (x: number, y: number) => {
    if (!fabricCanvasRef.current) return;

    // Get equipment label
    const label = equipment?.name || equipment?.serial_number || `EQP-${equipment?.friendly_id}` || 'Equipamento';

    // Create equipment marker (red circle)
    const marker = new Circle({
      left: x - 12,
      top: y - 12,
      radius: 12,
      fill: '#ef4444',
      stroke: 'white',
      strokeWidth: 3,
      selectable: editMode,
      hasControls: false,
      evented: editMode
    });

    // Create text label
    const text = new Text(label, {
      left: x - 12,
      top: y + 18,
      fontSize: 12,
      fill: '#1f2937',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
      originX: 'center',
      originY: 'top',
      selectable: editMode,
      hasControls: false,
      evented: editMode,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      padding: 4
    });

    // Group marker and text together
    const group = new Group([marker, text], {
      left: x - 12,
      top: y - 12,
      selectable: editMode,
      hasControls: false,
      evented: editMode
    });
    
    (group as any).equipmentMarker = true;

    fabricCanvasRef.current.add(group);
    
    // Store position for saving
    const selectedPlan = floorPlans.find(p => p.id === selectedFloorPlan);
    if (selectedPlan) {
      const scaleX = 800 / selectedPlan.image_width;
      const scaleY = 600 / selectedPlan.image_height;
      const scale = Math.min(scaleX, scaleY);
      
      setEquipmentPosition({
        x: Math.round(x / scale),
        y: Math.round(y / scale)
      });
    }
  };

  const savePosition = async () => {
    if (!equipment?.id || !selectedFloorPlan || !equipmentPosition) {
      toast({
        title: "Erro",
        description: "Posição do equipamento não definida",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('equipment_floorplan_positions')
        .upsert({
          equipment_id: equipment.id,
          floorplan_id: selectedFloorPlan,
          x_position: equipmentPosition.x,
          y_position: equipmentPosition.y
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Posição salva com sucesso!"
      });
      setEditMode(false);
      // Refresh canvas to update marker in view mode
      initializeFabricCanvas();
    } catch (error) {
      console.error('Erro ao salvar posição:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar posição",
        variant: "destructive"
      });
    }
  };

  const downloadPDF = () => {
    if (!fabricCanvasRef.current) return;

    try {
      // Get canvas as image
      const dataUrl = fabricCanvasRef.current.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2 // Higher resolution
      });

      // Create PDF
      const canvas = fabricCanvasRef.current;
      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();
      
      // Determine orientation based on aspect ratio
      const isLandscape = canvasWidth > canvasHeight;
      const pdf = new jsPDF(isLandscape ? 'landscape' : 'portrait', 'mm', 'a4');
      
      // Calculate dimensions to fit A4
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pdfWidth / canvasWidth, pdfHeight / canvasHeight);
      
      const imgWidth = canvasWidth * ratio * 0.264583; // Convert pixels to mm
      const imgHeight = canvasHeight * ratio * 0.264583;
      const x = (pdfWidth - imgWidth) / 2;
      const y = (pdfHeight - imgHeight) / 2;

      pdf.addImage(dataUrl, 'PNG', x, y, imgWidth, imgHeight);
      
      // Add title
      const selectedPlan = floorPlans.find(p => p.id === selectedFloorPlan);
      const equipmentLabel = equipment?.name || equipment?.serial_number || `EQP-${equipment?.friendly_id}` || 'Equipamento';
      const title = `${selectedPlan?.name || 'Planta'} - ${equipmentLabel}`;
      
      pdf.setFontSize(16);
      pdf.text(title, pdfWidth / 2, 15, { align: 'center' });

      pdf.save(`planta-${equipmentLabel}-${Date.now()}.pdf`);
      
      toast({
        title: "Sucesso",
        description: "PDF gerado com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = async (file: File) => {
    console.log('=== INÍCIO DO UPLOAD ===');
    console.log('Starting file upload with companyId:', companyId);
    console.log('File details:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });
    
    // Para admin_master, usar uma company_id padrão se não houver
    const effectiveCompanyId = companyId || 'admin-uploads';
    
    console.log('Effective companyId for upload:', effectiveCompanyId);

    try {
      console.log('=== STEP 1: Uploading to storage ===');
      
      // Upload file to storage
      const fileName = `${Date.now()}-${file.name}`;
      console.log('Generated filename:', fileName);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('floorplans')
        .upload(fileName, file);

      console.log('=== STORAGE UPLOAD RESULT ===');
      console.log('Upload data:', uploadData);
      console.log('Upload error:', uploadError);

      if (uploadError) {
        console.error('Storage upload failed:', uploadError);
        throw new Error(`Falha no upload: ${uploadError.message}`);
      }

      console.log('=== STEP 2: Getting public URL ===');
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('floorplans')
        .getPublicUrl(fileName);

      console.log('Public URL obtained:', publicUrl);

      if (!publicUrl) {
        throw new Error('Falha ao obter URL pública da imagem');
      }

      console.log('=== STEP 3: Processing image ===');
      
      // Get image dimensions from the original file to avoid CSP issues
      console.log('Processing image dimensions from original file...');
      
      try {
        // Create FileReader to read the file as data URL
        const reader = new FileReader();
        
        const imageLoadPromise = new Promise<{width: number, height: number}>((resolve, reject) => {
          reader.onload = (e) => {
            const img = new Image();
            
            img.onload = () => {
              console.log('Image loaded successfully from file');
              console.log('Image dimensions:', img.width, 'x', img.height);
              resolve({ width: img.width, height: img.height });
            };
            
            img.onerror = (error) => {
              console.error('Image load error from file:', error);
              reject(new Error('Falha ao processar dimensões da imagem.'));
            };
            
            // Set timeout for image loading
            setTimeout(() => {
              reject(new Error('Timeout ao processar imagem'));
            }, 10000);
            
            console.log('Setting image src to file data URL');
            img.src = e.target?.result as string;
          };
          
          reader.onerror = (error) => {
            console.error('FileReader error:', error);
            reject(new Error('Falha ao ler arquivo de imagem.'));
          };
        });
        
        console.log('Reading file as data URL...');
        reader.readAsDataURL(file);
        
        // Wait for image to load
        const { width, height } = await imageLoadPromise;
        
        console.log('=== STEP 4: Saving to database ===');
        
        const floorplanData = {
          name: planName.trim() || file.name.replace(/\.[^/.]+$/, ""),
          image_url: publicUrl,  // Use Storage URL for database
          image_width: width,
          image_height: height,
          company_id: effectiveCompanyId
        };
        
        console.log('Inserting floorplan data:', floorplanData);
        
        const { data, error } = await supabase
          .from('floorplans')
          .insert(floorplanData)
          .select()
          .single();

        console.log('=== DATABASE INSERT RESULT ===');
        console.log('Insert data:', data);
        console.log('Insert error:', error);

        if (error) {
          console.error('Database insert failed:', error);
          throw new Error(`Falha ao salvar no banco: ${error.message}`);
        }

        console.log('=== UPLOAD COMPLETED SUCCESSFULLY ===');
        
        toast({
          title: "Sucesso",
          description: "Planta baixa carregada com sucesso!"
        });

        setUploadMode(false);
        setPlanName('');
        loadFloorPlans();
        
      } catch (processError) {
        console.error('Processing error:', processError);
        throw new Error(`Erro ao processar imagem: ${processError.message}`);
      }
      
    } catch (error) {
      console.error('=== UPLOAD FAILED ===');
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      toast({
        title: "Erro",
        description: error.message || "Erro desconhecido no upload",
        variant: "destructive"
      });
    }
  };

  if (uploadMode) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Upload de Planta Baixa</h3>
          <Button type="button" variant="outline" onClick={() => {
            setUploadMode(false);
            setPlanName('');
          }}>
            Cancelar
          </Button>
        </div>
        
        <div>
          <Label htmlFor="planName">Nome da Planta</Label>
          <Input
            id="planName"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            placeholder="Digite o nome da planta baixa"
            className="mt-1"
          />
        </div>
        
        <SimpleFileUpload
          onFileSelect={handleFileUpload}
          accept="image/*"
          maxSize={10 * 1024 * 1024} // 10MB
        />
        
        <p className="text-sm text-muted-foreground">
          Faça upload de uma imagem da planta baixa (PNG, JPG, etc.)
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setUploadMode(true)}
        >
          <Upload className="h-4 w-4 mr-2" />
          Nova Planta
        </Button>

        {selectedFloorPlan && (
          <>
            <Button
              type="button"
              variant={editMode ? "default" : "outline"}
              size="sm"
              onClick={() => setEditMode(!editMode)}
            >
              <Move className="h-4 w-4 mr-2" />
              {editMode ? 'Sair da Edição' : 'Posicionar'}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadPDF}
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
          </>
        )}

        {editMode && equipmentPosition && (
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={savePosition}
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Posição
          </Button>
        )}
      </div>

      <div>
        <Label htmlFor="floorplan">Selecionar Planta Baixa</Label>
        <Select value={selectedFloorPlan} onValueChange={setSelectedFloorPlan}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma planta baixa" />
          </SelectTrigger>
          <SelectContent>
            {floorPlans.map((plan) => (
              <SelectItem key={plan.id} value={plan.id}>
                {plan.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedFloorPlan && (
        <div className="border rounded-lg p-4">
          <div className="space-y-2">
            {editMode && (
              <p className="text-sm font-medium">Clique na planta para posicionar o equipamento</p>
            )}
            <canvas
              ref={canvasRef}
              className={`border rounded ${editMode ? 'cursor-crosshair' : 'cursor-default'}`}
            />
            {equipmentPosition && (
              <p className="text-sm text-muted-foreground">
                Posição: X={equipmentPosition.x}, Y={equipmentPosition.y}
              </p>
            )}
          </div>
        </div>
      )}

      {!selectedFloorPlan && floorPlans.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-4" />
          <p>Nenhuma planta baixa encontrada</p>
          <p className="text-sm">Faça upload de uma planta para começar</p>
        </div>
      )}
    </div>
  );
};