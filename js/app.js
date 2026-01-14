const API_BASE = 'http://localhost:3000/api';

function setSession({ employeeId, name, role }) {
  localStorage.setItem('employeeId', String(employeeId));
  localStorage.setItem('name', name);
  localStorage.setItem('role', role);
  renderSession();
}

function clearSession() {
  localStorage.removeItem('employeeId');
  localStorage.removeItem('name');
  localStorage.removeItem('role');
  renderSession();
}

function renderSession() {
  const info = document.getElementById('sessionInfo');
  const id = localStorage.getItem('employeeId');
  const name = localStorage.getItem('name');
  const role = localStorage.getItem('role');
  if (id && name && role) {
    info.textContent = `Logged in as ${name} (${role}), ID: ${id}`;
  } else {
    info.textContent = 'Not logged in.';
  }
}

async function handleSignup(e) {
  e.preventDefault();
  const form = e.target;
  const data = {
    name: form.name.value.trim(),
    email_id: form.email_id.value.trim(),
    phone_number: form.phone_number.value.trim(),
    employee_role: form.employee_role.value,
    password: form.password.value,
  };
  const msg = document.getElementById('signupMsg');
  msg.textContent = '';

  try {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      msg.textContent = json.error || 'Signup failed.';
      return;
    }
    msg.textContent = 'Account created! You can login now.';
  } catch (err) {
    msg.textContent = 'Network error.';
    console.error(err);
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const form = e.target;
  const data = {
    email_id: form.email_id.value.trim(),
    password: form.password.value,
  };
  const msg = document.getElementById('loginMsg');
  msg.textContent = '';

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      msg.textContent = json.error || 'Login failed.';
      return;
    }
    setSession(json);
    msg.textContent = 'Logged in!';
  } catch (err) {
    msg.textContent = 'Network error.';
    console.error(err);
  }
}

function main() {
  document.getElementById('signupForm').addEventListener('submit', handleSignup);
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('logoutBtn').addEventListener('click', clearSession);
  renderSession();
}

main();
