
import { useState, useCallback } from 'react';

interface AnimationState {
  rocket: boolean;
  download: boolean;
  notification: {
    visible: boolean;
    type: 'received' | 'shared' | 'deleted' | 'folder_created';
    message: string;
  };
}

export const useAnimations = () => {
  const [animations, setAnimations] = useState<AnimationState>({
    rocket: false,
    download: false,
    notification: {
      visible: false,
      type: 'received',
      message: ''
    }
  });

  const showRocketAnimation = useCallback(() => {
    setAnimations(prev => ({ ...prev, rocket: true }));
  }, []);

  const hideRocketAnimation = useCallback(() => {
    setAnimations(prev => ({ ...prev, rocket: false }));
  }, []);

  const showDownloadAnimation = useCallback((fileCount: number = 1) => {
    setAnimations(prev => ({ ...prev, download: true }));
  }, []);

  const hideDownloadAnimation = useCallback(() => {
    setAnimations(prev => ({ ...prev, download: false }));
  }, []);

  const showNotification = useCallback((
    type: 'received' | 'shared' | 'deleted' | 'folder_created',
    message: string
  ) => {
    setAnimations(prev => ({
      ...prev,
      notification: {
        visible: true,
        type,
        message
      }
    }));
  }, []);

  const hideNotification = useCallback(() => {
    setAnimations(prev => ({
      ...prev,
      notification: {
        ...prev.notification,
        visible: false
      }
    }));
  }, []);

  return {
    animations,
    showRocketAnimation,
    hideRocketAnimation,
    showDownloadAnimation,
    hideDownloadAnimation,
    showNotification,
    hideNotification
  };
};
