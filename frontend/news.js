/**
 * Science Night - News Archive Page Application
 * دانشگاه صنعتی نوشیروانی بابل - صفحه مقالات و اخبار
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

  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    if (window.location.origin !== 'null' && !window.location.origin.startsWith('file:')) {
      return window.location.origin;
    }
  }

  return 'http://localhost:3000';
})();

function resolveImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/')) {
    return `${API_BASE}${path}`;
  }
  return `${API_BASE}/${path}`;
}

/**
 * Toast Helper
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
    toast.remove();
  });

  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast-show'));

  setTimeout(() => {
    if (toast.parentElement) {
      toast.classList.remove('toast-show');
      setTimeout(() => toast.remove(), 250);
    }
  }, 3200);
}

/**
 * Interactive Lightbox
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
  if (modal) modal.classList.remove('open');
}

/**
 * State
 */
let allArticles = [];

/**
 * App-Like In-Card Gallery Component Builder
 */
function createGalleryElement(images, articleTitle) {
  const galleryWrap = document.createElement('div');
  galleryWrap.className = 'mini-gallery';

  if (!images || images.length === 0) {
    return galleryWrap;
  }

  const imageUrls = images.map(img => resolveImageUrl(img.path));
  let currentIndex = 0;

  // Viewport
  const viewport = document.createElement('div');
  viewport.className = 'mini-gallery-viewport';
  viewport.title = 'برای مشاهده اندازه اصلی کلیک کنید';

  const imgEl = document.createElement('img');
  imgEl.className = 'mini-gallery-img';
  imgEl.src = imageUrls[0];
  imgEl.alt = articleTitle;
  viewport.appendChild(imgEl);

  // If only 1 image, just return viewport with click to lightbox
  if (imageUrls.length === 1) {
    viewport.addEventListener('click', () => {
      openLightbox(imageUrls[0], articleTitle);
    });
    galleryWrap.appendChild(viewport);
    return galleryWrap;
  }

  // Counter badge
  const counterBadge = document.createElement('span');
  counterBadge.className = 'gallery-counter-badge';
  counterBadge.textContent = `۱ از ${imageUrls.length}`;
  viewport.appendChild(counterBadge);

  // Navigation Arrows
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

  // Thumbs Strip
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

    imgEl.style.opacity = '0.4';
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

  // Touch Swipe on mobile
  let touchStartX = 0;
  viewport.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  viewport.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 35) {
      if (diff > 0) {
        setGalleryIndex(currentIndex + 1);
      } else {
        setGalleryIndex(currentIndex - 1);
      }
    }
  }, { passive: true });

  viewport.addEventListener('click', () => {
    openLightbox(imageUrls[currentIndex], `${articleTitle} (تصویر ${currentIndex + 1} از ${imageUrls.length})`);
  });

  galleryWrap.appendChild(viewport);
  galleryWrap.appendChild(thumbsWrap);
  return galleryWrap;
}

/**
 * Render Articles Grid
 */
