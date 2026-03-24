
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
}

export const ZoomControls = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  canZoomIn,
  canZoomOut
}: ZoomControlsProps) => {
  return (
    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg border p-2 shadow-sm">
      <Button
        variant="outline"
        size="sm"
        onClick={onZoomOut}
        disabled={!canZoomOut}
        className="h-8 w-8 p-0"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      
      <span className="text-xs font-mono min-w-[3rem] text-center">
        {Math.round(zoom * 100)}%
      </span>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onZoomIn}
        disabled={!canZoomIn}
        className="h-8 w-8 p-0"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onResetZoom}
        className="h-8 w-8 p-0"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
};
