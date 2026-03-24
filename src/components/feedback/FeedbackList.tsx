
import { motion } from 'framer-motion';
import { useFeedbackList } from '@/hooks/useFeedbackList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Bug, Lightbulb, Heart, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const FeedbackList = () => {
  const { feedbacks, loading } = useFeedbackList();

  console.log('FeedbackList render:', { feedbacksCount: feedbacks?.length, loading });

  const getFeedbackIcon = (type: string) => {
    switch (type) {
      case 'bug': return Bug;
      case 'suggestion': return Lightbulb;
      case 'compliment': return Heart;
      default: return HelpCircle;
    }
  };

  const getFeedbackColor = (type: string) => {
    switch (type) {
      case 'bug': return 'destructive';
      case 'suggestion': return 'default';
      case 'compliment': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-2">Carregando feedbacks...</span>
      </div>
    );
  }

  if (!feedbacks || feedbacks.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Nenhum feedback ainda
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Seja o primeiro a enviar um feedback!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Feedbacks da Comunidade
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Veja o que nossa comunidade está dizendo sobre o File Rocket
        </p>
      </div>

      <div className="grid gap-4">
        {feedbacks.map((feedback) => {
          const Icon = getFeedbackIcon(feedback.feedback_type);
          
          return (
            <motion.div
              key={feedback.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-purple-600" />
                      <div>
                        <CardTitle className="text-lg">
                          {feedback.profile?.social_name || 'Usuário Anônimo'}
                        </CardTitle>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(feedback.created_at), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <Badge variant={getFeedbackColor(feedback.feedback_type) as any}>
                      {feedback.feedback_type === 'bug' && 'Bug/Problema'}
                      {feedback.feedback_type === 'suggestion' && 'Sugestão'}
                      {feedback.feedback_type === 'compliment' && 'Elogio'}
                      {feedback.feedback_type === 'other' && 'Outro'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {feedback.feedback_text}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
