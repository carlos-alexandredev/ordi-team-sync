import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Building2, User, Package } from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'client' | 'equipment' | 'supplier';
  category: string;
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onQueryChange: (query: string) => void;
}

export function GlobalSearch({ open, onOpenChange, query, onQueryChange }: GlobalSearchProps) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.length > 2) {
      searchAll();
    } else {
      setResults([]);
    }
  }, [query]);

  const searchAll = async () => {
    setLoading(true);
    try {
      const searchPromises = [
        searchClients(),
        searchEquipments(),
        searchSuppliers()
      ];

      const allResults = await Promise.all(searchPromises);
      const flatResults = allResults.flat();
      setResults(flatResults);
    } catch (error) {
      console.error('Erro na busca:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchClients = async (): Promise<SearchResult[]> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, companies(name)')
        .eq('role', 'cliente_final')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(5);

      if (error) throw error;

      return (data || []).map(client => ({
        id: client.id,
        title: client.name,
        subtitle: client.email,
        type: 'client' as const,
        category: (client as any).companies?.name || 'Cliente'
      }));
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      return [];
    }
  };

  const searchEquipments = async (): Promise<SearchResult[]> => {
    try {
      const { data, error } = await supabase
        .from('equipments')
        .select(`
          id, 
          name, 
          model, 
          serial_number,
          client_profile: profiles!equipments_client_id_fkey(name)
        `)
        .or(`name.ilike.%${query}%,model.ilike.%${query}%,serial_number.ilike.%${query}%`)
        .limit(5);

      if (error) throw error;

      return (data || []).map(equipment => ({
        id: equipment.id,
        title: equipment.name,
        subtitle: equipment.model || equipment.serial_number || 'Equipamento',
        type: 'equipment' as const,
        category: (equipment as any).client_profile?.name || 'Equipamento'
      }));
    } catch (error) {
      console.error('Erro ao buscar equipamentos:', error);
      return [];
    }
  };

  const searchSuppliers = async (): Promise<SearchResult[]> => {
    // Para fornecedores, retornamos array vazio por enquanto
    // já que a tabela ainda não foi criada
    return [];
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'client': return <User className="h-4 w-4" />;
      case 'equipment': return <Package className="h-4 w-4" />;
      case 'supplier': return <Building2 className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'client': return 'Cliente';
      case 'equipment': return 'Equipamento';
      case 'supplier': return 'Fornecedor';
      default: return 'Item';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-2xl">
        <Command>
          <CommandInput 
            placeholder="Buscar clientes, equipamentos ou fornecedores..." 
            value={query}
            onValueChange={onQueryChange}
          />
          <CommandList>
            {loading && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Buscando...
              </div>
            )}
            {!loading && query.length > 2 && results.length === 0 && (
              <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            )}
            {results.length > 0 && (
              <CommandGroup heading="Resultados">
                {results.map((result) => (
                  <CommandItem key={`${result.type}-${result.id}`} className="p-3">
                    <div className="flex items-center gap-3 w-full">
                      {getIcon(result.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{result.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(result.type)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {result.subtitle} • {result.category}
                        </p>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}