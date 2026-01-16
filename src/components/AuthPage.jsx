import { useState } from 'react'
import Login from './Login'
import Signup from './Signup'

const API_BASE = import.meta.env.VITE_API_BASE || 'https://crm-backend-5kkb.onrender.com/api'

export default function AuthPage({ onLoggedIn }) {
  const [activeTab, setActiveTab] = useState('login')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-900 text-white p-6 text-center">
          <h1 className="text-3xl font-bold">CRM System</h1>
          <p className="text-slate-300 mt-2">Solar Application Management</p>
        </div>

        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-3 font-medium transition-colors ${
              activeTab === 'login'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={`flex-1 py-3 font-medium transition-colors ${
              activeTab === 'signup'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Sign Up
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'login' ? (
            <Login apiBase={API_BASE} onLoggedIn={onLoggedIn} />
          ) : (
            <Signup apiBase={API_BASE} />
          )}
        </div>
      </div>
    </div>
  )
}
