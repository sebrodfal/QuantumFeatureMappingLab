import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * useDraggable hook for creating floating draggable panels on screen.
 * Allows the user to grab the header or drag handle and reposition the panel
 * anywhere so it does not obstruct data visualizations during demos.
 */
export function useDraggable(defaultPos = null) {
  const [position, setPosition] = useState(defaultPos);
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef(null);
  const offsetRef = useRef({ x: 0, y: 0 });

  const onMouseDown = useCallback((e) => {
    // Only primary mouse button and ignore interactive elements
    if (e.button !== 0) return;
    if (e.target.closest('button, input, select, a, textarea, .no-drag')) return;

    if (panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      offsetRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      setIsDragging(true);
      e.preventDefault();
    }
  }, []);

  const onTouchStart = useCallback((e) => {
    if (e.target.closest('button, input, select, a, textarea, .no-drag')) return;
    if (e.touches.length === 1 && panelRef.current) {
      const touch = e.touches[0];
      const rect = panelRef.current.getBoundingClientRect();
      offsetRef.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
      setIsDragging(true);
    }
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e) => {
      const panelWidth = panelRef.current?.offsetWidth || 360;
      const panelHeight = panelRef.current?.offsetHeight || 300;
      const maxX = Math.max(10, window.innerWidth - panelWidth - 16);
      const maxY = Math.max(10, window.innerHeight - panelHeight - 16);

      const nextX = Math.min(Math.max(16, e.clientX - offsetRef.current.x), maxX);
      const nextY = Math.min(Math.max(16, e.clientY - offsetRef.current.y), maxY);

      setPosition({ x: nextX, y: nextY });
    };

    const onTouchMove = (e) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const panelWidth = panelRef.current?.offsetWidth || 360;
      const panelHeight = panelRef.current?.offsetHeight || 300;
      const maxX = Math.max(10, window.innerWidth - panelWidth - 16);
      const maxY = Math.max(10, window.innerHeight - panelHeight - 16);

      const nextX = Math.min(Math.max(16, touch.clientX - offsetRef.current.x), maxX);
      const nextY = Math.min(Math.max(16, touch.clientY - offsetRef.current.y), maxY);

      setPosition({ x: nextX, y: nextY });
    };

    const onEnd = () => setIsDragging(false);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [isDragging]);

  const dragHandleProps = {
    onMouseDown,
    onTouchStart,
    style: {
      cursor: isDragging ? 'grabbing' : 'grab',
      userSelect: 'none',
      WebkitUserSelect: 'none',
    },
  };

  return {
    panelRef,
    position,
    setPosition,
    isDragging,
    dragHandleProps,
  };
}
