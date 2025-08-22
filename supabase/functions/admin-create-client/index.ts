import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompanyData {
  name: string;
  fantasy_name?: string;
  cnpj: string;
  responsible_name: string;
  phone?: string;
  email: string;
  address?: string;
}

interface AdminData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

interface RequestBody {
  company: CompanyData;
  admin: AdminData;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const supabaseServiceRole = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get auth header and verify user is admin_master
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Verify user authentication and role
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Check if user is admin_master (using service role to bypass RLS)
    console.log('Checking user role for:', user.id);
    const { data: profile, error: profileError } = await supabaseServiceRole
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    console.log('Profile query result:', { profile, profileError });

    if (profileError || profile?.role !== 'admin_master') {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Only admin_master can create clients.' }),
        { 
          status: 403, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Parse request body
    const { company, admin }: RequestBody = await req.json();

    // Validate required fields
    if (!company.name || !company.cnpj || !company.responsible_name || !company.email) {
      return new Response(
        JSON.stringify({ error: 'Missing required company fields' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    if (!admin.name || !admin.email || !admin.password) {
      return new Response(
        JSON.stringify({ error: 'Missing required admin fields' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Validate CNPJ format (basic validation)
    const cleanCNPJ = company.cnpj.replace(/\D/g, '');
    if (cleanCNPJ.length !== 14) {
      return new Response(
        JSON.stringify({ error: 'Invalid CNPJ format' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(company.email) || !emailRegex.test(admin.email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Check if CNPJ already exists
    const { data: existingCompany } = await supabaseServiceRole
      .from('companies')
      .select('id')
      .eq('cnpj', company.cnpj)
      .single();

    if (existingCompany) {
      return new Response(
        JSON.stringify({ error: 'CNPJ already registered' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // Check if admin email already exists
    const { data: existingUser } = await supabaseServiceRole.auth.admin.listUsers();
    const emailExists = existingUser.users.some(u => u.email === admin.email);

    if (emailExists) {
      return new Response(
        JSON.stringify({ error: 'Admin email already registered' }),
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    console.log('Creating company and admin for:', company.name);

    // 1. Create company first (using service role to bypass RLS)
    const { data: newCompany, error: companyError } = await supabaseServiceRole
      .from('companies')
      .insert([{
        name: company.name,
        fantasy_name: company.fantasy_name || null,
        cnpj: company.cnpj,
        responsible_name: company.responsible_name,
        phone: company.phone || null,
        email: company.email,
        address: company.address || null,
        active: true
      }])
      .select()
      .single();

    if (companyError) {
      console.error('Error creating company:', companyError);
      return new Response(
        JSON.stringify({ error: 'Failed to create company: ' + companyError.message }),
        { 
          status: 500, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    console.log('Company created:', newCompany.id);

    try {
      // 2. Create admin user in auth
      const { data: newUser, error: userError } = await supabaseServiceRole.auth.admin.createUser({
        email: admin.email,
        password: admin.password,
        email_confirm: true,
        user_metadata: {
          name: admin.name,
          role: 'admin_cliente'
        }
      });

      if (userError) {
        // Rollback: delete company if user creation fails
        await supabaseServiceRole
          .from('companies')
          .delete()
          .eq('id', newCompany.id);

        console.error('Error creating user:', userError);
        return new Response(
          JSON.stringify({ error: 'Failed to create admin user: ' + userError.message }),
          { 
            status: 500, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }

      console.log('User created:', newUser.user?.id);

      // 3. Create/update profile (using service role to bypass RLS)
      const { error: profileError } = await supabaseServiceRole
        .from('profiles')
        .upsert([{
          user_id: newUser.user!.id,
          name: admin.name,
          email: admin.email,
          phone: admin.phone || null,
          role: 'admin_cliente',
          company_id: newCompany.id,
          active: true
        }]);

      if (profileError) {
        // Rollback: delete user and company
        await supabaseServiceRole.auth.admin.deleteUser(newUser.user!.id);
        await supabaseServiceRole
          .from('companies')
          .delete()
          .eq('id', newCompany.id);

        console.error('Error creating profile:', profileError);
        return new Response(
          JSON.stringify({ error: 'Failed to create admin profile: ' + profileError.message }),
          { 
            status: 500, 
            headers: { 'Content-Type': 'application/json', ...corsHeaders } 
          }
        );
      }

      console.log('Profile created successfully');

      return new Response(
        JSON.stringify({ 
          message: 'Client created successfully',
          company: newCompany,
          admin: {
            id: newUser.user!.id,
            email: admin.email,
            name: admin.name
          }
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );

    } catch (error: any) {
      // Rollback company creation if anything fails
      await supabaseServiceRole
        .from('companies')
        .delete()
        .eq('id', newCompany.id);

      throw error;
    }

  } catch (error: any) {
    console.error('Error in admin-create-client function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);