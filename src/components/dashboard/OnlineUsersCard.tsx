import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export function OnlineUsersCard() {
  const [onlineCount, setOnlineCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchOnlineUsers = async () => {
    try {
      const { data: count, error } = await supabase.rpc('count_online_users');
      
      if (error) {
        console.error('Error counting online users:', error);
        return;
      }

      setOnlineCount(count || 0);
    } catch (error) {
      console.error('Error in fetchOnlineUsers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnlineUsers();

    // Atualizar a cada 60 segundos
    const interval = setInterval(fetchOnlineUsers, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Usuários Online</CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-green-600">
          {loading ? '...' : onlineCount}
        </div>
        <p className="text-xs text-muted-foreground">
          {onlineCount === 1 ? 'usuário ativo' : 'usuários ativos'}
        </p>
        <div className="mt-2">
          <div className={`inline-flex items-center gap-1 text-xs ${
            onlineCount > 0 ? 'text-green-600' : 'text-muted-foreground'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              onlineCount > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`} />
            {onlineCount > 0 ? 'Sistema ativo' : 'Nenhum usuário online'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}