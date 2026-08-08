
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, get, update, remove, push, onValue, off } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  onAuthStateChanged, signOut, updatePassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBIdWmaPTl1GRCx0m3TlUZZCD6ERqYLBOI",
  authDomain: "jam3-28aa3.firebaseapp.com",
  databaseURL: "https://jam3-28aa3-default-rtdb.firebaseio.com",
  projectId: "jam3-28aa3",
  storageBucket: "jam3-28aa3.firebasestorage.app",
  messagingSenderId: "542003023497",
  appId: "1:542003023497:web:a5bad22439d6ea87578058"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);


const ADMIN_ACTIVATION_CODE = "JAM3-ADMIN-2025";


window.APP = {
  db, ref, set, get, update, remove, push, onValue, off,
  auth,
  currentUser: null,
  currentRole: null,
  currentStudentId: null,
  allStudents: [],
  allTasks: [],
  loginIntent: 'supervisor',
  supAvatarData: null,
  activeChatStudentId: null,
  _stChatId: null,
  _supChatId: null,
  _studentSupervisorId: null,
};


window.showScreen = function(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo(0, 0);
};

window.showLoading = function() { document.getElementById('loading').classList.add('show'); };
window.hideLoading = function() { document.getElementById('loading').classList.remove('show'); };

window.showToast = function(msg, type = 'success') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const tc = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span class="toast-icon">${icons[type] || '💬'}</span><span>${msg}</span>`;
  tc.appendChild(t);
  setTimeout(() => t.remove(), 3500);
};

window.openModal = function(id) { document.getElementById(id).classList.add('open'); };
window.closeModal = function(id) { document.getElementById(id).classList.remove('open'); };

window.formatDate = function(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
};

window.formatTime = function(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
};

window.statusLabel = function(s) {
  return { new: 'جديدة', progress: 'قيد التنفيذ', done: 'منجزة', late: 'متأخرة' }[s] || s;
};
window.statusBadgeClass = function(s) {
  return { new: 'badge-new', progress: 'badge-progress', done: 'badge-done', late: 'badge-late' }[s] || '';
};
window.statusDotClass = function(s) {
  return { new: 'status-new', progress: 'status-progress', done: 'status-done', late: 'status-late' }[s] || '';
};

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

function getChatId(idA, idB) {
  return [idA, idB].sort().join('_');
}

function firebaseAuthErrorText(e) {
  const code = e && e.code ? e.code : '';
  const map = {
    'auth/email-already-in-use': 'هذا البريد الإلكتروني مسجل بالفعل، جرّب تسجيل الدخول',
    'auth/invalid-email': 'صيغة البريد الإلكتروني غير صحيحة',
    'auth/weak-password': 'كلمة المرور ضعيفة، يجب أن تكون 6 أحرف على الأقل',
    'auth/user-not-found': 'لا يوجد حساب بهذا البريد الإلكتروني',
    'auth/wrong-password': 'كلمة المرور غير صحيحة',
    'auth/invalid-credential': 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    'auth/too-many-requests': 'محاولات كثيرة، حاول لاحقاً',
    'auth/requires-recent-login': 'لأسباب أمنية، يجب تسجيل الخروج والدخول من جديد قبل تنفيذ هذا الإجراء',
  };
  return map[code] || (e && e.message ? e.message : 'حدث خطأ غير متوقع');
}

window.triggerAvatarUpload = function(inputId) {
  document.getElementById(inputId).click();
};

window.handleStudentAvatarUpload = function() {
  const f = document.getElementById('st-avatar-file').files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = e => {
    APP.studentAvatarData = e.target.result;
    const img = document.getElementById('st-avatar-img');
    img.src = e.target.result;
    img.style.display = 'block';
  };
  r.readAsDataURL(f);
};

window.handleAvatarUpload = function(prefix) {
  const f = document.getElementById(`${prefix}-avatar-file`).files[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = e => {
    APP.supAvatarData = e.target.result;
    const img = document.getElementById(`${prefix}-avatar-img`);
    img.src = e.target.result;
    img.style.display = 'block';
  };
  r.readAsDataURL(f);
};

window.saveStudentSession = function(user) {
  localStorage.setItem('jam3_student', JSON.stringify(user));
};
window.loadStudentSession = function() {
  const u = localStorage.getItem('jam3_student');
  if (u) { APP.currentUser = JSON.parse(u); APP.currentRole = 'student'; return true; }
  return false;
};
window.clearStudentSession = function() {
  localStorage.removeItem('jam3_student');
};

window.logout = async function() {
  if (APP.chatListener) { off(ref(db, APP.chatListener)); APP.chatListener = null; }
  if (APP.currentRole === 'supervisor') {
    try { await signOut(auth); } catch (e) { /* ignore */ }
  }
  clearStudentSession();
  APP.currentUser = null;
  APP.currentRole = null;
  APP.activeChatStudentId = null;
  showScreen('screen-home');
  showToast('تم تسجيل الخروج', 'info');
};

window.openSupervisorAuth = function(intent) {
  APP.loginIntent = intent || 'supervisor';
  const icon = document.getElementById('sup-auth-icon');
  const title = document.getElementById('sup-auth-title');
  const sub = document.getElementById('sup-auth-sub');
  if (APP.loginIntent === 'admin') {
    icon.style.background = 'linear-gradient(135deg,var(--red),#e74c3c)';
    icon.textContent = '🛡';
    title.textContent = 'دخول الإدارة';
    sub.textContent = 'سجّل الدخول بحساب يملك صلاحية الإدارة العليا';
  } else {
    icon.style.background = 'linear-gradient(135deg,var(--accent),var(--accent-light))';
    icon.textContent = '👑';
    title.textContent = 'حساب المشرف';
    sub.textContent = 'سجل دخولك أو أنشئ حساب مشرف جديد بالبريد الإلكتروني';
  }
  showScreen('screen-supervisor-auth');
};

window.switchSupTab = function(tab, el) {
  document.querySelectorAll('#screen-supervisor-auth .tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('#screen-supervisor-auth .slide-section').forEach(s => s.classList.remove('active'));
  document.getElementById(`sup-${tab}`).classList.add('active');
};

window.supervisorRegister = async function() {
  const name = document.getElementById('sup-reg-name').value.trim();
  const email = document.getElementById('sup-reg-email').value.trim();
  const password = document.getElementById('sup-reg-password').value.trim();
  const adminCode = document.getElementById('sup-reg-admincode').value.trim();
  if (!name || !email || !password) { showToast('أدخل جميع البيانات المطلوبة', 'error'); return; }
  if (password.length < 6) { showToast('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error'); return; }
  showLoading();
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;
    const isAdmin = !!(adminCode && adminCode === ADMIN_ACTIVATION_CODE);
    const userData = {
      id: uid, name, email, role: 'supervisor',
      avatar: APP.supAvatarData || null, isAdmin, createdAt: Date.now()
    };
    await set(ref(db, `supervisors/${uid}`), userData);
    APP.currentUser = userData;
    APP.currentRole = 'supervisor';
    hideLoading();
    showToast(isAdmin ? `أهلاً ${name}! تم إنشاء حساب بصلاحية الإدارة` : `أهلاً ${name}! تم إنشاء الحساب`, 'success');
    loadSupervisorDashboard();
  } catch (e) {
    hideLoading();
    showToast(firebaseAuthErrorText(e), 'error');
  }
};

window.supervisorLogin = async function() {
  const email = document.getElementById('sup-login-email').value.trim();
  const password = document.getElementById('sup-login-password').value.trim();
  if (!email || !password) { showToast('أدخل البريد الإلكتروني وكلمة المرور', 'error'); return; }
  showLoading();
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;
    const snap = await get(ref(db, `supervisors/${uid}`));
    if (!snap.exists()) {
      await signOut(auth);
      hideLoading();
      showToast('هذا الحساب غير موجود في النظام أو تم حذفه من قبل الإدارة', 'error');
      return;
    }
    const profile = snap.val();
    if (APP.loginIntent === 'admin' && !profile.isAdmin) {
      await signOut(auth);
      hideLoading();
      showToast('هذا الحساب لا يملك صلاحيات الإدارة العليا', 'error');
      return;
    }
    APP.currentUser = profile;
    APP.currentRole = 'supervisor';
    hideLoading();
    showToast(`أهلاً ${profile.name}!`, 'success');
    loadSupervisorDashboard();
  } catch (e) {
    hideLoading();
    showToast(firebaseAuthErrorText(e), 'error');
  }
};

onAuthStateChanged(auth, async (user) => {
  if (APP.currentRole === 'supervisor' && APP.currentUser) return; // already loaded via explicit login/register
  if (user) {
    try {
      const snap = await get(ref(db, `supervisors/${user.uid}`));
      if (snap.exists()) {
        APP.currentUser = snap.val();
        APP.currentRole = 'supervisor';
        loadSupervisorDashboard();
        return;
      }
    } catch (e) { /* fall through */ }
  }
  if (!APP.currentUser && loadStudentSession()) {
    loadStudentDashboard();
  }
});

window.studentRegister = async function() {
  const name = document.getElementById('st-reg-name').value.trim();
  const phone = document.getElementById('st-reg-phone').value.trim();
  const password = document.getElementById('st-reg-password').value.trim();
  if (!name || !phone || !password) { showToast('أدخل جميع البيانات المطلوبة', 'error'); return; }
  if (password.length < 4) { showToast('كلمة المرور يجب أن تكون 4 أحرف على الأقل', 'error'); return; }
  showLoading();
  try {
    const snap = await get(ref(db, 'students'));
    if (snap.exists()) {
      const found = Object.values(snap.val()).find(s => s.phone === phone);
      if (found) { showToast('هذا الرقم مسجل بالفعل، استخدم تسجيل الدخول', 'error'); hideLoading(); return; }
    }
    const id = generateId();
    const userData = { id, name, phone, password, role: 'student', avatar: APP.studentAvatarData || null, createdAt: Date.now() };
    await set(ref(db, `students/${id}`), userData);
    APP.currentUser = userData;
    APP.currentRole = 'student';
    saveStudentSession(userData);
    hideLoading();
    showToast(`أهلاً ${name}! تم إنشاء حسابك`, 'success');
    loadStudentDashboard();
  } catch (e) {
    hideLoading();
    showToast('حدث خطأ: ' + e.message, 'error');
  }
};

window.studentLogin = async function() {
  const phone = document.getElementById('st-login-phone').value.trim();
  const password = document.getElementById('st-login-password').value.trim();
  if (!phone || !password) { showToast('أدخل رقم الهاتف وكلمة المرور', 'error'); return; }
  showLoading();
  try {
    const snap = await get(ref(db, 'students'));
    if (!snap.exists()) { showToast('لا يوجد حساب بهذا الرقم', 'error'); hideLoading(); return; }
    const found = Object.values(snap.val()).find(s => s.phone === phone);
    if (!found) { showToast('لا يوجد حساب بهذا الرقم', 'error'); hideLoading(); return; }
    if (found.password !== password) { showToast('كلمة المرور غير صحيحة', 'error'); hideLoading(); return; }
    APP.currentUser = found;
    APP.currentRole = 'student';
    saveStudentSession(found);
    hideLoading();
    showToast(`أهلاً ${found.name}!`, 'success');
    loadStudentDashboard();
  } catch (e) {
    hideLoading();
    showToast('حدث خطأ: ' + e.message, 'error');
  }
};

window.loadStudentDashboard = async function() {
  showScreen('screen-student-dashboard');
  const u = APP.currentUser;
  const avEl = document.getElementById('st-sidebar-avatar');
  if (u.avatar) avEl.innerHTML = `<img src="${u.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
  else avEl.textContent = '👤';
  document.getElementById('st-sidebar-name').textContent = u.name;
  await refreshStudentTasks();
  renderStudentProfile();
  setupStudentChatListener();
};

