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
 * Image URL Resolution
 */
function resolveImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/')) {
    return `${API_BASE}${path}`;
  }
  return `${API_BASE}/${path}`;
}

/**
 * XSS Safe HTML Escape
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

  // If body is a string (JSON), attach application/json
  // If body is FormData (e.g. file uploads), DO NOT set Content-Type header so browser adds boundary!
  if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  let token = options.token;
  if (!token) {
    const isNewsMutation = endpoint.includes('news') && options.method && ['POST', 'PATCH', 'PUT', 'DELETE'].includes(options.method.toUpperCase());
    const isWorkshopMutation = endpoint.includes('workshop') && options.method && ['POST', 'PATCH', 'PUT', 'DELETE'].includes(options.method.toUpperCase());
    
    if (options.auth === 'admin' || endpoint.includes('admin') || endpoint.includes('export') || isNewsMutation || isWorkshopMutation) {
      token = getAdminToken();
    } else if (options.auth === 'user') {
      token = getUserToken();
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
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
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
 * When an admin is authenticated, hides the participant registration form
 * and focuses the workspace on the executive management panel.
 */
function updateAuthState() {
  const navAuth = document.getElementById('nav-auth');
  const adminPanel = document.getElementById('admin-panel');
  const signupSection = document.getElementById('signup');
  const signupFormContainer = document.getElementById('signup-form-container');
  const signupRegisteredBox = document.getElementById('signup-registered-box');
  const heroCtaBtn = document.getElementById('hero-cta-btn');
  const footerSignupLink = document.getElementById('footer-signup-link');
  const adminDiscreetTrigger = document.getElementById('admin-discreet-trigger');

  const userToken = getUserToken();
  const adminToken = getAdminToken();

  // 1. Update dynamic header auth controls
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
    } else {
      // Normal Public User: clean sign-up button only
      const signupBtn = document.createElement('a');
      signupBtn.href = '#signup';
      signupBtn.className = 'btn-primary';
      signupBtn.textContent = 'ثبت‌نام در رویداد';

      navAuth.appendChild(signupBtn);
    }
  }

  // 2. Admin vs Participant Mode Orchestration
  if (adminToken) {
    // Admin is active: HIDE the participant sign-up form completely
    if (signupSection) {
      signupSection.classList.add('hidden-admin');
      signupSection.style.display = 'none';
    }

    // SHOW Executive Admin Panel
    if (adminPanel) {
      adminPanel.classList.add('show');
      adminPanel.querySelectorAll('.reveal').forEach(el => el.classList.add('revealed'));
      loadAdminNews();
      loadAdminWorkshops();
    }

    // Hero CTA points to Admin Panel
    if (heroCtaBtn) {
      heroCtaBtn.href = '#admin-panel';
      const span = heroCtaBtn.querySelector('span');
      if (span) span.textContent = 'ورود به پنل مدیریت';
    }

    // Footer quick link points to Admin Panel
    if (footerSignupLink) {
      footerSignupLink.href = '#admin-panel';
      footerSignupLink.textContent = 'پنل مدیریت رویداد';
    }

    // Discreet staff trigger in footer is hidden when already logged in
    if (adminDiscreetTrigger) {
      adminDiscreetTrigger.style.display = 'none';
    }
  } else {
    // Admin is NOT active: HIDE Executive Admin Panel
    if (adminPanel) {
      adminPanel.classList.remove('show');
    }

    // SHOW participant registration section
    if (signupSection) {
      signupSection.classList.remove('hidden-admin');
      signupSection.style.display = '';
    }

    // Restore discreet trigger
    if (adminDiscreetTrigger) {
      adminDiscreetTrigger.style.display = '';
    }

    // Toggle participant registration state (registered vs new form)
    if (userToken) {
      if (signupFormContainer) signupFormContainer.style.display = 'none';
      if (signupRegisteredBox) signupRegisteredBox.classList.add('show');

      if (heroCtaBtn) {
        heroCtaBtn.href = '#signup';
        const span = heroCtaBtn.querySelector('span');
        if (span) span.textContent = 'مشاهده وضعیت ثبت‌نام';
      }

      if (footerSignupLink) {
        footerSignupLink.href = '#signup';
        footerSignupLink.textContent = 'وضعیت ثبت‌نام شما';
      }
    } else {
      if (signupFormContainer) signupFormContainer.style.display = 'block';
      if (signupRegisteredBox) signupRegisteredBox.classList.remove('show');

      if (heroCtaBtn) {
        heroCtaBtn.href = '#signup';
        const span = heroCtaBtn.querySelector('span');
        if (span) span.textContent = 'ثبت‌نام در رویداد';
      }

      if (footerSignupLink) {
        footerSignupLink.href = '#signup';
        footerSignupLink.textContent = 'ثبت‌نام در رویداد';
      }
    }
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

/**
 * Interactive Lightbox System
 */
function openLightbox(imgSrc, caption = '') {
  const modal = document.getElementById('lightbox-modal');
  const img = document.getElementById('lightbox-img');
  const cap = document.getElementById('lightbox-caption');

  if (modal && img) {
    img.src = imgSrc;
    if (cap) cap.textContent = caption;
    modal.classList.add('open');
  }
}

function closeLightbox() {
  const modal = document.getElementById('lightbox-modal');
  if (modal) {
    modal.classList.remove('open');
  }
}

/**
 * Public News Reader Modal
 */
function openNewsReader(article) {
  const modal = document.getElementById('news-reader-modal');
  const titleEl = document.getElementById('news-reader-title');
  const bodyEl = document.getElementById('news-modal-body');
  const galleryEl = document.getElementById('news-modal-gallery');

  if (!modal || !article) return;

  if (titleEl) titleEl.textContent = article.title;
  if (bodyEl) bodyEl.textContent = article.description;

  if (galleryEl) {
    galleryEl.innerHTML = '';
    if (article.images && article.images.length > 0) {
      article.images.forEach((img) => {
        const fullSrc = resolveImageUrl(img.path);
        const wrap = document.createElement('div');
        wrap.className = 'news-modal-img-wrap';
        wrap.innerHTML = `<img src="${fullSrc}" alt="${article.title}" loading="lazy">`;
        wrap.addEventListener('click', () => {
          openLightbox(fullSrc, article.title);
        });
        galleryEl.appendChild(wrap);
      });
    }
  }

  modal.classList.add('open');
}

function closeNewsReader() {
  const modal = document.getElementById('news-reader-modal');
  if (modal) modal.classList.remove('open');
}

/**
 * App-Like In-Slide Multi-Image Gallery Component
 */
function createInSlideGalleryElement(images, articleTitle) {
  const galleryWrap = document.createElement('div');
  galleryWrap.className = 'mini-gallery';

  const imageUrls = (images && images.length > 0)
    ? images.map(img => resolveImageUrl(img.path))
    : ['assets/banner-wide.jpg'];

  let currentIndex = 0;

  const viewport = document.createElement('div');
  viewport.className = 'mini-gallery-viewport';
  viewport.title = 'برای مشاهده در کیفیت اصلی کلیک کنید';

  const imgEl = document.createElement('img');
  imgEl.className = 'mini-gallery-img';
  imgEl.src = imageUrls[0];
  imgEl.alt = articleTitle;
  viewport.appendChild(imgEl);

  if (imageUrls.length > 1) {
    const counterBadge = document.createElement('span');
    counterBadge.className = 'gallery-counter-badge';
    counterBadge.textContent = `۱ از ${imageUrls.length}`;
    viewport.appendChild(counterBadge);

    const btnPrev = document.createElement('button');
    btnPrev.type = 'button';
    btnPrev.className = 'gallery-nav-btn gallery-btn-prev';
    btnPrev.innerHTML = '‹';
    btnPrev.title = 'عکس قبلی';
    btnPrev.setAttribute('aria-label', 'عکس قبلی');

    const btnNext = document.createElement('button');
    btnNext.type = 'button';
    btnNext.className = 'gallery-nav-btn gallery-btn-next';
    btnNext.innerHTML = '›';
    btnNext.title = 'عکس بعدی';
    btnNext.setAttribute('aria-label', 'عکس بعدی');

    viewport.appendChild(btnPrev);
    viewport.appendChild(btnNext);

    const thumbsWrap = document.createElement('div');
    thumbsWrap.className = 'mini-gallery-thumbs';

    const thumbEls = imageUrls.map((url, idx) => {
      const thumb = document.createElement('img');
      thumb.className = `mini-thumb ${idx === 0 ? 'active' : ''}`;
      thumb.src = url;
      thumb.alt = `بندانگشتی ${idx + 1}`;
      thumb.addEventListener('click', (e) => {
        e.stopPropagation();
        setGalleryIndex(idx);
      });
      thumbsWrap.appendChild(thumb);
      return thumb;
    });

    function setGalleryIndex(index) {
      if (index < 0) index = imageUrls.length - 1;
      if (index >= imageUrls.length) index = 0;
      currentIndex = index;

      imgEl.style.opacity = '0.35';
      setTimeout(() => {
        imgEl.src = imageUrls[currentIndex];
        imgEl.style.opacity = '1';
      }, 120);

      counterBadge.textContent = `${currentIndex + 1} از ${imageUrls.length}`;
      thumbEls.forEach((th, i) => {
        th.classList.toggle('active', i === currentIndex);
      });
    }

    btnPrev.addEventListener('click', (e) => {
      e.stopPropagation();
      setGalleryIndex(currentIndex - 1);
    });

    btnNext.addEventListener('click', (e) => {
      e.stopPropagation();
      setGalleryIndex(currentIndex + 1);
    });

    let touchStartX = 0;
    viewport.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    viewport.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 35) {
        if (diff > 0) setGalleryIndex(currentIndex + 1);
        else setGalleryIndex(currentIndex - 1);
      }
    }, { passive: true });

    galleryWrap.appendChild(viewport);
    galleryWrap.appendChild(thumbsWrap);
  } else {
    galleryWrap.appendChild(viewport);
  }

  viewport.addEventListener('click', () => {
    openLightbox(imageUrls[currentIndex], `${articleTitle} ${imageUrls.length > 1 ? `(تصویر ${currentIndex + 1} از ${imageUrls.length})` : ''}`);
  });

  return galleryWrap;
}

