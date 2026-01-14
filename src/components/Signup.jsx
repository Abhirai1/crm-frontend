import { useState } from 'react'

// Bihar Districts List
const BIHAR_DISTRICTS = [
  'Araria', 'Arwal', 'Aurangabad', 'Banka', 'Begusarai', 'Bhagalpur', 'Bhojpur',
  'Buxar', 'Darbhanga', 'East Champaran', 'Gaya', 'Gopalganj', 'Jamui', 'Jehanabad',
  'Kaimur', 'Katihar', 'Khagaria', 'Kishanganj', 'Lakhisarai', 'Madhepura', 'Madhubani',
  'Munger', 'Muzaffarpur', 'Nalanda', 'Nawada', 'Patna', 'Purnia', 'Rohtas', 'Saharsa',
  'Samastipur', 'Saran', 'Sheikhpura', 'Sheohar', 'Sitamarhi', 'Siwan', 'Supaul',
  'Vaishali', 'West Champaran'
]

const roles = [
  'Sales Executive',
  'System Admin',
  'Utility Officer',
  'Finance Officer',
  'Operations Engineer',
  'Installation Technician',
  'Super Admin',
]

export default function Signup({ apiBase }) {
  const [form, setForm] = useState({
    name: '',
    email_id: '',
    phone_number: '',
    district: '',
    employee_role: roles[0],
    password: '',
  })
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
      const res = await fetch(`${apiBase}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) {
        setMsg(json.error || 'Signup failed.')
      } else {
        setMsg('Account created! You can login now.')
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
        <label className="block text-sm">Name</label>
        <input name="name" value={form.name} onChange={onChange} className="mt-1 w-full border rounded px-3 py-2" required />
      </div>
      <div>
        <label className="block text-sm">Email</label>
        <input type="email" name="email_id" value={form.email_id} onChange={onChange} className="mt-1 w-full border rounded px-3 py-2" required />
      </div>
      <div>
        <label className="block text-sm">Phone Number</label>
        <input name="phone_number" value={form.phone_number} onChange={onChange} className="mt-1 w-full border rounded px-3 py-2" required />
      </div>
      <div>
        <label className="block text-sm">District</label>
        <select name="district" value={form.district} onChange={onChange} className="mt-1 w-full border rounded px-3 py-2 bg-white">
          <option value="">Select District (Optional)</option>
          {BIHAR_DISTRICTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm">Role</label>
        <select name="employee_role" value={form.employee_role} onChange={onChange} className="mt-1 w-full border rounded px-3 py-2">
          {roles.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm">Password</label>
        <input type="password" name="password" value={form.password} onChange={onChange} className="mt-1 w-full border rounded px-3 py-2" required />
      </div>
      <button disabled={loading} className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">Create Account</button>
      <p className="text-sm text-slate-700">{msg}</p>
    </form>
  )
}