function renderArticles(articles) {
  const grid = document.getElementById('news-archive-grid');
  const stats = document.getElementById('news-search-stats');
  if (!grid) return;

  if (stats) {
    stats.textContent = `${articles.length} اطلاعیه و مقاله در دسترس است`;
  }

  if (articles.length === 0) {
    grid.innerHTML = `
      <div class="news-empty-state" style="grid-column: 1 / -1;">
        <div class="news-empty-icon" aria-hidden="true">🔍</div>
        <h3 class="news-empty-title">مطلبی مطابق با جستجوی شما یافت نشد</h3>
        <p class="news-empty-desc">
          لطفاً کلمات کلیدی دیگری را جستجو نمایید یا فیلتر جستجو را پاک کنید.
        </p>
      </div>
    `;
    return;
  }

  grid.innerHTML = '';
  articles.forEach((article) => {
    const card = document.createElement('article');
    card.className = 'news-article-card reveal revealed';
    card.id = `article-${article.id}`;

    // Header info
    const headerEl = document.createElement('div');
    headerEl.className = 'news-article-header';
    headerEl.innerHTML = `
      <div class="news-article-badges">
        <span class="section-tag" style="margin: 0;">اطلاعیه رویداد</span>
        <span class="news-article-id">شناسه: ${article.id}</span>
      </div>
      <h2 class="news-article-title">${article.title}</h2>
    `;

    // Gallery / Media
    const hasImages = article.images && article.images.length > 0;
    let galleryEl = null;
    if (hasImages) {
      galleryEl = createGalleryElement(article.images, article.title);
    }

    // Body content
    const bodyEl = document.createElement('div');
    bodyEl.className = 'news-article-body';
    bodyEl.textContent = article.description;

    // Footer actions
    const footerEl = document.createElement('div');
    footerEl.className = 'news-article-footer';
    
    const shareBtn = document.createElement('button');
    shareBtn.type = 'button';
    shareBtn.className = 'btn-share-article';
    shareBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
      </svg>
      <span>کپی لینک مستقیم خبر</span>
    `;
    shareBtn.addEventListener('click', () => {
      const directUrl = `${window.location.origin}${window.location.pathname}?id=${article.id}`;
      navigator.clipboard.writeText(directUrl).then(() => {
        showToast('لینک مستقیم خبر در کلیپ‌بورد کپی شد.', 'success');
      }).catch(() => {
        showToast('امکان کپی خودکار لینک میسر نشد.', 'info');
      });
    });

    footerEl.appendChild(shareBtn);

    card.appendChild(headerEl);
    if (galleryEl) card.appendChild(galleryEl);
    card.appendChild(bodyEl);
    card.appendChild(footerEl);

    grid.appendChild(card);
  });

  // Check URL deep-linking (?id=...)
  const params = new URLSearchParams(window.location.search);
  const targetId = params.get('id');
  if (targetId) {
    const targetCard = document.getElementById(`article-${targetId}`);
    if (targetCard) {
      setTimeout(() => {
        targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetCard.classList.add('highlighted-article');
      }, 250);
    }
  }
}

/**
 * Fetch and Init News
 */
async function loadNewsArchive() {
  const grid = document.getElementById('news-archive-grid');
  try {
    const res = await fetch(`${API_BASE}/news`);
    if (!res.ok) throw new Error('Network response error');

    allArticles = await res.json();
    if (!Array.isArray(allArticles)) allArticles = [];

    renderArticles(allArticles);
  } catch (err) {
    if (grid) {
      grid.innerHTML = `
        <div class="news-empty-state" style="grid-column: 1 / -1;">
          <div class="news-empty-icon" aria-hidden="true">📢</div>
          <h3 class="news-empty-title">به زودی؛ اعلام جزئیات و برنامه‌های شب علم</h3>
          <p class="news-empty-desc">
            اطلاعیه‌های رسمی، فهرست دقیق سخنرانان، کارگاه‌ها و محل استقرار غرفه‌های علمی دانشگاه صنعتی نوشیروانی بابل به زودی در این بخش قرار می‌گیرد.
          </p>
        </div>
      `;
    }
  }
}

/**
 * Setup DOM Events
 */
document.addEventListener('DOMContentLoaded', () => {
  loadNewsArchive();

  // Dynamic link update for active admin / user sessions
  const adminToken = localStorage.getItem('adminToken');
  const userToken = localStorage.getItem('userToken');
  document.querySelectorAll('a[href="index.html#signup"]').forEach(link => {
    if (adminToken) {
      link.href = 'index.html#admin-panel';
      link.textContent = 'پنل مدیریت';
    } else if (userToken) {
      link.href = 'index.html#signup';
      link.textContent = 'وضعیت ثبت‌نام';
    }
  });

  // Mobile Navigation Drawer Toggle
  const mobileToggle = document.getElementById('mobile-toggle');
  const navContent = document.getElementById('nav-content');
  if (mobileToggle && navContent) {
    mobileToggle.addEventListener('click', () => {
      const expanded = mobileToggle.getAttribute('aria-expanded') === 'true';
      mobileToggle.setAttribute('aria-expanded', String(!expanded));
      navContent.classList.toggle('mobile-open');
    });

    // Close drawer when any link is clicked
    navContent.querySelectorAll('.nav-link, a').forEach(link => {
      link.addEventListener('click', () => {
        navContent.classList.remove('mobile-open');
        mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Navbar blur & elevate on scroll
  const navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 25) {
        navbar.classList.add('nav-scrolled');
      } else {
        navbar.classList.remove('nav-scrolled');
      }
    }, { passive: true });
  }

  // Search logic
  const searchInput = document.getElementById('news-search-input');
  const searchClear = document.getElementById('news-search-clear');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const hasVal = searchInput.value.length > 0;
      if (searchClear) {
        searchClear.style.display = hasVal ? 'inline-flex' : 'none';
      }

      const term = searchInput.value.trim().toLowerCase();
      if (!term) {
        renderArticles(allArticles);
        return;
      }

      const filtered = allArticles.filter(art => 
        (art.title && art.title.toLowerCase().includes(term)) ||
        (art.description && art.description.toLowerCase().includes(term))
      );
      renderArticles(filtered);
    });
  }

  if (searchClear && searchInput) {
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchClear.style.display = 'none';
      renderArticles(allArticles);
      searchInput.focus();
    });
  }

  // Lightbox Close Handlers
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

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });
});
