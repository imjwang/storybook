'use client'

import { ReactNode } from 'react'

interface CanvasProps {
  children: ReactNode;
  onDoubleClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export default function Canvas({ children, onDoubleClick }: CanvasProps) {
  return (
    <div 
      className="w-full h-full border border-gray-300 relative bg-gray-100 bg-opacity-50 flex flex-col" 
      style={{
        backgroundImage: 'radial-gradient(circle, #AAAAAA 1px, transparent 1px)',
        backgroundSize: '30px 30px'
      }}
      onDoubleClick={onDoubleClick}
    >
      {children}
    </div>
  )
}
