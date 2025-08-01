import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Play, Square } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TimeLog {
  id: string;
  check_in_time: string | null;
  check_out_time: string | null;
  check_in_location: string | null;
  check_out_location: string | null;
  total_minutes: number | null;
}

interface TimeTrackerProps {
  orderId: string;
  technicianId?: string;
  isReadOnly?: boolean;
}

export const TimeTracker: React.FC<TimeTrackerProps> = ({
  orderId,
  technicianId,
  isReadOnly = false
}) => {
  const [currentLog, setCurrentLog] = useState<TimeLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    loadCurrentTimeLog();
  }, [orderId]);

  const loadCurrentTimeLog = async () => {
    try {
      const { data, error } = await supabase
        .from('order_time_logs')
        .select('*')
        .eq('order_id', orderId)
        .is('check_out_time', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      setCurrentLog(data?.[0] || null);
    } catch (error: any) {
      console.error('Erro ao carregar log de tempo:', error);
    }
  };

  const getCurrentLocation = (): Promise<string> => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            resolve(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          },
          () => {
            resolve('Localização não disponível');
          }
        );
      } else {
        resolve('Geolocalização não suportada');
      }
    });
  };

  const handleCheckIn = async () => {
    if (!technicianId) {
      toast({
        title: "Erro",
        description: "ID do técnico é obrigatório",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const location = await getCurrentLocation();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('order_time_logs')
        .insert([{
          order_id: orderId,
          technician_id: technicianId,
          check_in_time: new Date().toISOString(),
          check_in_location: location
        }])
        .select()
        .single();

      if (error) throw error;

      setCurrentLog(data);
      setLocation(location);

      toast({
        title: "Check-in realizado",
        description: "Horário de início registrado com sucesso!"
      });
    } catch (error: any) {
      toast({
        title: "Erro no check-in",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!currentLog) return;

    setLoading(true);

    try {
      const location = await getCurrentLocation();

      const { error } = await supabase
        .from('order_time_logs')
        .update({
          check_out_time: new Date().toISOString(),
          check_out_location: location
        })
        .eq('id', currentLog.id);

      if (error) throw error;

      toast({
        title: "Check-out realizado",
        description: "Horário de término registrado com sucesso!"
      });

      loadCurrentTimeLog();
    } catch (error: any) {
      toast({
        title: "Erro no check-out",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '0min';
    
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  const getCurrentDuration = () => {
    if (!currentLog?.check_in_time) return 0;
    
    const start = new Date(currentLog.check_in_time);
    const now = new Date();
    return Math.floor((now.getTime() - start.getTime()) / 60000);
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center">
          <Clock className="mr-2 h-4 w-4" />
          Controle de Tempo
        </h3>
        
        {currentLog?.check_in_time && !currentLog?.check_out_time && (
          <Badge variant="default" className="animate-pulse">
            Em andamento
          </Badge>
        )}
      </div>

      {currentLog ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Check-in:</span>
            <span className="text-sm font-medium">
              {currentLog.check_in_time 
                ? new Date(currentLog.check_in_time).toLocaleString('pt-BR')
                : '-'
              }
            </span>
          </div>

          {currentLog.check_in_location && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Local inicial:</span>
              <span className="text-xs text-muted-foreground flex items-center">
                <MapPin className="mr-1 h-3 w-3" />
                {currentLog.check_in_location}
              </span>
            </div>
          )}

          {currentLog.check_out_time ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Check-out:</span>
                <span className="text-sm font-medium">
                  {new Date(currentLog.check_out_time).toLocaleString('pt-BR')}
                </span>
              </div>

              {currentLog.check_out_location && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Local final:</span>
                  <span className="text-xs text-muted-foreground flex items-center">
                    <MapPin className="mr-1 h-3 w-3" />
                    {currentLog.check_out_location}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm font-medium">Tempo total:</span>
                <Badge variant="secondary">
                  {formatDuration(currentLog.total_minutes)}
                </Badge>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm font-medium">Tempo decorrido:</span>
                <Badge variant="default">
                  {formatDuration(getCurrentDuration())}
                </Badge>
              </div>

              {!isReadOnly && (
                <Button 
                  onClick={handleCheckOut}
                  disabled={loading}
                  variant="destructive"
                  className="w-full"
                >
                  <Square className="mr-2 h-4 w-4" />
                  {loading ? 'Processando...' : 'Finalizar Atendimento'}
                </Button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            Nenhum atendimento em andamento
          </p>
          
          {!isReadOnly && (
            <Button 
              onClick={handleCheckIn}
              disabled={loading}
              className="w-full"
            >
              <Play className="mr-2 h-4 w-4" />
              {loading ? 'Processando...' : 'Iniciar Atendimento'}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};