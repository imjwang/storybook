import { DynamicWidget } from '@dynamic-labs/sdk-react-core';
export default function Home() {
  return <div className="flex flex-col items-center justify-center h-screen">
    <DynamicWidget />
    <h1 className="text-4xl font-bold">storybook.</h1>
    <div className="mt-8">
      <button className="w-32 h-32 bg-gray-200 hover:bg-gray-300 flex items-center justify-center rounded-lg shadow-md transition duration-300 ease-in-out">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
      <p className="mt-2 text-center text-gray-600 font-bold">create new book.</p>
    </div>
  </div>;
