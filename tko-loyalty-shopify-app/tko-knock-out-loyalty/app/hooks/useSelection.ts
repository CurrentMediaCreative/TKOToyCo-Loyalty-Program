import { useState, useCallback, useMemo } from 'react';

export interface SelectionState {
  selectedIds: Set<string>;
  allSelected: boolean;
  indeterminate: boolean;
}

export interface SelectionHook<T> {
  selectedIds: string[];
  allSelected: boolean;
  indeterminate: boolean;
  selectedCount: number;
  isSelected: (id: string) => boolean;
  toggleSelection: (id: string) => void;
  toggleAll: () => void;
  clearSelection: () => void;
  selectAll: () => void;
  getSelectedItems: () => T[];
}

/**
 * Custom hook for managing selection state in tables and lists
 * Provides proper selection state management that works with Shopify's IndexTable
 */
export function useSelection<T>(
  items: T[],
  getId: (item: T) => string
): SelectionHook<T> {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Get all available IDs
  const allIds = useMemo(() => items.map(getId), [items, getId]);

  // Calculate selection state
  const selectedCount = selectedIds.size;
  const allSelected = selectedCount > 0 && selectedCount === allIds.length;
  const indeterminate = selectedCount > 0 && selectedCount < allIds.length;

  // Check if an item is selected
  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  // Toggle selection for a single item
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Toggle all items
  const toggleAll = useCallback(() => {
    setSelectedIds(prev => {
      if (prev.size === allIds.length) {
        // All selected, deselect all
        return new Set();
      } else {
        // Not all selected, select all
        return new Set(allIds);
      }
    });
  }, [allIds]);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Select all items
  const selectAll = useCallback(() => {
    setSelectedIds(new Set(allIds));
  }, [allIds]);

  // Get selected items
  const getSelectedItems = useCallback(() => {
    return items.filter(item => selectedIds.has(getId(item)));
  }, [items, selectedIds, getId]);

  return {
    selectedIds: Array.from(selectedIds),
    allSelected,
    indeterminate,
    selectedCount,
    isSelected,
    toggleSelection,
    toggleAll,
    clearSelection,
    selectAll,
    getSelectedItems,
  };
}

/**
 * Hook specifically designed for Shopify IndexTable selection
 * Handles the specific selection change format that IndexTable expects
 */
export function useIndexTableSelection<T>(
  items: T[],
  getId: (item: T) => string
) {
  const selectionHook = useSelection(items, getId);

  // Handle IndexTable selection change events - matches Shopify's expected signature
  const handleSelectionChange = useCallback(
    (selectionType: any, toggleType: boolean, selection?: string | any, position?: number) => {
      if (selectionType === 'all') {
        if (toggleType) {
          selectionHook.selectAll();
        } else {
          selectionHook.clearSelection();
        }
      } else if (selectionType === 'single' && typeof selection === 'string') {
        selectionHook.toggleSelection(selection);
      }
    },
    [selectionHook]
  );

  return {
    ...selectionHook,
    handleSelectionChange,
    // Format for IndexTable's selectedItemsCount prop - must be number or "All"
    selectedItemsCount: selectionHook.allSelected ? 'All' as const : selectionHook.selectedCount,
  };
}

export default useSelection;
