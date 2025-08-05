import React, { useState, useMemo, useCallback } from "react";
import { AuthLayout } from "@/components/AuthLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Question {
  id: string;
  title: string;
  description: string;
  required: boolean;
  multipleChoice: boolean;
  options: string[];
}

const PesquisaSatisfacao = () => {
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: "1",
      title: "Pergunta 1",
      description: "",
      required: false,
      multipleChoice: false,
      options: []
    }
  ]);

  const addQuestion = useCallback(() => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      title: `Pergunta ${questions.length + 1}`,
      description: "",
      required: false,
      multipleChoice: false,
      options: []
    };
    setQuestions(prev => [...prev, newQuestion]);
  }, [questions.length]);

  const removeQuestion = useCallback((id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  }, []);

  const updateQuestion = useCallback((id: string, field: keyof Question, value: any) => {
    setQuestions(prev => prev.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  }, []);

  const addOption = useCallback((questionId: string) => {
    setQuestions(prev => prev.map(q => 
      q.id === questionId 
        ? { ...q, options: [...q.options, ''] }
        : q
    ));
  }, []);

  return (
    <AuthLayout>
      <ProtectedRoute allowedRoles={["admin_master", "admin", "gestor"]}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary">Pesquisa de Satisfação</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="bg-purple-600 text-white hover:bg-purple-700">
                Tutorial
              </Button>
              <Button className="bg-green-600 hover:bg-green-700">
                Salvar
              </Button>
              <Button variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">
                Visualizar formulário
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {questions.map((question, index) => (
              <Card key={question.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-primary">{question.title}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQuestion(question.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`desc-${question.id}`}>Descrição</Label>
                    <Textarea
                      id={`desc-${question.id}`}
                      value={question.description}
                      onChange={(e) => updateQuestion(question.id, 'description', e.target.value)}
                      placeholder="Digite a descrição da pergunta"
                      className="mt-1"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`required-${question.id}`}
                          checked={question.required}
                          onCheckedChange={(checked) => 
                            updateQuestion(question.id, 'required', checked)
                          }
                        />
                        <Label htmlFor={`required-${question.id}`}>Obrigatória</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`multiple-${question.id}`}
                          checked={question.multipleChoice}
                          onCheckedChange={(checked) => 
                            updateQuestion(question.id, 'multipleChoice', checked)
                          }
                        />
                        <Label htmlFor={`multiple-${question.id}`} className="text-blue-600">
                          Múltipla escolha
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-blue-600">Itens da pergunta {index + 1}</Label>
                    </div>
                    
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <Input
                          key={optionIndex}
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...question.options];
                            newOptions[optionIndex] = e.target.value;
                            updateQuestion(question.id, 'options', newOptions);
                          }}
                          placeholder="Digite a opção de resposta"
                        />
                      ))}
                      
                      <Button
                        variant="outline"
                        onClick={() => addOption(question.id)}
                        className="w-full text-green-600 border-green-600 hover:bg-green-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar
                      </Button>
                    </div>
                    
                    <Input
                      placeholder="Insira aqui uma nova opção de resposta"
                      className="mt-2 text-gray-500"
                    />
                  </div>
                </div>
              </Card>
            ))}

            <Button
              onClick={addQuestion}
              variant="outline"
              className="w-full text-primary border-primary hover:bg-primary/10"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Pergunta
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    </AuthLayout>
  );
};

export default PesquisaSatisfacao;