import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AuthLayout } from '@/components/AuthLayout';
import { supabase } from '@/integrations/supabase/client';
import { Users, Clock, Activity, Monitor } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface OnlineUser {
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: string;
  login_time: string;
  last_activity: string;
  last_page?: string;
  ip_address?: unknown;
  session_duration: unknown;
  is_online: boolean;
}

const UsersOnline = () => {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [totalOnline, setTotalOnline] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchOnlineUsers = async () => {
    try {
      // Buscar usuários online
      const { data: users, error: usersError } = await supabase.rpc('get_online_users');
      
      if (usersError) {
        console.error('Error fetching online users:', usersError);
        return;
      }

      // Buscar total de usuários online
      const { data: count, error: countError } = await supabase.rpc('count_online_users');
      
      if (countError) {
        console.error('Error counting online users:', countError);
        return;
      }

      setOnlineUsers(users || []);
      setTotalOnline(count || 0);
    } catch (error) {
      console.error('Error in fetchOnlineUsers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnlineUsers();

    // Atualizar dados a cada 30 segundos
    const interval = setInterval(fetchOnlineUsers, 30000);

    return () => clearInterval(interval);
  }, []);

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      'admin_master': 'Admin Master',
      'admin': 'Administrador',
      'admin_cliente': 'Admin Cliente',
      'gestor': 'Gestor',
      'tecnico': 'Técnico',
      'cliente_final': 'Cliente',
    };
    return roles[role] || 'Usuário';
  };

  const getRoleBadgeVariant = (role: string) => {
    const variants: Record<string, any> = {
      'admin_master': 'destructive',
      'admin': 'default',
      'admin_cliente': 'secondary',
      'gestor': 'outline',
      'tecnico': 'secondary',
      'cliente_final': 'outline',
    };
    return variants[role] || 'outline';
  };

  const formatDuration = (pgInterval: string) => {
    // Parse PostgreSQL interval format
    if (!pgInterval) return '0 min';
    
    const regex = /(?:(\d+):)?(\d+):(\d+)(?:\.(\d+))?/;
    const match = pgInterval.match(regex);
    
    if (!match) return '0 min';
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes} min`;
  };

  const getStatusColor = (isOnline: boolean, lastActivity: string) => {
    if (!isOnline) return 'text-muted-foreground';
    
    const activityDate = new Date(lastActivity);
    const now = new Date();
    const diffMinutes = (now.getTime() - activityDate.getTime()) / (1000 * 60);
    
    if (diffMinutes < 2) return 'text-green-600';
    if (diffMinutes < 5) return 'text-yellow-600';
    return 'text-orange-600';
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["admin_master"]}>
        <AuthLayout>
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </div>
        </AuthLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["admin_master"]}>
      <AuthLayout>
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Usuários Online
            </h1>
            <p className="text-muted-foreground">
              Monitoramento em tempo real dos usuários ativos no sistema
            </p>
          </div>

          {/* Cards de Estatísticas */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuários Online</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{totalOnline}</div>
                <p className="text-xs text-muted-foreground">
                  Ativo nos últimos 5 minutos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sessões Ativas</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{onlineUsers.length}</div>
                <p className="text-xs text-muted-foreground">
                  Últimos 30 minutos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Última Atualização</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {format(new Date(), 'HH:mm')}
                </div>
                <p className="text-xs text-muted-foreground">
                  Atualização automática
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monitoramento</CardTitle>
                <Monitor className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">Ativo</div>
                <p className="text-xs text-muted-foreground">
                  Tempo real
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Usuários Online */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes dos Usuários Online</CardTitle>
              <CardDescription>
                Lista completa de usuários ativos e suas atividades recentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead>Login</TableHead>
                      <TableHead>Última Atividade</TableHead>
                      <TableHead>Tempo Online</TableHead>
                      <TableHead>Última Página</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {onlineUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="flex flex-col items-center space-y-2">
                            <Users className="h-8 w-8 text-muted-foreground" />
                            <p className="text-muted-foreground">Nenhum usuário online no momento</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      onlineUsers.map((user) => (
                        <TableRow key={user.user_id}>
                          <TableCell>
                            <div className={`w-2 h-2 rounded-full ${
                              user.is_online ? 'bg-green-500' : 'bg-gray-400'
                            }`} title={user.is_online ? 'Online' : 'Offline'} />
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{user.user_name}</p>
                              <p className="text-sm text-muted-foreground">{user.user_email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(user.user_role)}>
                              {getRoleLabel(user.user_role)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">
                                {format(new Date(user.login_time), 'HH:mm', { locale: ptBR })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(user.login_time), 'dd/MM', { locale: ptBR })}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className={`text-sm ${getStatusColor(user.is_online, user.last_activity)}`}>
                                {formatDistanceToNow(new Date(user.last_activity), { 
                                  addSuffix: true, 
                                  locale: ptBR 
                                })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(user.last_activity), 'HH:mm', { locale: ptBR })}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {formatDuration(user.session_duration as string)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-mono">
                              {user.last_page || '/'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-mono">
                              {user.ip_address as string || 'N/A'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </AuthLayout>
    </ProtectedRoute>
  );
};

export default UsersOnline;