/**
 * Science Night Landing Page - Client Application
 * دانشگاه صنعتی نوشیروانی بابل - رویداد شب علم
 */

/**
 * Origin-Aware API Base URL:
 * Resolves to window.location.origin directly (preventing all CORS & host mismatches),
 * with fallback to http://localhost:3000 if opened directly as file:// in browser.
 * Supports manual override via ?api_base=... or window.API_BASE if ever needed.
 */
const API_BASE = (() => {
  try {
    const params = new URLSearchParams(window.location.search);
    const queryApi = params.get('api_base') || params.get('api');
    if (queryApi) return queryApi.replace(/\/+$/, '');
  } catch (_) {}

  if (typeof window.API_BASE === 'string' && window.API_BASE.trim()) {
    return window.API_BASE.trim().replace(/\/+$/, '');
  }

  const stored = localStorage.getItem('API_BASE');
  if (stored && stored.trim()) {
    return stored.trim().replace(/\/+$/, '');
  }

  // Same-origin default (resolves CORS & host issues across ports, LAN IPs, and production domains)
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    if (window.location.origin !== 'null' && !window.location.origin.startsWith('file:')) {
      return window.location.origin;
    }
  }

  return 'http://localhost:3000';
})();

/**
 * Token Helpers
 */
function getUserToken() {
  return localStorage.getItem('userToken');
}

function setUserToken(token) {
  localStorage.setItem('userToken', token);
}

function getAdminToken() {
  return localStorage.getItem('adminToken');
}

function setAdminToken(token) {
  localStorage.setItem('adminToken', token);
}

function clearTokens() {
  localStorage.removeItem('userToken');
  localStorage.removeItem('adminToken');
}

/**
 * Button Loading State Helper
 */
function setLoading(btn, loading) {
  if (!btn) return;
  if (loading) {
    btn._savedHtml = btn.innerHTML;
    btn.classList.add('btn-loading');
    btn.disabled = true;
  } else {
    btn.classList.remove('btn-loading');
    btn.disabled = false;
    if (btn._savedHtml) {
      btn.innerHTML = btn._savedHtml;
      delete btn._savedHtml;
    }
  }
}

/**
 * Auto-dismiss inline notification boxes after timeout
 */
function autoDismiss(el, timeout = 5000) {
  if (!el) return;
  if (el._dismissTimer) clearTimeout(el._dismissTimer);
  el._dismissTimer = setTimeout(() => {
    el.classList.remove('show');
    delete el._dismissTimer;
  }, timeout);
}

/**
 * Converts Persian (۰-۹) and Arabic (٠-٩) numerals to standard ASCII digits (0-9)
 */
function toEnglishDigits(str) {
  if (!str) return '';
  return String(str)
    .replace(/[۰-۹]/g, c => String(c.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 1632));
}

/**
 * Reusable HTTP fetch helper wrapping API_BASE, JSON headers, and JWT tokens
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const headers = { ...(options.headers || {}) };

  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  let token = options.token;
  if (!token) {
    if (endpoint.includes('admin') || endpoint.includes('export')) {
      token = getAdminToken();
    } else {
      token = getUserToken();
    }
  }

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return await fetch(url, { ...options, headers });
}

/**
 * Toast Notification System
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
    </svg>`;
  } else if (type === 'error') {
    iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>`;
  } else {
    iconSvg = `<svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>`;
  }

  toast.innerHTML = `
    ${iconSvg}
    <span class="toast-text">${message}</span>
    <button class="toast-close" type="button" aria-label="بستن">&times;</button>
  `;

  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.classList.remove('toast-show');
    toast.classList.add('toast-hide');
    setTimeout(() => toast.remove(), 250);
  });

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('toast-show');
  });

  setTimeout(() => {
    if (toast.parentElement) {
      toast.classList.remove('toast-show');
      toast.classList.add('toast-hide');
      setTimeout(() => toast.remove(), 250);
    }
  }, 3200);
}

function showInlineError(boxEl, msgEl, message) {
  if (msgEl) msgEl.textContent = message;
  if (boxEl) {
    boxEl.classList.add('show');
    autoDismiss(boxEl, 6000);
  }
}

function clearInlineError(boxEl) {
  if (boxEl) boxEl.classList.remove('show');
}

/**
 * Updates UI state based on session tokens
 * Keeps normal public view completely clean of admin jargon!
 */
