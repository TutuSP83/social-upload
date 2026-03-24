
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useFeedback } from '@/hooks/useFeedback';
import { MessageCircle, Bug, Lightbulb, Heart, HelpCircle } from 'lucide-react';

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FeedbackModal = ({ open, onOpenChange }: FeedbackModalProps) => {
  const [feedback, setFeedback] = useState('');
  const [selectedType, setSelectedType] = useState<'bug' | 'suggestion' | 'compliment' | 'other'>('suggestion');
  const { submitFeedback, loading } = useFeedback();

  const feedbackTypes = [
    { id: 'suggestion', label: 'Sugestão', icon: Lightbulb, color: 'text-yellow-500' },
    { id: 'bug', label: 'Bug/Problema', icon: Bug, color: 'text-red-500' },
    { id: 'compliment', label: 'Elogio', icon: Heart, color: 'text-pink-500' },
    { id: 'other', label: 'Outro', icon: HelpCircle, color: 'text-gray-500' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!feedback.trim()) {
      return;
    }

    const success = await submitFeedback(feedback, selectedType);
    if (success) {
      setFeedback('');
      setSelectedType('suggestion');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-purple-600" />
            Enviar Feedback
          </DialogTitle>
          <DialogDescription>
            Sua opinião é muito importante! Conte-nos o que você pensa sobre o File Rocket.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Tipo de feedback</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {feedbackTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <motion.button
                    key={type.id}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedType(type.id as any)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedType === type.id
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`h-4 w-4 mx-auto mb-1 ${type.color}`} />
                    <span className="text-xs font-medium">{type.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div>
            <Label htmlFor="feedback" className="text-sm font-medium">
              Seu feedback
            </Label>
            <Textarea
              id="feedback"
              placeholder="Digite aqui suas sugestões, problemas encontrados ou elogios..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="mt-2 min-h-[100px]"
              required
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !feedback.trim()}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {loading ? 'Enviando...' : 'Enviar Feedback'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