/**
 * Landing Page News Slider State & Controls
 */
let currentSlideIndex = 0;
let totalNewsSlides = 0;
let sliderAutoplayInterval = null;

function goToSlide(index) {
  const track = document.getElementById('news-slider-track');
  const dots = document.querySelectorAll('#slider-dots .slider-dot');
  if (!track || totalNewsSlides === 0) return;

  if (index < 0) index = totalNewsSlides - 1;
  if (index >= totalNewsSlides) index = 0;
  currentSlideIndex = index;

  // LTR track offset ensures seamless cross-browser consistency:
  track.style.transform = `translateX(-${currentSlideIndex * 100}%)`;

  dots.forEach((dot, idx) => {
    dot.classList.toggle('active', idx === currentSlideIndex);
  });
}

function startSliderAutoplay() {
  stopSliderAutoplay();
  if (totalNewsSlides > 1) {
    sliderAutoplayInterval = setInterval(() => {
      goToSlide(currentSlideIndex + 1);
    }, 6000);
  }
}

function stopSliderAutoplay() {
  if (sliderAutoplayInterval) {
    clearInterval(sliderAutoplayInterval);
    sliderAutoplayInterval = null;
  }
}

/**
 * Load Public News Slider (GET /news)
 */
async function loadPublicNews() {
  const track = document.getElementById('news-slider-track');
  const dotsContainer = document.getElementById('slider-dots');
  const sliderPrevBtn = document.getElementById('slider-arrow-prev');
  const sliderNextBtn = document.getElementById('slider-arrow-next');
  const sliderContainer = document.getElementById('news-slider-container');

  if (!track) return;

  try {
    const res = await apiFetch('/news', { method: 'GET' });
    if (!res.ok) {
      throw new Error('Failed to fetch news');
    }

    const newsList = await res.json();

    if (!Array.isArray(newsList) || newsList.length === 0) {
      track.innerHTML = `
        <div class="news-slide">
          <div class="news-empty-state" style="margin: 2rem;">
            <div class="news-empty-icon" aria-hidden="true">📢</div>
            <h3 class="news-empty-title">به زودی؛ اعلام جزئیات و برنامه‌های شب علم</h3>
            <p class="news-empty-desc">
              اطلاعیه‌های رسمی، فهرست دقیق سخنرانان، کارگاه‌ها و محل استقرار غرفه‌های علمی دانشگاه صنعتی نوشیروانی بابل به زودی در این بخش منتشر خواهد شد.
            </p>
          </div>
        </div>
      `;
      if (dotsContainer) dotsContainer.innerHTML = '';
      if (sliderPrevBtn) sliderPrevBtn.style.display = 'none';
      if (sliderNextBtn) sliderNextBtn.style.display = 'none';
      totalNewsSlides = 0;
      return;
    }

    track.innerHTML = '';
    if (dotsContainer) dotsContainer.innerHTML = '';
    totalNewsSlides = newsList.length;

    if (sliderPrevBtn) sliderPrevBtn.style.display = totalNewsSlides > 1 ? 'grid' : 'none';
    if (sliderNextBtn) sliderNextBtn.style.display = totalNewsSlides > 1 ? 'grid' : 'none';

    newsList.forEach((article, idx) => {
      const slide = document.createElement('div');
      slide.className = 'news-slide';

      const inner = document.createElement('div');
      inner.className = 'news-slide-inner';

      // Content area (Right side in RTL desktop)
      const contentEl = document.createElement('div');
      contentEl.className = 'news-slide-content';

      contentEl.innerHTML = `
        <div>
          <div class="news-slide-meta">
            <span class="section-tag" style="margin: 0;">اطلاعیه رسمی ${idx + 1} از ${newsList.length}</span>
            <span style="font-size: 0.78rem; color: var(--text-muted);">شناسه: ${article.id}</span>
          </div>
          <h3 class="news-slide-title">${article.title}</h3>
          <p class="news-slide-desc">${article.description}</p>
        </div>
        <div class="news-slide-actions">
          <button type="button" class="btn-read-news">
            <span>مطالعه کامل خبر</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <a href="news.html?id=${article.id}" class="btn-slide-archive">
            <span>مشاهده در آرشیو مقالات ↗</span>
          </a>
        </div>
      `;

      contentEl.querySelector('.btn-read-news').addEventListener('click', () => {
        openNewsReader(article);
      });

      // Media area (Left side in RTL desktop)
      const mediaEl = document.createElement('div');
      mediaEl.className = 'news-slide-media';
      const gallery = createInSlideGalleryElement(article.images, article.title);
      mediaEl.appendChild(gallery);

      inner.appendChild(contentEl);
      inner.appendChild(mediaEl);
      slide.appendChild(inner);
      track.appendChild(slide);

      // Dot indicator
      if (dotsContainer && totalNewsSlides > 1) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = `slider-dot ${idx === 0 ? 'active' : ''}`;
        dot.setAttribute('aria-label', `رفتن به خبر ${idx + 1}`);
        dot.addEventListener('click', () => {
          goToSlide(idx);
          stopSliderAutoplay();
          startSliderAutoplay();
        });
        dotsContainer.appendChild(dot);
      }
    });

    // Reset slide position
    goToSlide(0);
    startSliderAutoplay();

    // Arrows event listeners
    if (sliderPrevBtn) {
      sliderPrevBtn.onclick = () => {
        goToSlide(currentSlideIndex - 1);
        stopSliderAutoplay();
        startSliderAutoplay();
      };
    }
    if (sliderNextBtn) {
      sliderNextBtn.onclick = () => {
        goToSlide(currentSlideIndex + 1);
        stopSliderAutoplay();
        startSliderAutoplay();
      };
    }

    // Touch swipe and Hover pause on slider container
    if (sliderContainer) {
      sliderContainer.onmouseenter = stopSliderAutoplay;
      sliderContainer.onmouseleave = startSliderAutoplay;

      let touchStartX = 0;
      sliderContainer.addEventListener('touchstart', (e) => {
        stopSliderAutoplay();
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      sliderContainer.addEventListener('touchend', (e) => {
        startSliderAutoplay();
        const touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        // In RTL, left swipe moves to next slide
        if (diff > 45) {
          goToSlide(currentSlideIndex + 1);
        } else if (diff < -45) {
          goToSlide(currentSlideIndex - 1);
        }
      }, { passive: true });
    }

  } catch (err) {
    track.innerHTML = `
      <div class="news-slide">
        <div class="news-empty-state" style="margin: 2rem;">
          <div class="news-empty-icon" aria-hidden="true">📢</div>
          <h3 class="news-empty-title">به زودی؛ اعلام جزئیات و برنامه‌های شب علم</h3>
          <p class="news-empty-desc">
            اطلاعیه‌های رسمی، فهرست دقیق سخنرانان، کارگاه‌ها و محل استقرار غرفه‌های علمی دانشگاه صنعتی نوشیروانی بابل به زودی در این بخش قرار می‌گیرد.
          </p>
        </div>
      </div>
    `;
    if (dotsContainer) dotsContainer.innerHTML = '';
    if (sliderPrevBtn) sliderPrevBtn.style.display = 'none';
    if (sliderNextBtn) sliderNextBtn.style.display = 'none';
    totalNewsSlides = 0;
  }
}

/**
 * Load Admin News Management List (GET /news)
 */
async function loadAdminNews() {
  const container = document.getElementById('admin-news-list');
  if (!container) return;

  const adminToken = getAdminToken();
  if (!adminToken) return;

  container.innerHTML = '<p style="color: var(--text-muted); text-align: center; font-size: 0.9rem;">در حال بارگذاری لیست اخبار...</p>';

  try {
    const res = await apiFetch('/news', { method: 'GET' });
    if (!res.ok) {
      container.innerHTML = '<p style="color: #fca5a5; text-align: center;">خطا در دریافت لیست اخبار.</p>';
      return;
    }

    const newsList = await res.json();

    if (!Array.isArray(newsList) || newsList.length === 0) {
      container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 1.5rem 0;">تاکنون خبری ثبت نشده است. از فرم بالا برای ثبت اولین خبر استفاده نمایید.</p>';
      return;
    }

    container.innerHTML = '';
    newsList.forEach((article) => {
      const item = document.createElement('div');
      item.className = 'admin-news-item';

      // Build images strip
      let imagesHtml = '';
      if (article.images && article.images.length > 0) {
        imagesHtml = article.images.map(img => `
          <div class="admin-news-img-box">
            <img src="${resolveImageUrl(img.path)}" alt="" class="admin-news-img-thumb">
            <button type="button" class="btn-del-img" data-news-id="${article.id}" data-image-id="${img.id}" title="حذف این تصویر">×</button>
          </div>
        `).join('');
      }

      item.innerHTML = `
        <div class="admin-news-item-top">
          <div>
            <h4 class="admin-news-item-title">${article.title} <small style="color: var(--cyan); font-weight: normal;">(شناسه: ${article.id})</small></h4>
            <p class="admin-news-item-desc">${article.description}</p>
          </div>
          <button type="button" class="btn-del-article" data-id="${article.id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
            <span>حذف کل خبر</span>
          </button>
        </div>

        <div class="admin-news-gallery">
          ${imagesHtml}
          <div class="admin-append-img-wrap">
            <input type="file" accept="image/*" multiple class="admin-append-file-input" style="display: none;" id="append-input-${article.id}">
            <label for="append-input-${article.id}" class="btn-append-img-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
              </svg>
              <span>افزودن عکس</span>
            </label>
          </div>
        </div>
      `;

      // Handle delete entire article
      item.querySelector('.btn-del-article').addEventListener('click', async () => {
        if (!confirm(`آیا از حذف خبر «${article.title}» اطمینان دارید؟`)) return;

        try {
          const delRes = await apiFetch(`/news/${article.id}`, {
            method: 'DELETE',
            auth: 'admin'
          });

          if (delRes.ok) {
            showToast('خبر با موفقیت حذف گردید.', 'success');
            loadAdminNews();
            loadPublicNews();
          } else {
            showToast('خطا در حذف خبر.', 'error');
          }
        } catch {
          showToast('خطا در برقراری ارتباط با سرور.', 'error');
        }
      });

      // Handle delete individual image
      item.querySelectorAll('.btn-del-img').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const nId = btn.getAttribute('data-news-id');
          const imgId = btn.getAttribute('data-image-id');

          if (!confirm('آیا مایل به حذف این تصویر هستید؟')) return;

          try {
            const delImgRes = await apiFetch(`/news/${nId}/images/${imgId}`, {
              method: 'DELETE',
              auth: 'admin'
            });

            if (delImgRes.ok) {
              showToast('تصویر حذف گردید.', 'success');
              loadAdminNews();
              loadPublicNews();
            } else {
              showToast('خطا در حذف تصویر.', 'error');
            }
          } catch {
            showToast('خطا در برقراری ارتباط با سرور.', 'error');
          }
        });
      });

      // Handle append image to this article
      const appendInput = item.querySelector(`#append-input-${article.id}`);
      if (appendInput) {
        appendInput.addEventListener('change', async () => {
          if (!appendInput.files || appendInput.files.length === 0) return;

          const formData = new FormData();
          for (let i = 0; i < appendInput.files.length; i++) {
            formData.append('images', appendInput.files[i]);
          }

          showToast('در حال آپلود تصاویر...', 'info');

          try {
            const upRes = await apiFetch(`/news/${article.id}/images`, {
              method: 'POST',
              auth: 'admin',
              body: formData
            });

            if (upRes.ok) {
              showToast('تصاویر جدید با موفقیت اضافه شدند.', 'success');
              loadAdminNews();
              loadPublicNews();
            } else {
              showToast('خطا در بارگذاری تصاویر.', 'error');
            }
          } catch {
            showToast('خطا در برقراری ارتباط با سرور.', 'error');
          }
        });
      }

      container.appendChild(item);
    });

  } catch (err) {
    container.innerHTML = '<p style="color: #fca5a5; text-align: center;">خطا در دریافت لیست اخبار.</p>';
  }
}

