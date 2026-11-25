import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface WidgetItem {
  id: string;
  title: string;
  shortLabel: string;
  icon?: React.ReactNode;
  component: React.ReactNode;
}

interface WidgetDeckProps {
  items: WidgetItem[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  className?: string;
}

export const WidgetDeck: React.FC<WidgetDeckProps> = ({
  items,
  currentIndex,
  onIndexChange,
  className = '',
}) => {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const isHorizontalSwipeRef = useRef<boolean | null>(null);

  const total = items.length;

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    isHorizontalSwipeRef.current = null;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartXRef.current;
    const diffY = currentY - touchStartYRef.current;

    // Determine direction on first significant movement
    if (isHorizontalSwipeRef.current === null) {
      if (Math.abs(diffX) > 8 || Math.abs(diffY) > 8) {
        isHorizontalSwipeRef.current = Math.abs(diffX) > Math.abs(diffY);
      }
    }

    if (isHorizontalSwipeRef.current) {
      // It's a horizontal widget swipe: prevent page scrolling and stop bubbling
      e.stopPropagation();
      // Apply rubberband resistance at edges
      let offset = diffX;
      if ((currentIndex === 0 && diffX > 0) || (currentIndex === total - 1 && diffX < 0)) {
        offset = diffX * 0.3;
      }
      setDragOffset(offset);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (isHorizontalSwipeRef.current) {
      const threshold = 40;
      if (dragOffset < -threshold && currentIndex < total - 1) {
        onIndexChange(currentIndex + 1);
        if (navigator.vibrate) navigator.vibrate(25);
      } else if (dragOffset > threshold && currentIndex > 0) {
        onIndexChange(currentIndex - 1);
        if (navigator.vibrate) navigator.vibrate(25);
      }
    }

    setDragOffset(0);
    setIsDragging(false);
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    isHorizontalSwipeRef.current = null;
  };

  const prevWidget = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) onIndexChange(currentIndex - 1);
  };

  const nextWidget = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < total - 1) onIndexChange(currentIndex + 1);
  };

  return (
    <div
      className={`relative w-full h-full min-h-0 flex flex-col overflow-hidden select-none group ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'pan-y' }}
    >
      {/* Top Deck Navigation Strip */}
      <div className="flex items-center justify-between px-2.5 py-1.5 shrink-0 bg-[#060608] border-b border-[#141418] z-20">
        <div className="flex items-center gap-1.5 overflow-hidden">
          {items[currentIndex]?.icon && (
            <span className="text-neutral-400 shrink-0">
              {items[currentIndex].icon}
            </span>
          )}
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-neutral-300 truncate">
            {items[currentIndex]?.shortLabel || items[currentIndex]?.title}
          </span>
        </div>

        {/* Mini Step Indicator / Selector Dots */}
        <div className="flex items-center gap-1.5">
          {items.map((item, idx) => (
            <button
              key={item.id}
              onClick={(e) => {
                e.stopPropagation();
                onIndexChange(idx);
              }}
              className={`transition-all duration-200 rounded-full ${
                idx === currentIndex
                  ? 'w-4 h-1.5 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                  : 'w-1.5 h-1.5 bg-neutral-800 hover:bg-neutral-600'
              }`}
              title={item.title}
            />
          ))}
        </div>
      </div>

      {/* Sliding Widget Container */}
      <div className="flex-1 min-h-0 w-full relative overflow-hidden">
        <div
          className={`flex h-full w-full ${isDragging ? '' : 'transition-transform duration-300 ease-out'}`}
          style={{
            transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}px))`,
          }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              className="w-full min-w-full h-full min-h-0 shrink-0 overflow-hidden flex flex-col"
            >
              {item.component}
            </div>
          ))}
        </div>

        {/* Hover / Touch Chevron Buttons */}
        {currentIndex > 0 && (
          <button
            onClick={prevWidget}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-neutral-400 hover:text-white border border-neutral-800 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-20"
            title="Previous widget"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}

        {currentIndex < total - 1 && (
          <button
            onClick={nextWidget}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 hover:bg-black/90 text-neutral-400 hover:text-white border border-neutral-800 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-20"
            title="Next widget"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
