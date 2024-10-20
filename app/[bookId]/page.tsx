'use client'

import { useState, useCallback, useEffect } from 'react'
import ChatBlock from '../components/ChatBlock'
import Canvas from '../components/Canvas'
import Sidebar from '../components/Sidebar'
import { PinataSDK } from 'pinata'
import { useParams } from 'next/navigation'

const pinata = new PinataSDK({
    pinataJwt: `${process.env.PINATA_JWT}`, 
    pinataGateway: "beige-fashionable-kangaroo-471.mypinata.cloud"
})

interface Block {
    id: string;
    x: number;
    y: number;
    responses: Response[];
    title: string;
  }
  
interface Response {
role: 'user' | 'assistant';
content: string;
isTable?: boolean;
}

interface Book {
    id: string;
    name: string;
    cid: string;
  }

export default function Home() {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [book, setBook] = useState<any>(null)
  const { bookId } = useParams()
  const [shouldUpdateInsight, setShouldUpdateInsight] = useState(false)

  useEffect(() => {
    fetchBook()
  }, [bookId])

  const fetchBook = async () => {
    try {
      const response = await fetch(`/api/pinata-file?id=${bookId}`)
      console.log('response', response)
      if (!response.ok) {
        throw new Error('Failed to fetch book')
      }
      const data = await response.json()
      console.log('data', data)
      setBlocks(JSON.parse(data))
    } catch (error) {
      console.error('Error fetching book:', error)
      // If the book doesn't exist, create a new one
    //   const newBook: Book = {
    //     id: bookId as string,
    //     name: 'Untitled Book',
    //     blocks: []
    //   }
    //   setBook(newBook)
    //   await saveBook(newBook)
    }
  }

  const CONSTANT_Y_POSITION = 100; // Set this to whatever y-position you want the blocks to appear at

  const addNewBlock = useCallback((x: number): void => {
    const newBlock: Block = {
      id: Date.now().toString(),
      x,
      y: CONSTANT_Y_POSITION,
      responses: [],
      title: ''
    }
    setBlocks(prevBlocks => [...prevBlocks, newBlock]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault()
    const data = JSON.parse(e.dataTransfer.getData('text/plain'))
    const { content, role, originalBlockId, originalIndex } = data
    
    // Create a new block
    const newBlock: Block = {
      id: Date.now().toString(),
      x: e.clientX,
      y: e.clientY,
      responses: [{ role, content }],
      title: ''
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

  const handleMessageComplete = useCallback(() => {
    setShouldUpdateInsight(true);
  }, []);

  useEffect(() => {
    if (shouldUpdateInsight) {
      setShouldUpdateInsight(false);
    }
  }, [shouldUpdateInsight]);

  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    addNewBlock(x);
  }, [addNewBlock]);

  return (
    <main 
      className="h-screen w-screen relative overflow-hidden"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <Canvas onDoubleClick={handleDoubleClick}>
        {blocks.map(block => (
          <ChatBlock 
            key={block.id}
            block={block}
            setBlocks={setBlocks}
            onMessageComplete={handleMessageComplete}
          />
        ))}
      </Canvas>
      <Sidebar blocks={blocks} shouldUpdateInsight={shouldUpdateInsight} />
    </main>
  )
}
