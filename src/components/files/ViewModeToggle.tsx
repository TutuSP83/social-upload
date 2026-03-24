import { Grid, List, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type ViewMode = 'grid' | 'list' | 'preview';

interface ViewModeToggleProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

export const ViewModeToggle = ({ currentMode, onModeChange }: ViewModeToggleProps) => {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 border rounded-md p-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={currentMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onModeChange('grid')}
              className="h-8 w-8 p-0"
            >
              <Grid className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Visualização em grade</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={currentMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onModeChange('list')}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Visualização em lista</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={currentMode === 'preview' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onModeChange('preview')}
              className="h-8 w-8 p-0"
            >
              <Image className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Pré-visualização grande</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};