/**
 * ==========================================================================
 * Public & Admin Workshop System
 * ==========================================================================
 */

let currentActiveWorkshop = null;

function openWorkshopModal(workshop) {
  const modal = document.getElementById('workshop-modal');
  const imgEl = document.getElementById('workshop-modal-img');
  const bgEl = document.getElementById('workshop-modal-banner-bg');
  const titleEl = document.getElementById('workshop-modal-title');
  const descEl = document.getElementById('workshop-modal-desc');
  const bannerFrame = document.getElementById('workshop-modal-banner-frame');
  const scrollable = modal ? modal.querySelector('.workshop-modal-scrollable') : null;

  if (!modal || !workshop) return;
  currentActiveWorkshop = workshop;

  if (titleEl) titleEl.textContent = workshop.title || 'کارگاه آموزشی شب علم';
  if (descEl) descEl.textContent = workshop.description || '';

  if (workshop.bannerPath) {
    const fullImgUrl = resolveImageUrl(workshop.bannerPath);
    if (imgEl) {
      imgEl.src = fullImgUrl;
      imgEl.alt = workshop.title || '';
      imgEl.style.display = 'block';
      imgEl.onclick = () => openLightbox(fullImgUrl, workshop.title || '');
    }
    if (bgEl) {
      bgEl.style.backgroundImage = `url("${fullImgUrl}")`;
      bgEl.style.display = 'block';
    }
    if (bannerFrame) bannerFrame.style.display = 'flex';
  } else {
    if (imgEl) imgEl.style.display = 'none';
    if (bgEl) bgEl.style.display = 'none';
    if (bannerFrame) bannerFrame.style.display = 'none';
  }

  if (scrollable) scrollable.scrollTop = 0;

  modal.classList.add('open');
}

