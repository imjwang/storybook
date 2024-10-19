'use client'

import { ReactNode } from 'react'


export default function Canvas({ children }: { children: ReactNode }) {
  return (
    <div className="w-full h-full border border-gray-300 relative bg-gray-100 bg-opacity-50" style={{
      backgroundImage: 'radial-gradient(circle, #AAAAAA 1px, transparent 1px)',
      backgroundSize: '30px 30px'
    }}>
      {children}
    </div>
  )
}