window.refreshStudentTasks = async function() {
  const u = APP.currentUser;
  showLoading();
  try {
    const snap = await get(ref(db, 'tasks'));
    let tasks = [];
    if (snap.exists()) {
      tasks = Object.values(snap.val()).filter(t => t.studentId === u.id);
    }
    APP.allTasks = tasks;
    renderStudentTasks(tasks);
    hideLoading();
  } catch (e) {
    hideLoading();
    showToast('خطأ في تحميل الواجبات', 'error');
  }
};

function renderStudentTasks(tasks) {
  const list = document.getElementById('st-task-list');
  const total = tasks.length;
  const prog = tasks.filter(t => t.status === 'progress').length;
  const done = tasks.filter(t => t.status === 'done').length;
  const ratings = tasks.filter(t => t.points !== undefined && t.points !== '').map(t => parseFloat(t.points));
  const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : 0;

  document.getElementById('st-total-tasks').textContent = total;
  document.getElementById('st-progress-tasks').textContent = prog;
  document.getElementById('st-done-tasks').textContent = done;
  document.getElementById('st-points').textContent = avgRating;
  document.getElementById('st-tasks-badge').textContent = total;

  if (!tasks.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-title">لا توجد واجبات بعد</div><div class="empty-state-sub">سيتم تعيين واجباتك من قبل المشرف</div></div>`;
    return;
  }

  list.innerHTML = tasks.sort((a, b) => b.createdAt - a.createdAt).map(t => `
    <div class="task-item" onclick="openTaskDetail('${t.id}')" style="cursor:pointer">
      <div class="task-status-dot ${statusDotClass(t.status)}"></div>
      <div class="task-content">
        <div class="task-title" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px">
          <span>📋 واجب</span>
          ${(t.sentDateHijri || t.sentDateMiladi) ? `
          <div style="text-align:left;font-size:11px;color:var(--text3);line-height:1.5">
            ${t.sentDateHijri ? `<div style="font-weight:600;color:var(--primary-dark)">${t.sentDateHijri}</div>` : ''}
            ${t.sentDateMiladi ? `<div>${t.sentDateMiladi}</div>` : ''}
          </div>` : `<span style="font-size:12px;color:var(--text3)">${formatDate(t.createdAt)}</span>`}
        </div>
        ${t.attendance ? `
        <div style="margin:6px 0">
          <span style="display:inline-flex;align-items:center;gap:6px;padding:5px 14px;border-radius:20px;font-size:13px;font-weight:700;${t.attendance==='present'?'background:rgba(26,107,69,0.12);color:var(--primary);border:1.5px solid rgba(26,107,69,0.3)':'background:rgba(192,57,43,0.1);color:var(--red);border:1.5px solid rgba(192,57,43,0.3)'}">
            ${t.attendance==='present'?'✅ حضور':'❌ غياب'}
          </span>
        </div>` : ''}
        <div class="task-meta" style="margin-top:8px">
          ${t.deadline ? `<span class="task-date">📅 موعد التسميع القادم: ${formatDate(t.deadline)}</span>` : ''}
          ${t.points !== undefined && t.points !== '' ? `<span class="task-points">⭐ تقييم: ${t.points}/10</span>` : ''}
        </div>
        ${(t.newHw || t.oldHw) ? `
        <div style="margin-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:8px">
          ${t.newHw ? `<div style="background:rgba(26,107,69,0.06);border:1px solid var(--border);border-radius:8px;padding:8px 10px"><div style="font-size:11px;color:var(--text3);margin-bottom:3px">الجديد</div><div style="font-size:13px;font-weight:600">${t.newHw}</div></div>` : ''}
          ${t.oldHw ? `<div style="background:rgba(36,113,163,0.06);border:1px solid var(--border);border-radius:8px;padding:8px 10px"><div style="font-size:11px;color:var(--text3);margin-bottom:3px">القديم</div><div style="font-size:13px;font-weight:600">${t.oldHw}</div></div>` : ''}
        </div>` : ''}
      </div>
      <div style="color:var(--text3);font-size:18px;margin-right:4px">←</div>
    </div>
  `).join('');
}

