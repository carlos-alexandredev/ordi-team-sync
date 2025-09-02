import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, Printer, QrCode, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QRCode from "react-qr-code";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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
  companyName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EquipmentQRCode = ({ equipment, companyName, open, onOpenChange }: EquipmentQRCodeProps) => {
  const { toast } = useToast();
  const qrRef = useRef<HTMLDivElement>(null);

  const baseUrl = window.location.origin;
  const clientLink = `${baseUrl}/calls/new?fid=${equipment.friendly_id}`;

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
      // Create a centered container for the QR code
      const container = document.createElement('div');
      container.style.width = '400px';
      container.style.height = '500px';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.alignItems = 'center';
      container.style.justifyContent = 'center';
      container.style.backgroundColor = '#ffffff';
      container.style.padding = '40px';
      
      // Clone and add equipment info
      const equipmentInfo = document.createElement('div');
      equipmentInfo.style.textAlign = 'center';
      equipmentInfo.style.marginBottom = '20px';
      equipmentInfo.innerHTML = `
        <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">${equipment.name}</h3>
        <p style="font-size: 14px; color: #666;">ID: #${equipment.friendly_id}${equipment.model ? ` • ${equipment.model}` : ''}${equipment.location ? ` • ${equipment.location}` : ''}</p>
      `;
      
      // Clone QR code
      const qrClone = qrRef.current.cloneNode(true) as HTMLElement;
      qrClone.style.margin = '0 auto';
      
      container.appendChild(equipmentInfo);
      container.appendChild(qrClone);
      
      // Temporarily add to document to capture
      document.body.appendChild(container);
      
      const canvas = await html2canvas(container, {
        backgroundColor: "#ffffff",
        scale: 2
      });
      
      document.body.removeChild(container);

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

  const downloadQRCodePDF = async () => {
    if (!qrRef.current) return;

    try {
      const canvas = await html2canvas(qrRef.current, {
        backgroundColor: "#ffffff",
        scale: 2
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Add title
      pdf.setFontSize(16);
      pdf.text(equipment.name, 105, 30, { align: 'center' });
      
      // Add equipment details
      pdf.setFontSize(12);
      pdf.text(`ID: #${equipment.friendly_id}`, 105, 45, { align: 'center' });
      
      if (equipment.model) {
        pdf.text(`Modelo: ${equipment.model}`, 105, 55, { align: 'center' });
      }
      
      if (equipment.location) {
        pdf.text(`Local: ${equipment.location}`, 105, equipment.model ? 65 : 55, { align: 'center' });
      }

      // Add QR code (centered)
      const imgData = canvas.toDataURL('image/png');
      const qrSize = 60; // 60mm square
      const xPos = (210 - qrSize) / 2; // Center on A4 width (210mm)
      const yPos = equipment.location ? 80 : (equipment.model ? 70 : 65);
      
      pdf.addImage(imgData, 'PNG', xPos, yPos, qrSize, qrSize);
      
      // Add company name at bottom
      pdf.setFontSize(10);
      pdf.text(companyName, 105, yPos + qrSize + 20, { align: 'center' });

      pdf.save(`qr-code-${equipment.name.replace(/[^a-zA-Z0-9]/g, '-')}-${equipment.friendly_id}.pdf`);

      toast({
        title: "PDF baixado!",
        description: "O arquivo PDF foi salvo na pasta de downloads."
      });
    } catch (error) {
      toast({
        title: "Erro ao baixar PDF",
        description: "Não foi possível gerar o arquivo PDF.",
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
              padding: 40px;
              text-align: center;
              margin: 0;
            }
            .qr-container {
              border: 2px solid #000;
              padding: 30px;
              margin: 0 auto;
              width: fit-content;
              background: white;
              max-width: 400px;
            }
            .equipment-info {
              margin-bottom: 25px;
            }
            .equipment-name {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .equipment-details {
              font-size: 14px;
              color: #666;
            }
            .qr-code-area {
              margin: 20px 0;
              display: flex;
              justify-content: center;
            }
            .company-name {
              margin-top: 25px;
              font-size: 12px;
              font-weight: bold;
              color: #333;
            }
            @media print {
              body { margin: 0; padding: 20px; }
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
            <div class="qr-code-area">
              <svg width="240" height="240" viewBox="0 0 200 200">
                ${qrRef.current?.querySelector('svg')?.innerHTML || ''}
              </svg>
            </div>
            <div class="company-name">
              ${companyName}
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

          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              QR Code para abertura de chamados
            </p>
            <div ref={qrRef} className="inline-block p-4 bg-white border rounded">
              <QRCode
                size={200}
                value={clientLink}
                viewBox="0 0 200 200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 bg-muted rounded text-xs">
              <span className="font-medium">Link:</span>
              <span className="truncate flex-1">{clientLink}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(clientLink)}
              >
                <Copy className="h-4 w-4 mr-1" />
                Copiar Link
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadQRCode}
              >
                <Download className="h-4 w-4 mr-1" />
                Baixar PNG
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadQRCodePDF}
              >
                <FileText className="h-4 w-4 mr-1" />
                Baixar PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={printQRCode}
              >
                <Printer className="h-4 w-4 mr-1" />
                Imprimir
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};