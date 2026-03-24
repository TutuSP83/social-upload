import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedReceivedFilesNavigator } from './EnhancedReceivedFilesNavigator';
import { SentFilesNavigator } from './SentFilesNavigator';
import { Download, Share2 } from 'lucide-react';

export const EnhancedSharedFilesManager = () => {
  const [activeTab, setActiveTab] = useState('received');
  const [currentSenderFolderId, setCurrentSenderFolderId] = useState<string | null>(null);

  const handleNavigateToFolder = (folderId: string) => {
    setCurrentSenderFolderId(folderId);
  };

  const handleNavigateBack = () => {
    setCurrentSenderFolderId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          Arquivos Compartilhados
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="received" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Recebidos
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Enviados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="space-y-4">
          <EnhancedReceivedFilesNavigator
            senderFolderId={currentSenderFolderId || undefined}
            onNavigateBack={handleNavigateBack}
            onNavigateToFolder={handleNavigateToFolder}
          />
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          <SentFilesNavigator />
        </TabsContent>
      </Tabs>
    </div>
  );
};