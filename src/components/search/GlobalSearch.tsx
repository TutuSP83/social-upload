
import { useState, useEffect } from 'react';
import { Search, X, File, MessageCircle, Heart, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface GlobalSearchProps {
  onClose?: () => void;
}

export const GlobalSearch = ({ onClose }: GlobalSearchProps) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { results, loading, search } = useGlobalSearch();

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (query.trim()) {
        search(query);
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [query]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'file':
        return <File className="h-4 w-4 text-blue-500" />;
      case 'message':
        return <MessageCircle className="h-4 w-4 text-green-500" />;
      case 'feedback':
        return <Heart className="h-4 w-4 text-pink-500" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'file':
        return 'Arquivo';
      case 'message':
        return 'Mensagem';
      case 'feedback':
        return 'Feedback';
      default:
        return type;
    }
  };

  const handleClose = () => {
    setQuery('');
    setIsOpen(false);
    onClose?.();
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar arquivos, mensagens, feedbacks..."
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-full z-50"
          >
            <Card className="max-h-96 overflow-auto shadow-lg">
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2"></div>
                    Buscando...
                  </div>
                ) : results.length > 0 ? (
                  <div className="divide-y">
                    {results.map((result, index) => (
                      <motion.div
                        key={`${result.type}-${result.id}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-3 hover:bg-gray-50 cursor-pointer group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {getIcon(result.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-medium truncate">
                                {result.title}
                              </h4>
                              <Badge variant="outline" className="text-xs">
                                {getTypeLabel(result.type)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2 mb-1">
                              {result.content}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <span>
                                {format(new Date(result.created_at), "dd/MM/yyyy", {
                                  locale: ptBR
                                })}
                              </span>
                              {result.user_name && (
                                <span>• {result.user_name}</span>
                              )}
                            </div>
                          </div>
                          <ExternalLink className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : query.trim() ? (
                  <div className="p-4 text-center text-gray-500">
                    Nenhum resultado encontrado para "{query}"
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
