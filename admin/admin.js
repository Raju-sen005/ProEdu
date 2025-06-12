const apiBase = 'http://localhost:3000/api';

const dataStore = { blog: [], news: [], event: [], job: [] };
const modalEl = document.getElementById('itemModal');
const modal = new bootstrap.Modal(modalEl);
const form = document.getElementById('itemForm');

// Sidebar navigation
document.querySelectorAll('.sidebar .nav-link').forEach(link => {
  link.addEventListener('click', () => {
    const t = link.dataset.target;
    document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
    document.getElementById(t).style.display = 'block';
    document.querySelectorAll('.sidebar .nav-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    fetchList(t);
  });
});

// Show first section by default
document.querySelector('.sidebar .nav-link').click();

// Open modal with correct fields
function openModal(type, item = {}) {
  form.reset();
  form.dataset.type = type;
  form.dataset.id = item.id || '';

  // Set values
  document.getElementById('itemTitle').value = item.title || '';
  document.getElementById('itemDesc').value = item.desc || '';
  document.getElementById('itemImage').value = item.image || '';
  document.getElementById('itemDate').value = item.date || '';

  // Show/hide fields
  document.getElementById('imageField').style.display = ['blog', 'news', 'event'].includes(type) ? 'block' : 'none';
  document.getElementById('dateField').style.display = ['news', 'event', 'job'].includes(type) ? 'block' : 'none';

  document.querySelector('#itemModal .modal-title').textContent =
    item.id ? `Edit ${capitalize(type)}` : `Add ${capitalize(type)}`;

  modal.show();
}

// Submit form
form.addEventListener('submit', async e => {
  e.preventDefault();

  const type = form.dataset.type;
  const id = form.dataset.id;

  const payload = {
    title: document.getElementById('itemTitle').value.trim(),
    desc: document.getElementById('itemDesc').value.trim(),
  };

  if (!payload.title) return alert('Title is required');

  // Include optional fields
  if (['blog', 'news', 'event'].includes(type)) {
    payload.image = document.getElementById('itemImage').value.trim();
  }
  if (['news', 'event', 'job'].includes(type)) {
    payload.date = document.getElementById('itemDate').value.trim();
  }

  if (!id) payload.id = Date.now(); // Generate ID if adding

  const method = id ? 'PUT' : 'POST';
  const url = id ? `${apiBase}/${type}/${id}` : `${apiBase}/${type}`;

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (res.ok) {
    modal.hide();
    fetchList(type);
  } else {
    alert('Failed to save data');
  }
});

// Fetch list
async function fetchList(type) {
  try {
    const res = await fetch(`${apiBase}/${type}`);
    dataStore[type] = await res.json();
    renderList(type);
  } catch (err) {
    alert(`Failed to fetch ${type}`);
  }
}

// Render list
function renderList(type) {
  const ul = document.getElementById(`${type}List`);
  ul.innerHTML = '';

  dataStore[type].forEach(item => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';

    const img = item.image ? `<img src="${item.image}" alt="" style="height:40px;width:40px;object-fit:cover;margin-right:10px;">` : '';
    const date = item.date ? `<br><small>${item.date}</small>` : '';


    li.innerHTML = `
      <div class="d-flex align-items-center">
        ${img}
        <div>
          <strong>${item.title}</strong><br>
          <small>${item.desc}</small>${date}
        </div>
      </div>
      <div>
        <button class="btn btn-sm btn-primary me-1" onclick='openModal("${type}", ${JSON.stringify(item)})'>Edit</button>
        <button class="btn btn-sm btn-danger" onclick='deleteItem("${type}", ${item.id})'>Delete</button>
      </div>`;
    ul.appendChild(li);
  });
}

// Delete
async function deleteItem(type, id) {
  if (!confirm(`Delete this ${type}?`)) return;
  const res = await fetch(`${apiBase}/${type}/${id}`, { method: 'DELETE' });
  if (res.ok) fetchList(type);
  else alert('Failed to delete');
}

// Capitalize
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
