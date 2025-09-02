import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { CallFormModal } from "@/components/calls/CallFormModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, User, Wrench } from "lucide-react";

const NewCall = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [equipmentInfo, setEquipmentInfo] = useState<any>(null);
  const [preselectedEquipmentId, setPreselectedEquipmentId] = useState<string | undefined>();
  
  const equipmentId = searchParams.get('eq');
  const friendlyId = searchParams.get('fid');

  useEffect(() => {
    const loadEquipmentInfo = async () => {
      if (!equipmentId && !friendlyId) return;

      try {
        let query = supabase
          .from('equipments')
          .select(`
            id,
            name,
            model,
            serial_number,
            location,
            status,
            friendly_id,
            last_maintenance_date,
            client_id,
            company_id,
            profiles!equipments_client_id_fkey(name, company_id)
          `);

        if (equipmentId) {
          query = query.eq('id', equipmentId);
        } else if (friendlyId) {
          query = query.eq('friendly_id', parseInt(friendlyId));
        }

        const { data: equipment, error } = await query.single();

        if (error) {
          console.error('Equipment not found:', error);
          toast({
            title: "Equipamento não encontrado",
            description: "O equipamento especificado não foi encontrado ou você não tem acesso a ele.",
            variant: "destructive"
          });
          return;
        }

        // Verify user has access to this equipment (same company)
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .single();

        if (profile?.company_id !== equipment.company_id) {
          toast({
            title: "Acesso negado",
            description: "Você não tem acesso a este equipamento.",
            variant: "destructive"
          });
          return;
        }

        setEquipmentInfo(equipment);
        setPreselectedEquipmentId(equipment.id);
      } catch (error) {
        console.error('Error loading equipment:', error);
      }
    };

    loadEquipmentInfo();
  }, [equipmentId, friendlyId, toast]);

  const handleModalClose = () => {
    setIsModalOpen(false);
    navigate('/calls');
  };

  const handleSuccess = () => {
    toast({
      title: "Chamado criado com sucesso!",
      description: "Seu chamado foi registrado e você receberá atualizações sobre o atendimento."
    });
    navigate('/calls');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-500';
      case 'inativo': return 'bg-red-500';
      case 'manutenção': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["cliente_final"]}>
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Novo Chamado</h1>
              <p className="text-muted-foreground">
                Abra um novo chamado de suporte
              </p>
            </div>
          </div>

          {equipmentInfo && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Equipamento Selecionado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <strong>{equipmentInfo.name}</strong>
                      <Badge className={getStatusColor(equipmentInfo.status)}>
                        {equipmentInfo.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      ID: #{equipmentInfo.friendly_id}
                    </p>
                    {equipmentInfo.model && (
                      <p className="text-sm">Modelo: {equipmentInfo.model}</p>
                    )}
                    {equipmentInfo.serial_number && (
                      <p className="text-sm">S/N: {equipmentInfo.serial_number}</p>
                    )}
                  </div>
                  
                  {equipmentInfo.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{equipmentInfo.location}</span>
                    </div>
                  )}
                  
                  {equipmentInfo.last_maintenance_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Última manutenção: {new Date(equipmentInfo.last_maintenance_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <CallFormModal
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            onSuccess={handleSuccess}
            preselectedEquipmentId={preselectedEquipmentId}
          />
        </div>
      </ProtectedRoute>
    </AuthLayout>
  );
};

export default NewCall;