import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: 'call_created' | 'order_created' | 'order_assigned' | 'order_completed';
  recordId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, recordId }: NotificationRequest = await req.json();
    console.log(`Processing notification: ${type} for record ${recordId}`);

    let emailData;
    
    switch (type) {
      case 'call_created':
        emailData = await handleCallCreated(recordId);
        break;
      case 'order_created':
        emailData = await handleOrderCreated(recordId);
        break;
      case 'order_assigned':
        emailData = await handleOrderAssigned(recordId);
        break;
      case 'order_completed':
        emailData = await handleOrderCompleted(recordId);
        break;
      default:
        throw new Error(`Unknown notification type: ${type}`);
    }

    if (emailData) {
      console.log(`Sending email to: ${emailData.to}`);
      const emailResponse = await resend.emails.send(emailData);
      console.log("Email sent successfully:", emailResponse);
      return new Response(JSON.stringify({ success: true, emailResponse }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ success: true, message: "No email sent" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-notification-email function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

async function handleCallCreated(callId: string) {
  const { data: call, error } = await supabase
    .from('calls')
    .select(`
      *,
      client_profile: profiles!calls_client_id_fkey(name, email),
      company: companies(name, responsible_name, email)
    `)
    .eq('id', callId)
    .single();

  if (error || !call) {
    console.error("Error fetching call:", error);
    return null;
  }

  // Enviar para o responsável da empresa
  const adminEmail = call.company?.email;
  if (!adminEmail) {
    console.log("No admin email found for company");
    return null;
  }

  return {
    from: "Sistema Ordi <onboarding@resend.dev>",
    to: [adminEmail],
    subject: `🆘 Novo Chamado: ${call.title}`,
    html: createCallCreatedTemplate(call),
  };
}

async function handleOrderCreated(orderId: string) {
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      client_profile: profiles!orders_client_id_fkey(name, email),
      company: companies(name, responsible_name, email),
      technician_profile: profiles!orders_technician_id_fkey(name, email)
    `)
    .eq('id', orderId)
    .single();

  if (error || !order) {
    console.error("Error fetching order:", error);
    return null;
  }

  // Enviar para o cliente
  const clientEmail = order.client_profile?.email;
  if (!clientEmail) {
    console.log("No client email found");
    return null;
  }

  return {
    from: "Sistema Ordi <onboarding@resend.dev>",
    to: [clientEmail],
    subject: `✅ Ordem de Serviço Criada: ${order.title}`,
    html: createOrderCreatedTemplate(order),
  };
}

async function handleOrderAssigned(orderId: string) {
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      client_profile: profiles!orders_client_id_fkey(name, email),
      company: companies(name),
      technician_profile: profiles!orders_technician_id_fkey(name, email)
    `)
    .eq('id', orderId)
    .single();

  if (error || !order || !order.technician_profile?.email) {
    console.error("Error fetching order or no technician email:", error);
    return null;
  }

  return {
    from: "Sistema Ordi <onboarding@resend.dev>",
    to: [order.technician_profile.email],
    subject: `🔧 Nova Ordem Atribuída: ${order.title}`,
    html: createOrderAssignedTemplate(order),
  };
}

async function handleOrderCompleted(orderId: string) {
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      client_profile: profiles!orders_client_id_fkey(name, email),
      company: companies(name),
      technician_profile: profiles!orders_technician_id_fkey(name, email)
    `)
    .eq('id', orderId)
    .single();

  if (error || !order) {
    console.error("Error fetching order:", error);
    return null;
  }

  const clientEmail = order.client_profile?.email;
  if (!clientEmail) {
    console.log("No client email found");
    return null;
  }

  return {
    from: "Sistema Ordi <onboarding@resend.dev>",
    to: [clientEmail],
    subject: `✅ Ordem de Serviço Concluída: ${order.title}`,
    html: createOrderCompletedTemplate(order),
  };
}

function createCallCreatedTemplate(call: any): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h1 style="color: #dc3545; margin: 0;">🆘 Novo Chamado Aberto</h1>
      </div>
      
      <div style="background-color: white; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px;">
        <h2 style="color: #495057;">${call.title}</h2>
        <p style="color: #6c757d; margin-bottom: 20px;">${call.description}</p>
        
        <div style="margin-bottom: 15px;">
          <strong>Cliente:</strong> ${call.client_profile?.name || 'N/A'}
        </div>
        <div style="margin-bottom: 15px;">
          <strong>Empresa:</strong> ${call.company?.name || 'N/A'}
        </div>
        <div style="margin-bottom: 15px;">
          <strong>Prioridade:</strong> 
          <span style="background-color: ${getPriorityColor(call.priority)}; color: white; padding: 4px 8px; border-radius: 4px;">
            ${call.priority}
          </span>
        </div>
        <div style="margin-bottom: 15px;">
          <strong>Data de Abertura:</strong> ${new Date(call.created_at).toLocaleString('pt-BR')}
        </div>
        
        <div style="margin-top: 30px; padding: 15px; background-color: #e7f3ff; border-radius: 6px;">
          <p style="margin: 0; color: #0066cc;">
            ℹ️ Acesse o sistema para visualizar detalhes completos e tomar as ações necessárias.
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px;">
        Sistema Ordi - Gestão de Chamados e Ordens de Serviço
      </div>
    </div>
  `;
}

function createOrderCreatedTemplate(order: any): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h1 style="color: #28a745; margin: 0;">✅ Ordem de Serviço Criada</h1>
      </div>
      
      <div style="background-color: white; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px;">
        <h2 style="color: #495057;">${order.title}</h2>
        <p style="color: #6c757d; margin-bottom: 20px;">${order.description}</p>
        
        <div style="margin-bottom: 15px;">
          <strong>Cliente:</strong> ${order.client_profile?.name || 'N/A'}
        </div>
        <div style="margin-bottom: 15px;">
          <strong>Empresa:</strong> ${order.company?.name || 'N/A'}
        </div>
        <div style="margin-bottom: 15px;">
          <strong>Prioridade:</strong> 
          <span style="background-color: ${getPriorityColor(order.priority)}; color: white; padding: 4px 8px; border-radius: 4px;">
            ${order.priority}
          </span>
        </div>
        <div style="margin-bottom: 15px;">
          <strong>Status:</strong> 
          <span style="background-color: #6c757d; color: white; padding: 4px 8px; border-radius: 4px;">
            ${order.status}
          </span>
        </div>
        ${order.scheduled_date ? `
        <div style="margin-bottom: 15px;">
          <strong>Data Agendada:</strong> ${new Date(order.scheduled_date).toLocaleString('pt-BR')}
        </div>
        ` : ''}
        ${order.technician_profile ? `
        <div style="margin-bottom: 15px;">
          <strong>Técnico Responsável:</strong> ${order.technician_profile.name}
        </div>
        ` : ''}
        
        <div style="margin-top: 30px; padding: 15px; background-color: #d4edda; border-radius: 6px;">
          <p style="margin: 0; color: #155724;">
            ✅ Sua ordem de serviço foi criada e está sendo processada. Você receberá atualizações sobre o andamento.
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px;">
        Sistema Ordi - Gestão de Chamados e Ordens de Serviço
      </div>
    </div>
  `;
}

function createOrderAssignedTemplate(order: any): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h1 style="color: #007bff; margin: 0;">🔧 Nova Ordem Atribuída</h1>
      </div>
      
      <div style="background-color: white; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px;">
        <h2 style="color: #495057;">${order.title}</h2>
        <p style="color: #6c757d; margin-bottom: 20px;">${order.description}</p>
        
        <div style="margin-bottom: 15px;">
          <strong>Cliente:</strong> ${order.client_profile?.name || 'N/A'}
        </div>
        <div style="margin-bottom: 15px;">
          <strong>Empresa:</strong> ${order.company?.name || 'N/A'}
        </div>
        <div style="margin-bottom: 15px;">
          <strong>Prioridade:</strong> 
          <span style="background-color: ${getPriorityColor(order.priority)}; color: white; padding: 4px 8px; border-radius: 4px;">
            ${order.priority}
          </span>
        </div>
        ${order.scheduled_date ? `
        <div style="margin-bottom: 15px;">
          <strong>Data Agendada:</strong> ${new Date(order.scheduled_date).toLocaleString('pt-BR')}
        </div>
        ` : ''}
        
        <div style="margin-top: 30px; padding: 15px; background-color: #cce5ff; border-radius: 6px;">
          <p style="margin: 0; color: #004085;">
            🔧 Esta ordem foi atribuída a você. Acesse o sistema para visualizar detalhes e iniciar o trabalho.
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px;">
        Sistema Ordi - Gestão de Chamados e Ordens de Serviço
      </div>
    </div>
  `;
}

function createOrderCompletedTemplate(order: any): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h1 style="color: #28a745; margin: 0;">✅ Ordem de Serviço Concluída</h1>
      </div>
      
      <div style="background-color: white; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px;">
        <h2 style="color: #495057;">${order.title}</h2>
        <p style="color: #6c757d; margin-bottom: 20px;">${order.description}</p>
        
        <div style="margin-bottom: 15px;">
          <strong>Técnico:</strong> ${order.technician_profile?.name || 'N/A'}
        </div>
        <div style="margin-bottom: 15px;">
          <strong>Data de Conclusão:</strong> ${order.execution_date ? new Date(order.execution_date).toLocaleString('pt-BR') : 'Agora'}
        </div>
        
        <div style="margin-top: 30px; padding: 15px; background-color: #d4edda; border-radius: 6px;">
          <p style="margin: 0; color: #155724;">
            🎉 Sua ordem de serviço foi concluída com sucesso! Se tiver alguma dúvida ou feedback, entre em contato conosco.
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px;">
        Sistema Ordi - Gestão de Chamados e Ordens de Serviço
      </div>
    </div>
  `;
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'alta': return '#dc3545';
    case 'média': return '#ffc107';
    case 'baixa': return '#28a745';
    default: return '#6c757d';
  }
}

serve(handler);