"use client";
import { usePrivy } from '@privy-io/react-auth';

export default function Home() {
  const { login, logout, user } = usePrivy();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="w-full p-4 flex justify-end">
        {user ? (
          <button
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full shadow-md transition duration-300 ease-in-out"
            onClick={logout}
          >
            Logout
          </button>
        ) : (
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full shadow-md transition duration-300 ease-in-out"
            onClick={login}
          >
            Login
          </button>
        )}
      </header>

      <main className="text-center">
        <h1 className="text-6xl font-bold text-gray-800 mb-8">storybook.</h1>
        {user && (
          <p className="mb-8 text-gray-600">
            Welcome, {user.email?.toString() || user.wallet?.address || 'User'}!
          </p>
        )}
        <div className="mt-12">
          <button className="group">
            <div className="w-40 h-40 bg-white hover:bg-gray-100 flex items-center justify-center rounded-2xl shadow-lg transition duration-300 ease-in-out group-hover:shadow-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-blue-500 group-hover:text-blue-600 transition duration-300 ease-in-out" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="mt-4 text-lg text-gray-700 font-semibold group-hover:text-gray-900 transition duration-300 ease-in-out">create new book</p>
          </button>
        </div>
      </main>
    </div>
  );
}
