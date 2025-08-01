import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Star, MessageSquare, TrendingUp, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Evaluation {
  id: string;
  order_id: string;
  order_title: string;
  client_name: string;
  technician_name: string;
  rating: number;
  feedback: string;
  created_at: string;
  punctuality_rating: number;
  quality_rating: number;
  communication_rating: number;
}

interface EvaluationForm {
  order_id: string;
  rating: number;
  punctuality_rating: number;
  quality_rating: number;
  communication_rating: number;
  feedback: string;
}

export function ServiceEvaluation() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [completedOrders, setCompletedOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<string>("");
  const [evaluationForm, setEvaluationForm] = useState<EvaluationForm>({
    order_id: "",
    rating: 0,
    punctuality_rating: 0,
    quality_rating: 0,
    communication_rating: 0,
    feedback: ""
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadEvaluations();
    loadCompletedOrders();
  }, []);

  const loadEvaluations = async () => {
    try {
      // Como não temos tabela de avaliações, vamos simular dados
      const mockEvaluations: Evaluation[] = [
        {
          id: "1",
          order_id: "order-1",
          order_title: "Manutenção Ar Condicionado",
          client_name: "João Silva",
          technician_name: "Carlos Santos",
          rating: 5,
          punctuality_rating: 5,
          quality_rating: 4,
          communication_rating: 5,
          feedback: "Excelente atendimento! Técnico muito profissional e pontual.",
          created_at: new Date().toISOString()
        },
        {
          id: "2",
          order_id: "order-2",
          order_title: "Instalação Câmeras",
          client_name: "Maria Oliveira",
          technician_name: "Pedro Lima",
          rating: 4,
          punctuality_rating: 4,
          quality_rating: 5,
          communication_rating: 3,
          feedback: "Boa qualidade do serviço, mas poderia comunicar melhor o andamento.",
          created_at: new Date().toISOString()
        }
      ];

      setEvaluations(mockEvaluations);
    } catch (error) {
      console.error("Erro ao carregar avaliações:", error);
    }
  };

  const loadCompletedOrders = async () => {
    try {
      const { data } = await supabase
        .from("orders")
        .select(`
          id,
          title,
          client:profiles!orders_client_id_fkey(name),
          technician:profiles!orders_technician_id_fkey(name)
        `)
        .eq("status", "concluída")
        .order("created_at", { ascending: false })
        .limit(10);

      setCompletedOrders(data || []);
    } catch (error) {
      console.error("Erro ao carregar ordens concluídas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingClick = (field: keyof EvaluationForm, rating: number) => {
    setEvaluationForm(prev => ({
      ...prev,
      [field]: rating
    }));
  };

  const handleSubmitEvaluation = async () => {
    if (!selectedOrder || evaluationForm.rating === 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione uma ordem e dê uma avaliação geral.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      // Aqui normalmente salvaria no banco de dados
      // Por enquanto, vamos apenas simular o salvamento
      
      const newEvaluation: Evaluation = {
        id: Date.now().toString(),
        order_id: selectedOrder,
        order_title: completedOrders.find(o => o.id === selectedOrder)?.title || "",
        client_name: completedOrders.find(o => o.id === selectedOrder)?.client?.name || "",
        technician_name: completedOrders.find(o => o.id === selectedOrder)?.technician?.name || "",
        rating: evaluationForm.rating,
        punctuality_rating: evaluationForm.punctuality_rating,
        quality_rating: evaluationForm.quality_rating,
        communication_rating: evaluationForm.communication_rating,
        feedback: evaluationForm.feedback,
        created_at: new Date().toISOString()
      };

      setEvaluations(prev => [newEvaluation, ...prev]);

      // Reset form
      setEvaluationForm({
        order_id: "",
        rating: 0,
        punctuality_rating: 0,
        quality_rating: 0,
        communication_rating: 0,
        feedback: ""
      });
      setSelectedOrder("");

      toast({
        title: "Avaliação enviada",
        description: "Sua avaliação foi registrada com sucesso!"
      });
    } catch (error) {
      console.error("Erro ao salvar avaliação:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar avaliação. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarRating = (rating: number, onRate?: (rating: number) => void, readonly = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating 
                ? "fill-yellow-400 text-yellow-400" 
                : "text-gray-300"
            } ${!readonly && onRate ? "cursor-pointer hover:fill-yellow-300" : ""}`}
            onClick={() => !readonly && onRate && onRate(star)}
          />
        ))}
      </div>
    );
  };

  const getAverageRating = () => {
    if (evaluations.length === 0) return 0;
    const sum = evaluations.reduce((acc, evaluation) => acc + evaluation.rating, 0);
    return (sum / evaluations.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando avaliações...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Sistema de Avaliação</h2>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAverageRating()}</div>
            <div className="flex mt-1">
              {renderStarRating(Number(getAverageRating()), undefined, true)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Avaliações</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{evaluations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfação</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {evaluations.length > 0 
                ? Math.round((evaluations.filter(e => e.rating >= 4).length / evaluations.length) * 100)
                : 0
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              Avaliações 4+ estrelas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Excelência</CardTitle>
            <Award className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {evaluations.length > 0 
                ? Math.round((evaluations.filter(e => e.rating === 5).length / evaluations.length) * 100)
                : 0
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              Avaliações 5 estrelas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Formulário de Nova Avaliação */}
      <Card>
        <CardHeader>
          <CardTitle>Nova Avaliação</CardTitle>
          <CardDescription>
            Avalie um serviço concluído
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Ordem de Serviço</Label>
            <select 
              className="w-full mt-1 p-2 border rounded-md"
              value={selectedOrder}
              onChange={(e) => {
                setSelectedOrder(e.target.value);
                setEvaluationForm(prev => ({ ...prev, order_id: e.target.value }));
              }}
            >
              <option value="">Selecione uma ordem concluída</option>
              {completedOrders.map(order => (
                <option key={order.id} value={order.id}>
                  {order.title} - {order.client?.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Avaliação Geral</Label>
              <div className="mt-1">
                {renderStarRating(evaluationForm.rating, (rating) => 
                  handleRatingClick('rating', rating)
                )}
              </div>
            </div>

            <div>
              <Label>Pontualidade</Label>
              <div className="mt-1">
                {renderStarRating(evaluationForm.punctuality_rating, (rating) => 
                  handleRatingClick('punctuality_rating', rating)
                )}
              </div>
            </div>

            <div>
              <Label>Qualidade</Label>
              <div className="mt-1">
                {renderStarRating(evaluationForm.quality_rating, (rating) => 
                  handleRatingClick('quality_rating', rating)
                )}
              </div>
            </div>

            <div>
              <Label>Comunicação</Label>
              <div className="mt-1">
                {renderStarRating(evaluationForm.communication_rating, (rating) => 
                  handleRatingClick('communication_rating', rating)
                )}
              </div>
            </div>
          </div>

          <div>
            <Label>Comentários (opcional)</Label>
            <Textarea
              placeholder="Deixe seu feedback sobre o atendimento..."
              value={evaluationForm.feedback}
              onChange={(e) => setEvaluationForm(prev => ({ 
                ...prev, 
                feedback: e.target.value 
              }))}
              className="mt-1"
            />
          </div>

          <Button 
            onClick={handleSubmitEvaluation}
            disabled={submitting || !selectedOrder || evaluationForm.rating === 0}
          >
            {submitting ? "Enviando..." : "Enviar Avaliação"}
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Avaliações */}
      <Card>
        <CardHeader>
          <CardTitle>Avaliações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ordem</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Técnico</TableHead>
                <TableHead>Avaliação</TableHead>
                <TableHead>Detalhes</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evaluations.map((evaluation) => (
                <TableRow key={evaluation.id}>
                  <TableCell className="font-medium">
                    {evaluation.order_title}
                  </TableCell>
                  <TableCell>{evaluation.client_name}</TableCell>
                  <TableCell>{evaluation.technician_name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{evaluation.rating}.0</span>
                      {renderStarRating(evaluation.rating, undefined, true)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-xs">
                        Pontualidade: {renderStarRating(evaluation.punctuality_rating, undefined, true)}
                      </div>
                      <div className="text-xs">
                        Qualidade: {renderStarRating(evaluation.quality_rating, undefined, true)}
                      </div>
                      <div className="text-xs">
                        Comunicação: {renderStarRating(evaluation.communication_rating, undefined, true)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(evaluation.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}