window.openTaskDetail = function(taskId) {
  const task = APP.allTasks.find(t => t.id === taskId);
  if (!task) return;
  document.getElementById('detail-body').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px">
      ${(task.sentDateHijri || task.sentDateMiladi) ? `
      <div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:12px 16px;display:flex;align-items:center;gap:12px">
        <span style="font-size:22px">📅</span>
        <div>
          <div style="font-size:11px;color:var(--text3);margin-bottom:2px">تاريخ إرسال الواجب</div>
          ${task.sentDateHijri ? `<div style="font-size:14px;font-weight:700;color:var(--primary-dark)">${task.sentDateHijri}</div>` : ''}
          ${task.sentDateMiladi ? `<div style="font-size:12px;color:var(--text3)">${task.sentDateMiladi}</div>` : ''}
        </div>
      </div>` : ''}
      ${task.attendance ? `
      <div>
        <span style="display:inline-flex;align-items:center;gap:8px;padding:8px 18px;border-radius:20px;font-size:14px;font-weight:700;${task.attendance==='present'?'background:rgba(26,107,69,0.12);color:var(--primary);border:1.5px solid rgba(26,107,69,0.3)':'background:rgba(192,57,43,0.1);color:var(--red);border:1.5px solid rgba(192,57,43,0.3)'}">
          ${task.attendance==='present'?'✅ حضور':'❌ غياب'}
        </span>
      </div>` : ''}
      ${(task.newMemorized || task.oldMemorized) ? `
      <div style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.2);border-radius:12px;padding:16px">
        <div style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:12px">📖 ما تم تسميعه</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          ${task.newMemorized ? `<div><div class="detail-label">الجديد</div><div class="detail-value" style="font-weight:600">${task.newMemorized}</div></div>` : ''}
          ${task.oldMemorized ? `<div><div class="detail-label">القديم</div><div class="detail-value" style="font-weight:600">${task.oldMemorized}</div></div>` : ''}
        </div>
      </div>` : ''}
      ${(task.newHw || task.oldHw) ? `
      <div style="background:rgba(26,107,69,0.06);border:1px solid rgba(26,107,69,0.15);border-radius:12px;padding:16px">
        <div style="font-size:13px;font-weight:700;color:var(--primary);margin-bottom:12px">📝 الواجب المطلوب</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          ${task.newHw ? `<div><div class="detail-label">الجديد (حفظ)</div><div class="detail-value" style="font-weight:600">${task.newHw}</div></div>` : ''}
          ${task.oldHw ? `<div><div class="detail-label">القديم (مراجعة)</div><div class="detail-value" style="font-weight:600">${task.oldHw}</div></div>` : ''}
        </div>
      </div>` : ''}
      ${task.deadline ? `
      <div class="detail-row">
        <div class="detail-label">📅 موعد التسميع القادم</div>
        <div class="detail-value" style="font-size:15px;font-weight:700;color:var(--primary)">🎤 ${formatDate(task.deadline)}</div>
      </div>` : ''}
      ${task.points !== undefined && task.points !== '' ? `
      <div class="detail-row">
        <div class="detail-label">التقييم</div>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="font-size:28px;font-weight:800;color:var(--accent)">${task.points}</div>
          <div style="color:var(--text3);font-size:14px">/ 10</div>
          ${ratingBar(task.points)}
        </div>
      </div>` : ''}
      ${task.note ? `<div class="detail-row"><div class="detail-label">ملاحظة المشرف</div><div class="note-box">${task.note}</div></div>` : ''}
    </div>
  `;
  openModal('modal-task-detail');
};

function ratingBar(score) {
  const pct = (parseFloat(score) / 10) * 100;
  const color = score >= 8 ? 'var(--primary)' : score >= 5 ? 'var(--orange)' : 'var(--red)';
  return `<div style="flex:1;height:8px;background:var(--bg2);border-radius:4px;overflow:hidden"><div style="width:${pct}%;height:100%;background:${color};border-radius:4px;transition:width 0.5s"></div></div>`;
}

function renderStudentProfile() {
  const u = APP.currentUser;
  const pc = document.getElementById('st-profile-card');
  pc.innerHTML = `
    <div class="profile-avatar">${u.avatar ? `<img src="${u.avatar}">` : '👤'}</div>
    <div>
      <div class="profile-name">${u.name}</div>
      <div class="profile-phone">📱 ${u.phone}</div>
      <div class="profile-badges">
        <span class="task-badge badge-done">طالب حفظ</span>
        <span class="task-badge badge-new">انضم ${formatDate(u.createdAt)}</span>
      </div>
    </div>
  `;
}

window.showStudentSection = function(section, el) {
  document.querySelectorAll('#screen-student-dashboard .nav-item').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');
  document.querySelectorAll('#screen-student-dashboard .slide-section').forEach(s => s.classList.remove('active'));
  document.getElementById(`st-section-${section}`).classList.add('active');
  if (section === 'chat') {
    document.getElementById('st-chat-badge').style.display = 'none';
    loadStudentChatMessages();
  }
};

function setupStudentChatListener() {
  const u = APP.currentUser;
  const chatRef = ref(db, 'chats');
  onValue(chatRef, (snap) => {
    if (!snap.exists()) return;
    const allChats = snap.val();
    let hasUnread = false;
    Object.keys(allChats).forEach(chatId => {
      if (chatId.includes(u.id)) {
        const msgs = Object.values(allChats[chatId].messages || {});
        const unread = msgs.filter(m => m.senderId !== u.id && !m.readByStudent);
        if (unread.length > 0) hasUnread = true;
      }
    });
    const badge = document.getElementById('st-chat-badge');
    badge.style.display = hasUnread ? 'inline-block' : 'none';
  });
}

async function loadStudentChatMessages() {
  const u = APP.currentUser;
  let supervisorId = APP._studentSupervisorId || null;

  if (!supervisorId) {
    const taskSnap = await get(ref(db, 'tasks'));
    if (taskSnap.exists()) {
      const task = Object.values(taskSnap.val()).find(t => t.studentId === u.id && t.supervisorId);
      if (task) supervisorId = task.supervisorId;
    }
  }

  if (!supervisorId) {
    const supSnap = await get(ref(db, 'supervisors'));
    if (supSnap.exists()) {
      const sups = Object.values(supSnap.val());
      if (sups.length > 0) supervisorId = sups[0].id;
    }
  }

  if (!supervisorId) {
    document.getElementById('st-chat-no-supervisor').style.display = 'block';
    document.getElementById('st-chat-area').style.display = 'none';
    return;
  }

  APP._studentSupervisorId = supervisorId;
  document.getElementById('st-chat-no-supervisor').style.display = 'none';
  document.getElementById('st-chat-area').style.display = 'block';
  APP.activeChatStudentId = supervisorId;

  const chatId = getChatId(u.id, supervisorId);

  if (APP._stChatId && APP._stChatId !== chatId) {
    off(ref(db, `chats/${APP._stChatId}/messages`));
  }
  APP._stChatId = chatId;

  onValue(ref(db, `chats/${chatId}/messages`), (snap) => {
    const container = document.getElementById('st-chat-messages');
    if (!snap.exists()) {
      container.innerHTML = `<div class="empty-state" style="padding:30px 20px"><div class="empty-state-icon">💬</div><div class="empty-state-title">لا توجد رسائل بعد</div><div class="empty-state-sub">ابدأ المحادثة مع مشرفك</div></div>`;
      return;
    }
    const msgs = Object.values(snap.val()).sort((a, b) => a.ts - b.ts);
    container.innerHTML = msgs.map(m => {
      const isSent = m.senderId === u.id;
      return `<div class="chat-msg ${isSent ? 'sent' : 'received'}">${m.text}<div class="chat-msg-meta">${formatTime(m.ts)}</div></div>`;
    }).join('');
    container.scrollTop = container.scrollHeight;

    msgs.filter(m => m.senderId !== u.id && !m.readByStudent).forEach(m => {
      update(ref(db, `chats/${chatId}/messages/${m.id}`), { readByStudent: true });
    });
  });
}

window.sendStudentMessage = async function() {
  const input = document.getElementById('st-chat-input');
  const text = input.value.trim();
  if (!text) return;
  const u = APP.currentUser;

  let supervisorId = APP._studentSupervisorId || null;

  if (!supervisorId) {
    const taskSnap = await get(ref(db, 'tasks'));
    if (taskSnap.exists()) {
      const task = Object.values(taskSnap.val()).find(t => t.studentId === u.id && t.supervisorId);
      if (task) supervisorId = task.supervisorId;
    }
    if (!supervisorId) {
      const supSnap = await get(ref(db, 'supervisors'));
      if (supSnap.exists()) {
        const sups = Object.values(supSnap.val());
        if (sups.length > 0) supervisorId = sups[0].id;
      }
    }
    if (supervisorId) APP._studentSupervisorId = supervisorId;
  }

  if (!supervisorId) {
    showToast('لا يوجد مشرف متاح حالياً', 'error');
    return;
  }

  const chatId = getChatId(u.id, supervisorId);
  const msgId = generateId();
  try {
    await set(ref(db, `chats/${chatId}/messages/${msgId}`), {
      id: msgId, text, senderId: u.id, senderName: u.name,
      senderRole: 'student', ts: Date.now(), readByStudent: true, readBySupervisor: false
    });
    input.value = '';

    if (!APP._stChatId || APP._stChatId !== chatId) {
      APP._stChatId = chatId;
      APP.activeChatStudentId = supervisorId;
      document.getElementById('st-chat-no-supervisor').style.display = 'none';
      document.getElementById('st-chat-area').style.display = 'block';
      onValue(ref(db, `chats/${chatId}/messages`), (snap) => {
        const container = document.getElementById('st-chat-messages');
        if (!snap.exists()) {
          container.innerHTML = `<div class="empty-state" style="padding:30px 20px"><div class="empty-state-icon">💬</div><div class="empty-state-title">لا توجد رسائل بعد</div></div>`;
          return;
        }
        const msgs = Object.values(snap.val()).sort((a, b) => a.ts - b.ts);
        container.innerHTML = msgs.map(m => {
          const isSent = m.senderId === u.id;
          return `<div class="chat-msg ${isSent ? 'sent' : 'received'}">${m.text}<div class="chat-msg-meta">${formatTime(m.ts)}</div></div>`;
        }).join('');
        container.scrollTop = container.scrollHeight;
        msgs.filter(m => m.senderId !== u.id && !m.readByStudent).forEach(m => {
          update(ref(db, `chats/${chatId}/messages/${m.id}`), { readByStudent: true });
        });
      });
    }
  } catch(e) {
    showToast('فشل الإرسال: ' + e.message, 'error');
  }
};

window.loadSupervisorDashboard = async function() {
  showScreen('screen-supervisor-dashboard');
  const u = APP.currentUser;
  document.getElementById('sup-nav-name').textContent = u.name;
  document.getElementById('sup-sidebar-name').textContent = u.name;
  const avEl = document.getElementById('sup-sidebar-avatar');
  if (u.avatar) avEl.innerHTML = `<img src="${u.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
  else avEl.textContent = '👑';
  document.getElementById('sup-overview-greeting').textContent = `أهلاً ${u.name}، إليك ملخص اليوم`;
  document.getElementById('settings-name').value = u.name;
  document.getElementById('settings-email').value = u.email || '';

  const isAdmin = !!u.isAdmin;
  const roleBadge = document.getElementById('sup-sidebar-role');
  roleBadge.textContent = isAdmin ? 'مشرف + إدارة عليا' : 'مشرف';
  document.getElementById('sup-admin-section-title').style.display = isAdmin ? 'block' : 'none';
  document.getElementById('sup-nav-admin-students').style.display = isAdmin ? 'flex' : 'none';
  document.getElementById('sup-nav-admin-supervisors').style.display = isAdmin ? 'flex' : 'none';

  await loadAllData();
  setupSupChatUnreadListener();

  if (isAdmin) await loadAdminData();

  if (APP.loginIntent === 'admin' && isAdmin) {
    showSupSection('admin-students', document.getElementById('sup-nav-admin-students'));
  }
  APP.loginIntent = 'supervisor';
};

