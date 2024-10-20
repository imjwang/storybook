'use client'

import { ReactNode } from 'react'

interface CanvasProps {
  children: ReactNode;
  onDoubleClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export default function Canvas({ children, onDoubleClick }: CanvasProps) {
  return (
    <div 
      className="w-full h-full relative flex flex-col overflow-hidden"
      style={{
        background: '#fbfaee',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(5px)',
      }}
      onDoubleClick={onDoubleClick}
    >
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(circle, #3a0c64 2px, transparent 2px),
            radial-gradient(circle, #4e1f7a 2px, transparent 2px)
          `,
          backgroundSize: '40px 40px, 90px 90px',
          backgroundPosition: '0 0, 15px 15px',
          opacity: 0.1,
        }}
      />
      <div className="relative z-10 flex-grow">
        {children}
      </div>
    </div>
  )
}
