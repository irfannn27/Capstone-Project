/* ============================================================
   script.js — Student Attendance System
   Vanilla JavaScript, no external libraries.
   Uses localStorage for persistence.
   ============================================================ */

'use strict';

// ============================================================
// 1. CONSTANTS & STORAGE KEYS
// ============================================================

/** localStorage key for students array */
const STORAGE_STUDENTS   = 'sas_students';
/** localStorage key for attendance records object (keyed by date) */
const STORAGE_ATTENDANCE = 'sas_attendance';

/** Valid attendance statuses */
const STATUSES = ['Hadir', 'Izin', 'Sakit', 'Alpha'];

// ============================================================
// 2. STATE
// ============================================================

/** @type {Array<{id: string, nim: string, name: string, prodi: string}>} */
let students = [];

/**
 * Attendance records keyed by date string (YYYY-MM-DD).
 * Each date maps to an object keyed by student id:
 * { [date]: { [studentId]: 'Hadir'|'Izin'|'Sakit'|'Alpha' } }
 * @type {Object}
 */
let attendance = {};

// ============================================================
// 3. PERSISTENCE — localStorage helpers
// ============================================================

/** Load data from localStorage into state */
function loadFromStorage() {
  try {
    const rawStudents   = localStorage.getItem(STORAGE_STUDENTS);
    const rawAttendance = localStorage.getItem(STORAGE_ATTENDANCE);
    students   = rawStudents   ? JSON.parse(rawStudents)   : [];
    attendance = rawAttendance ? JSON.parse(rawAttendance) : {};
  } catch (err) {
    // Corrupt data → reset
    console.warn('Storage corrupt, resetting.', err);
    students   = [];
    attendance = {};
  }
}

/** Persist current state to localStorage */
function saveStudents() {
  try {
    localStorage.setItem(STORAGE_STUDENTS, JSON.stringify(students));
  } catch (err) {
    showToast('Gagal menyimpan data mahasiswa.', 'error');
  }
}

/** Persist attendance to localStorage */
function saveAttendance() {
  try {
    localStorage.setItem(STORAGE_ATTENDANCE, JSON.stringify(attendance));
  } catch (err) {
    showToast('Gagal menyimpan data kehadiran.', 'error');
  }
}

// ============================================================
// 4. DOM HELPERS
// ============================================================

/**
 * Show or hide an element by toggling the "hidden" class.
 * @param {HTMLElement} el
 * @param {boolean} visible
 */
function setVisible(el, visible) {
  el.classList.toggle('hidden', !visible);
}

/**
 * Safely set text content of an element found by selector.
 * @param {string} selector
 * @param {string|number} text
 */
function setText(selector, text) {
  const el = document.querySelector(selector);
  if (el) el.textContent = text;
}

/**
 * Show a badge HTML string for a given status.
 * Returns a safe HTML string (status value is from our constant list only).
 * @param {string} status
 * @returns {string}
 */
function statusBadge(status) {
  const map = { Hadir: 'hadir', Izin: 'izin', Sakit: 'sakit', Alpha: 'alpha' };
  const cls = map[status] || 'alpha';
  return `<span class="badge badge-${cls}">${status}</span>`;
}

/**
 * Generate a simple unique id.
 * @returns {string}
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/**
 * Format a date string (YYYY-MM-DD) to locale display.
 * @param {string} dateStr
 * @returns {string}
 */
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('-');
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
}

/**
 * Get today's date as YYYY-MM-DD.
 * @returns {string}
 */
function todayStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Render a generic empty-state block */
function emptyStateHTML(message) {
  return `
    <div class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.2">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M9 17v-2m3 2v-4m3 4v-6M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
      </svg>
      <p>${message}</p>
    </div>`;
}

// ============================================================
// 5. TOAST NOTIFICATIONS
// ============================================================

/**
 * Show a toast notification.
 * @param {string} message
 * @param {'success'|'error'|'info'} type
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const icons = {
    success: `<svg xmlns="http://www.w3.org/2000/svg" class="toast__icon toast__icon--success" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>`,
    error:   `<svg xmlns="http://www.w3.org/2000/svg" class="toast__icon toast__icon--error" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>`,
    info:    `<svg xmlns="http://www.w3.org/2000/svg" class="toast__icon toast__icon--info" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z"/></svg>`,
  };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `${icons[type] || icons.info}<span></span>`;
  toast.querySelector('span').textContent = message;
  container.appendChild(toast);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    toast.classList.add('toast-out');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, 3000);
}

// ============================================================
// 6. NAVIGATION / PAGE ROUTING
// ============================================================

const PAGE_TITLES = {
  dashboard:  'Dashboard',
  students:   'Data Mahasiswa',
  attendance: 'Catat Kehadiran',
  history:    'Riwayat Kehadiran',
};

/**
 * Navigate to a named page.
 * @param {string} page — one of 'dashboard'|'students'|'attendance'|'history'
 */
