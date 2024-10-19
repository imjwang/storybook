'use client'

import { useState, useCallback } from 'react'
import ChatBlock from '../components/ChatBlock'
import Canvas from '../components/Canvas'

interface Block {
    id: string;
    x: number;
    y: number;
    responses: Response[];
  }
  
interface Response {
role: 'user' | 'assistant';
content: string;
isTable?: boolean;
}

export default function Home() {
  const [blocks, setBlocks] = useState<Block[]>([])

  const addNewBlock = (x: number, y: number): void => {
    const newBlock: Block = {
      id: Date.now().toString(),
      x,
      y,
      responses: []
    }
    setBlocks([...blocks, newBlock])
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault()
    const data = JSON.parse(e.dataTransfer.getData('text/plain'))
    const { content, role, originalBlockId, originalIndex } = data
    
    // Create a new block
    const newBlock: Block = {
      id: Date.now().toString(),
      x: e.clientX,
      y: e.clientY,
      responses: [{ role, content }]
    }
    setBlocks(prevBlocks => [...prevBlocks, newBlock])

    // Remove the message from the original block
    setBlocks(prevBlocks => 
      prevBlocks.map(block => 
        block.id === originalBlockId
          ? { ...block, responses: block.responses.filter((_, index) => index !== originalIndex) }
          : block
      )
    )
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault()
  }, [])

  const onDragMessage = useCallback((event: React.DragEvent, message: string) => {
    // Implementation of drag logic
    const [blockId, index] = message.split(':');
    event.dataTransfer.setData('text/plain', JSON.stringify({
      content: blocks.find(b => b.id === blockId)?.responses[parseInt(index)]?.content,
      role: blocks.find(b => b.id === blockId)?.responses[parseInt(index)]?.role,
      originalBlockId: blockId,
      originalIndex: parseInt(index)
    }));
  }, [blocks]);

  return (
    <main 
      className="h-screen w-screen relative overflow-hidden"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <Canvas>
        {blocks.map(block => (
          <ChatBlock 
            key={block.id}
            block={block}
            setBlocks={setBlocks}
            onDragMessage={onDragMessage}
          />
        ))}
      </Canvas>
      <button 
        onClick={() => addNewBlock(Math.random() * 500, Math.random() * 500)}
        className="absolute bottom-4 left-4 bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600"
      >
        <p className="text-white text-5xl">+</p>
      </button>
    </main>
  )
}
