import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Archive, Download } from "lucide-react";

interface DownloadFormatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadZip: () => void;
  onDownloadIndividual: () => void;
  selectedCount: number;
  hasFolder: boolean;
}

export const DownloadFormatModal: React.FC<DownloadFormatModalProps> = ({
  isOpen,
  onClose,
  onDownloadZip,
  onDownloadIndividual,
  selectedCount,
  hasFolder
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escolher formato de download</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {selectedCount} item(s) selecionado(s){hasFolder ? ' (incluindo pastas)' : ''}. 
            Como você gostaria de baixar?
          </p>
          
          <div className="space-y-3">
            <Button
              onClick={onDownloadZip}
              className="w-full justify-start"
              variant="outline"
            >
              <Archive className="h-4 w-4 mr-2" />
              <div className="text-left">
                <div className="font-medium">Download com Estrutura (ZIP)</div>
                <div className="text-xs text-muted-foreground">
                  Mantém pastas e organização original
                </div>
              </div>
            </Button>
            
            <Button
              onClick={onDownloadIndividual}
              className="w-full justify-start"
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              <div className="text-left">
                <div className="font-medium">Download Simples (ZIP)</div>
                <div className="text-xs text-muted-foreground">
                  Todos os arquivos juntos sem pastas
                </div>
              </div>
            </Button>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};