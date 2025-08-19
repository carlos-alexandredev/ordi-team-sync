import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Module {
  id?: string;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  status: 'active' | 'inactive' | 'archived';
  visibility: 'internal' | 'public';
  is_core: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin_master
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'admin_master') {
      return new Response(
        JSON.stringify({ ok: false, error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const moduleId = pathParts[3];
    const action = pathParts[4];

    console.log('Method:', req.method, 'PathParts:', pathParts, 'ModuleId:', moduleId, 'Action:', action);

    switch (req.method) {
      case 'GET':
        if (moduleId && !action) {
          // Get single module
          const { data, error } = await supabaseClient
            .from('modules')
            .select(`
              *,
              module_versions (*),
              module_dependencies (
                id,
                depends_on_module:depends_on_module_id (
                  id, name, slug
                )
              ),
              module_settings (*),
              module_permissions (*)
            `)
            .eq('id', moduleId)
            .is('deleted_at', null)
            .single();

          if (error) {
            console.error('Error fetching module:', error);
            return new Response(
              JSON.stringify({ ok: false, error: error.message }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ ok: true, data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          // List modules with filters
          const page = parseInt(url.searchParams.get('page') || '1');
          const limit = parseInt(url.searchParams.get('limit') || '10');
          const search = url.searchParams.get('search');
          const status = url.searchParams.get('status');
          const category = url.searchParams.get('category');

          let query = supabaseClient
            .from('modules')
            .select('*', { count: 'exact' })
            .is('deleted_at', null);

          if (search) {
            query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%,description.ilike.%${search}%`);
          }
          if (status) {
            query = query.eq('status', status);
          }
          if (category) {
            query = query.eq('category', category);
          }

          const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

          if (error) {
            console.error('Error fetching modules:', error);
            return new Response(
              JSON.stringify({ ok: false, error: error.message }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ 
              ok: true, 
              data, 
              pagination: {
                page,
                limit,
                total: count || 0,
                pages: Math.ceil((count || 0) / limit)
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

      case 'POST':
        if (moduleId && action === 'activate') {
          // Activate module
          const { data, error } = await supabaseClient
            .from('modules')
            .update({ 
              status: 'active',
              updated_by: user.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', moduleId)
            .select()
            .single();

          if (error) {
            console.error('Error activating module:', error);
            return new Response(
              JSON.stringify({ ok: false, error: error.message }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ ok: true, data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else if (moduleId && action === 'deactivate') {
          // Deactivate module
          const { data, error } = await supabaseClient
            .from('modules')
            .update({ 
              status: 'inactive',
              updated_by: user.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', moduleId)
            .select()
            .single();

          if (error) {
            console.error('Error deactivating module:', error);
            return new Response(
              JSON.stringify({ ok: false, error: error.message }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ ok: true, data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else if (moduleId && action === 'versions') {
          // Create new version
          const body = await req.json();
          const { semver, changelog } = body;

          const { data, error } = await supabaseClient
            .from('module_versions')
            .insert({
              module_id: moduleId,
              semver,
              changelog
            })
            .select()
            .single();

          if (error) {
            console.error('Error creating version:', error);
            return new Response(
              JSON.stringify({ ok: false, error: error.message }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ ok: true, data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          // Create new module
          const body = await req.json() as Module;
          
          // Generate slug if not provided
          if (!body.slug && body.name) {
            const { data: slugData } = await supabaseClient
              .rpc('generate_slug', { input_name: body.name });
            body.slug = slugData || body.name.toLowerCase().replace(/\s+/g, '-');
          }

          const { data, error } = await supabaseClient
            .from('modules')
            .insert({
              ...body,
              created_by: user.id,
              updated_by: user.id
            })
            .select()
            .single();

          if (error) {
            console.error('Error creating module:', error);
            return new Response(
              JSON.stringify({ ok: false, error: error.message }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ ok: true, data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

      case 'PATCH':
        if (moduleId) {
          const body = await req.json() as Partial<Module>;
          
          const { data, error } = await supabaseClient
            .from('modules')
            .update({
              ...body,
              updated_by: user.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', moduleId)
            .select()
            .single();

          if (error) {
            console.error('Error updating module:', error);
            return new Response(
              JSON.stringify({ ok: false, error: error.message }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ ok: true, data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        break;

      case 'DELETE':
        if (moduleId) {
          const isHardDelete = url.searchParams.get('hard') === 'true';
          
          if (isHardDelete) {
            // Check if module has dependencies or is core
            const { data: module } = await supabaseClient
              .from('modules')
              .select('is_core')
              .eq('id', moduleId)
              .single();

            if (module?.is_core) {
              return new Response(
                JSON.stringify({ ok: false, error: 'Cannot hard delete core modules' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }

            const { data: dependencies } = await supabaseClient
              .from('module_dependencies')
              .select('id')
              .eq('depends_on_module_id', moduleId);

            if (dependencies && dependencies.length > 0) {
              return new Response(
                JSON.stringify({ ok: false, error: 'Cannot delete module with dependencies' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }

            // Hard delete
            const { error } = await supabaseClient
              .from('modules')
              .delete()
              .eq('id', moduleId);

            if (error) {
              console.error('Error hard deleting module:', error);
              return new Response(
                JSON.stringify({ ok: false, error: error.message }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          } else {
            // Soft delete
            const { error } = await supabaseClient
              .from('modules')
              .update({ 
                deleted_at: new Date().toISOString(),
                updated_by: user.id
              })
              .eq('id', moduleId);

            if (error) {
              console.error('Error soft deleting module:', error);
              return new Response(
                JSON.stringify({ ok: false, error: error.message }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          }

          return new Response(
            JSON.stringify({ ok: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        break;

      default:
        return new Response(
          JSON.stringify({ ok: false, error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify({ ok: false, error: 'Invalid request' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ ok: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});