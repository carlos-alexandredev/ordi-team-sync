import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useActivityLogger } from "@/hooks/useActivityLogger";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface ImportResult {
  success: number;
  errors: Array<{ line: number; message: string; data?: any }>;
}

export function FAQImportExport({ onImportComplete }: { onImportComplete?: () => void }) {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { data: faqs, error } = await supabase
        .from("faqs")
        .select("question, answer, category, status, tags")
        .order("created_at");
      
      if (error) throw error;

      // Convert to CSV
      const csvHeaders = ["pergunta", "resposta", "categoria", "status", "tags"];
      const csvData = faqs?.map(faq => [
        `"${faq.question?.replace(/"/g, '""') || ''}"`,
        `"${faq.answer?.replace(/"/g, '""') || ''}"`,
        faq.category || '',
        faq.status,
        faq.tags ? `"${faq.tags.join(';')}"` : ''
      ]) || [];
      
      const csvContent = [csvHeaders.join(","), ...csvData.map(row => row.join(","))].join("\n");
      
      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `faqs_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      await logActivity({
        action: "export_faqs",
        table_name: "faqs",
        details: { count: faqs?.length || 0 }
      });

      toast({
        title: "Export realizado com sucesso",
        description: `${faqs?.length || 0} FAQs exportadas`,
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "Erro ao exportar FAQs",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('Arquivo deve conter pelo menos cabeçalho e uma linha de dados');
      }

      // Skip header
      const dataLines = lines.slice(1);
      
      const { data, error } = await supabase.functions.invoke('faq-import', {
        body: { 
          csvData: dataLines.map((line, index) => ({ line: index + 2, content: line }))
        }
      });

      if (error) throw error;

      setImportResult(data);
      
      if (data.success > 0) {
        toast({
          title: "Import concluído",
          description: `${data.success} FAQs importadas com sucesso`,
        });
        onImportComplete?.();
      }

      await logActivity({
        action: "import_faqs",
        table_name: "faqs",
        details: { 
          success: data.success, 
          errors: data.errors.length,
          filename: file.name
        }
      });

    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Erro ao importar FAQs",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={handleExport}
        disabled={isExporting}
        className="gap-2"
      >
        {isExporting ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        Exportar
      </Button>

      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Importar
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Importar FAQs</DialogTitle>
            <DialogDescription>
              Importe FAQs a partir de um arquivo CSV com as colunas: pergunta, resposta, categoria, status, tags
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <FileSpreadsheet className="h-4 w-4" />
              <AlertDescription>
                <strong>Formato esperado:</strong> CSV com colunas: pergunta, resposta, categoria, status, tags (separadas por ponto e vírgula)
                <br />
                <strong>Status válidos:</strong> published, draft, archived
              </AlertDescription>
            </Alert>

            <div>
              <Input
                type="file"
                accept=".csv"
                onChange={handleImport}
                disabled={isImporting}
              />
            </div>

            {isImporting && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Processando arquivo...
              </div>
            )}

            {importResult && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {importResult.success} Sucessos
                  </Badge>
                  {importResult.errors.length > 0 && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {importResult.errors.length} Erros
                    </Badge>
                  )}
                </div>

                {importResult.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <strong>Erros encontrados:</strong>
                        {importResult.errors.slice(0, 5).map((error, index) => (
                          <div key={index} className="text-xs">
                            Linha {error.line}: {error.message}
                          </div>
                        ))}
                        {importResult.errors.length > 5 && (
                          <div className="text-xs">
                            ... e mais {importResult.errors.length - 5} erros
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}