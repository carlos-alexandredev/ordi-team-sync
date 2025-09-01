import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface SecurityCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  description: string;
}

export const SecurityDiagnostic: React.FC = () => {
  const [checks, setChecks] = useState<SecurityCheck[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runSecurityChecks = () => {
    setIsRunning(true);
    
    const securityChecks: SecurityCheck[] = [];

    // Verificar CSP
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    securityChecks.push({
      name: 'Content Security Policy',
      status: cspMeta ? 'pass' : 'fail',
      description: cspMeta ? 'CSP configurado corretamente' : 'CSP não encontrado'
    });

    // Verificar cookies de terceiros
    const cookies = document.cookie.split(';').map(c => c.trim());
    const suspiciousCookies = cookies.filter(cookie => 
      cookie.toLowerCase().includes('baidu') || 
      cookie.toLowerCase().includes('google') ||
      cookie.toLowerCase().includes('facebook')
    );
    
    securityChecks.push({
      name: 'Cookies de Terceiros',
      status: suspiciousCookies.length === 0 ? 'pass' : 'warn',
      description: suspiciousCookies.length === 0 
        ? 'Nenhum cookie suspeito detectado' 
        : `${suspiciousCookies.length} cookies de terceiros encontrados`
    });

    // Verificar recursos externos
    const externalImages = Array.from(document.querySelectorAll('img'))
      .filter(img => img.src.startsWith('http') && !img.src.includes(window.location.hostname));
    
    securityChecks.push({
      name: 'Recursos Externos',
      status: externalImages.length === 0 ? 'pass' : 'warn',
      description: externalImages.length === 0 
        ? 'Nenhuma imagem externa detectada' 
        : `${externalImages.length} imagens externas encontradas`
    });

    // Verificar HTTPS
    securityChecks.push({
      name: 'Conexão Segura',
      status: window.location.protocol === 'https:' ? 'pass' : 'warn',
      description: window.location.protocol === 'https:' 
        ? 'Conexão HTTPS ativa' 
        : 'Conexão não está usando HTTPS'
    });

    setChecks(securityChecks);
    setIsRunning(false);
  };

  useEffect(() => {
    runSecurityChecks();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'text-green-600';
      case 'warn': return 'text-yellow-600';
      case 'fail': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4" />;
      case 'warn': return <AlertTriangle className="h-4 w-4" />;
      case 'fail': return <AlertTriangle className="h-4 w-4" />;
      default: return null;
    }
  };

  // Só renderizar em desenvolvimento
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 bg-background/95 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Shield className="h-4 w-4" />
          Diagnóstico de Segurança
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {checks.map((check, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span className="truncate">{check.name}</span>
            <div className="flex items-center gap-1">
              <span className={getStatusColor(check.status)}>
                {getStatusIcon(check.status)}
              </span>
              <Badge 
                variant={check.status === 'pass' ? 'default' : 'destructive'}
                className="text-xs"
              >
                {check.status}
              </Badge>
            </div>
          </div>
        ))}
        
        <div className="pt-2 border-t">
          <Button 
            onClick={runSecurityChecks}
            disabled={isRunning}
            size="sm" 
            className="w-full"
          >
            {isRunning ? 'Verificando...' : 'Verificar Novamente'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};