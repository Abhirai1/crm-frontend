import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login({ apiBase, onLoggedIn }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email_id: '', password: '' })
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setMsg('')
    setLoading(true)
    try {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) {
        setMsg(json.error || 'Login failed.')
      } else {
        onLoggedIn(json)
        setMsg('Logged in!')
        navigate('/dashboard')
      }
    } catch (err) {
      setMsg('Network error.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="block text-sm">Email</label>
        <input type="email" name="email_id" value={form.email_id} onChange={onChange} className="mt-1 w-full border rounded px-3 py-2" required />
      </div>
      <div>
        <label className="block text-sm">Password</label>
        <input type="password" name="password" value={form.password} onChange={onChange} className="mt-1 w-full border rounded px-3 py-2" required />
      </div>
      <button disabled={loading} className="px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">Login</button>
      <p className="text-sm text-slate-700">{msg}</p>
    </form>
  )
}
