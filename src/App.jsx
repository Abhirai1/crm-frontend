import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import AuthPage from './components/AuthPage'
import Dashboard from './components/Dashboard'
import NewApplication from './components/NewApplication'

const EditApplicationRoute = ({ session }) => {
  const { id } = useParams()
  return <NewApplication session={session} applicationId={id} mode="edit" />
}

function App() {
  const [session, setSession] = useState(() => ({
    employeeId: localStorage.getItem('employeeId') || null,
    name: localStorage.getItem('name') || null,
    role: localStorage.getItem('role') || null,
  }))

  useEffect(() => {
    if (session.employeeId && session.name && session.role) {
      localStorage.setItem('employeeId', String(session.employeeId))
      localStorage.setItem('name', session.name)
      localStorage.setItem('role', session.role)
    }
  }, [session])

  const handleLoggedIn = (data) => {
    setSession(data)
  }

  const logout = () => {
    localStorage.removeItem('employeeId')
    localStorage.removeItem('name')
    localStorage.removeItem('role')
    setSession({ employeeId: null, name: null, role: null })
  }

  const isAuthenticated = session.employeeId && session.name && session.role

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Route - Show only when not logged in */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthPage onLoggedIn={handleLoggedIn} />
            )
          }
        />

        {/* Dashboard Route - Protected */}
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <Dashboard session={session} onLogout={logout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* New Application Route - Protected & Role-based */}
        <Route
          path="/new-application"
          element={
            isAuthenticated ? (
              session.role === 'Sales Executive' ? (
                <NewApplication session={session} />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Edit Application Route - Protected & Role-based */}
        <Route
          path="/applications/:id/edit"
          element={
            isAuthenticated ? (
              session.role === 'Sales Executive' ? (
                <EditApplicationRoute session={session} />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Catch all - Redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
