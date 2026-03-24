
import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import {
  Play,
  Save,
  History,
  Database,
  Table,
  Columns,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Copy,
  Download,
  RefreshCw
} from 'lucide-react';

interface QueryResult {
  data?: any[];
  error?: string;
  executionTime: number;
  rowCount?: number;
}

interface QueryHistory {
  id: string;
  query: string;
  timestamp: Date;
  success: boolean;
  executionTime: number;
  rowCount?: number;
}

export const SQLEditor = () => {
  const [query, setQuery] = useState(`-- SQL Editor - Execute suas consultas aqui
-- Exemplo: SELECT * FROM profiles LIMIT 10;

SELECT 
  id,
  full_name,
  email,
  created_at
FROM profiles 
WHERE created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC
LIMIT 10;`);
  
  const [result, setResult] = useState<QueryResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [history, setHistory] = useState<QueryHistory[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableSchema, setTableSchema] = useState<any[]>([]);
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();

  // Temporary untyped DB wrapper until backend types are available
  const db = supabase as any;

  const tables = [
    'profiles', 'files', 'folders', 'file_shares', 'folder_shares',
    'messages', 'notifications', 'feedback', 'user_stats', 'user_presence'
  ];

  useEffect(() => {
    const savedHistory = localStorage.getItem('sql-editor-history');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const saveToHistory = (query: string, result: QueryResult, success: boolean) => {
    const historyItem: QueryHistory = {
      id: Date.now().toString(),
      query: query.trim(),
      timestamp: new Date(),
      success,
      executionTime: result.executionTime,
      rowCount: result.data?.length
    };

    const newHistory = [historyItem, ...history.slice(0, 49)]; // Keep last 50 queries
    setHistory(newHistory);
    localStorage.setItem('sql-editor-history', JSON.stringify(newHistory));
  };

  const executeQuery = async () => {
    if (!query.trim()) {
      toast({
        title: "Query vazia",
        description: "Digite uma consulta SQL para executar",
        variant: "destructive"
      });
      return;
    }

    setIsExecuting(true);
    const startTime = Date.now();

    try {
      const { data, error } = await db.rpc('execute_sql', {
        sql_query: query.trim()
      });

      const executionTime = Date.now() - startTime;

      if (error) {
        const result: QueryResult = {
          error: error.message,
          executionTime
        };
        setResult(result);
        saveToHistory(query, result, false);
        
        // Log to audit table (best-effort)
        await db.from('sql_audit_log').insert({
          query_text: query.trim(),
          success: false,
          error_message: error.message,
          row_count: 0
        });
        
        toast({
          title: "Erro na execução",
          description: error.message,
          variant: "destructive"
        });
      } else {
        const normalized = Array.isArray(data) ? data : (data ? [data] : []);
        const result: QueryResult = {
          data: normalized,
          executionTime,
          rowCount: normalized.length
        };
        setResult(result);
        saveToHistory(query, result, true);
        
        // Log to audit table (best-effort)
        await db.from('sql_audit_log').insert({
          query_text: query.trim(),
          success: true,
          row_count: result.rowCount
        });
        
        toast({
          title: "Query executada com sucesso",
          description: `${result.rowCount} linha(s) retornada(s) em ${executionTime}ms`
        });
      }
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      const result: QueryResult = {
        error: error.message || 'Erro desconhecido',
        executionTime
      };
      setResult(result);
      saveToHistory(query, result, false);

      // Log error to audit table (best-effort)
      await db.from('sql_audit_log').insert({
        query_text: query.trim(),
        success: false,
        error_message: error.message || 'Erro desconhecido',
        row_count: 0
      });

      toast({
        title: "Erro na execução",
        description: error.message || 'Erro desconhecido',
        variant: "destructive"
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const loadTableSchema = async (tableName: string) => {
    try {
      const { data, error } = await db.rpc('get_table_schema', {
        table_name: tableName
      });

      if (error) {
        toast({
          title: "Erro ao carregar schema",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      // Ensure data is always an array
      const schemaData = Array.isArray(data) ? data : (data ? [data] : []);
      setTableSchema(schemaData);
      setSelectedTable(tableName);
    } catch (error) {
      console.error('Erro ao carregar schema:', error);
      setTableSchema([]);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Texto copiado para a área de transferência"
    });
  };

  const downloadResults = () => {
    if (!result?.data) return;

    const csv = [
      Object.keys(result.data[0]).join(','),
      ...result.data.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query-results-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (roleLoading) {
    return <div>Carregando...</div>;
  }

  if (!isAdmin) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardContent className="pt-6">
          <div className="text-center">
            <Database className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Acesso Restrito</h3>
            <p className="text-gray-600">
              O SQL Editor está disponível apenas para administradores.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            SQL Editor
            <Badge variant="secondary">Admin</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="editor" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="schema">Schema</TabsTrigger>
              <TabsTrigger value="history">Histórico</TabsTrigger>
              <TabsTrigger value="results">Resultados</TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <Editor
                  height="400px"
                  language="sql"
                  value={query}
                  onChange={(value) => setQuery(value || '')}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    automaticLayout: true
                  }}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={executeQuery} 
                  disabled={isExecuting}
                  className="flex items-center gap-2"
                >
                  {isExecuting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Executar
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => copyToClipboard(query)}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copiar
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => setQuery('')}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Limpar
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="schema" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Tabelas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-1">
                        {tables.map((table) => (
                          <Button
                            key={table}
                            variant={selectedTable === table ? "default" : "ghost"}
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => loadTableSchema(table)}
                          >
                            <Table className="h-4 w-4 mr-2" />
                            {table}
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {selectedTable && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Columns className="h-4 w-4" />
                        Colunas de {selectedTable}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64">
                        <div className="space-y-2">
                          {tableSchema.map((column, index) => (
                            <div key={index} className="p-2 border rounded text-sm">
                              <div className="font-medium">{column.column_name}</div>
                              <div className="text-gray-500 text-xs">
                                {column.data_type}
                                {column.is_nullable === 'NO' && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    NOT NULL
                                  </Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {history.map((item) => (
                    <Card key={item.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {item.success ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500 mt-1" />
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {item.timestamp.toLocaleString()}
                              </span>
                              <span className="text-xs text-gray-500">
                                {item.executionTime}ms
                              </span>
                              {item.rowCount !== undefined && (
                                <span className="text-xs text-gray-500">
                                  {item.rowCount} linha(s)
                                </span>
                              )}
                            </div>
                            
                            <code 
                              className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded block cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                              onClick={() => setQuery(item.query)}
                            >
                              {item.query}
                            </code>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              {result ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        {result.error ? (
                          <>
                            <XCircle className="h-4 w-4 text-red-500" />
                            Erro na Execução
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            Resultado da Query
                          </>
                        )}
                      </CardTitle>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {result.executionTime}ms
                        </Badge>
                        {result.rowCount !== undefined && (
                          <Badge variant="outline">
                            {result.rowCount} linha(s)
                          </Badge>
                        )}
                        {result.data && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={downloadResults}
                            className="flex items-center gap-1"
                          >
                            <Download className="h-3 w-3" />
                            CSV
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {result.error ? (
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                        <pre className="text-sm text-red-700 dark:text-red-400 whitespace-pre-wrap">
                          {result.error}
                        </pre>
                      </div>
                    ) : (
                      <ScrollArea className="h-64 w-full">
                        <div className="overflow-x-auto">
                          {result.data && result.data.length > 0 ? (
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b">
                                  {Object.keys(result.data[0]).map((key) => (
                                    <th key={key} className="text-left p-2 font-medium">
                                      {key}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {result.data.map((row, index) => (
                                  <tr key={index} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                                    {Object.values(row).map((value: any, cellIndex) => (
                                      <td key={cellIndex} className="p-2">
                                        {value === null ? (
                                          <span className="text-gray-400 italic">null</span>
                                        ) : typeof value === 'object' ? (
                                          JSON.stringify(value)
                                        ) : (
                                          String(value)
                                        )}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="text-center p-8 text-gray-500">
                              Nenhum resultado encontrado
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center text-gray-500">
                    Execute uma query para ver os resultados aqui
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