window.loadAllData = async function() {
  showLoading();
  try {
    const [studSnap, taskSnap] = await Promise.all([
      get(ref(db, 'students')),
      get(ref(db, 'tasks'))
    ]);
    APP.allStudents = studSnap.exists() ? Object.values(studSnap.val()) : [];
    APP.allTasks = taskSnap.exists() ? Object.values(taskSnap.val()) : [];
    renderSupOverview();
    renderSupStudents();
    renderSupAllTasks();
    hideLoading();
  } catch (e) {
    hideLoading();
    showToast('خطأ في تحميل البيانات', 'error');
  }
};

function setupSupChatUnreadListener() {
  const u = APP.currentUser;
  onValue(ref(db, 'chats'), (snap) => {
    if (!snap.exists()) return;
    const allChats = snap.val();
    let hasUnread = false;
    Object.keys(allChats).forEach(chatId => {
      if (chatId.includes(u.id)) {
        const msgs = Object.values(allChats[chatId].messages || {});
        const unread = msgs.filter(m => m.senderId !== u.id && !m.readBySupervisor);
        if (unread.length > 0) hasUnread = true;
      }
    });
    const badge = document.getElementById('sup-chat-unread-badge');
    badge.style.display = hasUnread ? 'inline-block' : 'none';
  });
}

function renderSupOverview() {
  const students = APP.allStudents;
  const tasks = APP.allTasks;
  document.getElementById('sup-stat-students').textContent = students.length;
  document.getElementById('sup-stat-tasks').textContent = tasks.length;
  document.getElementById('sup-stat-done').textContent = tasks.filter(t => t.status === 'done').length;
  document.getElementById('sup-stat-progress').textContent = tasks.filter(t => t.status === 'progress').length;
  document.getElementById('sup-students-badge').textContent = students.length;

  const grid = document.getElementById('sup-recent-students');
  if (!students.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">👥</div><div class="empty-state-title">لا يوجد طلاب بعد</div></div>`;
    return;
  }
  grid.innerHTML = students.slice(0, 4).map(s => studentCardHTML(s)).join('');
}

function studentCardHTML(s) {
  const tasks = APP.allTasks.filter(t => t.studentId === s.id);
  const done = tasks.filter(t => t.status === 'done').length;
  const ratings = tasks.filter(t => t.points !== undefined && t.points !== '').map(t => parseFloat(t.points));
  const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : '—';
  return `
    <div class="student-card" onclick="openStudentProfile('${s.id}')">
      <div class="student-card-avatar">${s.avatar ? `<img src="${s.avatar}">` : '👤'}</div>
      <div class="student-card-name">${s.name}</div>
      <div class="student-card-phone">📱 ${s.phone}</div>
      <div class="student-card-stats">
        <div class="student-stat"><div class="student-stat-val">${tasks.length}</div><div class="student-stat-lbl">واجبات</div></div>
        <div class="student-stat"><div class="student-stat-val">${done}</div><div class="student-stat-lbl">منجزة</div></div>
        <div class="student-stat"><div class="student-stat-val">${avgRating}</div><div class="student-stat-lbl">تقييم</div></div>
      </div>
    </div>
  `;
}

function renderSupStudents() {
  const grid = document.getElementById('sup-students-grid');
  if (!APP.allStudents.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">👥</div><div class="empty-state-title">لا يوجد طلاب</div><div class="empty-state-sub">ستظهر قائمة الطلاب بعد تسجيلهم من الصفحة الرئيسية</div></div>`;
    return;
  }
  grid.innerHTML = APP.allStudents.map(s => studentCardHTML(s)).join('');
}

window.filterStudents = function() {
  const q = document.getElementById('student-search').value.trim().toLowerCase();
  const filtered = q ? APP.allStudents.filter(s => s.name.toLowerCase().includes(q) || s.phone.includes(q)) : APP.allStudents;
  const grid = document.getElementById('sup-students-grid');
  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">🔍</div><div class="empty-state-title">لا توجد نتائج</div></div>`;
    return;
  }
  grid.innerHTML = filtered.map(s => studentCardHTML(s)).join('');
};

