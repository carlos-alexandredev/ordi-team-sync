import { useState, useEffect, useRef } from 'react';
import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Download, Eye, ZoomIn, ZoomOut, RotateCcw, FileText, Image as ImageIcon, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Canvas as FabricCanvas, Circle, Text, Group, Point, FabricImage } from 'fabric';
import jsPDF from 'jspdf';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist/webpack';

interface FloorPlan {
  id: string;
  name: string;
  description?: string;
  image_url: string;
  image_width: number;
  image_height: number;
  file_type: string;
  original_file_url?: string;
  created_at: string;
  company_id: string;
}

interface Equipment {
  id: string;
  name: string;
  friendly_id: number;
  x_position: number;
  y_position: number;
}

const Plantas = () => {
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadMode, setUploadMode] = useState(false);
  const [viewerMode, setViewerMode] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<FloorPlan | null>(null);
  const [equipmentsOnPlan, setEquipmentsOnPlan] = useState<Equipment[]>([]);
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load floor plans
  const loadFloorPlans = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('floorplans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFloorPlans(data || []);
    } catch (error) {
      console.error('Error loading floor plans:', error);
      toast.error('Erro ao carregar plantas baixas');
    } finally {
      setIsLoading(false);
    }
  };

  // Load equipments for a specific plan
  const loadEquipmentsOnPlan = async (planId: string) => {
    try {
      const { data, error } = await supabase
        .from('equipment_floorplan_positions')
        .select(`
          x_position,
          y_position,
          equipment_id
        `)
        .eq('floorplan_id', planId);

      if (error) throw error;

      // Get equipment details
      const equipmentIds = data?.map(item => item.equipment_id) || [];
      
      if (equipmentIds.length === 0) {
        setEquipmentsOnPlan([]);
        return;
      }

      const { data: equipmentsData, error: equipmentsError } = await supabase
        .from('equipments')
        .select('id, name, friendly_id')
        .in('id', equipmentIds);

      if (equipmentsError) throw equipmentsError;

      const equipments = data?.map(position => {
        const equipment = equipmentsData?.find(eq => eq.id === position.equipment_id);
        return {
          id: equipment?.id || '',
          name: equipment?.name || '',
          friendly_id: equipment?.friendly_id || 0,
          x_position: position.x_position,
          y_position: position.y_position
        };
      }).filter(eq => eq.id) || [];

      setEquipmentsOnPlan(equipments);
    } catch (error) {
      console.error('Error loading equipments:', error);
      setEquipmentsOnPlan([]);
    }
  };

  // Convert PDF to image for preview
  const convertPdfToImage = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      const page = await pdf.getPage(1);
      
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error converting PDF to image:', error);
      throw new Error('Erro ao processar PDF');
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const validPdfTypes = ['application/pdf'];
    const isImage = validImageTypes.includes(file.type);
    const isPdf = validPdfTypes.includes(file.type);

    if (!isImage && !isPdf) {
      toast.error('Tipo de arquivo não suportado. Use imagens (JPG, PNG, GIF, WebP) ou PDF.');
      return;
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. O tamanho máximo é 50MB.');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('Por favor, informe um nome para a planta baixa.');
      return;
    }

    setIsLoading(true);
    try {
      let imageUrl = '';
      let originalFileUrl = '';
      let imageWidth = 0;
      let imageHeight = 0;
      let fileType = 'image';

      if (isPdf) {
        // Upload original PDF
        const pdfFileName = `floorplan-pdf-${Date.now()}-${file.name}`;
        const { error: pdfUploadError } = await supabase.storage
          .from('floorplans')
          .upload(pdfFileName, file);

        if (pdfUploadError) throw pdfUploadError;

        const { data: { publicUrl: pdfUrl } } = supabase.storage
          .from('floorplans')
          .getPublicUrl(pdfFileName);

        originalFileUrl = pdfUrl;

        // Convert PDF to image for preview
        const imageDataUrl = await convertPdfToImage(file);
        const imageBlob = await fetch(imageDataUrl).then(res => res.blob());
        
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

      // Get user's company ID
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      const companyId = userProfile?.company_id;
      if (!companyId) throw new Error('Company not found');

      // Save to database
      const { error: insertError } = await supabase
        .from('floorplans')
        .insert({
          name: formData.name,
          description: formData.description,
          image_url: imageUrl,
          original_file_url: originalFileUrl || null,
          file_type: fileType,
          image_width: imageWidth,
          image_height: imageHeight,
          company_id: companyId
        });

      if (insertError) throw insertError;

      await loadFloorPlans();
      setUploadMode(false);
      setFormData({ name: '', description: '' });
      toast.success('Planta baixa carregada com sucesso!');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Erro ao fazer upload da planta baixa');
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize canvas viewer
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
        canvas.defaultCursor = 'move';
      }
    });

    canvas.on('mouse:move', (opt) => {
      if (isDragging) {
        const vpt = canvas.viewportTransform!;
        const e = opt.e as MouseEvent;
        vpt[4] += e.movementX;
        vpt[5] += e.movementY;
        canvas.requestRenderAll();
      }
    });

    canvas.on('mouse:up', () => {
      isDragging = false;
      canvas.defaultCursor = 'default';
    });
  };

  // Add equipment marker
  const addEquipmentMarker = (canvas: FabricCanvas, x: number, y: number, equipment: Equipment) => {
    const circle = new Circle({
      left: x - 15,
      top: y - 15,
      radius: 15,
      fill: '#ef4444',
      stroke: '#ffffff',
      strokeWidth: 2,
      selectable: false
    });

    const text = new Text(`${equipment.name} (#${equipment.friendly_id})`, {
      left: x + 20,
      top: y - 10,
      fontSize: 12,
      fill: '#1f2937',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      selectable: false
    });

    const group = new Group([circle, text], {
      left: x - 15,
      top: y - 15,
      selectable: false
    });

    canvas.add(group);
  };

  // Download PDF with all equipments
  const downloadPDFWithEquipments = async (plan: FloorPlan) => {
    if (!fabricCanvasRef.current) return;

    try {
      const canvas = fabricCanvasRef.current;
      const dataUrl = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 2
      });

      const pdf = new jsPDF({
        orientation: plan.image_width > plan.image_height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(dataUrl, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Add equipment list
      pdf.addPage();
      pdf.setFontSize(16);
      pdf.text('Lista de Equipamentos', 20, 30);
      
      let yPos = 50;
      equipmentsOnPlan.forEach((equipment, index) => {
        pdf.setFontSize(12);
        pdf.text(`${index + 1}. ${equipment.name} (#${equipment.friendly_id})`, 20, yPos);
        yPos += 10;
      });

      pdf.save(`${plan.name}-com-equipamentos.pdf`);
      toast.success('PDF baixado com sucesso!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Erro ao gerar PDF');
    }
  };

  // Download original file
  const downloadOriginalFile = (plan: FloorPlan) => {
    const url = plan.file_type === 'pdf' && plan.original_file_url ? plan.original_file_url : plan.image_url;
    const link = document.createElement('a');
    link.href = url;
    link.download = plan.name;
    link.click();
  };

  // Delete floor plan
  const deletePlan = async (plan: FloorPlan) => {
    if (!confirm('Tem certeza que deseja excluir esta planta baixa?')) return;

    try {
      const { error } = await supabase
        .from('floorplans')
        .delete()
        .eq('id', plan.id);

      if (error) throw error;

      await loadFloorPlans();
      toast.success('Planta baixa excluída com sucesso!');
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Erro ao excluir planta baixa');
    }
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
    }
  };

  const openViewer = async (plan: FloorPlan) => {
    setSelectedPlan(plan);
    await loadEquipmentsOnPlan(plan.id);
    setViewerMode(true);
    // Initialize viewer after dialog opens
    setTimeout(() => initializeViewer(plan), 100);
  };

  useEffect(() => {
    loadFloorPlans();
  }, []);

  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["admin_master", "admin", "admin_cliente", "gestor"]}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Plantas Baixas</h1>
              <p className="text-gray-600">Gerencie as plantas baixas e projetos da empresa</p>
            </div>
            <Button
              onClick={() => setUploadMode(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Carregar Planta
            </Button>
          </div>

          {/* Upload Dialog */}
          <Dialog open={uploadMode} onOpenChange={setUploadMode}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Carregar Nova Planta Baixa</DialogTitle>
                <DialogDescription>
                  Adicione uma nova planta baixa ou projeto. Aceita imagens (JPG, PNG, GIF, WebP) e PDFs.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome da Planta</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Planta Térreo - Prédio A"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição detalhada da planta baixa"
                  />
                </div>
                <div>
                  <Label>Arquivo</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full mt-2"
                    disabled={isLoading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isLoading ? 'Carregando...' : 'Selecionar Arquivo'}
                  </Button>
                  <p className="text-sm text-gray-500 mt-2">
                    Formatos: JPG, PNG, GIF, WebP, PDF • Tamanho máximo: 50MB
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Floor Plans Grid */}
          {isLoading ? (
            <div className="text-center py-8">Carregando plantas baixas...</div>
          ) : floorPlans.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma planta baixa encontrada</h3>
              <p>Clique em "Carregar Planta" para adicionar sua primeira planta baixa.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {floorPlans.map((plan) => (
                <Card key={plan.id} className="overflow-hidden">
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    <img
                      src={plan.image_url}
                      alt={plan.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {plan.file_type === 'pdf' ? (
                            <FileText className="w-4 h-4 text-red-500" />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-blue-500" />
                          )}
                          {plan.name}
                        </CardTitle>
                        {plan.description && (
                          <CardDescription className="mt-1">{plan.description}</CardDescription>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(plan.created_at).toLocaleDateString('pt-BR')} • 
                          {plan.image_width} × {plan.image_height}px
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePlan(plan)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openViewer(plan)}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Visualizar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadOriginalFile(plan)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Baixar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Viewer Dialog */}
          <Dialog open={viewerMode} onOpenChange={setViewerMode}>
            <DialogContent className="max-w-6xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  {selectedPlan?.name}
                </DialogTitle>
                <DialogDescription>
                  {equipmentsOnPlan.length} equipamento(s) posicionado(s) nesta planta
                </DialogDescription>
              </DialogHeader>
              
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="flex justify-between items-center p-3 bg-gray-50 border-b">
                  <div className="text-sm text-gray-600">
                    Zoom: {Math.round(canvasZoom * 100)}%
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleZoomIn}>
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleZoomOut}>
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleResetView}>
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    {selectedPlan && (
                      <Button
                        size="sm"
                        onClick={() => downloadPDFWithEquipments(selectedPlan)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        PDF com Equipamentos
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="overflow-hidden bg-gray-100" style={{ height: '600px' }}>
                  <canvas ref={canvasRef} className="border-0" />
                </div>
                
                <div className="p-2 bg-gray-50 text-xs text-gray-500 border-t">
                  Use Ctrl+clique e arraste para navegar • Roda do mouse para zoom
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </ProtectedRoute>
    </AuthLayout>
  );
};

export default Plantas;