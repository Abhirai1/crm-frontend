import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import KanbanBoard from './KanbanBoard'

export default function Dashboard({ session, onLogout }) {
  const navigate = useNavigate()
  const [activeView, setActiveView] = useState('tasks') // 'tasks' or 'create'

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white p-4 md:p-6 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold">CRM Dashboard</h1>
            <p className="text-slate-300 text-sm">Welcome, {session.name}</p>
          </div>
          <div className="flex items-center gap-2 md:gap-4 flex-wrap">
            <span className="text-xs md:text-sm bg-slate-700 px-3 py-1 rounded">{session.role}</span>
            
            {/* Navigation Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveView('tasks')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  activeView === 'tasks'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                My Tasks
              </button>
              {session.role === 'Sales Executive' && (
                <button
                  onClick={() => setActiveView('create')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    activeView === 'create'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Create App
                </button>
              )}
            </div>
            
            <button
              onClick={onLogout}
              className="px-3 md:px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 text-sm transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main>
        {activeView === 'tasks' ? (
          <KanbanBoard session={session} />
        ) : (
          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Create New Application</h3>
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-slate-600 mb-4">Start a new application for a customer</p>
              <button
                onClick={() => navigate('/new-application')}
                className="w-full px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Create Application
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
