import React, { useEffect, useState, useCallback } from 'react';

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

interface SidebarProps {
  blocks: Block[];
  shouldUpdateInsight: boolean;
}

export default function Sidebar({ blocks, shouldUpdateInsight }: SidebarProps) {
  const [insight, setInsight] = useState<string>('');

  // Create a memoized function to get all responses
  const getAllResponses = useCallback(() => {
    return blocks.flatMap(block => block.responses.map(r => r.content)).join(' ');
  }, [blocks]);

  useEffect(() => {
    if (!shouldUpdateInsight) return;

    const generateInsight = async () => {
      const allResponses = getAllResponses();
      
      try {
        const response = await fetch('/api/generate-insight', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: allResponses }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate insight');
        }

        const data = await response.json();
        setInsight(data.insight);
      } catch (error) {
        console.error('Error generating insight:', error);
        setInsight('Unable to generate insight at this time.');
      }
    };

    generateInsight();
  }, [getAllResponses, shouldUpdateInsight]);

  return (
    <div className="fixed right-4 top-4 w-80 bg-[#fbfaee] rounded-2xl shadow-2xl p-6 overflow-y-auto max-h-[calc(100vh-2rem)] backdrop-filter backdrop-blur-lg border border-[#53118f] border-opacity-20">
      <h2 className="text-3xl font-extrabold mb-6 text-[#53118f] tracking-tight">book buddy</h2>
      <div className="bg-[#6e2daa] bg-opacity-10 rounded-xl p-5 shadow-inner">
        <p className="text-sm text-[#53118f] leading-relaxed font-light">{insight}</p>
      </div>
      <div className="mt-6 flex justify-center">
        <div className="w-12 h-1 bg-[#53118f] rounded-full opacity-30"></div>
      </div>
    </div>
  );
}
