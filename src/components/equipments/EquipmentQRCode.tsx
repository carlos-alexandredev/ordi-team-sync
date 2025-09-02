import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Download, Printer, QrCode, ExternalLink, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QRCode from "react-qr-code";
import html2canvas from "html2canvas";

interface Equipment {
  id: string;
  name: string;
  friendly_id: number;
  model?: string;
  location?: string;
  status: string;
}

interface EquipmentQRCodeProps {
  equipment: Equipment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EquipmentQRCode = ({ equipment, open, onOpenChange }: EquipmentQRCodeProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("cliente");
  const qrRef = useRef<HTMLDivElement>(null);

  const baseUrl = window.location.origin;
  const clientLink = `${baseUrl}/calls/new?fid=${equipment.friendly_id}`;
  const internalLink = `${baseUrl}/orders/new?fid=${equipment.friendly_id}`;

  const currentLink = activeTab === "cliente" ? clientLink : internalLink;
  const linkType = activeTab === "cliente" ? "Chamado (Cliente)" : "OS (Interno)";

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para a área de transferência."
      });
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link.",
        variant: "destructive"
      });
    }
  };

  const downloadQRCode = async () => {
    if (!qrRef.current) return;

    try {
      const canvas = await html2canvas(qrRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        width: 300,
        height: 400
      });

      const link = document.createElement('a');
      link.download = `qr-code-${equipment.name.replace(/[^a-zA-Z0-9]/g, '-')}-${equipment.friendly_id}.png`;
      link.href = canvas.toDataURL();
      link.click();

      toast({
        title: "QR Code baixado!",
        description: "O arquivo foi salvo na pasta de downloads."
      });
    } catch (error) {
      toast({
        title: "Erro ao baixar",
        description: "Não foi possível baixar o QR Code.",
        variant: "destructive"
      });
    }
  };

  const printQRCode = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${equipment.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              text-align: center;
            }
            .qr-container {
              border: 2px solid #000;
              padding: 20px;
              margin: 20px auto;
              width: fit-content;
              background: white;
            }
            .equipment-info {
              margin-bottom: 15px;
            }
            .equipment-name {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .equipment-details {
              font-size: 12px;
              color: #666;
            }
            .link-info {
              margin-top: 15px;
              font-size: 10px;
              color: #666;
              word-break: break-all;
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="equipment-info">
              <div class="equipment-name">${equipment.name}</div>
              <div class="equipment-details">
                ID: #${equipment.friendly_id}
                ${equipment.model ? ` • ${equipment.model}` : ''}
                ${equipment.location ? ` • ${equipment.location}` : ''}
              </div>
            </div>
            <div id="qr-code-container">
              <svg width="200" height="200" viewBox="0 0 200 200">
                ${qrRef.current?.querySelector('svg')?.innerHTML || ''}
              </svg>
            </div>
            <div class="link-info">
              ${linkType}: ${currentLink}
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code - {equipment.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span className="font-medium">ID: #{equipment.friendly_id}</span>
              <Badge variant="outline">{equipment.status}</Badge>
            </div>
            {equipment.model && (
              <p className="text-sm text-muted-foreground">Modelo: {equipment.model}</p>
            )}
            {equipment.location && (
              <p className="text-sm text-muted-foreground">Local: {equipment.location}</p>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="cliente" className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                Chamado
              </TabsTrigger>
              <TabsTrigger value="interno" className="flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                OS Interna
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cliente" className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  QR para abertura de chamados (clientes)
                </p>
                <div ref={qrRef} className="inline-block p-4 bg-white border rounded">
                  <QRCode
                    size={200}
                    value={clientLink}
                    viewBox="0 0 200 200"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="interno" className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  QR para criação de OS (uso interno)
                </p>
                <div ref={qrRef} className="inline-block p-4 bg-white border rounded">
                  <QRCode
                    size={200}
                    value={internalLink}
                    viewBox="0 0 200 200"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 bg-muted rounded text-xs">
              <span className="font-medium">{linkType}:</span>
              <span className="truncate flex-1">{currentLink}</span>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(currentLink)}
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-1" />
                Copiar Link
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadQRCode}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-1" />
                Baixar PNG
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={printQRCode}
              >
                <Printer className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};