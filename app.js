/**
 * client-side logic talking to server APIs.
 * no localStorage; authentication handled by server session.
 */

async function apiGetCurrent() {
  const res = await fetch('/api/profile');
  if (res.ok) return res.json();
  return null;
}

async function apiGetUsers(filters = {}) {
  const url = new URL('/api/users', window.location.origin);
  Object.entries(filters).forEach(([k,v])=>{ if(v) url.searchParams.append(k,v); });
  const res = await fetch(url);
  if (!res.ok) return [];
  return res.json();
}

async function apiGetRequests(filters = {}) {
  const url = new URL('/api/requests', window.location.origin);
  Object.entries(filters).forEach(([k,v])=>{ if(v) url.searchParams.append(k,v); });
  const res = await fetch(url);
  if (!res.ok) return [];
  return res.json();
}

async function apiPostRequest(data) {
  return fetch('/api/requests', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(data)
  });
}

async function apiDeleteRequest(id) {
  return fetch(`/api/requests/${id}`, {method:'DELETE'});
}

// ui helpers -------------------------------------------------
async function setAuthUI(){
  const me = await apiGetCurrent();
  const profileMenu = document.getElementById('profileMenu');
  const navLogin = document.querySelector('[data-nav="login"]')?.closest('li');
  const navRegister = document.querySelector('[data-nav="register"]')?.closest('li');
  if(me){
    profileMenu?.classList.remove('hidden');
    document.getElementById('welcomeName').textContent = me.name;
    navLogin?.classList.add('hidden');
    navRegister?.classList.add('hidden');
  } else {
    profileMenu?.classList.add('hidden');
    navLogin?.classList.remove('hidden');
    navRegister?.classList.remove('hidden');
  }
}

function highlightNav(){
  const page = document.body.getAttribute('id');
  if(!page) return;
  const navMap = {
    'page-home': 'home',
    'page-register': 'register',
    'page-login': 'login',
    'page-donors': 'donors',
    'page-requests': 'requests',
    'page-dashboard': 'dashboard'
  };
  const key = navMap[page];
  if(key){
    document.querySelectorAll('[data-nav]').forEach(a=>a.classList.remove('active'));
    document.querySelectorAll('[data-nav="'+key+'"]')?.forEach(a=>a.classList.add('active'));
  }
}

function badgeByUrgency(u){
  if(u==='Critical') return 'text-bg-danger';
  if(u==='High') return 'text-bg-warning';
  return 'text-bg-secondary';
}

async function updatePostingAs(){
  const me = await apiGetCurrent();
  const el = document.getElementById('postingAs');
  if(el) el.textContent = me ? me.name : 'Guest';
}

function renderDonorTable(list){
  const tbody = document.querySelector('#donorTable tbody');
  if(!tbody) return;
  tbody.innerHTML = list.map(u=> `
    <tr>
      <td class="fw-semibold">${u.name}</td>
      <td>${u.blood_group}</td>
      <td>${u.organ}</td>
      <td>${u.location}</td>
      <td><a href="tel:${u.phone}">${u.phone}</a></td>
      <td><a href="mailto:${u.email}">${u.email}</a></td>
      <td>${u.notes||''}</td>
    </tr>`).join('');
}

async function renderRequestTable(){
  const groupFilter = document.getElementById('filterByGroup')?.value;
  const params = groupFilter? { blood_group: groupFilter } : {};
  const list = await apiGetRequests(params);
  const rows = list.map(r=> `
      <tr>
        <td>${r.patient_name}</td>
        <td class="fw-semibold">${r.blood_group}</td>
        <td>${r.organ}</td>
        <td>${r.location}</td>
        <td>${r.hospital}</td>
        <td>${r.date_needed}</td>
        <td><span class="badge ${badgeByUrgency(r.urgency)}">${r.urgency}</span></td>
        <td>
          ${r.contact?.phone? `<a href="tel:${r.contact.phone}" class="me-2">${r.contact.phone}</a>`:''}
          ${r.contact?.email? `<a href="mailto:${r.contact.email}">${r.contact.email}</a>`:''}
        </td>
      </tr>`).join('');
  const tbody = document.querySelector('#requestTable tbody');
  if(tbody) tbody.innerHTML = rows || `<tr><td colspan="8" class="text-center text-secondary">No requests yet.</td></tr>`;
}