window.openStudentProfile = function(studentId) {
  const student = APP.allStudents.find(s => s.id === studentId);
  if (!student) return;
  APP.currentStudentId = studentId;
  document.getElementById('sup-profile-title').textContent = `ملف الطالب: ${student.name}`;

  const tasks = APP.allTasks.filter(t => t.studentId === studentId);
  const done = tasks.filter(t => t.status === 'done').length;
  const pct = tasks.length ? Math.round(done / tasks.length * 100) : 0;
  const ratings = tasks.filter(t => t.points !== undefined && t.points !== '').map(t => parseFloat(t.points));
  const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : '—';

  const header = document.getElementById('sup-profile-header');
  header.innerHTML = `
    <div class="profile-avatar">${student.avatar ? `<img src="${student.avatar}">` : '👤'}</div>
    <div style="flex:1">
      <div class="profile-name">${student.name}</div>
      <div class="profile-phone">📱 ${student.phone}</div>
      <div class="profile-badges">
        <span class="task-badge badge-done">📋 ${tasks.length} واجب</span>
        <span class="task-badge badge-new">✅ ${done} منجز</span>
        <span class="task-points">⭐ معدل: ${avgRating}/10</span>
      </div>
      <div style="margin-top:10px">
        <div style="font-size:12px;color:var(--text3);margin-bottom:4px">التقدم الإجمالي ${pct}%</div>
        <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
      </div>
    </div>
    <div>
      <button class="btn btn-danger btn-sm" onclick="confirmDeleteStudent('${student.id}')">🗑 حذف</button>
    </div>
  `;

  renderSupStudentTasks(studentId);
  renderSupStudentNotes(studentId);
  showSupSection('student-profile', null);
};

function renderSupStudentTasks(studentId) {
  const tasks = APP.allTasks.filter(t => t.studentId === studentId);
  const list = document.getElementById('sup-student-tasks');
  if (!tasks.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-title">لا توجد واجبات</div><div class="empty-state-sub">اضغط على "إضافة واجب" لإضافة واجب جديد</div></div>`;
    return;
  }
  list.innerHTML = tasks.sort((a, b) => b.createdAt - a.createdAt).map(t => `
    <div class="task-item">
      <div class="task-status-dot ${statusDotClass(t.status)}"></div>
      <div class="task-content">
        <div class="task-title" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px">
          <span>📋 واجب</span>
          ${(t.sentDateHijri || t.sentDateMiladi) ? `
          <div style="text-align:left;font-size:11px;color:var(--text3);line-height:1.5">
            ${t.sentDateHijri ? `<div style="font-weight:600;color:var(--primary-dark)">${t.sentDateHijri}</div>` : ''}
            ${t.sentDateMiladi ? `<div>${t.sentDateMiladi}</div>` : ''}
          </div>` : `<span style="font-size:12px;color:var(--text3)">${formatDate(t.createdAt)}</span>`}
        </div>
        ${t.attendance ? `
        <div style="margin:6px 0">
          <span style="display:inline-flex;align-items:center;gap:6px;padding:5px 14px;border-radius:20px;font-size:13px;font-weight:700;${t.attendance==='present'?'background:rgba(26,107,69,0.12);color:var(--primary);border:1.5px solid rgba(26,107,69,0.3)':'background:rgba(192,57,43,0.1);color:var(--red);border:1.5px solid rgba(192,57,43,0.3)'}">
            ${t.attendance==='present'?'✅ حضور':'❌ غياب'}
          </span>
        </div>` : ''}
        ${(t.newMemorized || t.oldMemorized) ? `
        <div style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.2);border-radius:8px;padding:10px;margin:8px 0">
          <div style="font-size:11px;color:var(--accent);font-weight:700;margin-bottom:6px">📖 ما تم تسميعه</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">
            ${t.newMemorized ? `<div><span style="color:var(--text3)">الجديد: </span><strong>${t.newMemorized}</strong></div>` : ''}
            ${t.oldMemorized ? `<div><span style="color:var(--text3)">القديم: </span><strong>${t.oldMemorized}</strong></div>` : ''}
          </div>
        </div>` : ''}
        ${t.points !== undefined && t.points !== '' ? `
        <div style="background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.25);border-radius:8px;padding:8px 12px;margin:6px 0;display:flex;align-items:center;gap:8px">
          <span style="font-size:13px;color:var(--text3)">التقييم:</span>
          <span style="font-size:18px;font-weight:800;color:var(--accent)">${t.points}</span>
          <span style="font-size:12px;color:var(--text3)">/ 10</span>
          <div style="flex:1;height:6px;background:var(--bg2);border-radius:3px;overflow:hidden;margin-right:4px">
            <div style="width:${(parseFloat(t.points)/10)*100}%;height:100%;background:${parseFloat(t.points)>=8?'var(--primary)':parseFloat(t.points)>=5?'var(--orange)':'var(--red)'};border-radius:3px"></div>
          </div>
        </div>` : ''}
        ${(t.newHw || t.oldHw) ? `
        <div style="background:rgba(26,107,69,0.04);border:1px solid rgba(26,107,69,0.15);border-radius:8px;padding:10px;margin:6px 0">
          <div style="font-size:11px;color:var(--primary);font-weight:700;margin-bottom:6px">📝 الواجب المطلوب</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            ${t.newHw ? `<div style="background:rgba(26,107,69,0.06);border:1px solid var(--border);border-radius:6px;padding:8px"><div style="font-size:11px;color:var(--text3)">الجديد</div><div style="font-size:13px;font-weight:600">${t.newHw}</div></div>` : ''}
            ${t.oldHw ? `<div style="background:rgba(36,113,163,0.06);border:1px solid var(--border);border-radius:6px;padding:8px"><div style="font-size:11px;color:var(--text3)">القديم</div><div style="font-size:13px;font-weight:600">${t.oldHw}</div></div>` : ''}
          </div>
        </div>` : ''}
        <div class="task-meta">
          <span class="task-badge ${statusBadgeClass(t.status)}">${statusLabel(t.status)}</span>
          ${t.deadline ? `<span class="task-date">📅 موعد التسميع القادم: ${formatDate(t.deadline)}</span>` : ''}
        </div>
        ${t.note ? `<div class="note-box" style="margin-top:8px">💬 ${t.note}</div>` : ''}
      </div>
      <div class="task-actions">
        <button class="btn btn-outline btn-sm" onclick="openEditTask('${t.id}')">✏️ تعديل</button>
        <button class="btn btn-danger btn-sm" onclick="deleteTask('${t.id}')">🗑 حذف</button>
      </div>
    </div>
  `).join('');
}

function renderSupStudentNotes(studentId) {
  const student = APP.allStudents.find(s => s.id === studentId);
  const notesEl = document.getElementById('sup-student-notes');
  const notes = student?.notes || [];
  if (!notes.length) {
    notesEl.innerHTML = `<div style="color:var(--text3);font-size:14px;text-align:center;padding:20px">لا توجد ملاحظات بعد</div>`;
  } else {
    notesEl.innerHTML = notes.map(n => `
      <div class="note-box" style="margin-bottom:10px;position:relative">
        <div style="font-size:11px;color:var(--text3);margin-bottom:4px">${formatDate(n.date)}</div>
        ${n.text}
        <button onclick="deleteNote('${studentId}','${n.id}')" style="position:absolute;top:8px;left:8px;background:none;border:none;cursor:pointer;color:var(--red);font-size:14px">✕</button>
      </div>
    `).join('');
  }
}

