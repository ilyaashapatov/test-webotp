import { useCallback } from 'react';
import confetti from 'canvas-confetti';

interface TriggerOptions {
  clientX?: number;
  clientY?: number;
}

export const useFireworks = () => {
  const triggerFireworks = useCallback((options?: TriggerOptions) => {
    // Если переданы координаты клика, переводим их в относительные (от 0 до 1)
    // Иначе пускаем салют по центру экрана
    const x = options?.clientX !== undefined ? options.clientX / window.innerWidth : 0.5;
    const y = options?.clientY !== undefined ? options.clientY / window.innerHeight : 0.5;

    const duration = 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Залп искр с небольшим смещением для объемного эффекта
      confetti({
        ...defaults,
        particleCount,
        origin: { x: x + randomInRange(-0.02, 0.02), y: y + randomInRange(-0.02, 0.02) },
        colors: ['#ff0a00', '#ffdd00', '#00ff66', '#00ffff', '#ff00ff', '#ffffff'],
        shapes: ['circle'],
        scalar: randomInRange(0.4, 0.8),
      });
    }, 50);
  }, []);

  return { triggerFireworks };
};
