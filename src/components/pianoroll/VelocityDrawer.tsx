import React, { useRef, useEffect, useState } from 'react';
import { NoteEvent } from '../../types/audio';

interface VelocityDrawerProps {
  notes: NoteEvent[];
  lengthSteps: number;
  stepWidth: number;
  scrollLeft: number;
  onUpdateNoteVelocity: (noteId: string, velocity: number) => void;
}

export const VelocityDrawer: React.FC<VelocityDrawerProps> = ({
  notes,
  lengthSteps,
  stepWidth,
  scrollLeft,
  onUpdateNoteVelocity
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDragging = useRef<boolean>(false);
  const [canvasWidth, setCanvasWidth] = useState<number>(1200);

  const height = 70;
  const pianoKeyWidth = 60;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const updateSize = () => {
      if (container.clientWidth > 0) {
        setCanvasWidth(container.clientWidth);
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#111827'; // Dark charcoal
    ctx.fillRect(0, 0, width, height);

    // Piano key placeholder on the left
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, pianoKeyWidth, height);
    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px JetBrains Mono';
    ctx.fillText('VELOCITY', 6, height / 2 + 4);

    // Vertical step grid lines
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let s = 0; s <= lengthSteps; s++) {
      const x = pianoKeyWidth + s * stepWidth - scrollLeft;
      if (x >= pianoKeyWidth && x <= width) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
    }
    ctx.stroke();

    // 100% velocity guide line (subtle dotted)
    ctx.strokeStyle = '#374151';
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(pianoKeyWidth, 8);
    ctx.lineTo(width, 8);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw velocity stalks for each note
    notes.forEach(note => {
      const x = pianoKeyWidth + note.step * stepWidth - scrollLeft + 4;
      if (x < pianoKeyWidth || x > width) return;

      const stalkHeight = Math.max(4, (note.velocity ?? 0.8) * (height - 16));
      const y = height - stalkHeight - 4;

      // Stalk line
      ctx.strokeStyle = '#6366f1'; // Indigo
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, height - 4);
      ctx.lineTo(x, y);
      ctx.stroke();

      // Top dot
      ctx.fillStyle = '#a5b4fc';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }, [notes, lengthSteps, stepWidth, scrollLeft]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDragging.current = true;
    updateVelocityAtPoint(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDragging.current) {
      updateVelocityAtPoint(e);
    }
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const updateVelocityAtPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = (e.clientX - rect.left) * scaleX;
    const clientY = (e.clientY - rect.top) * scaleY;

    if (clientX < pianoKeyWidth) return;

    // Calculate step from mouse X
    const step = Math.floor((clientX - pianoKeyWidth + scrollLeft) / stepWidth);
    // Calculate velocity (0.0 to 1.0) from mouse Y
    const rawVel = 1.0 - (clientY - 4) / (height - 16);
    const vel = Math.max(0.05, Math.min(1.0, rawVel));

    // Find note near this step
    const target = notes.find(n => n.step === step || (step >= n.step && step < n.step + n.duration));
    if (target) {
      onUpdateNoteVelocity(target.id, parseFloat(vel.toFixed(2)));
    }
  };

  return (
    <div ref={containerRef} className="w-full border-t border-gray-800 relative bg-gray-900 overflow-hidden select-none">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={height}
        className="cursor-crosshair block w-full"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
    </div>
  );
};
