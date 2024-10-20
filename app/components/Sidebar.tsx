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
    <div className="fixed right-4 top-4 w-72 bg-white rounded-xl shadow-lg p-6 overflow-y-auto max-h-[calc(100vh-2rem)] backdrop-blur-sm bg-opacity-90">
      <h2 className="text-2xl font-bold mb-4 text-indigo-600">book buddy</h2>
      <div className="bg-indigo-50 rounded-lg p-4">
        <p className="text-sm text-gray-700 leading-relaxed">{insight}</p>
      </div>
    </div>
  );
}