function renderSupAllTasks() {
  const list = document.getElementById('sup-all-tasks');
  if (!APP.allTasks.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-title">لا توجد واجبات</div></div>`;
    return;
  }
  list.innerHTML = APP.allTasks.sort((a, b) => b.createdAt - a.createdAt).map(t => {
    const student = APP.allStudents.find(s => s.id === t.studentId);
    return `
      <div class="task-item">
        <div class="task-status-dot ${statusDotClass(t.status)}"></div>
        <div class="task-content">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px;margin-bottom:6px">
            <span style="font-size:12px;color:var(--text3)">👤 ${student?.name || 'طالب محذوف'}</span>
            ${(t.sentDateHijri || t.sentDateMiladi) ? `
            <div style="text-align:left;font-size:11px;color:var(--text3);line-height:1.5">
              ${t.sentDateHijri ? `<div style="font-weight:600;color:var(--primary-dark)">${t.sentDateHijri}</div>` : ''}
              ${t.sentDateMiladi ? `<div>${t.sentDateMiladi}</div>` : ''}
            </div>` : `<span style="font-size:11px;color:var(--text3)">${formatDate(t.createdAt)}</span>`}
          </div>
          <div class="task-title">📋 واجب</div>
          ${(t.newHw || t.oldHw) ? `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0;font-size:13px">
            ${t.newHw ? `<div><span style="color:var(--text3)">الجديد: </span><strong>${t.newHw}</strong></div>` : ''}
            ${t.oldHw ? `<div><span style="color:var(--text3)">القديم: </span><strong>${t.oldHw}</strong></div>` : ''}
          </div>` : ''}
          <div class="task-meta">
            <span class="task-badge ${statusBadgeClass(t.status)}">${statusLabel(t.status)}</span>
            ${t.deadline ? `<span class="task-date">📅 موعد التسميع القادم: ${formatDate(t.deadline)}</span>` : ''}
            ${t.points !== undefined && t.points !== '' ? `<span class="task-points">⭐ ${t.points}/10</span>` : ''}
          </div>
        </div>
        <div class="task-actions">
          <button class="btn btn-outline btn-sm" onclick="openEditTask('${t.id}')">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="deleteTask('${t.id}')">🗑</button>
        </div>
      </div>
    `;
  }).join('');
}

window.showSupSection = function(section, el) {
  document.querySelectorAll('#screen-supervisor-dashboard .nav-item').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');
  document.querySelectorAll('#screen-supervisor-dashboard .slide-section').forEach(s => s.classList.remove('active'));
  document.getElementById(`sup-section-${section}`).classList.add('active');
  if (section === 'chat') renderSupChatStudentsList();
};

function renderSupChatStudentsList() {
  const list = document.getElementById('sup-chat-students-list');
  if (!APP.allStudents.length) {
    list.innerHTML = `<div class="empty-state" style="padding:30px 10px"><div class="empty-state-icon">👥</div><div class="empty-state-title" style="font-size:14px">لا يوجد طلاب</div></div>`;
    return;
  }
  list.innerHTML = APP.allStudents.map(s => `
    <div class="chat-student-item ${APP.activeChatStudentId === s.id ? 'active' : ''}" onclick="openSupChatWith('${s.id}')">
      <div class="chat-student-item-avatar">${s.avatar ? `<img src="${s.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">` : '👤'}</div>
      <div>
        <div style="font-size:14px;font-weight:700;color:var(--text)">${s.name}</div>
        <div style="font-size:12px;color:var(--text3)">${s.phone}</div>
      </div>
    </div>
  `).join('');
}

window.openSupChatWithStudent = function() {
  showSupSection('chat', null);
  openSupChatWith(APP.currentStudentId);
};

window.openSupChatWith = function(studentId) {
  APP.activeChatStudentId = studentId;
  const student = APP.allStudents.find(s => s.id === studentId);
  if (!student) return;

  document.querySelectorAll('.chat-student-item').forEach(i => i.classList.remove('active'));
  document.querySelectorAll('.chat-student-item').forEach(i => {
    if (i.getAttribute('onclick') && i.getAttribute('onclick').includes(studentId)) i.classList.add('active');
  });

  document.getElementById('sup-chat-placeholder').style.display = 'none';
  const area = document.getElementById('sup-chat-area');
  area.style.display = 'block';

  document.getElementById('sup-chat-student-name').textContent = student.name;
  document.getElementById('sup-chat-student-avatar').textContent = student.avatar ? '' : '👤';
  if (student.avatar) {
    document.getElementById('sup-chat-student-avatar').innerHTML = `<img src="${student.avatar}" style="width:36px;height:36px;border-radius:50%;object-fit:cover">`;
  }

  const u = APP.currentUser;
  const chatId = getChatId(u.id, studentId);

  if (APP._supChatId && APP._supChatId !== chatId) {
    off(ref(db, `chats/${APP._supChatId}/messages`));
  }
  APP._supChatId = chatId;

  onValue(ref(db, `chats/${chatId}/messages`), (snap) => {
    const container = document.getElementById('sup-chat-messages');
    if (!snap.exists()) {
      container.innerHTML = `<div class="empty-state" style="padding:30px 20px"><div class="empty-state-icon">💬</div><div class="empty-state-title">لا توجد رسائل بعد</div></div>`;
      return;
    }
    const msgs = Object.values(snap.val()).sort((a, b) => a.ts - b.ts);
    container.innerHTML = msgs.map(m => {
      const isSent = m.senderId === u.id;
      return `<div class="chat-msg ${isSent ? 'sent' : 'received'}">
        ${m.text}
        <div class="chat-msg-meta">${formatTime(m.ts)}</div>
      </div>`;
    }).join('');
    container.scrollTop = container.scrollHeight;

    msgs.filter(m => m.senderId !== u.id && !m.readBySupervisor).forEach(m => {
      update(ref(db, `chats/${chatId}/messages/${m.id}`), { readBySupervisor: true });
    });
  });
};

window.sendSupervisorMessage = async function() {
  const input = document.getElementById('sup-chat-input');
  const text = input.value.trim();
  if (!text || !APP.activeChatStudentId) return;
  const u = APP.currentUser;
  const chatId = getChatId(u.id, APP.activeChatStudentId);
  const msgId = generateId();
  await set(ref(db, `chats/${chatId}/messages/${msgId}`), {
    id: msgId, text, senderId: u.id, senderName: u.name,
    senderRole: 'supervisor', ts: Date.now(), readBySupervisor: true, readByStudent: false
  });
  input.value = '';
};

const ARABIC_DAYS = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
const ARABIC_MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

function getHijriDate(date) {
  try {
    const hijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
      day: 'numeric', month: 'long', year: 'numeric', weekday: 'long'
    }).formatToParts(date);
    return hijri.map(p => p.value).join('').replace(/\s+/g,' ').trim();
  } catch(e) {
    return '';
  }
}

function getMiladiDate(date) {
  const day = ARABIC_DAYS[date.getDay()];
  const d = date.getDate();
  const m = ARABIC_MONTHS[date.getMonth()];
  const y = date.getFullYear();
  return `${day}، ${d} ${m} ${y}م`;
}

window.openAddTaskModal = function() {
  document.getElementById('task-new-memorized').value = '';
  document.getElementById('task-old-memorized').value = '';
  document.getElementById('task-new-hw').value = '';
  document.getElementById('task-old-hw').value = '';
  document.getElementById('task-deadline').value = getTodayDate();
  document.getElementById('task-points').value = '';
  document.getElementById('task-note').value = '';
  document.getElementById('task-attendance').value = '';

  document.getElementById('btn-attend-present').style.background = 'var(--surface)';
  document.getElementById('btn-attend-present').style.borderColor = 'var(--border2)';
  document.getElementById('btn-attend-present').style.color = 'var(--text2)';
  document.getElementById('btn-attend-absent').style.background = 'var(--surface)';
  document.getElementById('btn-attend-absent').style.borderColor = 'var(--border2)';
  document.getElementById('btn-attend-absent').style.color = 'var(--text2)';

  const now = new Date();
  const hijri = getHijriDate(now);
  const miladi = getMiladiDate(now);
  document.getElementById('task-today-hijri').textContent = hijri || miladi;
  document.getElementById('task-today-miladi').textContent = hijri ? miladi : '';

  openModal('modal-add-task');
};

