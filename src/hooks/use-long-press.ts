import { useRef, useCallback } from "react";

interface UseLongPressOptions {
  onLongPress: (e: React.TouchEvent) => void;
  delay?: number;
  /** Distance en px au-delà de laquelle on annule (l'utilisateur scrolle) */
  moveThreshold?: number;
}

/**
 * Détecte un appui long (long press) sur mobile.
 * Annule automatiquement si le doigt bouge (scroll) ou si le composant est démonté.
 */
export function useLongPress({ onLongPress, delay = 500, moveThreshold = 10 }: UseLongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startPosRef.current = null;
  }, []);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    startPosRef.current = { x: touch.clientX, y: touch.clientY };
    timerRef.current = setTimeout(() => {
      onLongPress(e);
      timerRef.current = null;
    }, delay);
  }, [onLongPress, delay]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!startPosRef.current || !timerRef.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - startPosRef.current.x);
    const dy = Math.abs(touch.clientY - startPosRef.current.y);
    if (dx > moveThreshold || dy > moveThreshold) {
      clear();
    }
  }, [clear, moveThreshold]);

  return { onTouchStart, onTouchMove, onTouchEnd: clear, onTouchCancel: clear };
}
