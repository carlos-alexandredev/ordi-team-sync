import React from 'react';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

interface ConversationMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp?: string;
}

const ConversationPDFGenerator = () => {
  // Dados da conversa baseados no session replay
  const conversationData: ConversationMessage[] = [
    {
      role: 'user',
      content: 'Approved SQL execution.',
      timestamp: 'Início da conversa'
    },
    {
      role: 'ai',
      content: 'Created UI components for role management (RoleCard.tsx, RoleFormModal.tsx), updated RBACManager.tsx, created UserPermissions.tsx, and handled Supabase migrations/types.'
    },
    {
      role: 'user',
      content: 'Reported TypeError: roles?.find is not a function.'
    },
    {
      role: 'ai',
      content: 'Fixed the error in RBACManager.tsx by correcting the getRoleBadge function\'s logic.'
    },
    {
      role: 'user',
      content: 'Como fazer uma confirmação de e-mail'
    },
    {
      role: 'ai',
      content: 'Provided a detailed guide for email confirmation using Supabase, including frontend setup, custom email templates, and backend configurations.'
    },
    {
      role: 'user',
      content: 'Alguns erros (Some errors) with attached images.'
    },
    {
      role: 'ai',
      content: 'Fixed RLS policy violations for role management tables and created a migration.'
    },
    {
      role: 'user',
      content: 'Approved SQL execution.'
    },
    {
      role: 'ai',
      content: 'Fixed RLS policy issues, improved error handling, and added debug logs in RBAC components.'
    },
    {
      role: 'user',
      content: 'carlos.alexandress@utlook.com é adm master'
    },
    {
      role: 'ai',
      content: 'Planned to configure the user as admin master, noting the user didn\'t exist and would require a migration.'
    },
    {
      role: 'user',
      content: 'Corrected the email to "carlos.alexandress@outlook.com".'
    },
    {
      role: 'ai',
      content: 'Updated the user\'s email and set them as admin master, creating a migration.'
    },
    {
      role: 'user',
      content: 'Approved SQL execution.'
    },
    {
      role: 'ai',
      content: 'Refined the migration to correctly update the user\'s email and role.'
    },
    {
      role: 'user',
      content: 'Approved SQL execution.'
    },
    {
      role: 'ai',
      content: 'Confirmed the successful update of the user\'s email and admin master status.'
    },
    {
      role: 'user',
      content: 'o side bar nao esta completo com os modulos para o user adm master'
    },
    {
      role: 'ai',
      content: 'Identified the issue as an incorrect role (\'admin\' instead of \'admin_master\') in the database and will correct it.'
    },
    {
      role: 'user',
      content: 'gere um pdf com toda nossa conversa'
    },
    {
      role: 'ai',
      content: 'Criando gerador de PDF da conversa com as bibliotecas jsPDF e html2canvas.'
    }
  ];

  const generatePDF = () => {
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const lineHeight = 6;
      let currentY = margin;

      // Título
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Conversa - Sistema de Gestão', margin, currentY);
      currentY += lineHeight * 2;

      // Data
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, currentY);
      currentY += lineHeight * 2;

      // Linha separadora
      pdf.line(margin, currentY, pageWidth - margin, currentY);
      currentY += lineHeight;

      // Mensagens da conversa
      conversationData.forEach((message, index) => {
        // Verificar se precisa de nova página
        if (currentY > pageHeight - 30) {
          pdf.addPage();
          currentY = margin;
        }

        // Role/Usuário
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        const roleText = message.role === 'user' ? 'USUÁRIO:' : 'IA:';
        pdf.text(roleText, margin, currentY);
        
        if (message.timestamp) {
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`(${message.timestamp})`, margin + 25, currentY);
        }
        
        currentY += lineHeight;

        // Conteúdo da mensagem
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        
        // Quebrar texto em linhas
        const textLines = pdf.splitTextToSize(message.content, pageWidth - margin * 2);
        
        textLines.forEach((line: string) => {
          if (currentY > pageHeight - 20) {
            pdf.addPage();
            currentY = margin;
          }
          pdf.text(line, margin, currentY);
          currentY += lineHeight;
        });

        currentY += lineHeight; // Espaço entre mensagens

        // Linha separadora a cada 3 mensagens
        if ((index + 1) % 3 === 0) {
          pdf.line(margin, currentY, pageWidth - margin, currentY);
          currentY += lineHeight;
        }
      });

      // Rodapé
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 20, pageHeight - 10);
      }

      // Salvar PDF
      const fileName = `conversa_sistema_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF. Tente novamente.');
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 border rounded-lg">
      <div>
        <h3 className="text-lg font-semibold">Exportar Conversa</h3>
        <p className="text-sm text-muted-foreground">
          Gere um PDF com toda a conversa entre você e a IA
        </p>
      </div>
      
      <Button onClick={generatePDF} className="w-fit">
        <FileDown className="w-4 h-4 mr-2" />
        Gerar PDF da Conversa
      </Button>
    </div>
  );
};

export default ConversationPDFGenerator;