window.setAttendance = function(val) {
  document.getElementById('task-attendance').value = val;
  const pBtn = document.getElementById('btn-attend-present');
  const aBtn = document.getElementById('btn-attend-absent');
  if (val === 'present') {
    pBtn.style.background = 'rgba(26,107,69,0.12)';
    pBtn.style.borderColor = 'var(--primary)';
    pBtn.style.color = 'var(--primary)';
    aBtn.style.background = 'var(--surface)';
    aBtn.style.borderColor = 'var(--border2)';
    aBtn.style.color = 'var(--text2)';
  } else {
    aBtn.style.background = 'rgba(192,57,43,0.1)';
    aBtn.style.borderColor = 'var(--red)';
    aBtn.style.color = 'var(--red)';
    pBtn.style.background = 'var(--surface)';
    pBtn.style.borderColor = 'var(--border2)';
    pBtn.style.color = 'var(--text2)';
  }
};

window.setEditAttendance = function(val) {
  document.getElementById('edit-task-attendance').value = val;
  const pBtn = document.getElementById('edit-btn-attend-present');
  const aBtn = document.getElementById('edit-btn-attend-absent');
  if (val === 'present') {
    pBtn.style.background = 'rgba(26,107,69,0.12)';
    pBtn.style.borderColor = 'var(--primary)';
    pBtn.style.color = 'var(--primary)';
    aBtn.style.background = 'var(--surface)';
    aBtn.style.borderColor = 'var(--border2)';
    aBtn.style.color = 'var(--text2)';
  } else {
    aBtn.style.background = 'rgba(192,57,43,0.1)';
    aBtn.style.borderColor = 'var(--red)';
    aBtn.style.color = 'var(--red)';
    pBtn.style.background = 'var(--surface)';
    pBtn.style.borderColor = 'var(--border2)';
    pBtn.style.color = 'var(--text2)';
  }
};

window.saveTask = async function() {
  if (!APP.currentStudentId) { showToast('لم يتم تحديد الطالب', 'error'); return; }
  showLoading();
  try {
    const id = generateId();
    const task = {
      id,
      studentId: APP.currentStudentId,
      attendance: document.getElementById('task-attendance').value || '',
      newMemorized: document.getElementById('task-new-memorized').value.trim(),
      oldMemorized: document.getElementById('task-old-memorized').value.trim(),
      newHw: document.getElementById('task-new-hw').value.trim(),
      oldHw: document.getElementById('task-old-hw').value.trim(),
      status: 'new',
      deadline: document.getElementById('task-deadline').value || null,
      points: document.getElementById('task-points').value !== '' ? parseFloat(document.getElementById('task-points').value) : '',
      note: document.getElementById('task-note').value.trim(),
      createdAt: Date.now(),
      supervisorId: APP.currentUser.id,
      sentDateHijri: document.getElementById('task-today-hijri').textContent || '',
      sentDateMiladi: document.getElementById('task-today-miladi').textContent || '',
    };
    await set(ref(db, `tasks/${id}`), task);
    APP.allTasks.push(task);
    closeModal('modal-add-task');
    renderSupStudentTasks(APP.currentStudentId);
    openStudentProfile(APP.currentStudentId);
    renderSupAllTasks();
    renderSupOverview();
    hideLoading();
    showToast('تم إضافة الواجب', 'success');
  } catch (e) {
    hideLoading();
    showToast('خطأ: ' + e.message, 'error');
  }
};

window.openEditTask = function(taskId) {
  const task = APP.allTasks.find(t => t.id === taskId);
  if (!task) return;
  document.getElementById('edit-task-id').value = taskId;
  document.getElementById('edit-task-student-id').value = task.studentId;
  document.getElementById('edit-task-new-memorized').value = task.newMemorized || '';
  document.getElementById('edit-task-old-memorized').value = task.oldMemorized || '';
  document.getElementById('edit-task-new-hw').value = task.newHw || '';
  document.getElementById('edit-task-old-hw').value = task.oldHw || '';
  document.getElementById('edit-task-deadline').value = task.deadline || '';
  document.getElementById('edit-task-points').value = task.points !== undefined ? task.points : '';
  document.getElementById('edit-task-note').value = task.note || '';
  document.getElementById('edit-task-attendance').value = task.attendance || '';

  const pBtn = document.getElementById('edit-btn-attend-present');
  const aBtn = document.getElementById('edit-btn-attend-absent');
  pBtn.style.cssText = 'flex:1;padding:12px;border-radius:10px;border:2px solid var(--border2);background:var(--surface);font-family:Cairo,sans-serif;font-size:15px;font-weight:700;cursor:pointer;transition:all 0.2s;color:var(--text2)';
  aBtn.style.cssText = 'flex:1;padding:12px;border-radius:10px;border:2px solid var(--border2);background:var(--surface);font-family:Cairo,sans-serif;font-size:15px;font-weight:700;cursor:pointer;transition:all 0.2s;color:var(--text2)';
  if (task.attendance === 'present') setEditAttendance('present');
  else if (task.attendance === 'absent') setEditAttendance('absent');

  openModal('modal-edit-task');
};

window.updateTask = async function() {
  const id = document.getElementById('edit-task-id').value;
  showLoading();
  try {
    const updates = {
      attendance: document.getElementById('edit-task-attendance').value || '',
      newMemorized: document.getElementById('edit-task-new-memorized').value.trim(),
      oldMemorized: document.getElementById('edit-task-old-memorized').value.trim(),
      newHw: document.getElementById('edit-task-new-hw').value.trim(),
      oldHw: document.getElementById('edit-task-old-hw').value.trim(),
      deadline: document.getElementById('edit-task-deadline').value || null,
      points: document.getElementById('edit-task-points').value !== '' ? parseFloat(document.getElementById('edit-task-points').value) : '',
      note: document.getElementById('edit-task-note').value.trim(),
      updatedAt: Date.now(),
    };
    await update(ref(db, `tasks/${id}`), updates);
    const idx = APP.allTasks.findIndex(t => t.id === id);
    if (idx !== -1) APP.allTasks[idx] = { ...APP.allTasks[idx], ...updates };
    closeModal('modal-edit-task');
    if (APP.currentStudentId) renderSupStudentTasks(APP.currentStudentId);
    renderSupAllTasks();
    renderSupOverview();
    hideLoading();
    showToast('تم تحديث الواجب', 'success');
  } catch (e) {
    hideLoading();
    showToast('خطأ: ' + e.message, 'error');
  }
};

window.deleteTask = async function(taskId) {
  if (!confirm('هل أنت متأكد من حذف هذا الواجب؟')) return;
  showLoading();
  try {
    await remove(ref(db, `tasks/${taskId}`));
    APP.allTasks = APP.allTasks.filter(t => t.id !== taskId);
    if (APP.currentStudentId) renderSupStudentTasks(APP.currentStudentId);
    renderSupAllTasks();
    renderSupOverview();
    hideLoading();
    showToast('تم حذف الواجب', 'success');
  } catch (e) {
    hideLoading();
    showToast('خطأ: ' + e.message, 'error');
  }
};

window.openAddNoteModal = function() {
  document.getElementById('note-text').value = '';
  openModal('modal-add-note');
};

window.saveNote = async function() {
  const text = document.getElementById('note-text').value.trim();
  if (!text) { showToast('أدخل نص الملاحظة', 'error'); return; }
  if (!APP.currentStudentId) return;
  showLoading();
  try {
    const student = APP.allStudents.find(s => s.id === APP.currentStudentId);
    const notes = student.notes || [];
    const note = { id: generateId(), text, date: Date.now() };
    notes.push(note);
    await update(ref(db, `students/${APP.currentStudentId}`), { notes });
    student.notes = notes;
    closeModal('modal-add-note');
    renderSupStudentNotes(APP.currentStudentId);
    hideLoading();
    showToast('تم إضافة الملاحظة', 'success');
  } catch (e) {
    hideLoading();
    showToast('خطأ: ' + e.message, 'error');
  }
};

window.deleteNote = async function(studentId, noteId) {
  const student = APP.allStudents.find(s => s.id === studentId);
  if (!student) return;
  student.notes = (student.notes || []).filter(n => n.id !== noteId);
  await update(ref(db, `students/${studentId}`), { notes: student.notes });
  renderSupStudentNotes(studentId);
  showToast('تم حذف الملاحظة', 'info');
};