function closeWorkshopModal() {
  const modal = document.getElementById('workshop-modal');
  if (modal) modal.classList.remove('open');
  currentActiveWorkshop = null;
}

/**
 * Load Public Workshops (GET /workshop)
 */
async function loadPublicWorkshops() {
  const grid = document.getElementById('workshops-grid');
  if (!grid) return;

  grid.innerHTML = `
    <div class="workshop-skeleton-card"></div>
    <div class="workshop-skeleton-card"></div>
    <div class="workshop-skeleton-card"></div>
  `;

  try {
    const res = await apiFetch('/workshop', { method: 'GET' });
    if (!res.ok) throw new Error('Network error');

    const workshops = await res.json();
    if (!Array.isArray(workshops) || workshops.length === 0) {
      renderWorkshopsEmptyState(grid);
      return;
    }

    renderPublicWorkshops(workshops);
  } catch (err) {
    renderWorkshopsEmptyState(grid);
  }
}

function renderWorkshopsEmptyState(grid) {
  grid.innerHTML = `
    <div class="news-empty-state" style="grid-column: 1 / -1; margin: 1.5rem 0;">
      <div class="news-empty-icon" aria-hidden="true">🛠️</div>
      <h3 class="news-empty-title">به زودی؛ ثبت و اعلام کارگاه‌های آموزشی شب علم</h3>
      <p class="news-empty-desc">
        برنامه‌ها و سرفصل‌های کارگاه‌های تعاملی و تخصصی اساتید دانشگاه صنعتی نوشیروانی بابل به زودی در این بخش قرار خواهد گرفت. برای حضور در کارگاه‌ها از بخش زیر اقدام به ثبت‌نام نمایید.
      </p>
    </div>
  `;
}

