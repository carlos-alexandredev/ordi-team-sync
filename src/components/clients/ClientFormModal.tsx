import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  company_id?: string;
  active: boolean;
}

interface Company {
  id: string;
  name: string;
}

interface ClientFormModalProps {
  open: boolean;
  onClose: () => void;
  client?: Client | null;
  companies: Company[];
}

export function ClientFormModal({ open, onClose, client, companies }: ClientFormModalProps) {
  console.log("ClientFormModal render - open:", open, "client:", client, "companies:", companies);
  
  const { toast } = useToast();

  useEffect(() => {
    console.log("ClientFormModal useEffect - modal opened:", open, "client data:", client);
  }, [client, open]);

  console.log("ClientFormModal render start - open:", open);
  
  if (!open) {
    console.log("Modal não está aberto, retornando null");
    return null;
  }

  try {
    console.log("Tentando renderizar o modal...");
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {client ? "Editar Cliente" : "Novo Cliente"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-4 space-y-4">
            <p className="text-green-600 font-semibold">✅ Modal está funcionando!</p>
            <p>Cliente: {client ? client.name : 'Novo'}</p>
            <p>Empresas disponíveis: {companies?.length || 0}</p>
            <Button onClick={onClose} className="w-full">
              Fechar Modal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  } catch (error: any) {
    console.error("Erro no modal:", error);
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg">
          <h2 className="text-red-600 font-bold">Erro no modal</h2>
          <p>{error?.message || 'Erro desconhecido'}</p>
          <Button onClick={onClose} className="mt-4">
            Fechar
          </Button>
        </div>
      </div>
    );
  }
}