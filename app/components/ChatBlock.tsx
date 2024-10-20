'use client'

import { useState, useEffect, useRef } from 'react'
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable'
import { ResizableBox } from 'react-resizable'
import ReactMarkdown from 'react-markdown'
import 'react-resizable/css/styles.css'

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

interface ChatBlockProps {
  block: Block;
  setBlocks: React.Dispatch<React.SetStateAction<Block[]>>;
  onMessageComplete: () => void;
}

export default function ChatBlock({ block, setBlocks, onMessageComplete }: ChatBlockProps) {
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 384, height: 300 })
  const [hasUserSentMessage, setHasUserSentMessage] = useState(block.responses.some(r => r.role === 'user'))
  const [blockTitle, setBlockTitle] = useState(block.title || 'New Chat')
  const [isEditing, setIsEditing] = useState<number | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [block.responses])

  useEffect(() => {
    console.log('block', block)
  }, [])

  const handleSend = async () => {
    if (!message.trim() || hasUserSentMessage) return

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
      
      setBlocks(prevBlocks => 
        prevBlocks.map(b => 
          b.id === block.id 
            ? {...b, responses: [...b.responses, { role: 'user' as const, content: message }]} 
            : b
        )
      )

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
            ? {...b, responses: [...b.responses.slice(0, -1), { role: 'assistant', content: '', isTable: isTableRequest }]} 
            : b
        )
      )

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          onMessageComplete();
          break;
        }
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

      const generatedTitle = generateTitle(accumulatedResponse)
      setBlockTitle(generatedTitle)

      setBlocks(prevBlocks => 
        prevBlocks.map(b => 
          b.id === block.id 
            ? {...b, title: generatedTitle} 
            : b
        )
      )

      if (isTableRequest) {
        const newTableBlock: Block = {
          id: `table-${Date.now()}`,
          x: block.x + 20,
          y: block.y + 20,
          responses: [
            { role: 'assistant', content: accumulatedResponse, isTable: true }
          ],
          title: generatedTitle
        }

        setBlocks(prevBlocks => [...prevBlocks, newTableBlock])
      }

      setHasUserSentMessage(true)
      onMessageComplete()
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

  const handleDrag = (e: DraggableEvent, data: DraggableData) => {
    setBlocks(prevBlocks =>
      prevBlocks.map(b =>
        b.id === block.id ? { ...b, x: data.x, y: data.y } : b
      )
    );
  };

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

  const handleDragStart = (e: React.DragEvent, response: Response, index: number) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({
      originalBlockId: block.id,
      role: response.role,
      content: response.content,
      index
    }));
  };

  const handleResponseEdit = (index: number, newContent: string) => {
    setBlocks(prevBlocks =>
      prevBlocks.map(b =>
        b.id === block.id
          ? {
              ...b,
              responses: b.responses.map((r, i) =>
                i === index ? { ...r, content: newContent } : r
              )
            }
          : b
      )
    )
  }

  const generateTitle = (response: string): string => {
    const words = response.split(' ').slice(0, 5).join(' ')
    return words.length < 30 ? words : words.slice(0, 30) + '...'
  }

  return (
    <Draggable
      position={{x: block.x, y: block.y}}
      onDrag={handleDrag}
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
          className="absolute bg-[#fbfaee] shadow-2xl rounded-2xl p-4 border border-[#53118f] border-opacity-20 overflow-hidden flex flex-col"
          style={{ 
            width: size.width, 
            height: size.height,
            transform: 'translate(0, 0)',
            backdropFilter: 'blur(10px)',
          }}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <div className="drag-handle absolute top-0 left-0 right-0 h-8 bg-[#6e2daa] bg-opacity-50 cursor-move flex items-center px-4 rounded-t-2xl">
            <span className="text-sm font-medium text-[#fbfaee] truncate">{blockTitle}</span>
          </div>
          <button 
            onClick={handleDelete}
            className="absolute top-2 right-2 text-[#53118f] hover:text-[#933dc9] transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <div className="flex-grow overflow-y-auto mt-10 px-2 scrollbar-thin scrollbar-thumb-[#6e2daa] scrollbar-track-[#53118f]">
            {block.responses.map((response, index) => (
              <div 
                key={index} 
                className={`mb-4 text-sm ${
                  response.role === 'assistant' ? 'text-[#53118f]' : 'hidden'
                } w-full`}
                draggable
                onDragStart={(e) => handleDragStart(e, response, index)}
              >
                {response.isTable ? (
                  <TableFromJSON jsonString={response.content} />
                ) : (
                  response.role === 'assistant' ? (
                    isEditing === index ? (
                      <textarea
                        value={response.content}
                        onChange={(e) => handleResponseEdit(index, e.target.value)}
                        onBlur={() => setIsEditing(null)}
                        className="w-full min-h-[100px] bg-[#6e2daa] bg-opacity-10 resize-vertical focus:outline-none border border-[#53118f] border-opacity-30 p-3 rounded-lg text-[#53118f]"
                        autoFocus
                        style={{ height: 'auto', overflow: 'hidden' }}
                        onInput={(e) => {
                          e.currentTarget.style.height = 'auto';
                          e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                        }}
                      />
                    ) : (
                      <div onClick={() => setIsEditing(index)} className="cursor-pointer hover:bg-[#6e2daa] hover:bg-opacity-10 rounded-lg p-2 transition-all duration-200">
                        <ReactMarkdown className="prose prose-purple">{response.content}</ReactMarkdown>
                      </div>
                    )
                  ) : (
                    <p className="whitespace-pre-wrap text-[#53118f]">{response.content}</p>
                  )
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          {!hasUserSentMessage && (
            <div className="mt-4">
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
                  className="w-full bg-[#6e2daa] bg-opacity-10 border border-[#53118f] border-opacity-30 rounded-full py-2 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-[#933dc9] focus:border-transparent text-[#53118f] placeholder-[#53118f] placeholder-opacity-50"
                  placeholder="Type a message..."
                  disabled={isLoading}
                />
                <button 
                  onClick={handleSend}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#933dc9] text-[#fbfaee] p-2 rounded-full transition-colors duration-200 ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#53118f]'
                  }`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5 text-[#fbfaee]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
          )}
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
        <table className="divide-y divide-[#53118f] divide-opacity-20 text-xs">
          <thead className="bg-[#6e2daa] bg-opacity-10 sticky top-0">
            <tr>
              {tableData.headers.map((header, index) => (
                <th
                  key={index}
                  className="px-2 py-2 text-left font-medium text-[#53118f] uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-[#53118f] bg-opacity-5 divide-y divide-[#53118f] divide-opacity-10">
            {tableData.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="px-2 py-2 whitespace-nowrap text-[#53118f]"
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