function navigateTo(page) {
  // Hide all sections
  document.querySelectorAll('.page-section').forEach(el => el.classList.add('hidden'));
  // Show target section
  const target = document.getElementById(`page-${page}`);
  if (target) target.classList.remove('hidden');

  // Update nav active state
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('nav-active', btn.dataset.page === page);
  });

  // Update header title
  setText('#page-title', PAGE_TITLES[page] || '');

  // Close sidebar on mobile
  closeMobileSidebar();

  // Run page-specific refresh
  if (page === 'dashboard')  renderDashboard();
  if (page === 'students')   renderStudentTable();
  if (page === 'history')    renderHistoryTable();
}

// ============================================================
// 7. MOBILE SIDEBAR TOGGLE
// ============================================================

function openMobileSidebar() {
  document.getElementById('sidebar').classList.add('sidebar--open');
  document.getElementById('sidebar-overlay').classList.remove('hidden');
}

function closeMobileSidebar() {
  document.getElementById('sidebar').classList.remove('sidebar--open');
  document.getElementById('sidebar-overlay').classList.add('hidden');
}

// ============================================================
// 8. DASHBOARD
// ============================================================

function renderDashboard() {
  const dateInput = document.getElementById('dashboard-date');
  const selectedDate = dateInput.value || todayStr();

  // Update stat: total students
  setText('#stat-total', students.length);

  // Compute attendance counts for selected date
  const dayAttendance = attendance[selectedDate] || {};
  let countHadir = 0, countIzin = 0, countSakit = 0, countAlpha = 0;

  Object.values(dayAttendance).forEach(status => {
    if (status === 'Hadir') countHadir++;
    else if (status === 'Izin') countIzin++;
    else if (status === 'Sakit') countSakit++;
    else if (status === 'Alpha') countAlpha++;
  });

  setText('#stat-hadir', countHadir);
  setText('#stat-izin-sakit', countIzin + countSakit);
  setText('#stat-alpha', countAlpha);

  const dateLabel = formatDate(selectedDate);
  ['#stat-date-label','#stat-date-label2','#stat-date-label3'].forEach(sel => setText(sel, dateLabel));

  // Render mini summary table
  const container = document.getElementById('dashboard-attendance-summary');
  if (students.length === 0) {
    container.innerHTML = emptyStateHTML('Belum ada mahasiswa terdaftar.');
    return;
  }

  const hasData = Object.keys(dayAttendance).length > 0;
  if (!hasData) {
    container.innerHTML = emptyStateHTML(`Belum ada catatan kehadiran untuk ${dateLabel}.`);
    return;
  }

  // Build table rows — only for students that have a record that day
  const rows = students
    .filter(s => dayAttendance[s.id])
    .map(s => {
      const st = dayAttendance[s.id];
      return `<tr>
        <td>${s.nim}</td>
        <td>${s.name}</td>
        <td>${s.prodi}</td>
        <td>${statusBadge(st)}</td>
      </tr>`;
    }).join('');

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>NIM</th><th>Nama</th><th>Program Studi</th><th>Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ============================================================
// 9. STUDENT MANAGEMENT
// ============================================================

// --- Validation ---

/**
 * Validate student form inputs.
 * Returns true if valid, false otherwise.
 * @param {string} nim
 * @param {string} name
 * @param {string} prodi
 * @param {string|null} editId — student id being edited (null for new)
 */
function validateStudentForm(nim, name, prodi, editId) {
  let valid = true;

  // NIM
  const nimError = document.getElementById('error-nim');
  if (!nim) {
    nimError.textContent = 'NIM tidak boleh kosong.';
    nimError.classList.remove('hidden');
    valid = false;
  } else if (!/^\d{5,20}$/.test(nim)) {
    nimError.textContent = 'NIM harus berupa angka (5–20 digit).';
    nimError.classList.remove('hidden');
    valid = false;
  } else {
    // Duplicate NIM check (exclude current student when editing)
    const duplicate = students.find(s => s.nim === nim && s.id !== editId);
    if (duplicate) {
      nimError.textContent = 'NIM sudah terdaftar.';
      nimError.classList.remove('hidden');
      valid = false;
    } else {
      nimError.classList.add('hidden');
    }
  }

  // Name
  const nameError = document.getElementById('error-name');
  if (!name) {
    nameError.textContent = 'Nama tidak boleh kosong.';
    nameError.classList.remove('hidden');
    valid = false;
  } else if (name.length < 3) {
    nameError.textContent = 'Nama minimal 3 karakter.';
    nameError.classList.remove('hidden');
    valid = false;
  } else {
    nameError.classList.add('hidden');
  }

  // Prodi
  const prodiError = document.getElementById('error-prodi');
  if (!prodi) {
    prodiError.textContent = 'Program studi tidak boleh kosong.';
    prodiError.classList.remove('hidden');
    valid = false;
  } else if (prodi.length < 3) {
    prodiError.textContent = 'Program studi minimal 3 karakter.';
    prodiError.classList.remove('hidden');
    valid = false;
  } else {
    prodiError.classList.add('hidden');
  }

  return valid;
}

/** Clear all form error messages */
function clearFormErrors() {
  ['error-nim','error-name','error-prodi'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
}

/** Reset student form to "add new" mode */
function resetStudentForm() {
  document.getElementById('student-form').reset();
  document.getElementById('edit-index').value = '';
  document.getElementById('student-form-title').textContent = 'Tambah Mahasiswa';
  document.getElementById('btn-submit-student').textContent = 'Simpan';
  document.getElementById('btn-cancel-edit').classList.add('hidden');
  clearFormErrors();
}

/** Populate form with student data for editing */
function populateEditForm(studentId) {
  const student = students.find(s => s.id === studentId);
  if (!student) return;
  document.getElementById('input-nim').value   = student.nim;
  document.getElementById('input-name').value  = student.name;
  document.getElementById('input-prodi').value = student.prodi;
  document.getElementById('edit-index').value  = student.id;
  document.getElementById('student-form-title').textContent = 'Edit Mahasiswa';
  document.getElementById('btn-submit-student').textContent = 'Perbarui';
  document.getElementById('btn-cancel-edit').classList.remove('hidden');
  // Scroll to form
  document.getElementById('student-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// --- Render ---

/** Render the student table, with optional search filter */
function renderStudentTable(filter = '') {
  const container = document.getElementById('student-table-container');
  const query = (filter || document.getElementById('search-students').value || '').trim().toLowerCase();

  let filtered = students;
  if (query) {
    filtered = students.filter(s =>
      s.nim.toLowerCase().includes(query) ||
      s.name.toLowerCase().includes(query)
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = emptyStateHTML(
      query ? 'Mahasiswa tidak ditemukan.' : 'Belum ada mahasiswa terdaftar. Tambah mahasiswa di atas.'
    );
    return;
  }

  const rows = filtered.map((s, idx) => `
    <tr>
      <td class="cell-index">${idx + 1}</td>
      <td class="cell-nim">${s.nim}</td>
      <td>${s.name}</td>
      <td>${s.prodi}</td>
      <td>
        <div class="table-actions">
          <button class="btn-edit" data-action="edit" data-id="${s.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536M9 11l6-6 3 3-6 6H9v-3z"/>
            </svg>
            Edit
          </button>
          <button class="btn-delete" data-action="delete" data-id="${s.id}" data-name="${s.name}">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
            Hapus
          </button>
        </div>
      </td>
    </tr>`).join('');

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>#</th><th>NIM</th><th>Nama</th><th>Program Studi</th><th>Aksi</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ============================================================
// 10. ATTENDANCE RECORDING
// ============================================================

/** Render the attendance form for a given date */
function renderAttendanceList(date) {
  const container = document.getElementById('attendance-list-container');
  const saveBtnWrapper = document.getElementById('btn-save-attendance-wrapper');

  if (students.length === 0) {
    container.innerHTML = emptyStateHTML('Belum ada mahasiswa terdaftar.');
    setVisible(saveBtnWrapper, false);
    return;
  }

  const dayRecord = attendance[date] || {};

  const rows = students.map(s => {
    const current = dayRecord[s.id] || '';
    // Build radio pill buttons for each status
    const statusButtons = STATUSES.map(status => {
      const checked = current === status ? 'checked' : '';
      const checkedClass = current === status ? `checked-${status.toLowerCase()}` : '';
      return `
        <label class="status-label ${checkedClass}" data-status="${status}" data-sid="${s.id}">
          <input type="radio" name="status_${s.id}" value="${status}" ${checked} />
          <span>${status}</span>
        </label>`;
    }).join('');

    return `
      <div class="attendance-row">
        <div class="student-info">
          <p class="student-info__name">${s.name}</p>
          <p class="student-info__nim">${s.nim}</p>
        </div>
        <div class="status-options">${statusButtons}</div>
      </div>`;
  }).join('');

  container.innerHTML = `<div id="attendance-form-rows">${rows}</div>`;
  setVisible(saveBtnWrapper, true);

  // Attach change listeners to radio inputs to update pill styling
  container.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const sid = radio.closest('.attendance-row').querySelector('.status-options').querySelectorAll('.status-label');
      sid.forEach(label => {
        const statusVal = label.dataset.status;
        const isChecked = label.querySelector('input').checked;
        // Remove all checked classes
        STATUSES.forEach(s => label.classList.remove(`checked-${s.toLowerCase()}`));
        if (isChecked) {
          label.classList.add(`checked-${statusVal.toLowerCase()}`);
        }
      });
    });
  });
}

/** Collect attendance data from the form and save it */
function saveAttendanceForm(date) {
  const container = document.getElementById('attendance-form-rows');
  if (!container) {
    showToast('Muat data kehadiran terlebih dahulu.', 'error');
    return;
  }

  const record = {};
  students.forEach(s => {
    const checked = container.querySelector(`input[name="status_${s.id}"]:checked`);
    if (checked) {
      record[s.id] = checked.value;
    }
  });

  // Check at least one status recorded
  if (Object.keys(record).length === 0) {
    showToast('Pilih status kehadiran minimal satu mahasiswa.', 'error');
    return;
  }

  attendance[date] = record;
  saveAttendance();
  showToast(`Kehadiran ${formatDate(date)} berhasil disimpan.`, 'success');
  renderDashboard();
}

// ============================================================
// 11. HISTORY
// ============================================================

/** Render the history table with optional date and status filter */
function renderHistoryTable() {
  const container = document.getElementById('history-table-container');
  const dateFilter   = document.getElementById('history-date-filter').value;
  const statusFilter = document.getElementById('history-status-filter').value;

  // Flatten attendance records into rows
  const rows = [];
  Object.entries(attendance).forEach(([date, dayRecord]) => {
    if (dateFilter && date !== dateFilter) return;
    Object.entries(dayRecord).forEach(([studentId, status]) => {
      if (statusFilter && status !== statusFilter) return;
      const student = students.find(s => s.id === studentId);
      if (!student) return; // Student deleted
      rows.push({ date, nim: student.nim, name: student.name, prodi: student.prodi, status });
    });
  });

  if (rows.length === 0) {
    container.innerHTML = emptyStateHTML('Tidak ada riwayat kehadiran yang sesuai filter.');
    return;
  }

  // Sort by date descending, then name ascending
  rows.sort((a, b) => {
    if (b.date !== a.date) return b.date.localeCompare(a.date);
    return a.name.localeCompare(b.name);
  });

  const tableRows = rows.map((r, idx) => `
    <tr>
      <td class="cell-index">${idx + 1}</td>
      <td class="cell-nim">${r.nim}</td>
      <td>${r.name}</td>
      <td>${r.prodi}</td>
      <td>${formatDate(r.date)}</td>
      <td>${statusBadge(r.status)}</td>
    </tr>`).join('');

  container.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>#</th><th>NIM</th><th>Nama</th><th>Program Studi</th><th>Tanggal</th><th>Status</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>`;
}

// ============================================================
// 12. DELETE CONFIRMATION MODAL
// ============================================================

let pendingDeleteId = null;

/**
 * Open the confirmation modal for deleting a student.
 * @param {string} studentId
 * @param {string} studentName
 */
function openDeleteModal(studentId, studentName) {
  pendingDeleteId = studentId;
  const modal = document.getElementById('modal-confirm');
  document.getElementById('modal-confirm-text').textContent =
    `Hapus mahasiswa "${studentName}"? Data kehadiran terkait juga akan terhapus.`;
  modal.classList.remove('hidden');
}

function closeDeleteModal() {
  pendingDeleteId = null;
  document.getElementById('modal-confirm').classList.add('hidden');
}

/** Execute the pending delete */
function executeDelete() {
  if (!pendingDeleteId) return;
  const studentId = pendingDeleteId;

  // Remove from students array
  students = students.filter(s => s.id !== studentId);
  saveStudents();

  // Remove from all attendance records
  Object.keys(attendance).forEach(date => {
    delete attendance[date][studentId];
    // Clean up empty date records
    if (Object.keys(attendance[date]).length === 0) {
      delete attendance[date];
    }
  });
  saveAttendance();

  closeDeleteModal();
  renderStudentTable();
  showToast('Mahasiswa berhasil dihapus.', 'success');
}

// ============================================================
// 13. EVENT LISTENERS — SETUP
// ============================================================

function setupEventListeners() {

  // --- Navigation buttons ---
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.page));
  });

  // --- Mobile sidebar toggle ---
  document.getElementById('menu-toggle').addEventListener('click', openMobileSidebar);
  document.getElementById('sidebar-overlay').addEventListener('click', closeMobileSidebar);

  // --- Student form submission ---
  document.getElementById('student-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const nim   = document.getElementById('input-nim').value.trim();
    const name  = document.getElementById('input-name').value.trim();
    const prodi = document.getElementById('input-prodi').value.trim();
    const editId = document.getElementById('edit-index').value || null;

    if (!validateStudentForm(nim, name, prodi, editId)) return;

    if (editId) {
      // Update existing
      const idx = students.findIndex(s => s.id === editId);
      if (idx !== -1) {
        students[idx] = { ...students[idx], nim, name, prodi };
        showToast('Data mahasiswa berhasil diperbarui.', 'success');
      }
    } else {
      // Add new
      students.push({ id: generateId(), nim, name, prodi });
      showToast('Mahasiswa berhasil ditambahkan.', 'success');
    }

    saveStudents();
    resetStudentForm();
    renderStudentTable();
  });

  // --- Cancel edit ---
  document.getElementById('btn-cancel-edit').addEventListener('click', resetStudentForm);

  // --- Student table: event delegation for Edit and Delete ---
  document.getElementById('student-table-container').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id     = btn.dataset.id;
    const name   = btn.dataset.name || '';
    if (action === 'edit')   populateEditForm(id);
    if (action === 'delete') openDeleteModal(id, name);
  });

  // --- Search students ---
  document.getElementById('search-students').addEventListener('input', (e) => {
    renderStudentTable(e.target.value);
  });

  // --- Dashboard date filter ---
  document.getElementById('dashboard-date').addEventListener('change', renderDashboard);

  // --- Attendance: load button ---
  document.getElementById('btn-load-attendance').addEventListener('click', () => {
    const date = document.getElementById('attendance-date').value;
    if (!date) {
      showToast('Pilih tanggal terlebih dahulu.', 'error');
      return;
    }
    renderAttendanceList(date);
  });

  // --- Attendance: save button ---
  document.getElementById('btn-save-attendance').addEventListener('click', () => {
    const date = document.getElementById('attendance-date').value;
    if (!date) {
      showToast('Pilih tanggal terlebih dahulu.', 'error');
      return;
    }
    saveAttendanceForm(date);
  });

  // --- History filters ---
  document.getElementById('history-date-filter').addEventListener('change', renderHistoryTable);
  document.getElementById('history-status-filter').addEventListener('change', renderHistoryTable);

  // --- Reset history filter ---
  document.getElementById('btn-reset-history-filter').addEventListener('click', () => {
    document.getElementById('history-date-filter').value = '';
    document.getElementById('history-status-filter').value = '';
    renderHistoryTable();
  });

  // --- Delete modal ---
  document.getElementById('modal-cancel').addEventListener('click', closeDeleteModal);
  document.getElementById('modal-confirm-btn').addEventListener('click', executeDelete);

  // Close modal when clicking backdrop
  document.getElementById('modal-confirm').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal-confirm')) closeDeleteModal();
  });
}

// ============================================================
// 14. INITIALISE
// ============================================================

function init() {
  loadFromStorage();

  // Display today's date in the header
  const now = new Date();
  const headerDate = document.getElementById('current-date-display');
  if (headerDate) {
    headerDate.textContent = now.toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  // Default dashboard date to today
  const dashDateInput = document.getElementById('dashboard-date');
  dashDateInput.value = todayStr();

  // Default attendance date to today
  const attDateInput = document.getElementById('attendance-date');
  attDateInput.value = todayStr();

  setupEventListeners();

  // Start on dashboard
  navigateTo('dashboard');
}

// Boot the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