function updateAuthState() {
  const navAuth = document.getElementById('nav-auth');
  const adminPanel = document.getElementById('admin-panel');
  const signupFormContainer = document.getElementById('signup-form-container');
  const signupRegisteredBox = document.getElementById('signup-registered-box');

  const userToken = getUserToken();
  const adminToken = getAdminToken();

  if (navAuth) {
    navAuth.innerHTML = '';

    if (adminToken) {
      // Admin session: display admin panel link & logout
      const panelLink = document.createElement('a');
      panelLink.href = '#admin-panel';
      panelLink.className = 'btn-primary';
      panelLink.textContent = 'پنل مدیریت';

      const logoutBtn = document.createElement('button');
      logoutBtn.type = 'button';
      logoutBtn.className = 'btn-logout';
      logoutBtn.textContent = 'خروج';
      logoutBtn.addEventListener('click', logout);

      navAuth.appendChild(panelLink);
      navAuth.appendChild(logoutBtn);

      if (adminPanel) adminPanel.classList.add('show');
    } else if (userToken) {
      // Registered User session: display badge & logout
      const badge = document.createElement('div');
      badge.className = 'badge-user-active';
      badge.innerHTML = `<span class="badge-dot"></span><span>خوش آمدید (ثبت‌نام شده)</span>`;

      const logoutBtn = document.createElement('button');
      logoutBtn.type = 'button';
      logoutBtn.className = 'btn-logout';
      logoutBtn.textContent = 'خروج';
      logoutBtn.addEventListener('click', logout);

      navAuth.appendChild(badge);
      navAuth.appendChild(logoutBtn);

      if (adminPanel) adminPanel.classList.remove('show');
    } else {
      // Normal Public User: clean sign-up button only
      const signupBtn = document.createElement('a');
      signupBtn.href = '#signup';
      signupBtn.className = 'btn-primary';
      signupBtn.textContent = 'ثبت‌نام در رویداد';

      navAuth.appendChild(signupBtn);

      if (adminPanel) adminPanel.classList.remove('show');
    }
  }

  // Toggle user sign-up box state
  if (userToken) {
    if (signupFormContainer) signupFormContainer.style.display = 'none';
    if (signupRegisteredBox) signupRegisteredBox.classList.add('show');
  } else {
    if (signupFormContainer) signupFormContainer.style.display = 'block';
    if (signupRegisteredBox) signupRegisteredBox.classList.remove('show');
  }
}

/**
 * Logout clears session tokens and resets UI
 */
function logout() {
  clearTokens();
  updateAuthState();
  showToast('با موفقیت از حساب کاربری خارج شدید.', 'info');
}

/**
 * Validates active tokens against real backend endpoints on load
 */
async function validateSessions() {
  const userToken = getUserToken();
  const adminToken = getAdminToken();

  if (userToken) {
    try {
      const res = await apiFetch('/auth/validate/user', {
        method: 'GET',
        token: userToken
      });
      if (!res.ok) {
        localStorage.removeItem('userToken');
      }
    } catch {}
  }

  if (adminToken) {
    try {
      const res = await apiFetch('/auth/validate/admin', {
        method: 'GET',
        token: adminToken
      });
      if (!res.ok) {
        localStorage.removeItem('adminToken');
      }
    } catch {}
  }

  updateAuthState();
}

/**
 * Admin Modal Open / Close
 */
function openAdminModal() {
  const modal = document.getElementById('admin-modal');
  if (modal) {
    modal.classList.add('open');
    const usernameInput = document.getElementById('admin-username');
    if (usernameInput) usernameInput.focus();
  }
}

function closeAdminModal() {
  const modal = document.getElementById('admin-modal');
  if (modal) {
    modal.classList.remove('open');
  }
}

