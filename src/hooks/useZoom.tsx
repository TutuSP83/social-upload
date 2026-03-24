
import { useState, useCallback, useEffect } from 'react';

interface UseZoomProps {
  minZoom?: number;
  maxZoom?: number;
  step?: number;
  initialZoom?: number;
}

export const useZoom = ({
  minZoom = 0.25,
  maxZoom = 5,
  step = 0.25,
  initialZoom = 1
}: UseZoomProps = {}) => {
  const [zoom, setZoom] = useState(initialZoom);

  const zoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + step, maxZoom));
  }, [step, maxZoom]);

  const zoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - step, minZoom));
  }, [step, minZoom]);

  const resetZoom = useCallback(() => {
    setZoom(initialZoom);
  }, [initialZoom]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  }, [zoomIn, zoomOut]);

  useEffect(() => {
    return () => {
      setZoom(initialZoom);
    };
  }, [initialZoom]);

  return {
    zoom,
    zoomIn,
    zoomOut,
    resetZoom,
    handleWheel,
    canZoomIn: zoom < maxZoom,
    canZoomOut: zoom > minZoom
  };
};