function renderPublicWorkshops(workshops) {
  const grid = document.getElementById('workshops-grid');
  if (!grid) return;

  grid.innerHTML = '';

  workshops.forEach((ws, idx) => {
    const card = document.createElement('article');
    card.className = 'workshop-card reveal revealed';
    card.setAttribute('data-id', ws.id);

    // Banner HTML
    let bannerHtml = '';
    if (ws.bannerPath) {
      const bannerSrc = resolveImageUrl(ws.bannerPath);
      bannerHtml = `
        <div class="workshop-banner-wrap" role="button" tabindex="0" title="مشاهده جزئیات کامل ${escapeHtml(ws.title)}">
          <div class="workshop-banner-bg" style="background-image: url('${bannerSrc}')"></div>
          <img src="${bannerSrc}" alt="${escapeHtml(ws.title)}" class="workshop-banner-img" loading="lazy">
          <div class="workshop-banner-overlay">
            <span class="workshop-tag">کارگاه تخصصی ${idx + 1}</span>
            <span class="workshop-expand-indicator">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
              <span>مشاهده جزئیات</span>
            </span>
          </div>
        </div>
      `;
    } else {
      bannerHtml = `
        <div class="workshop-banner-wrap" role="button" tabindex="0" title="مشاهده جزئیات کامل ${escapeHtml(ws.title)}">
          <div class="workshop-banner-placeholder">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" stroke-width="1.8" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
            </svg>
            <span style="font-size: 0.85rem; font-weight: 600; color: #fff;">کارگاه تخصصی شب علم</span>
          </div>
          <div class="workshop-banner-overlay">
            <span class="workshop-tag">کارگاه تخصصی ${idx + 1}</span>
            <span class="workshop-expand-indicator">
              <span>مشاهده جزئیات</span>
            </span>
          </div>
        </div>
      `;
    }

    card.innerHTML = `
      ${bannerHtml}
      <div class="workshop-card-body">
        <div class="workshop-card-header" role="button" tabindex="0" title="نمایش توضیحات کارگاه">
          <h3 class="workshop-card-title">${escapeHtml(ws.title)}</h3>
          <button type="button" class="btn-workshop-toggle" aria-expanded="false" title="تغییر وضعیت نمایش توضیحات">
            <span class="toggle-text">توضیحات</span>
            <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
        </div>
        <div class="workshop-desc-accordion" aria-hidden="true">
          <div class="workshop-desc-inner">
            <p class="workshop-full-desc">${escapeHtml(ws.description)}</p>
            <div class="workshop-card-actions">
              <button type="button" class="btn-open-modal-detail">
                <span>نمایش در پنجره تمام‌صفحه</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Interactive toggle listeners
    const bannerWrap = card.querySelector('.workshop-banner-wrap');
    const headerWrap = card.querySelector('.workshop-card-header');
    const toggleBtn = card.querySelector('.btn-workshop-toggle');
    const toggleText = card.querySelector('.toggle-text');
    const accordion = card.querySelector('.workshop-desc-accordion');
    const modalBtn = card.querySelector('.btn-open-modal-detail');

    function toggleAccordion() {
      const isExpanded = card.classList.toggle('expanded');
      toggleBtn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
      accordion.setAttribute('aria-hidden', isExpanded ? 'false' : 'true');
      if (toggleText) {
        toggleText.textContent = isExpanded ? 'بستن' : 'توضیحات';
      }
    }

    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleAccordion();
      });
    }

    if (headerWrap) {
      headerWrap.addEventListener('click', (e) => {
        if (e.target !== toggleBtn && !toggleBtn.contains(e.target)) {
          toggleAccordion();
        }
      });
      headerWrap.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleAccordion();
        }
      });
    }

    // Clicking banner opens the full detail modal
    if (bannerWrap) {
      bannerWrap.addEventListener('click', () => {
        openWorkshopModal(ws);
      });
      bannerWrap.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openWorkshopModal(ws);
        }
      });
    }

    if (modalBtn) {
      modalBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openWorkshopModal(ws);
      });
    }

    grid.appendChild(card);
  });
}

/**
 * Load Admin Workshop Management List (GET /workshop)
 */
async function loadAdminWorkshops() {
  const container = document.getElementById('admin-workshops-list');
  if (!container) return;

  const adminToken = getAdminToken();
  if (!adminToken) return;

  container.innerHTML = '<p style="color: var(--text-muted); text-align: center; font-size: 0.9rem;">در حال بارگذاری لیست کارگاه‌ها...</p>';

  try {
    const res = await apiFetch('/workshop', { method: 'GET' });
    if (!res.ok) {
      container.innerHTML = '<p style="color: #fca5a5; text-align: center;">خطا در دریافت لیست کارگاه‌ها.</p>';
      return;
    }

    const workshops = await res.json();

    if (!Array.isArray(workshops) || workshops.length === 0) {
      container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 1.5rem 0;">تاکنون کارگاهی ثبت نشده است. از فرم بالا برای ثبت اولین کارگاه استفاده فرمایید.</p>';
      return;
    }

    container.innerHTML = '';
    workshops.forEach(ws => {
      const item = document.createElement('div');
      item.className = 'admin-workshop-item';

      let thumbHtml = '';
      if (ws.bannerPath) {
        thumbHtml = `<img src="${resolveImageUrl(ws.bannerPath)}" alt="${escapeHtml(ws.title)}" class="admin-workshop-thumb">`;
      } else {
        thumbHtml = `<div class="admin-workshop-thumb-placeholder">🛠️</div>`;
      }

      item.innerHTML = `
        <div class="admin-workshop-item-right">
          ${thumbHtml}
          <div class="admin-workshop-details">
            <h4 class="admin-workshop-title">${escapeHtml(ws.title)} <small style="color: var(--cyan); font-weight: normal;">(شناسه: ${ws.id})</small></h4>
            <p class="admin-workshop-desc-preview">${escapeHtml(ws.description)}</p>
          </div>
        </div>
        <button type="button" class="btn-del-workshop" data-id="${ws.id}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
          <span>حذف کارگاه</span>
        </button>
      `;

      item.querySelector('.btn-del-workshop').addEventListener('click', async () => {
        if (!confirm(`آیا از حذف کارگاه «${ws.title}» اطمینان دارید؟`)) return;

        try {
          const delRes = await apiFetch(`/workshop/${ws.id}`, {
            method: 'DELETE',
            auth: 'admin'
          });

          if (delRes.ok) {
            showToast('کارگاه با موفقیت حذف گردید.', 'success');
            loadAdminWorkshops();
            loadPublicWorkshops();
          } else {
            showToast('خطا در حذف کارگاه.', 'error');
          }
        } catch {
          showToast('خطا در برقراری ارتباط با سرور.', 'error');
        }
      });

      container.appendChild(item);
    });

  } catch (err) {
    container.innerHTML = '<p style="color: #fca5a5; text-align: center;">خطا در دریافت لیست کارگاه‌ها.</p>';
  }
}

/* ==========================================================================
   DOM Ready Initialization
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Initial immediate auth state render to prevent layout shift
  updateAuthState();

  // 2. Session verification on launch
  validateSessions();

  // 3. Load public news & workshops
  loadPublicNews();
  loadPublicWorkshops();

  // 4. Secret / Discreet trigger for Admin login:
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

  // 5. News Reader Modal Close Triggers
  const newsModalCloseBtn = document.getElementById('news-modal-close-btn');
  if (newsModalCloseBtn) {
    newsModalCloseBtn.addEventListener('click', closeNewsReader);
  }
  const newsReaderModal = document.getElementById('news-reader-modal');
  if (newsReaderModal) {
    newsReaderModal.addEventListener('click', (e) => {
      if (e.target === newsReaderModal) closeNewsReader();
    });
  }

  // 6. Workshop Detail Modal Close Triggers
  const wsModalCloseBtn = document.getElementById('workshop-modal-close-btn');
  const wsModalCloseBottom = document.getElementById('workshop-modal-close-bottom');
  const wsModal = document.getElementById('workshop-modal');
  if (wsModalCloseBtn) {
    wsModalCloseBtn.addEventListener('click', closeWorkshopModal);
  }
  if (wsModalCloseBottom) {
    wsModalCloseBottom.addEventListener('click', closeWorkshopModal);
  }
  if (wsModal) {
    wsModal.addEventListener('click', (e) => {
      if (e.target === wsModal) closeWorkshopModal();
    });
  }

  const wsModalSignupBtn = document.getElementById('workshop-modal-signup-btn');
  if (wsModalSignupBtn) {
    wsModalSignupBtn.addEventListener('click', () => {
      closeWorkshopModal();
    });
  }

  // 7. Lightbox Modal Close Triggers & Banner Zoom Handlers
  const lightboxCloseBtn = document.getElementById('lightbox-close-btn');
  if (lightboxCloseBtn) {
    lightboxCloseBtn.addEventListener('click', closeLightbox);
  }
  const lightboxModal = document.getElementById('lightbox-modal');
  if (lightboxModal) {
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) closeLightbox();
    });
  }

  // Escape key closes all modals
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAdminModal();
      closeNewsReader();
      closeWorkshopModal();
      closeLightbox();
    }
  });

  // Wire Hero Panoramic Banner Lightbox
  const heroBannerFrame = document.getElementById('hero-banner-frame');
  const btnZoomWide = document.getElementById('btn-zoom-wide');
  const openWideBanner = () => {
    openLightbox('assets/banner-wide.jpg', 'تصویر سردر دانشگاه صنعتی نوشیروانی بابل در شب علم - ۱۲ آذر ۱۴۰۵');
  };
  if (heroBannerFrame) {
    heroBannerFrame.addEventListener('click', openWideBanner);
    heroBannerFrame.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openWideBanner();
      }
    });
  }
  if (btnZoomWide) {
    btnZoomWide.addEventListener('click', (e) => {
      e.stopPropagation();
      openWideBanner();
    });
  }

  // Wire Official Poster Lightbox
  const posterCardTrigger = document.getElementById('poster-card-trigger');
  if (posterCardTrigger) {
    posterCardTrigger.addEventListener('click', (e) => {
      if (e.target.closest('.btn-poster-download')) return; // Allow download link to work
      openLightbox('assets/banner-poster.jpg', 'پوستر رسمی رویداد شب علم دانشگاه صنعتی نوشیروانی بابل - بپرس، کشف کن و فراتر برو');
    });
    posterCardTrigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox('assets/banner-poster.jpg', 'پوستر رسمی رویداد شب علم دانشگاه صنعتی نوشیروانی بابل - بپرس، کشف کن و فراتر برو');
      }
    });
  }

  // 6. Mobile Navigation Drawer Toggle
  const mobileToggle = document.getElementById('mobile-toggle');
  const navContent = document.getElementById('nav-content');
  if (mobileToggle && navContent) {
    mobileToggle.addEventListener('click', () => {
      const expanded = mobileToggle.getAttribute('aria-expanded') === 'true';
      mobileToggle.setAttribute('aria-expanded', String(!expanded));
      navContent.classList.toggle('mobile-open');
    });

    // Close mobile menu when clicking a link
    navContent.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navContent.classList.remove('mobile-open');
        mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // 7. Navbar blur & elevate on scroll
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 25) {
      navbar.classList.add('nav-scrolled');
    } else {
      navbar.classList.remove('nav-scrolled');
    }
  }, { passive: true });

  // 8. Scroll Animations via IntersectionObserver
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // 9. Public User Sign-Up Form Handling (POST /auth/user)
  const signupForm = document.getElementById('signup-form');
  const signupBtn = document.getElementById('signup-btn');
  const signupErrorBox = document.getElementById('signup-error-box');
  const signupErrorMsg = document.getElementById('signup-error-msg');
  const ssnInput = document.getElementById('ssn');
  const phoneInput = document.getElementById('phone');
  const fullNameInput = document.getElementById('fullName');
  const childCountInput = document.getElementById('childCount');
  const teenageCountInput = document.getElementById('teenageCount');
  const adultCountInput = document.getElementById('adultCount');

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

      const childCount = childCountInput ? Math.max(0, parseInt(toEnglishDigits(childCountInput.value) || '0', 10) || 0) : 0;
      const teenageCount = teenageCountInput ? Math.max(0, parseInt(toEnglishDigits(teenageCountInput.value) || '0', 10) || 0) : 0;
      const adultCount = adultCountInput ? Math.max(0, parseInt(toEnglishDigits(adultCountInput.value) || '0', 10) || 0) : 0;

      setLoading(signupBtn, true);

      try {
        const res = await apiFetch('/auth/user', {
          method: 'POST',
          body: JSON.stringify({ ssn, fullName, phone, childCount, teenageCount, adultCount })
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

  const btnReRegister = document.getElementById('btn-re-register');
  if (btnReRegister) {
    btnReRegister.addEventListener('click', () => {
      logout();
      const ssnEl = document.getElementById('ssn');
      if (ssnEl) ssnEl.focus();
    });
  }

  // 10. Admin Login Handling (POST /auth/admin / POST /auth/login/admin)
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

  // 11. Admin Panel Quick Logout Trigger
  const adminQuickLogout = document.getElementById('admin-quick-logout');
  if (adminQuickLogout) {
    adminQuickLogout.addEventListener('click', logout);
  }

  // 12. Admin Panel Excel Export (GET /export)
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

  // 13. Admin News Publishing Form (POST /news)
  const adminCreateNewsForm = document.getElementById('admin-create-news-form');
  const newsTitleInput = document.getElementById('news-title');
  const newsDescInput = document.getElementById('news-description');
  const newsImagesInput = document.getElementById('news-images-input');
  const newsImagesPreview = document.getElementById('news-images-preview');
  const btnSubmitNews = document.getElementById('btn-submit-news');
  const newsErrorBox = document.getElementById('news-error-box');
  const newsErrorMsg = document.getElementById('news-error-msg');
  const btnRefreshAdminNews = document.getElementById('btn-refresh-admin-news');

  let selectedNewsFiles = [];

  if (newsImagesInput) {
    newsImagesInput.addEventListener('change', () => {
      if (newsImagesInput.files) {
        const newFiles = Array.from(newsImagesInput.files);
        selectedNewsFiles = [...selectedNewsFiles, ...newFiles].slice(0, 10);
        renderNewsFilesPreview();
      }
    });
  }

  function renderNewsFilesPreview() {
    if (!newsImagesPreview) return;
    newsImagesPreview.innerHTML = '';

    selectedNewsFiles.forEach((file, index) => {
      const pill = document.createElement('div');
      pill.className = 'preview-pill';
      
      const thumb = document.createElement('img');
      thumb.className = 'preview-pill-thumb';
      thumb.src = URL.createObjectURL(file);
      
      const name = document.createElement('span');
      name.textContent = file.name.length > 15 ? file.name.substring(0, 12) + '...' : file.name;

      const removeBtn = document.createElement('span');
      removeBtn.className = 'preview-pill-remove';
      removeBtn.textContent = '×';
      removeBtn.title = 'حذف این فایل';
      removeBtn.addEventListener('click', () => {
        selectedNewsFiles.splice(index, 1);
        renderNewsFilesPreview();
      });

      pill.appendChild(thumb);
      pill.appendChild(name);
      pill.appendChild(removeBtn);
      newsImagesPreview.appendChild(pill);
    });
  }

  if (adminCreateNewsForm) {
    adminCreateNewsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearInlineError(newsErrorBox);

      const title = newsTitleInput.value.trim();
      const description = newsDescInput.value.trim();

      if (!title) {
        showInlineError(newsErrorBox, newsErrorMsg, 'لطفاً عنوان خبر را وارد نمایید.');
        newsTitleInput.focus();
        return;
      }

      if (!description) {
        showInlineError(newsErrorBox, newsErrorMsg, 'لطفاً متن کامل خبر را وارد نمایید.');
        newsDescInput.focus();
        return;
      }

      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);

      selectedNewsFiles.forEach(file => {
        formData.append('images', file);
      });

      setLoading(btnSubmitNews, true);

      try {
        const res = await apiFetch('/news', {
          method: 'POST',
          auth: 'admin',
          body: formData
        });

        if (res.ok) {
          showToast('خبر جدید با موفقیت منتشر شد!', 'success');
          adminCreateNewsForm.reset();
          selectedNewsFiles = [];
          renderNewsFilesPreview();
          loadAdminNews();
          loadPublicNews();
        } else {
          const data = await res.json().catch(() => ({}));
          const errMsg = Array.isArray(data.message) ? data.message.join('، ') : (data.message || 'خطا در ثبت خبر.');
          showInlineError(newsErrorBox, newsErrorMsg, errMsg);
        }
      } catch (err) {
        showInlineError(newsErrorBox, newsErrorMsg, 'خطا در ارتباط با سرور هنگام ایجاد خبر.');
      } finally {
        setLoading(btnSubmitNews, false);
      }
    });
  }

  if (btnRefreshAdminNews) {
    btnRefreshAdminNews.addEventListener('click', () => {
      loadAdminNews();
      showToast('لیست اخبار به‌روزرسانی شد.', 'info');
    });
  }

  // 14. Admin Workshop Creation Form (POST /workshop)
  const adminCreateWorkshopForm = document.getElementById('admin-create-workshop-form');
  const workshopTitleInput = document.getElementById('workshop-title');
  const workshopDescInput = document.getElementById('workshop-description');
  const workshopBannerInput = document.getElementById('workshop-banner-input');
  const workshopBannerPreview = document.getElementById('workshop-banner-preview');
  const btnSubmitWorkshop = document.getElementById('btn-submit-workshop');
  const workshopErrorBox = document.getElementById('workshop-error-box');
  const workshopErrorMsg = document.getElementById('workshop-error-msg');
  const btnRefreshAdminWorkshops = document.getElementById('btn-refresh-admin-workshops');

  let selectedWorkshopBanner = null;

  if (workshopBannerInput) {
    workshopBannerInput.addEventListener('change', () => {
      if (workshopBannerInput.files && workshopBannerInput.files[0]) {
        selectedWorkshopBanner = workshopBannerInput.files[0];
        renderWorkshopBannerPreview();
      }
    });
  }

  function renderWorkshopBannerPreview() {
    if (!workshopBannerPreview) return;
    workshopBannerPreview.innerHTML = '';
    if (!selectedWorkshopBanner) return;

    const pill = document.createElement('div');
    pill.className = 'preview-pill';

    const thumb = document.createElement('img');
    thumb.className = 'preview-pill-thumb';
    thumb.src = URL.createObjectURL(selectedWorkshopBanner);

    const name = document.createElement('span');
    name.textContent = selectedWorkshopBanner.name.length > 15
      ? selectedWorkshopBanner.name.substring(0, 12) + '...'
      : selectedWorkshopBanner.name;

    const removeBtn = document.createElement('span');
    removeBtn.className = 'preview-pill-remove';
    removeBtn.textContent = '×';
    removeBtn.title = 'حذف تصویر';
    removeBtn.addEventListener('click', () => {
      selectedWorkshopBanner = null;
      if (workshopBannerInput) workshopBannerInput.value = '';
      renderWorkshopBannerPreview();
    });

    pill.appendChild(thumb);
    pill.appendChild(name);
    pill.appendChild(removeBtn);
    workshopBannerPreview.appendChild(pill);
  }

  if (adminCreateWorkshopForm) {
    adminCreateWorkshopForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearInlineError(workshopErrorBox);

      const title = workshopTitleInput ? workshopTitleInput.value.trim() : '';
      const description = workshopDescInput ? workshopDescInput.value.trim() : '';

      if (!title) {
        showInlineError(workshopErrorBox, workshopErrorMsg, 'لطفاً عنوان کارگاه را وارد نمایید.');
        if (workshopTitleInput) workshopTitleInput.focus();
        return;
      }

      if (!description) {
        showInlineError(workshopErrorBox, workshopErrorMsg, 'لطفاً توضیحات کامل کارگاه را وارد نمایید.');
        if (workshopDescInput) workshopDescInput.focus();
        return;
      }

      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      if (selectedWorkshopBanner) {
        formData.append('bannerPath', selectedWorkshopBanner);
      }

      setLoading(btnSubmitWorkshop, true);

      try {
        const res = await apiFetch('/workshop', {
          method: 'POST',
          auth: 'admin',
          body: formData
        });

        if (res.ok) {
          showToast('کارگاه آموزشی با موفقیت ثبت شد!', 'success');
          adminCreateWorkshopForm.reset();
          selectedWorkshopBanner = null;
          renderWorkshopBannerPreview();
          loadAdminWorkshops();
          loadPublicWorkshops();
        } else {
          const data = await res.json().catch(() => ({}));
          const errMsg = Array.isArray(data.message) ? data.message.join('، ') : (data.message || 'خطا در ثبت کارگاه.');
          showInlineError(workshopErrorBox, workshopErrorMsg, errMsg);
        }
      } catch (err) {
        showInlineError(workshopErrorBox, workshopErrorMsg, 'خطا در ارتباط با سرور هنگام ثبت کارگاه.');
      } finally {
        setLoading(btnSubmitWorkshop, false);
      }
    });
  }

  if (btnRefreshAdminWorkshops) {
    btnRefreshAdminWorkshops.addEventListener('click', () => {
      loadAdminWorkshops();
      showToast('لیست کارگاه‌ها به‌روزرسانی شد.', 'info');
    });
  }
});
