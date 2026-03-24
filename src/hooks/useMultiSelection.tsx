
import { useState, useCallback } from 'react';
import { FileItem } from '@/hooks/useFiles';
import { Folder } from '@/hooks/useFolders';

export const useMultiSelection = () => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const toggleSelection = useCallback((id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback((files: FileItem[], folders: Folder[] = []) => {
    const fileIds = files.map(file => file.id);
    const folderIds = folders.map(folder => folder.id);
    const allIds = [...fileIds, ...folderIds];
    setSelectedItems(new Set(allIds));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(prev => !prev);
    if (isSelectionMode) {
      clearSelection();
    }
  }, [isSelectionMode, clearSelection]);

  const hasSelection = selectedItems.size > 0;

  const getSelectedFiles = useCallback((files: FileItem[]) => {
    return files.filter(file => selectedItems.has(file.id));
  }, [selectedItems]);

  const getSelectedFolders = useCallback((folders: Folder[]) => {
    return folders.filter(folder => selectedItems.has(folder.id));
  }, [selectedItems]);

  return {
    selectedItems,
    isSelectionMode,
    toggleSelection,
    selectAll,
    clearSelection,
    toggleSelectionMode,
    hasSelection,
    getSelectedFiles,
    getSelectedFolders
  };
};
