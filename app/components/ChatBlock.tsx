'use client'

import { useState, useEffect, useRef } from 'react'
import Draggable from 'react-draggable'
import { ResizableBox } from 'react-resizable'
import 'react-resizable/css/styles.css'

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

interface ChatBlockProps {
  block: Block;
  setBlocks: React.Dispatch<React.SetStateAction<Block[]>>;
  onDragMessage: (event: React.DragEvent, message: string) => void;
}

export default function ChatBlock({ block, setBlocks }: ChatBlockProps) {
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 384, height: 300 })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [block.responses])

  const handleSend = async () => {
    if (!message.trim()) return

    setIsLoading(true)
    try {
      const isTableRequest = message.toLowerCase().includes('table') || 
                             message.toLowerCase().includes('tabular data')

      let promptMessage = message
      if (isTableRequest) {
        promptMessage += ` Return the tabular data in this JSON format: 
        {
          "headers": ["Column1", "Column2", ...],
          "rows": [
            ["Row1Col1", "Row1Col2", ...],
            ["Row2Col1", "Row2Col2", ...],
            ...
          ]
        }
        Make sure your response only contains JSON with no other characters or formatting.
        It is extremely crucial that you return the JSON exactly as specified, with no additional text or formatting.
        DO NOT start your response with "sure" or anything like that, just return the JSON. It is very important that this JSON is ready to be parsed`
      }

      const newUserMessage: Response = { role: 'user' as const, content: promptMessage };
      
      // Update the block with the new user message
      setBlocks(prevBlocks => 
        prevBlocks.map(b => 
          b.id === block.id 
            ? {...b, responses: [...b.responses, { role: 'user' as const, content: message }]} 
            : b
        )
      )

      // Prepare the full conversation history
      const conversationHistory = [...block.responses, newUserMessage]

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: conversationHistory,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch response')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Failed to get reader from response')
      }
      const decoder = new TextDecoder()
      let accumulatedResponse = ''

      setBlocks(prevBlocks => 
        prevBlocks.map(b => 
          b.id === block.id 
            ? {...b, responses: [...b.responses, { role: 'assistant', content: '', isTable: isTableRequest }]} 
            : b
        )
      )

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulatedResponse += decoder.decode(value)
        
        setBlocks(prevBlocks => 
          prevBlocks.map(b => 
            b.id === block.id 
              ? {
                  ...b, 
                  responses: [
                    ...b.responses.slice(0, -1), 
                    { 
                      role: 'assistant', 
                      content: accumulatedResponse,
                      isTable: isTableRequest
                    }
                  ]
                } 
              : b
          )
        )
      }

      console.log('Finished message:', accumulatedResponse)

      // Create a new block for table responses
      if (isTableRequest) {
        const newTableBlock: Block = {
          id: `table-${Date.now()}`,
          x: block.x + 20, // Offset slightly from the original block
          y: block.y + 20,
          responses: [
            { role: 'assistant', content: accumulatedResponse, isTable: true }
          ]
        }

        setBlocks(prevBlocks => [...prevBlocks, newTableBlock])
      }

    } catch (error) {
      console.error('Error:', error)
      setBlocks(prevBlocks => 
        prevBlocks.map(b => 
          b.id === block.id 
            ? {...b, responses: [...b.responses, { role: 'assistant', content: 'Error: Failed to get response' }]} 
            : b
        )
      )
    } finally {
      setIsLoading(false)
      setMessage('')
    }
  }

  const handleDelete = () => {
    setBlocks(prevBlocks => prevBlocks.filter(b => b.id !== block.id))
  }

  const handleDragStart = (e: React.DragEvent, response: Response, index: number) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({
      content: response.content,
      role: response.role,
      originalBlockId: block.id,
      originalIndex: index
    }))
    
    // Create a duplicate of the dragged message in the original block
    setBlocks(prevBlocks => 
      prevBlocks.map(b => 
        b.id === block.id 
          ? {...b, responses: [
              ...b.responses.slice(0, index + 1),
              { ...response },
              ...b.responses.slice(index + 1)
            ]} 
          : b
      )
    )
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const data = JSON.parse(e.dataTransfer.getData('text/plain'))
    
    if (data.originalBlockId !== block.id) {
      setBlocks(prevBlocks => 
        prevBlocks.map(b => 
          b.id === block.id 
            ? {...b, responses: [...b.responses, { role: data.role, content: data.content }]} 
            : b
        )
      )
    }
  }

  const onResize = (event: React.SyntheticEvent, { size }: { size: { width: number; height: number } }) => {
    setSize({ width: size.width, height: size.height })
  }

  return (
    <Draggable
      defaultPosition={{x: block.x, y: block.y}}
      bounds="parent"
      handle=".drag-handle"
    >
      <ResizableBox
        width={size.width}
        height={size.height}
        onResize={onResize}
        minConstraints={[200, 200]}
        maxConstraints={[800, 600]}
      >
        <div 
          className="absolute bg-white shadow-2xl rounded-lg p-2 border border-gray-200 overflow-hidden"
          style={{ width: '100%', height: '100%' }}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <div className="drag-handle absolute top-0 left-0 right-0 h-6 bg-gray-100 cursor-move"></div>
          <button 
            onClick={handleDelete}
            className="absolute top-1 right-1 text-gray-400 hover:text-red-500 transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <div className="mb-4 max-h-[calc(100%-80px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 mt-8 px-2">
            {block.responses.map((response, index) => (
              <div 
                key={index} 
                className={`p-3 mb-3 rounded-lg text-sm ${
                  response.role === 'user' 
                    ? 'bg-blue-50 text-blue-800' 
                    : 'bg-gray-50 text-gray-800'
                } w-full shadow-sm`}
                draggable
                onDragStart={(e) => handleDragStart(e, response, index)}
              >
                {response.isTable ? (
                  <TableFromJSON jsonString={response.content} />
                ) : (
                  <p className="whitespace-pre-wrap">{response.content}</p>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="absolute bottom-2 left-2 right-2">
            <div className="relative">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isLoading) {
                    handleSend();
                  }
                }}
                className="w-full border border-gray-300 rounded-full py-2 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Type a message..."
                disabled={isLoading}
              />
              <button 
                onClick={handleSend}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 text-white p-2 rounded-full transition-colors duration-200 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
                }`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </ResizableBox>
    </Draggable>
  )
}

interface TableData {
  headers: string[];
  rows: string[][];
}

function TableFromJSON({ jsonString }: { jsonString: string }) {
  const [tableData, setTableData] = useState<TableData | null>(null)

  useEffect(() => {
    try {
      const data = JSON.parse(jsonString) as TableData
      setTableData(data)
    } catch (error) {
      console.error('Failed to parse JSON:', error)
    }
  }, [jsonString])

  if (!tableData) return null

  return (
    <div className="relative">
      <div className="overflow-auto w-auto h-auto">
        <table className="divide-y divide-gray-200 text-xs">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              {tableData.headers.map((header, index) => (
                <th
                  key={index}
                  className="px-2 py-1 text-left font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tableData.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="px-2 py-1 whitespace-nowrap text-gray-500"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