/* ==========================================================================
   DOM Ready Initialization
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Session verification on launch
  validateSessions();

  // 2. Secret / Discreet trigger for Admin login:
  // e.g. URL query ?admin=1 or #admin
  const params = new URLSearchParams(window.location.search);
  if (params.get('admin') === '1' || params.get('admin') === 'true' || window.location.hash === '#admin') {
    openAdminModal();
  }

  const adminDiscreetTrigger = document.getElementById('admin-discreet-trigger');
  if (adminDiscreetTrigger) {
    adminDiscreetTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      openAdminModal();
    });
  }

  const modalCloseBtn = document.getElementById('modal-close-btn');
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeAdminModal);
  }

  const adminModal = document.getElementById('admin-modal');
  if (adminModal) {
    adminModal.addEventListener('click', (e) => {
      if (e.target === adminModal) closeAdminModal();
    });
  }

  // Keyboard accessibility
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAdminModal();
      const navContent = document.getElementById('nav-content');
      if (navContent) navContent.classList.remove('mobile-open');
    }
  });

  // 3. Re-register button handler (allows another attendee to register)
  const btnReRegister = document.getElementById('btn-re-register');
  if (btnReRegister) {
    btnReRegister.addEventListener('click', () => {
      localStorage.removeItem('userToken');
      updateAuthState();
      const signupForm = document.getElementById('signup-form');
      if (signupForm) signupForm.reset();
    });
  }

  // 4. Mobile Navigation Toggle
  const mobileToggle = document.getElementById('mobile-toggle');
  const navContent = document.getElementById('nav-content');
  if (mobileToggle && navContent) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = navContent.classList.toggle('mobile-open');
      mobileToggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Close mobile menu on link click
    navContent.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navContent.classList.remove('mobile-open');
        mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // 5. Sticky Navbar Appearance on Scroll
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 25) {
      navbar.classList.add('nav-scrolled');
    } else {
      navbar.classList.remove('nav-scrolled');
    }
  }, { passive: true });

  // 6. Scroll Animations via IntersectionObserver
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // 7. Public User Sign-Up Form Handling (POST /auth/user)
  const signupForm = document.getElementById('signup-form');
  const signupBtn = document.getElementById('signup-btn');
  const signupErrorBox = document.getElementById('signup-error-box');
  const signupErrorMsg = document.getElementById('signup-error-msg');
  const ssnInput = document.getElementById('ssn');
  const phoneInput = document.getElementById('phone');
  const fullNameInput = document.getElementById('fullName');

  // Live Persian-to-English digit conversion
  if (ssnInput) {
    ssnInput.addEventListener('input', () => {
      ssnInput.value = toEnglishDigits(ssnInput.value).replace(/\D/g, '');
    });
  }

  if (phoneInput) {
    phoneInput.addEventListener('input', () => {
      phoneInput.value = toEnglishDigits(phoneInput.value).replace(/[^\d+]/g, '');
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearInlineError(signupErrorBox);

      const fullName = fullNameInput.value.trim();
      let ssn = toEnglishDigits(ssnInput.value.trim());
      let phone = toEnglishDigits(phoneInput.value.trim());

      // Client-side validations
      if (!fullName) {
        showInlineError(signupErrorBox, signupErrorMsg, 'لطفاً نام و نام خانوادگی خود را وارد نمایید.');
        fullNameInput.focus();
        return;
      }

      if (!ssn || !/^\d{10}$/.test(ssn)) {
        showInlineError(signupErrorBox, signupErrorMsg, 'کد ملی باید یک عدد ۱۰ رقمی باشد.');
        ssnInput.focus();
        return;
      }

      // Iranian phone number format (09xxxxxxxxx or +989xxxxxxxxx)
      if (/^9\d{9}$/.test(phone)) {
        phone = '0' + phone;
      }

      const phoneRegex = /^(\+98|0)9\d{9}$/;
      if (!phoneRegex.test(phone)) {
        showInlineError(signupErrorBox, signupErrorMsg, 'شماره همراه باید معتبر باشد (مانند: ۰۹۱۱xxxxxxx).');
        phoneInput.focus();
        return;
      }

      setLoading(signupBtn, true);

      try {
        const res = await apiFetch('/auth/user', {
          method: 'POST',
          body: JSON.stringify({ ssn, fullName, phone })
        });

        const data = await res.json().catch(() => ({}));

        if (res.status === 201 && data.token) {
          setUserToken(data.token);
          showToast('ثبت‌نام شما با موفقیت انجام شد!', 'success');
          updateAuthState();
          signupForm.reset();
        } else if (res.status === 409) {
          showInlineError(signupErrorBox, signupErrorMsg, 'این کد ملی یا شماره همراه قبلاً ثبت‌نام شده است.');
        } else {
          const message = Array.isArray(data.message)
            ? data.message.join('، ')
            : (data.message || 'خطا در ثبت‌نام. لطفاً اطلاعات را بررسی کرده و مجدداً تلاش کنید.');
          showInlineError(signupErrorBox, signupErrorMsg, message);
        }
      } catch (err) {
        showInlineError(signupErrorBox, signupErrorMsg, 'عدم برقراری ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی نمایید.');
      } finally {
        setLoading(signupBtn, false);
      }
    });
  }

  // 8. Admin Login Handling (POST /auth/admin / POST /auth/login/admin)
  const adminLoginForm = document.getElementById('admin-login-form');
  const adminLoginBtn = document.getElementById('admin-login-btn');
  const adminErrorBox = document.getElementById('admin-error-box');
  const adminErrorMsg = document.getElementById('admin-error-msg');
  const adminUsernameInput = document.getElementById('admin-username');
  const adminPasswordInput = document.getElementById('admin-password');

  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearInlineError(adminErrorBox);

      const username = toEnglishDigits(adminUsernameInput.value.trim());
      const password = adminPasswordInput.value;

      if (!username) {
        showInlineError(adminErrorBox, adminErrorMsg, 'لطفاً نام کاربری را وارد نمایید.');
        adminUsernameInput.focus();
        return;
      }

      if (!password || password.length < 8) {
        showInlineError(adminErrorBox, adminErrorMsg, 'رمز عبور باید حداقل ۸ کاراکتر باشد.');
        adminPasswordInput.focus();
        return;
      }

      setLoading(adminLoginBtn, true);

      try {
        let res = await apiFetch('/auth/admin', {
          method: 'POST',
          body: JSON.stringify({ username, password })
        });

        let data = await res.json().catch(() => ({}));

        // If admin already exists in database (409), attempt /auth/login/admin
        if (res.status === 409 || data.code === 'ADMIN_ALREADY_EXISTS') {
          const loginRes = await apiFetch('/auth/login/admin', {
            method: 'POST',
            body: JSON.stringify({ username, password })
          });
          const loginData = await loginRes.json().catch(() => ({}));

          if (loginRes.ok && loginData.token) {
            res = loginRes;
            data = loginData;
          } else {
            const errMsg = Array.isArray(loginData.message)
              ? loginData.message.join('، ')
              : (loginData.message || 'نام کاربری یا رمز عبور اشتباه است.');
            showInlineError(adminErrorBox, adminErrorMsg, errMsg);
            return;
          }
        }

        if ((res.status === 201 || res.status === 200) && data.token) {
          setAdminToken(data.token);
          showToast('ورود مدیران با موفقیت انجام شد.', 'success');
          closeAdminModal();
          updateAuthState();
          adminLoginForm.reset();

          const adminPanel = document.getElementById('admin-panel');
          if (adminPanel) {
            adminPanel.scrollIntoView({ behavior: 'smooth' });
          }
        } else {
          const message = Array.isArray(data.message)
            ? data.message.join('، ')
            : (data.message || 'خطا در احراز هویت مدیر.');
          showInlineError(adminErrorBox, adminErrorMsg, message);
        }
      } catch (err) {
        showInlineError(adminErrorBox, adminErrorMsg, 'خطا در برقراری ارتباط با سرور.');
      } finally {
        setLoading(adminLoginBtn, false);
      }
    });
  }

  // 9. Admin Panel Excel Export (GET /export)
  const btnExportExcel = document.getElementById('btn-export-excel');
  if (btnExportExcel) {
    btnExportExcel.addEventListener('click', async () => {
      const adminToken = getAdminToken();
      if (!adminToken) {
        showToast('لطفاً ابتدا به عنوان مدیر وارد شوید.', 'error');
        updateAuthState();
        return;
      }

      setLoading(btnExportExcel, true);

      try {
        const res = await apiFetch('/export', {
          method: 'GET',
          token: adminToken
        });

        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('adminToken');
          updateAuthState();
          showToast('نشست کاربری منقضی شده است. لطفاً مجدداً وارد شوید.', 'error');
          return;
        }

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          showToast(err.message || 'خطا در دریافت لیست شرکت‌کنندگان.', 'error');
          return;
        }

        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = 'users.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);

        showToast('فایل اکسل با موفقیت دریافت شد.', 'success');
      } catch (err) {
        showToast('خطا در دریافت فایل اکسل از سرور.', 'error');
      } finally {
        setLoading(btnExportExcel, false);
      }
    });
  }
});