async function renderProfile(){
  const me = await apiGetCurrent();
  const profileEl = document.getElementById('profileDetails');
  if(!profileEl) return;
  if(!me){ profileEl.innerHTML = '<div class="text-secondary">Login required.</div>'; return; }
  const fields = [
    ['Name', me.name],['Email', me.email],['Phone', me.phone],
    ['Blood Group', me.blood_group],['City', me.location],['Notes', me.notes||'-']
  ];
  profileEl.innerHTML = fields.map(([k,v])=>`
    <dt class="col-5 text-secondary">${k}</dt><dd class="col-7">${v}</dd>`).join('');
}

async function renderMyRequests(){
  const me = await apiGetCurrent();
  const tbody = document.querySelector('#myRequestTable tbody');
  if(!tbody) return;
  if(!me){ tbody.innerHTML = '<tr><td colspan="6" class="text-secondary">Login required.</td></tr>'; return; }
  const list = await apiGetRequests({ user_id: me.id });
  tbody.innerHTML = list.map(r=>`
    <tr data-id="${r._id}">
      <td>${r.patient_name}</td>
      <td>${r.blood_group}</td>
      <td>${r.organ}</td>
      <td>${r.location}</td>
      <td>${r.hospital}</td>
      <td>${r.date_needed}</td>
      <td>${r.urgency}</td>
    </tr>`).join('') || '<tr><td colspan="6" class="text-secondary">No requests yet.</td></tr>';
  tbody.querySelectorAll('tr[data-id]').forEach(tr=>{
    tr.addEventListener('click', async ()=>{
      if(confirm('Remove this request?')){
        const id = tr.getAttribute('data-id');
        await apiDeleteRequest(id);
        renderRequestTable();
        renderMyRequests();
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', async ()=>{
  await setAuthUI();
  highlightNav();

  const logoutBtn = document.getElementById('logoutBtn');
  if(logoutBtn){
    logoutBtn.addEventListener('click', async ()=>{
      await fetch('/logout', {method:'POST'});
      await setAuthUI();
      window.location.href = 'index.html';
    });
  }

  // Register form handler
  const registerForm = document.getElementById('registerForm');
  if(registerForm){
    registerForm.addEventListener('submit', async e=>{
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = {
        name: fd.get('name').trim(),
        email: fd.get('email').trim(),
        phone: fd.get('phone').trim(),
        blood_group: fd.get('blood_group'),
        organ: fd.get('organ')?.trim() || '',
        location: fd.get('location').trim(),
        password: fd.get('password'),
        notes: fd.get('notes')?.trim() || ''
      };

      const msgEl = document.getElementById('registerMsg');
      try {
        const res = await fetch('/register', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(data)
        });
        const result = await res.json();
        if(res.ok && result.success){
          msgEl.innerHTML = `<div class="alert alert-success">${result.message}</div>`;
          registerForm.reset();
          setTimeout(() => window.location.href = '/login.html', 1500);
        } else {
          msgEl.innerHTML = `<div class="alert alert-danger">${result.error || 'Registration failed'}</div>`;
        }
      } catch(err){
        msgEl.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
      }
    });
  }

  // Login form handler
  const loginForm = document.getElementById('loginForm');
  if(loginForm){
    loginForm.addEventListener('submit', async e=>{
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = {
        email: fd.get('email').trim(),
        password: fd.get('password')
      };

      const msgEl = document.getElementById('loginMsg');
      try {
        const res = await fetch('/login', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(data)
        });
        const result = await res.json();
        if(res.ok && result.success){
          msgEl.innerHTML = `<div class="alert alert-success">${result.message}</div>`;
          await setAuthUI();
          setTimeout(() => window.location.href = '/index.html', 1500);
        } else {
          msgEl.innerHTML = `<div class="alert alert-danger">${result.error || 'Login failed'}</div>`;
        }
      } catch(err){
        msgEl.innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
      }
    });
  }

  const quickSearchForm = document.getElementById('quickSearchForm');
  if(quickSearchForm){
    quickSearchForm.addEventListener('submit', async e=>{
      e.preventDefault();
      const fd = new FormData(e.target);
      const group = fd.get('blood_group');
      const city = (fd.get('location')||'').trim();
      const users = await apiGetUsers({blood_group:group, location:city});
      const box = document.getElementById('quickResults');
      if(!users.length){ box.innerHTML = `<div class="alert alert-warning">No donors found. Try a different city or register now.</div>`; return; }
      const rows = users.map(u=>`
        <tr>
          <td class="fw-semibold">${u.name}</td>
          <td>${u.blood_group}</td>
          <td>${u.organ}</td>
          <td>${u.location}</td>
          <td><a href="tel:${u.phone}">${u.phone}</a></td>
          <td><a href="mailto:${u.email}">${u.email}</a></td>
          <td>${u.notes||''}</td>
        </tr>`).join('');
      box.innerHTML = `
        <div class="table-responsive">
          <table class="table align-middle">
            <thead><tr><th>Name</th><th>Blood Group</th><th>Organ</th><th>City</th><th>Phone</th><th>Email</th><th>Notes</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    });
  }

  const donorSearchForm = document.getElementById('donorSearchForm');
  if(donorSearchForm){
    donorSearchForm.addEventListener('submit', async e=>{
      e.preventDefault();
      const fd = new FormData(e.target);
      const group = fd.get('blood_group');
      const org = fd.get('organ');
      const city = (fd.get('location')||'').trim();
      const filters = { blood_group: group, organ: org, location: city };
      Object.keys(filters).forEach(k=>!filters[k] && delete filters[k]);
      const users = await apiGetUsers(filters);
      renderDonorTable(users);
    });
  }

  const requestForm = document.getElementById('requestForm');
  if(requestForm){
    requestForm.addEventListener('submit', async e=>{
      e.preventDefault();
      const me = await apiGetCurrent();
      if(!me){
        document.getElementById('requestMsg').innerHTML = `<div class="alert alert-warning">Please login to post a request.</div>`;
        return;
      }
      const fd = new FormData(e.target);
      const req = {
        patient_name: fd.get('patient_name').trim(),
        hospital: fd.get('hospital').trim(),
        location: fd.get('location').trim(),
        blood_group: fd.get('blood_group'),
        organ: fd.get('organ')?.trim() || '',
        date_needed: fd.get('date_needed'),
        urgency: fd.get('urgency')||'Normal'
      };
      const res = await apiPostRequest(req);
      if(res.ok){
        e.target.reset();
        document.getElementById('requestMsg').innerHTML = `<div class="alert alert-success">Request posted successfully! A confirmation email has been sent and donors have been notified.</div>`;
        renderRequestTable();
        renderMyRequests();
      } else {
        const data = await res.json();
        document.getElementById('requestMsg').innerHTML = `<div class="alert alert-danger">${data.error||'Failed to post'}</div>`;
      }
    });
  }

  const filterByGroup = document.getElementById('filterByGroup');
  if(filterByGroup) filterByGroup.addEventListener('change', renderRequestTable);

  if(document.getElementById('donorTable')) renderDonorTable(await apiGetUsers());
  if(document.getElementById('requestTable')) renderRequestTable();
  if(document.getElementById('postingAs')) updatePostingAs();
  if(document.getElementById('profileDetails')) renderProfile();
  if(document.getElementById('myRequestTable')) renderMyRequests();
});
