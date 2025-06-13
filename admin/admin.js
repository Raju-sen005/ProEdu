const apiBase = 'https://proedu-b99f.onrender.com/api';
const dataStore = { blog: [], news: [], event: [], job: [] };
const modal = new bootstrap.Modal(document.getElementById('itemModal'));
const form = document.getElementById('itemForm');

window.addEventListener('DOMContentLoaded', () => {
  // ✅ Modal blur fix for aria-hidden warning:
  const modalEl = document.getElementById('itemModal');
  modalEl.addEventListener('hide.bs.modal', () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  });

  // Sidebar navigation setup:
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
  // Load default section:
  document.querySelector('.sidebar .nav-link').click();
});

// Open modal for add/edit:
function openModal(type, item = {}) {
  form.reset();
  form.dataset.type = type;
  form.dataset.id = item.id || '';
  document.getElementById('itemTitle').value = item.title || '';
  document.getElementById('itemDesc').value = item.desc || '';
  document.getElementById('itemImage').value = item.image || '';
  document.getElementById('itemDate').value = item.date || '';

  document.getElementById('imageField').style.display =
    ['blog', 'news', 'event', 'job'].includes(type) ? 'block' : 'none';
  document.getElementById('dateField').style.display =
    ['news', 'event', 'job'].includes(type) ? 'block' : 'none';
  document.getElementById('jobExtraFields').style.display =
    type === 'job' ? 'block' : 'none';

  if (type === 'job') {
    document.getElementById('candidateReq').value = item.candidateReq || '';
    document.getElementById('equipment').value = item.equipment || '';
  }

  document.querySelector('#itemModal .modal-title').textContent =
    item.id ? `Edit ${capitalize(type)}` : `Add ${capitalize(type)}`;
  modal.show();
}

// Form submit handler:
form.addEventListener('submit', async e => {
  e.preventDefault();
  const type = form.dataset.type, id = form.dataset.id;
  const payload = {
    title: form.itemTitle.value.trim(),
    desc: form.itemDesc.value.trim()
  };
  if (['blog', 'news', 'event', 'job'].includes(type)) {
    payload.image = form.itemImage.value.trim();
  }
  if (['news', 'event', 'job'].includes(type)) {
    payload.date = form.itemDate.value;
  }
  if (type === 'job') {
    payload.candidateReq = form.candidateReq.value.trim();
    payload.equipment = form.equipment.value.trim();
  }
  if (!payload.title) return alert('Title is required');
  if (!id) payload.id = Date.now();

  const res = await fetch(id ? `${apiBase}/${type}/${id}` : `${apiBase}/${type}`, {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (res.ok) {
    modal.hide();
    fetchList(type);
  } else {
    alert('Failed to save');
  }
});

// Fetch list from API:
async function fetchList(type) {
  const res = await fetch(`${apiBase}/${type}`);
  const arr = await res.json();
  dataStore[type] = arr.map((item, i) => ({ id: item.id ?? i + 1, ...item }));
  renderList(type);
}


// Render list items:
function renderList(type) {
  const ul = document.getElementById(`${type}List`);
  ul.innerHTML = '';

  dataStore[type].forEach(item => {
    const img = item.image
      ? `<img src="${item.image}" style="height:40px;width:40px;object-fit:cover;margin-right:10px;">`
      : '';
    const date = item.date ? `<br><small>${item.date}</small>` : '';
    const extra = type === 'job'
      ? `<br><small>Req: ${item.candidateReq}</small><br><small>Equip: ${item.equipment}</small>`
      : '';

    // Use data-id and data-type attributes for delete button
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center';
    li.innerHTML = `
      <div class="d-flex align-items-center">
        ${img}
        <div>
          <strong>${item.title}</strong><br>
          <small>${item.desc}</small>${date}${extra}
        </div>
      </div>
      <div>
        <button class="btn btn-sm btn-primary me-1"
          data-action="edit"
          data-type="${type}"
          data-item='${JSON.stringify(item)}'>
          Edit
        </button>
        <button class="btn btn-sm btn-danger"
          data-action="delete"
          data-type="${type}"
          data-id="${item.id}">
          Delete
        </button>
      </div>
    `;
    ul.appendChild(li);
  });

  // Attach event listeners after list is rendered
  ul.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', event => {
      const action = btn.getAttribute('data-action');
      const type = btn.getAttribute('data-type');
      if (action === 'delete') {
        const id = btn.getAttribute('data-id');
        deleteItem(type, id);
      } else if (action === 'edit') {
        const item = JSON.parse(btn.getAttribute('data-item'));
        openModal(type, item);
      }
    });
  });
}

// Delete handler:
async function deleteItem(type, id) {
  console.log('Deleting:', type, id);
  if (!confirm(`Delete this ${type}?`)) return;

  const res = await fetch(`${apiBase}/${type}/${id}`, { method: 'DELETE' });
  console.log('Delete status:', res.status);

  if (res.ok) {
    // Defer fetching so browser UI doesn’t block
    Promise.resolve().then(() => fetchList(type));
  } else {
    alert('Delete failed');
  }
}




function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
