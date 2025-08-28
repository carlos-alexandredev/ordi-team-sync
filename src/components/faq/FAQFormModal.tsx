import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useActivityLogger } from "@/hooks/useActivityLogger";
import { useQuery } from "@tanstack/react-query";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  tags: string[] | null;
  status: string;
}

interface FAQFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  faq?: FAQ | null;
}

export function FAQFormModal({ isOpen, onClose, faq }: FAQFormModalProps) {
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    category: "",
    status: "published",
    tags: [] as string[],
  });
  const [newTag, setNewTag] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();

  const { data: categories = [] } = useQuery({
    queryKey: ["faq-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("faq_categories").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    if (faq) {
      setFormData({
        question: faq.question,
        answer: faq.answer,
        category: faq.category || "",
        status: faq.status,
        tags: faq.tags || [],
      });
    } else {
      setFormData({
        question: "",
        answer: "",
        category: "",
        status: "published",
        tags: [],
      });
    }
  }, [faq, isOpen]);

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get current user profile for company_id
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, company_id")
        .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile) {
        throw new Error("Perfil do usuário não encontrado");
      }

      const faqData = {
        question: formData.question,
        answer: formData.answer,
        category: formData.category || null,
        tags: formData.tags.length > 0 ? formData.tags : null,
        status: formData.status,
        company_id: profile.company_id,
        [faq ? "updated_by" : "created_by"]: profile.id,
      };

      let result;
      if (faq) {
        result = await supabase
          .from("faqs")
          .update(faqData)
          .eq("id", faq.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from("faqs")
          .insert(faqData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      await logActivity({
        action: faq ? "update_faq" : "create_faq",
        table_name: "faqs",
        record_id: result.data.id,
        details: {
          question: formData.question.substring(0, 100),
          category: formData.category,
          status: formData.status
        }
      });

      toast({
        title: `FAQ ${faq ? "atualizada" : "criada"} com sucesso`,
      });

      onClose();
    } catch (error: any) {
      toast({
        title: `Erro ao ${faq ? "atualizar" : "criar"} FAQ`,
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {faq ? "Editar FAQ" : "Nova FAQ"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="question">Pergunta *</Label>
            <Textarea
              id="question"
              value={formData.question}
              onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
              placeholder="Digite a pergunta frequente..."
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="answer">Resposta *</Label>
            <Textarea
              id="answer"
              value={formData.answer}
              onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
              placeholder="Digite a resposta detalhada..."
              required
              rows={6}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sem categoria</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Publicada</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="archived">Arquivada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="tags">Tags</Label>
            <div className="mt-1 space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Digite uma tag..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddTag} variant="outline">
                  Adicionar
                </Button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {tag}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : faq ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}