window.confirmDeleteStudent = async function(studentId) {
  if (!confirm('هل أنت متأكد من حذف هذا الطالب وجميع واجباته؟')) return;
  showLoading();
  try {
    await remove(ref(db, `students/${studentId}`));
    const studentTasks = APP.allTasks.filter(t => t.studentId === studentId);
    for (const task of studentTasks) {
      await remove(ref(db, `tasks/${task.id}`));
    }
    APP.allStudents = APP.allStudents.filter(s => s.id !== studentId);
    APP.allTasks = APP.allTasks.filter(t => t.studentId !== studentId);
    showSupSection('students', null);
    renderSupStudents();
    renderSupOverview();
    hideLoading();
    showToast('تم حذف الطالب', 'info');
  } catch (e) {
    hideLoading();
    showToast('خطأ: ' + e.message, 'error');
  }
};

window.saveSettings = async function() {
  const name = document.getElementById('settings-name').value.trim();
  if (!name) { showToast('أدخل الاسم', 'error'); return; }
  showLoading();
  try {
    await update(ref(db, `supervisors/${APP.currentUser.id}`), { name });
    APP.currentUser.name = name;
    document.getElementById('sup-sidebar-name').textContent = name;
    document.getElementById('sup-nav-name').textContent = name;
    hideLoading();
    showToast('تم حفظ الإعدادات', 'success');
  } catch (e) {
    hideLoading();
    showToast('خطأ: ' + e.message, 'error');
  }
};

window.changeSupervisorPassword = async function() {
  const newPass = document.getElementById('settings-new-password').value.trim();
  if (!newPass || newPass.length < 6) { showToast('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error'); return; }
  showLoading();
  try {
    await updatePassword(auth.currentUser, newPass);
    document.getElementById('settings-new-password').value = '';
    hideLoading();
    showToast('تم تحديث كلمة المرور بنجاح', 'success');
  } catch (e) {
    hideLoading();
    showToast(firebaseAuthErrorText(e), 'error');
  }
};

async function loadAdminData() {
  showLoading();
  try {
    const [studSnap, supSnap] = await Promise.all([
      get(ref(db, 'students')),
      get(ref(db, 'supervisors'))
    ]);
    const students = studSnap.exists() ? Object.values(studSnap.val()) : [];
    const supervisors = supSnap.exists() ? Object.values(supSnap.val()) : [];

    const countSt = document.getElementById('admin-students-count');
    if (countSt) countSt.textContent = `(${students.length} طالب)`;
    const countSup = document.getElementById('admin-supervisors-count');
    if (countSup) countSup.textContent = `(${supervisors.length} مشرف)`;

    const stbody = document.getElementById('admin-full-students-tbody');
    stbody.innerHTML = students.length ? students.map((s, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${s.name}</strong></td>
        <td dir="ltr">${s.phone}</td>
        <td class="pass-cell">${s.password || '—'}</td>
        <td>${formatDate(s.createdAt)}</td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="btn btn-outline btn-sm" onclick="adminOpenEdit('${s.id}','student','${s.name}','${s.phone}',false)">✏️ تعديل</button>
            <button class="btn btn-danger btn-sm" onclick="adminDeleteStudent('${s.id}')">🗑 حذف</button>
          </div>
        </td>
      </tr>
    `).join('') : `<tr><td colspan="6" style="text-align:center;color:var(--text3);padding:20px">لا يوجد طلاب</td></tr>`;

    const supbody = document.getElementById('admin-full-supervisors-tbody');
    supbody.innerHTML = supervisors.length ? supervisors.map((s, i) => `
      <tr>
        <td>${i + 1}</td>
        <td><strong>${s.name}</strong></td>
        <td dir="ltr">${s.email || '—'}</td>
        <td>${s.isAdmin ? '<span class="task-badge badge-done">🛡 إدارة عليا</span>' : '<span class="task-badge badge-new">مشرف</span>'}</td>
        <td>${formatDate(s.createdAt)}</td>
        <td>
          <div style="display:flex;gap:6px">
            <button class="btn btn-outline btn-sm" onclick="adminOpenEdit('${s.id}','supervisor','${s.name}','',${!!s.isAdmin})">✏️ تعديل</button>
            <button class="btn btn-danger btn-sm" onclick="adminDeleteSupervisor('${s.id}')">🗑 حذف</button>
          </div>
        </td>
      </tr>
    `).join('') : `<tr><td colspan="6" style="text-align:center;color:var(--text3);padding:20px">لا يوجد مشرفين</td></tr>`;

    hideLoading();
  } catch (e) {
    hideLoading();
    showToast('خطأ في تحميل البيانات', 'error');
  }
}

window.adminOpenEdit = function(id, type, name, phone, isAdmin) {
  document.getElementById('admin-edit-id').value = id;
  document.getElementById('admin-edit-type').value = type;
  document.getElementById('admin-edit-name').value = name;
  document.getElementById('admin-edit-phone').value = phone;
  document.getElementById('admin-edit-password').value = '';
  document.getElementById('admin-edit-isadmin').checked = !!isAdmin;

  const isStudent = type === 'student';
  document.getElementById('admin-edit-phone-group').style.display = isStudent ? 'block' : 'none';
  document.getElementById('admin-edit-password-group').style.display = isStudent ? 'block' : 'none';
  document.getElementById('admin-edit-isadmin-group').style.display = isStudent ? 'none' : 'block';
  document.getElementById('admin-edit-modal-title').textContent =
    (isStudent ? '✏️ تعديل حساب طالب' : '✏️ تعديل حساب مشرف');
  openModal('modal-admin-edit');
};

window.adminSaveEdit = async function() {
  const id = document.getElementById('admin-edit-id').value;
  const type = document.getElementById('admin-edit-type').value;
  const name = document.getElementById('admin-edit-name').value.trim();
  if (!name) { showToast('الاسم مطلوب', 'error'); return; }

  showLoading();
  try {
    if (type === 'student') {
      const phone = document.getElementById('admin-edit-phone').value.trim();
      const newPass = document.getElementById('admin-edit-password').value.trim();
      if (!phone) { showToast('رقم الهاتف مطلوب', 'error'); hideLoading(); return; }
      const updates = { name, phone };
      if (newPass) updates.password = newPass;
      await update(ref(db, `students/${id}`), updates);
    } else {
      const isAdmin = document.getElementById('admin-edit-isadmin').checked;
      await update(ref(db, `supervisors/${id}`), { name, isAdmin });
      // If the admin edited their own account, refresh local state immediately.
      if (APP.currentUser && APP.currentUser.id === id) {
        APP.currentUser.name = name;
        APP.currentUser.isAdmin = isAdmin;
      }
    }
    closeModal('modal-admin-edit');
    hideLoading();
    showToast('تم تحديث الحساب بنجاح ✅', 'success');
    loadAdminData();
  } catch (e) {
    hideLoading();
    showToast('خطأ: ' + e.message, 'error');
  }
};

window.adminDeleteStudent = async function(studentId) {
  if (!confirm('هل أنت متأكد من حذف هذا الطالب وجميع بياناته؟')) return;
  showLoading();
  try {
    await remove(ref(db, `students/${studentId}`));
    const taskSnap = await get(ref(db, 'tasks'));
    if (taskSnap.exists()) {
      const tasks = Object.values(taskSnap.val()).filter(t => t.studentId === studentId);
      for (const task of tasks) await remove(ref(db, `tasks/${task.id}`));
    }
    hideLoading();
    showToast('تم حذف الطالب وجميع بياناته', 'info');
    loadAdminData();
    loadAllData();
  } catch (e) {
    hideLoading();
    showToast('خطأ: ' + e.message, 'error');
  }
};

window.adminDeleteSupervisor = async function(supId) {
  if (!confirm('هل أنت متأكد من حذف هذا المشرف؟ (سيُمنع من الدخول للتطبيق، لكن بريده الإلكتروني يبقى مسجلاً في Firebase Authentication)')) return;
  showLoading();
  try {
    await remove(ref(db, `supervisors/${supId}`));
    hideLoading();
    showToast('تم حذف حساب المشرف من النظام', 'info');
    loadAdminData();
  } catch (e) {
    hideLoading();
    showToast('خطأ: ' + e.message, 'error');
  }
};

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});