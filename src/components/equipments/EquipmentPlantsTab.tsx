import { useState, useEffect, useRef } from 'react';
import { Canvas as FabricCanvas, Circle, Text, Group, Point, FabricImage } from 'fabric';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Upload, Download, Trash2, Eye, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface Equipment {
  id?: string;
  name?: string;
  friendly_id?: number;
  company_id?: string;
}

interface FloorPlan {
  id: string;
  name: string;
  image_url: string;
  image_width: number;
  image_height: number;
  file_type: string;
  original_file_url?: string;
  description?: string;
}

interface EquipmentPosition {
  x_position: number;
  y_position: number;
  name: string;
  friendly_id: number;
}

interface EquipmentPlantsTabProps {
  equipment?: Equipment | null;
}

export const EquipmentPlantsTab: React.FC<EquipmentPlantsTabProps> = ({
  equipment
}) => {
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [uploadMode, setUploadMode] = useState(false);
  const [viewerMode, setViewerMode] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<FloorPlan | null>(null);
  const [equipmentsOnPlan, setEquipmentsOnPlan] = useState<EquipmentPosition[]>([]);
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load floor plans
  useEffect(() => {
    if (equipment?.company_id) {
      loadFloorPlans();
    }
  }, [equipment?.company_id]);

  const loadFloorPlans = async () => {
    if (!equipment?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('floorplans')
        .select('*')
        .eq('company_id', equipment.company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFloorPlans(data || []);
    } catch (error) {
      console.error('Error loading floor plans:', error);
      toast.error('Erro ao carregar plantas baixas');
    }
  };

  const loadEquipmentsOnPlan = async (planId: string) => {
    try {
      const { data, error } = await supabase
        .from('equipment_floorplan_positions')
        .select(`
          x_position,
          y_position,
          equipments!inner(
            name,
            friendly_id
          )
        `)
        .eq('floorplan_id', planId);

      if (error) throw error;

      const equipmentPositions = data?.map(item => ({
        x_position: item.x_position,
        y_position: item.y_position,
        name: (item.equipments as any).name,
        friendly_id: (item.equipments as any).friendly_id,
      })) || [];

      setEquipmentsOnPlan(equipmentPositions);
    } catch (error) {
      console.error('Error loading equipments on plan:', error);
    }
  };

  const convertPdfToImage = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    
    const scale = 2;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({ canvasContext: context, viewport, canvas }).promise;
    
    return canvas.toDataURL('image/png');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !equipment?.company_id) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não suportado. Use imagens (JPG, PNG, GIF, WebP) ou PDFs.');
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. O tamanho máximo é 10MB.');
      return;
    }

    setIsLoading(true);
    try {
      let imageUrl: string;
      let fileType: string;
      let imageWidth: number;
      let imageHeight: number;

      if (file.type === 'application/pdf') {
        // Convert PDF to image
        const imageDataUrl = await convertPdfToImage(file);
        const imageBlob = await fetch(imageDataUrl).then(r => r.blob());
        
        const imageFileName = `floorplan-preview-${Date.now()}.png`;
        const { error: imageUploadError } = await supabase.storage
          .from('floorplans')
          .upload(imageFileName, imageBlob);

        if (imageUploadError) throw imageUploadError;

        const { data: { publicUrl: imagePublicUrl } } = supabase.storage
          .from('floorplans')
          .getPublicUrl(imageFileName);

        imageUrl = imagePublicUrl;
        fileType = 'pdf';

        // Get image dimensions
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imageDataUrl;
        });
        imageWidth = img.width;
        imageHeight = img.height;
      } else {
        // Handle image upload
        const fileName = `floorplan-${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('floorplans')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('floorplans')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
        fileType = 'image';

        // Get image dimensions
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = publicUrl;
        });
        imageWidth = img.width;
        imageHeight = img.height;
      }

      // Insert floor plan record
      console.log('Inserting floor plan with company_id:', equipment.company_id);
      const { error: insertError } = await supabase
        .from('floorplans')
        .insert({
          name: file.name.replace(/\.[^/.]+$/, ''),
          description: `Planta baixa carregada em ${new Date().toLocaleDateString('pt-BR')}`,
          image_url: imageUrl,
          image_width: imageWidth,
          image_height: imageHeight,
          company_id: equipment.company_id,
          file_type: fileType,
          original_file_url: file.type === 'application/pdf' ? imageUrl : null
        });

      if (insertError) {
        console.error('Insert error details:', insertError);
        throw insertError;
      }

      await loadFloorPlans();
      setUploadMode(false);
      toast.success('Planta baixa carregada com sucesso!');
    } catch (error) {
      console.error('Error uploading file:', error);
      
      // More detailed error handling
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMsg = (error as any).message;
        if (errorMsg.includes('row-level security policy')) {
          toast.error('Erro de permissão: Você não tem autorização para fazer upload de plantas baixas.');
        } else if (errorMsg.includes('violates not-null')) {
          toast.error('Erro de dados: Alguns campos obrigatórios estão faltando.');
        } else {
          toast.error(`Erro ao fazer upload: ${errorMsg}`);
        }
      } else {
        toast.error('Erro ao fazer upload da planta baixa');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const initializeViewer = async (plan: FloorPlan) => {
    if (!canvasRef.current) return;

    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.dispose();
    }

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 1000,
      height: 700,
      backgroundColor: '#ffffff',
      selection: false
    });

    fabricCanvasRef.current = canvas;

    // Load background image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const scaleX = canvas.width! / img.width;
      const scaleY = canvas.height! / img.height;
      const scale = Math.min(scaleX, scaleY);
      
      // Set background image using proper Fabric.js v6 syntax
      canvas.backgroundImage = new FabricImage(img, {
        scaleX: scale,
        scaleY: scale,
        originX: 'center',
        originY: 'center',
        left: canvas.width! / 2,
        top: canvas.height! / 2
      });
      canvas.renderAll();

      // Add equipment markers
      equipmentsOnPlan.forEach(equipment => {
        addEquipmentMarker(canvas, equipment.x_position, equipment.y_position, equipment);
      });
    };
    img.onerror = (error) => {
      console.error('Error loading floor plan image:', error, plan.image_url);
      toast.error('Erro ao carregar imagem da planta baixa');
    };
    img.src = plan.image_url;

    // Add zoom controls
    canvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 20) zoom = 20;
      if (zoom < 0.01) zoom = 0.01;
      const pointer = new Point(opt.e.offsetX, opt.e.offsetY);
      canvas.zoomToPoint(pointer, zoom);
      setCanvasZoom(zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // Enable panning
    let isDragging = false;
    canvas.on('mouse:down', (opt) => {
      if (opt.e.ctrlKey) {
        isDragging = true;
        canvas.selection = false;
        canvas.defaultCursor = 'move';
      }
    });

    canvas.on('mouse:move', (opt) => {
      if (isDragging && opt.e) {
        const e = opt.e as MouseEvent;
        const vpt = canvas.viewportTransform!;
        vpt[4] += e.movementX;
        vpt[5] += e.movementY;
        canvas.requestRenderAll();
      }
    });

    canvas.on('mouse:up', () => {
      isDragging = false;
      canvas.selection = true;
      canvas.defaultCursor = 'default';
    });
  };

  const addEquipmentMarker = (canvas: FabricCanvas, x: number, y: number, equipment: EquipmentPosition) => {
    const circle = new Circle({
      left: x - 10,
      top: y - 10,
      radius: 10,
      fill: '#ef4444',
      stroke: '#ffffff',
      strokeWidth: 2,
      selectable: false,
    });

    const text = new Text(`${equipment.name} (${equipment.friendly_id})`, {
      left: x + 15,
      top: y - 5,
      fontSize: 12,
      fill: '#1f2937',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      selectable: false,
    });

    const group = new Group([circle, text], {
      left: x - 10,
      top: y - 10,
      selectable: false,
    });

    canvas.add(group);
  };

  const openViewer = async (plan: FloorPlan) => {
    setSelectedPlan(plan);
    await loadEquipmentsOnPlan(plan.id);
    setViewerMode(true);
    
    // Initialize viewer after modal opens
    setTimeout(() => initializeViewer(plan), 100);
  };

  const deletePlan = async (plan: FloorPlan) => {
    if (!confirm('Tem certeza que deseja excluir esta planta baixa?')) return;

    try {
      await supabase.from('floorplans').delete().eq('id', plan.id);
      await loadFloorPlans();
      toast.success('Planta baixa excluída com sucesso!');
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Erro ao excluir planta baixa');
    }
  };

  const handleZoomIn = () => {
    if (fabricCanvasRef.current) {
      const zoom = Math.min(fabricCanvasRef.current.getZoom() * 1.1, 20);
      fabricCanvasRef.current.setZoom(zoom);
      setCanvasZoom(zoom);
    }
  };

  const handleZoomOut = () => {
    if (fabricCanvasRef.current) {
      const zoom = Math.max(fabricCanvasRef.current.getZoom() / 1.1, 0.01);
      fabricCanvasRef.current.setZoom(zoom);
      setCanvasZoom(zoom);
    }
  };

  const handleResetView = () => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.setViewportTransform([1, 0, 0, 1, 0, 0]);
      fabricCanvasRef.current.setZoom(1);
      setCanvasZoom(1);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Plantas Baixas</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie as plantas baixas e projetos da empresa
          </p>
        </div>
        <Button onClick={() => setUploadMode(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Carregar Planta
        </Button>
      </div>

      {uploadMode && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Carregar Nova Planta Baixa
          </h3>
          <p className="text-gray-500 mb-4">
            Selecione uma imagem (JPG, PNG, GIF, WebP) ou PDF até 10MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="flex gap-2 justify-center">
            <Button onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
              {isLoading ? 'Carregando...' : 'Selecionar Arquivo'}
            </Button>
            <Button variant="outline" onClick={() => setUploadMode(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {!uploadMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {floorPlans.map((plan) => (
            <div key={plan.id} className="border rounded-lg overflow-hidden bg-card">
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                <img
                  src={plan.image_url}
                  alt={plan.name}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
              </div>
              <div className="p-4">
                <h4 className="font-medium mb-1">{plan.name}</h4>
                {plan.description && (
                  <p className="text-sm text-muted-foreground mb-2">{plan.description}</p>
                )}
                <p className="text-xs text-muted-foreground mb-3">
                  {new Date().toLocaleDateString('pt-BR')} • {plan.image_width} × {plan.image_height}px
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => openViewer(plan)} className="flex-1">
                    <Eye className="h-4 w-4 mr-1" />
                    Visualizar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => deletePlan(plan)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {floorPlans.length === 0 && !uploadMode && (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              Nenhuma planta baixa encontrada. Clique em "Carregar Planta" para adicionar uma nova.
            </div>
          )}
        </div>
      )}

      {viewerMode && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">{selectedPlan.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {equipmentsOnPlan.length} equipamento(s) posicionado(s)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={handleResetView}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {Math.round(canvasZoom * 100)}%
                </span>
                <Button variant="outline" onClick={() => setViewerMode(false)}>
                  Fechar
                </Button>
              </div>
            </div>
            <div className="flex-1 p-4 overflow-hidden">
              <div className="border rounded-lg bg-gray-50 h-full flex items-center justify-center">
                <canvas ref={canvasRef} className="max-w-full max-h-full" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};