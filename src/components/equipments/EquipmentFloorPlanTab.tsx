import { useState, useEffect, useRef } from 'react';
import { Canvas as FabricCanvas, Circle, Text, Group, Point, FabricImage } from 'fabric';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Download, Edit3, Save, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

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
}

interface EquipmentFloorPlanTabProps {
  equipment?: Equipment | null;
}

export const EquipmentFloorPlanTab: React.FC<EquipmentFloorPlanTabProps> = ({
  equipment
}) => {
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [selectedFloorPlan, setSelectedFloorPlan] = useState<string>('');
  const [uploadMode, setUploadMode] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [equipmentPosition, setEquipmentPosition] = useState<{ x: number; y: number } | null>(null);
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [canvasPan, setCanvasPan] = useState({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const editModeRef = useRef(false);

  // Load floor plans
  useEffect(() => {
    loadFloorPlans();
  }, [equipment?.company_id]);

  // Auto-load equipment's most recent position
  useEffect(() => {
    if (equipment?.id && floorPlans.length > 0) {
      loadMostRecentEquipmentPosition();
    }
  }, [equipment?.id, floorPlans]);

  // Initialize canvas when floor plan is selected
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

  // Sync editMode with ref
  useEffect(() => {
    editModeRef.current = editMode;
  }, [editMode]);

  // Load floor plans from database
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

  // Load most recent equipment position
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
      console.error('Error loading position:', error);
    }
  };

  // Load equipment position for selected floor plan
  const loadEquipmentPosition = async () => {
    if (!equipment?.id || !selectedFloorPlan) return null;

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
      console.error('Error loading position:', error);
      return null;
    }
  };

  // Resilient image loading with fallback to signed URL
  const loadImageWithFallback = async (imageUrl: string): Promise<HTMLImageElement> => {
    return new Promise(async (resolve, reject) => {
      console.log('Attempting to load image:', imageUrl);
      
      // Check if we're on mobile to skip HEAD request (can be problematic)
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (!isMobile) {
        // First try: Direct public URL with HEAD request validation (desktop only)
        try {
          const headResponse = await fetch(imageUrl, { method: 'HEAD' });
          if (headResponse.ok) {
            console.log('Public URL accessible via HEAD request');
            
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            const timeout = setTimeout(() => {
              reject(new Error('Image loading timeout'));
            }, 10000);
            
            img.onload = () => {
              clearTimeout(timeout);
              console.log('Image loaded successfully via public URL');
              resolve(img);
            };
            
            img.onerror = (error) => {
              clearTimeout(timeout);
              console.warn('Failed to load via public URL despite HEAD success:', error);
              // Fall back to signed URL
              loadViaSignedUrl();
            };
            
            img.src = imageUrl;
            return;
          }
        } catch (error) {
          console.warn('HEAD request failed, trying signed URL:', error);
        }
      } else {
        console.log('Mobile device detected, skipping HEAD request');
      }
      
      // Fallback: Try signed URL
      async function loadViaSignedUrl() {
        try {
          // Extract file path from public URL
          const urlParts = imageUrl.split('/storage/v1/object/public/floorplans/');
          if (urlParts.length !== 2) {
            throw new Error('Cannot extract file path from URL');
          }
          
          const filePath = urlParts[1];
          console.log('Generating signed URL for path:', filePath);
          
          const { data, error } = await supabase.storage
            .from('floorplans')
            .createSignedUrl(filePath, 3600); // 1 hour expiry
          
          if (error) throw error;
          
          console.log('Signed URL generated:', data.signedUrl);
          
          const img = new Image();
          
          const timeout = setTimeout(() => {
            reject(new Error('Signed URL image loading timeout'));
          }, 10000);
          
          img.onload = () => {
            clearTimeout(timeout);
            console.log('Image loaded successfully via signed URL');
            resolve(img);
          };
          
          img.onerror = (error) => {
            clearTimeout(timeout);
            console.error('Failed to load via signed URL:', error);
            reject(new Error('All image loading methods failed'));
          };
          
          img.src = data.signedUrl;
        } catch (signedUrlError) {
          console.error('Signed URL generation failed:', signedUrlError);
          reject(new Error(`All loading methods failed: ${signedUrlError.message}`));
        }
      }
      
      loadViaSignedUrl();
    });
  };

  // Initialize Fabric canvas and load floor plan (improved)
  const initializeFabricCanvas = async () => {
    if (!canvasRef.current || !selectedFloorPlan) return;

    // Dispose existing canvas if exists
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.dispose();
    }

    // Get canvas container dimensions
    const canvasContainer = canvasRef.current.parentElement;
    const containerWidth = canvasContainer?.clientWidth || 800;
    const containerHeight = canvasContainer?.clientHeight || 600;
    
    // Use responsive dimensions
    const canvasWidth = Math.min(containerWidth, 1200);
    const canvasHeight = Math.min(containerHeight, 800);

    const canvas = new FabricCanvas(canvasRef.current, {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: '#ffffff',
    });

    fabricCanvasRef.current = canvas;

    // Load the floor plan (with improved error handling)
    const floorPlan = floorPlans.find(fp => fp.id === selectedFloorPlan);
    if (floorPlan) {
      try {
        console.log('Loading floor plan:', floorPlan.name, floorPlan.image_url);
        
        const img = await loadImageWithFallback(floorPlan.image_url);
        
        console.log('Floor plan image loaded successfully:', img.width, 'x', img.height);
        
        // Scale image to fit canvas while maintaining aspect ratio
        const scaleX = canvas.width! / img.width;
        const scaleY = canvas.height! / img.height;
        const scale = Math.min(scaleX, scaleY);
        
        const fabricImg = new FabricImage(img, {
          scaleX: scale,
          scaleY: scale,
          originX: 'center',
          originY: 'center',
          left: canvas.width! / 2,
          top: canvas.height! / 2,
          selectable: false,
          evented: false
        });
        
        canvas.backgroundImage = fabricImg;
        canvas.renderAll();
        
        // Add equipment marker if position exists
        const position = await loadEquipmentPosition();
        if (position) {
          // Scale position to match the scaled image
          const scaledX = (position.x / img.width) * (img.width * scale) + (canvas.width! - img.width * scale) / 2;
          const scaledY = (position.y / img.height) * (img.height * scale) + (canvas.height! - img.height * scale) / 2;
          addEquipmentMarkerWithLabel(canvas, scaledX, scaledY);
        }
        
        toast.success('Planta baixa carregada com sucesso!');
      } catch (error) {
        console.error('Error loading floor plan:', error);
        toast.error(`Erro ao carregar imagem da planta baixa: ${error.message}`);
      }
    }

    // Enable zoom and pan (improved for mobile)
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

    // Enable panning with middle mouse or ctrl+drag
    let isDragging = false;
    let selection = false;
    let lastPosX: number | undefined;
    let lastPosY: number | undefined;

    // Mobile-friendly touch and mouse handling
    canvas.on('mouse:down', (options) => {
      const mouseEvent = options.e as MouseEvent;
      const touchEvent = options.e as TouchEvent;
      
      // Handle both mouse and touch events for mobile
      if (editModeRef.current && options.e && !options.e.ctrlKey && !mouseEvent.button) {
        // Edit mode - place equipment marker
        const pointer = canvas.getPointer(options.e);
        
        // Convert pointer position back to original image coordinates
        const backgroundImg = canvas.backgroundImage as FabricImage;
        if (backgroundImg) {
          const imgScale = Math.min(backgroundImg.scaleX || 1, backgroundImg.scaleY || 1);
          const imgLeft = backgroundImg.left || 0;
          const imgTop = backgroundImg.top || 0;
          const imgWidth = backgroundImg.width || 0;
          const imgHeight = backgroundImg.height || 0;
          
          const originalX = (pointer.x - imgLeft + (imgWidth * imgScale) / 2) / imgScale;
          const originalY = (pointer.y - imgTop + (imgHeight * imgScale) / 2) / imgScale;
          
          setEquipmentPosition({ x: originalX, y: originalY });
        } else {
          setEquipmentPosition({ x: pointer.x, y: pointer.y });
        }
        
        // Clear existing markers
        const objects = canvas.getObjects();
        objects.forEach(obj => {
          if ((obj as any).name === 'equipment-marker') {
            canvas.remove(obj);
          }
        });
        
        // Add new marker
        addEquipmentMarkerWithLabel(canvas, pointer.x, pointer.y);
        canvas.renderAll();
      } else if (options.e && (options.e.ctrlKey || mouseEvent.button === 1 || touchEvent.touches?.length > 1)) {
        // Pan mode (include multi-touch for mobile)
        isDragging = true;
        selection = canvas.selection!;
        canvas.selection = false;
        canvas.defaultCursor = 'move';
        
        // Initialize touch position tracking
        if (touchEvent.touches && touchEvent.touches.length === 1) {
          lastPosX = touchEvent.touches[0].clientX;
          lastPosY = touchEvent.touches[0].clientY;
        }
      }
    });

    canvas.on('mouse:move', (options) => {
      if (isDragging && options.e) {
        const e = options.e as MouseEvent | TouchEvent;
        const vpt = canvas.viewportTransform!;
        
        // Handle both mouse and touch movement
        if ('movementX' in e && 'movementY' in e) {
          vpt[4] += e.movementX;
          vpt[5] += e.movementY;
        } else if ('touches' in e && e.touches.length === 1) {
          // Handle touch movement for mobile
          const touch = e.touches[0];
          if (lastPosX !== undefined && lastPosY !== undefined) {
            vpt[4] += touch.clientX - lastPosX;
            vpt[5] += touch.clientY - lastPosY;
          }
          lastPosX = touch.clientX;
          lastPosY = touch.clientY;
        }
        
        canvas.requestRenderAll();
        setCanvasPan({ x: vpt[4], y: vpt[5] });
      }
    });

    canvas.on('mouse:up', () => {
      canvas.setViewportTransform(canvas.viewportTransform!);
      isDragging = false;
      canvas.selection = selection;
      canvas.defaultCursor = 'default';
      
      // Clear touch position tracking
      lastPosX = undefined;
      lastPosY = undefined;
    });
  };

  // Add equipment marker with label
  const addEquipmentMarkerWithLabel = (canvas: FabricCanvas, x: number, y: number) => {
    // Create circle marker
    const circle = new Circle({
      left: x - 15,
      top: y - 15,
      radius: 15,
      fill: '#ef4444',
      stroke: '#ffffff',
      strokeWidth: 2,
      selectable: false,
    });
    (circle as any).name = 'equipment-marker';

    // Create text label with equipment name
    const equipmentLabel = equipment?.name || `Equipamento ${equipment?.friendly_id || ''}`;
    const text = new Text(equipmentLabel, {
      left: x + 20,
      top: y - 10,
      fontSize: 14,
      fill: '#1f2937',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      selectable: false,
    });
    (text as any).name = 'equipment-marker';

    // Group the circle and text
    const group = new Group([circle, text], {
      left: x - 15,
      top: y - 15,
      selectable: false,
    });
    (group as any).name = 'equipment-marker';

    canvas.add(group);
  };

  // Zoom controls
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
      setCanvasPan({ x: 0, y: 0 });
    }
  };

  // Save position to database
  const savePosition = async () => {
    if (!equipmentPosition || !selectedFloorPlan || !equipment) return;

    setIsLoading(true);
    try {
      // Check if position already exists
      const { data: existingPosition } = await supabase
        .from('equipment_floorplan_positions')
        .select('id')
        .eq('equipment_id', equipment.id)
        .eq('floorplan_id', selectedFloorPlan)
        .single();

      if (existingPosition) {
        // Update existing position
        const { error } = await supabase
          .from('equipment_floorplan_positions')
          .update({
            x_position: Math.round(equipmentPosition.x),
            y_position: Math.round(equipmentPosition.y),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPosition.id);

        if (error) throw error;
      } else {
        // Create new position
        const { error } = await supabase
          .from('equipment_floorplan_positions')
          .insert({
            equipment_id: equipment.id,
            floorplan_id: selectedFloorPlan,
            x_position: Math.round(equipmentPosition.x),
            y_position: Math.round(equipmentPosition.y)
          });

        if (error) throw error;
      }

      setEditMode(false);
      toast.success('Posição do equipamento salva com sucesso!');
    } catch (error) {
      console.error('Error saving position:', error);
      toast.error('Erro ao salvar posição do equipamento');
    } finally {
      setIsLoading(false);
    }
  };

  // Download PDF
  const downloadPDF = () => {
    if (!fabricCanvasRef.current) return;

    try {
      const canvas = fabricCanvasRef.current;
      const dataUrl = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2
      });

      const pdf = new jsPDF({
        orientation: canvas.width! > canvas.height! ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(dataUrl, 'PNG', 0, 0, imgWidth, imgHeight);
      
      const selectedPlan = floorPlans.find(p => p.id === selectedFloorPlan);
      const equipmentLabel = equipment?.name || `Equipamento ${equipment?.friendly_id || ''}`;
      const title = `${selectedPlan?.name || 'Planta'} - ${equipmentLabel}`;
      
      pdf.save(`${title}.pdf`);
      toast.success('PDF baixado com sucesso!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erro ao gerar PDF');
    }
  };

  // Handle file upload (improved with dimension calculation)
  const handleFileUpload = async (file: File) => {
    if (!equipment?.company_id) return;

    setIsLoading(true);
    try {
      // Calculate image dimensions locally before upload
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          resolve({ width: img.width, height: img.height });
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Failed to load image for dimensions'));
        };
        img.src = objectUrl;
      });

      console.log('Image dimensions calculated:', width, 'x', height);

      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `${equipment.company_id}/${Date.now()}.${fileExt}`;

      // Force contentType if not provided (common on mobile)
      const contentType = file.type || `image/${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('floorplans')
        .upload(fileName, file, {
          contentType,
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        toast.error(`Erro no upload: ${uploadError.message || 'Falha no upload do arquivo'}`);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('floorplans')
        .getPublicUrl(fileName);

      console.log('Generated public URL:', publicUrl);

      const { error: dbError } = await supabase
        .from('floorplans')
        .insert({
          name: file.name,
          company_id: equipment.company_id,
          image_url: publicUrl,
          image_width: width,
          image_height: height,
          file_type: contentType
        });

      if (dbError) {
        console.error('Error saving to database:', dbError);
        toast.error(`Erro no banco: ${dbError.message || 'Falha ao salvar no banco de dados'}`);
        return;
      }

      toast.success('Planta baixa carregada com sucesso!');
      loadFloorPlans();
      setUploadMode(false);
    } catch (error) {
      console.error('Error in file upload:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao processar: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file upload from input event
  const handleFileUploadEvent = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Enhanced file validation
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const fileType = file.type || `image/${file.name.split('.').pop()?.toLowerCase()}`;
    
    if (!validTypes.includes(fileType) && !file.type.startsWith('image/')) {
      toast.error('Formato não suportado. Use JPG, PNG, GIF ou WebP');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('Arquivo muito grande. Máximo 10MB');
      return;
    }

    await handleFileUpload(file);
    
    // Reset input
    event.target.value = '';
  };

  return (
    <div className="space-y-4" ref={containerRef}>
      {uploadMode ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Carregar Nova Planta Baixa
          </h3>
          <p className="text-gray-500 mb-4">
            Selecione uma imagem (JPG, PNG, GIF, WebP) até 10MB
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUploadEvent}
            className="hidden"
            id="floorplan-upload"
          />
          <div className="space-x-2">
            <Button
              type="button"
              onClick={() => document.getElementById('floorplan-upload')?.click()}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? 'Carregando...' : 'Selecionar Arquivo'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setUploadMode(false)}
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Planta Baixa - Localização do Equipamento</h3>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setUploadMode(true)}
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                <Upload className="w-4 h-4 mr-2" />
                Carregar Planta
              </Button>
              {selectedFloorPlan && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadPDF}
                  className="text-green-600 border-green-600 hover:bg-green-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar PDF
                </Button>
              )}
            </div>
          </div>

          {floorPlans.length > 0 ? (
            <>
              <div className="flex gap-4 items-center">
                <div className="flex-1">
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
                  <div className="flex gap-2">
                    {!editMode ? (
                      <Button
                        type="button"
                        onClick={() => setEditMode(true)}
                        variant="outline"
                        className="text-orange-600 border-orange-600 hover:bg-orange-50"
                        disabled={isLoading}
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Posicionar
                      </Button>
                    ) : (
                      <>
                        <Button
                          type="button"
                          onClick={savePosition}
                          className="bg-green-600 hover:bg-green-700"
                          disabled={!equipmentPosition || isLoading}
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {isLoading ? 'Salvando...' : 'Salvar'}
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setEditMode(false)}
                          variant="outline"
                          disabled={isLoading}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancelar
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {editMode && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">
                    <strong>Modo de Posicionamento:</strong> Clique na planta baixa onde deseja posicionar o equipamento.
                  </p>
                </div>
              )}

              {selectedFloorPlan && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="flex justify-between items-center p-3 bg-gray-50 border-b">
                    <div className="text-sm text-gray-600">
                      Zoom: {Math.round(canvasZoom * 100)}%
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleZoomIn}
                      >
                        <ZoomIn className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleZoomOut}
                      >
                        <ZoomOut className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleResetView}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="overflow-hidden bg-gray-100 relative" style={{ height: '700px' }}>
                    <canvas
                      ref={canvasRef}
                      className="border-0 bg-white touch-none"
                      style={{ 
                        touchAction: 'none',
                        userSelect: 'none',
                        WebkitUserSelect: 'none'
                      }}
                    />
                  </div>
                  <div className="p-2 bg-gray-50 text-xs text-gray-500 border-t">
                    {editMode ? '📍 Toque para posicionar equipamento' : '👀 Modo visualização'} • Use Ctrl+clique ou multi-toque para navegar
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Nenhuma planta baixa disponível.</p>
              <p className="text-sm">Clique em "Carregar Planta" para adicionar uma nova planta baixa.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};