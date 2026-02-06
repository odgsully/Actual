'use client';

import { useState, useCallback, useRef, useEffect, KeyboardEvent } from 'react';

interface UseDropdownNavOptions {
  closeDelay?: number; // ms before closing on mouse leave
  openDelay?: number;  // ms before opening on mouse enter
}

interface UseDropdownNavReturn {
  openDropdown: string | null;
  isOpen: (label: string) => boolean;
  handleMouseEnter: (label: string) => void;
  handleMouseLeave: () => void;
  handleClick: (label: string) => void;
  handleKeyDown: (e: KeyboardEvent, label: string, itemCount: number) => void;
  handleItemKeyDown: (e: KeyboardEvent, index: number, itemCount: number, onSelect: () => void) => void;
  closeAll: () => void;
  focusedIndex: number;
  setFocusedIndex: (index: number) => void;
}

export function useDropdownNav({
  closeDelay = 150,
  openDelay = 0,
}: UseDropdownNavOptions = {}): UseDropdownNavReturn {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      if (openTimeoutRef.current) clearTimeout(openTimeoutRef.current);
    };
  }, []);

  const clearTimeouts = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }
  }, []);

  const isOpen = useCallback(
    (label: string) => openDropdown === label,
    [openDropdown]
  );

  const handleMouseEnter = useCallback(
    (label: string) => {
      clearTimeouts();

      if (openDelay > 0) {
        openTimeoutRef.current = setTimeout(() => {
          setOpenDropdown(label);
          setFocusedIndex(-1);
        }, openDelay);
      } else {
        setOpenDropdown(label);
        setFocusedIndex(-1);
      }
    },
    [clearTimeouts, openDelay]
  );

  const handleMouseLeave = useCallback(() => {
    clearTimeouts();
    closeTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
      setFocusedIndex(-1);
    }, closeDelay);
  }, [clearTimeouts, closeDelay]);

  const handleClick = useCallback((label: string) => {
    clearTimeouts();
    setOpenDropdown((prev) => (prev === label ? null : label));
    setFocusedIndex(-1);
  }, [clearTimeouts]);

  const closeAll = useCallback(() => {
    clearTimeouts();
    setOpenDropdown(null);
    setFocusedIndex(-1);
  }, [clearTimeouts]);

  // Keyboard navigation for the trigger button
  const handleKeyDown = useCallback(
    (e: KeyboardEvent, label: string, itemCount: number) => {
      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          setOpenDropdown((prev) => (prev === label ? null : label));
          if (openDropdown !== label) {
            setFocusedIndex(0);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (openDropdown !== label) {
            setOpenDropdown(label);
          }
          setFocusedIndex(0);
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (openDropdown !== label) {
            setOpenDropdown(label);
          }
          setFocusedIndex(itemCount - 1);
          break;
        case 'Escape':
          e.preventDefault();
          closeAll();
          break;
      }
    },
    [openDropdown, closeAll]
  );

  // Keyboard navigation within the dropdown items
  const handleItemKeyDown = useCallback(
    (e: KeyboardEvent, index: number, itemCount: number, onSelect: () => void) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => (prev + 1) % itemCount);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => (prev - 1 + itemCount) % itemCount);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          onSelect();
          closeAll();
          break;
        case 'Escape':
          e.preventDefault();
          closeAll();
          break;
        case 'Tab':
          // Allow natural tab flow, but close the dropdown
          closeAll();
          break;
      }
    },
    [closeAll]
  );

  return {
    openDropdown,
    isOpen,
    handleMouseEnter,
    handleMouseLeave,
    handleClick,
    handleKeyDown,
    handleItemKeyDown,
    closeAll,
    focusedIndex,
    setFocusedIndex,
  };
}
