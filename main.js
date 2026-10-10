/**
 * Slayvana — Main JavaScript
 * Keyboard-first, accessible interactions
 * WCAG 2.2 AA compliant
 */

'use strict';

/* ── 1. HEADER SCROLL SHADOW ─────────────────────────────── */
const siteHeader = document.getElementById('site-header');

function handleHeaderScroll() {
  if (window.scrollY > 20) {
    siteHeader.classList.add('scrolled');
  } else {
    siteHeader.classList.remove('scrolled');
  }
}

window.addEventListener('scroll', handleHeaderScroll, { passive: true });

/* ── 2. SEARCH OVERLAY ───────────────────────────────────── */
const searchToggle  = document.getElementById('search-toggle');
const searchOverlay = document.getElementById('search-overlay');
const searchClose   = document.getElementById('search-close');
const searchInput   = document.getElementById('search-input');

function openSearch() {
  searchOverlay.classList.add('open');
  searchOverlay.setAttribute('aria-hidden', 'false');
  searchToggle.setAttribute('aria-expanded', 'true');
  setTimeout(() => searchInput && searchInput.focus(), 100);
}

function closeSearch() {
  searchOverlay.classList.remove('open');
  searchOverlay.setAttribute('aria-hidden', 'true');
  searchToggle.setAttribute('aria-expanded', 'false');
  searchToggle.focus();
}

if (searchToggle) searchToggle.addEventListener('click', openSearch);
if (searchClose)  searchClose.addEventListener('click', closeSearch);

// Close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (searchOverlay && searchOverlay.classList.contains('open')) closeSearch();
    if (mobileNavOverlay && mobileNavOverlay.classList.contains('open')) closeMobileNav();
  }
});

/* ── 3. MOBILE NAVIGATION ────────────────────────────────── */
const navToggle        = document.getElementById('nav-toggle');
const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
const mobileNavPanel   = document.getElementById('mobile-nav-panel');
const mobileNavClose   = document.getElementById('mobile-nav-close');

function openMobileNav() {
  mobileNavOverlay.classList.add('open');
  mobileNavOverlay.setAttribute('aria-hidden', 'false');
  navToggle.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
  setTimeout(() => mobileNavClose && mobileNavClose.focus(), 150);
}

function closeMobileNav() {
  mobileNavOverlay.classList.remove('open');
  mobileNavOverlay.setAttribute('aria-hidden', 'true');
  navToggle.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
  navToggle.focus();
}

if (navToggle)       navToggle.addEventListener('click', openMobileNav);
if (mobileNavClose)  mobileNavClose.addEventListener('click', closeMobileNav);

// Close on overlay backdrop click
if (mobileNavOverlay) {
  mobileNavOverlay.addEventListener('click', (e) => {
    if (e.target === mobileNavOverlay) closeMobileNav();
  });
}

// Focus trap inside mobile nav panel
if (mobileNavPanel) {
  mobileNavPanel.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusable = mobileNavPanel.querySelectorAll(
      'a[href], button, input, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  });
}

/* ── 4. PRODUCT FILTER TABS ──────────────────────────────── */
const filterTabs  = document.querySelectorAll('.filter-tab');
const productGrid = document.getElementById('product-grid');

filterTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    // Update tab states
    filterTabs.forEach((t) => {
      t.classList.remove('filter-tab--active');
      t.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('filter-tab--active');
    tab.setAttribute('aria-selected', 'true');

    const filter = tab.dataset.filter;

    // Filter products
    if (!productGrid) return;
    const cards = productGrid.querySelectorAll('.product-card');

    cards.forEach((card) => {
      const categories = card.dataset.category || '';
      const show = filter === 'all' || categories.split(' ').includes(filter);

      card.style.transition = 'opacity 200ms ease, transform 200ms ease';

      if (show) {
        card.style.display = 'flex';
        requestAnimationFrame(() => {
          card.style.opacity = '1';
          card.style.transform = '';
        });
      } else {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.97)';
        setTimeout(() => {
          if (!card.dataset.category.includes(filter) && filter !== 'all') {
            card.style.display = 'none';
          }
        }, 200);
      }
    });
  });

  // Keyboard: arrow keys navigate tabs
  tab.addEventListener('keydown', (e) => {
    const tabs   = [...filterTabs];
    const idx    = tabs.indexOf(tab);
    let   newIdx = idx;

    if (e.key === 'ArrowRight') newIdx = (idx + 1) % tabs.length;
    if (e.key === 'ArrowLeft')  newIdx = (idx - 1 + tabs.length) % tabs.length;
    if (e.key === 'Home')       newIdx = 0;
    if (e.key === 'End')        newIdx = tabs.length - 1;

    if (newIdx !== idx) {
      e.preventDefault();
      tabs[newIdx].focus();
      tabs[newIdx].click();
    }
  });
});

/* ── 5. WISHLIST TOGGLE ──────────────────────────────────── */
document.querySelectorAll('.product-wishlist-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const productCard = btn.closest('.product-card');
    const productId = productCard ? productCard.dataset.id : 'unknown';
    
    // Toggle via manager
    const inWishlist = WishlistManager.toggleItem(productId);
    btn.setAttribute('aria-pressed', String(inWishlist));

    const productName = productCard
      ? productCard.querySelector('.product-name-link')?.textContent.trim()
      : 'product';

    if (inWishlist) {
      announceToSR(`${productName} added to wishlist`);
      if (typeof showToast === 'function') showToast(`${productName} added to wishlist`);
    } else {
      announceToSR(`${productName} removed from wishlist`);
    }
  });
});

/* ── 6. ADD TO CART ──────────────────────────────────────── */
document.querySelectorAll('.btn--add-to-cart').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();

    const originalText = btn.textContent;
    btn.textContent = 'Adding...';
    btn.setAttribute('disabled', 'true');
    btn.style.opacity = '0.7';

    setTimeout(() => {
      btn.textContent = 'Added!';
      btn.style.opacity = '1';
      
      const productCard = btn.closest('.product-card');
      const productId = productCard ? productCard.dataset.id : 'unknown';
      const productName = productCard
        ? productCard.querySelector('.product-name-link')?.textContent.trim()
        : 'Item';
        
      // Add to manager (default size M, qty 1 for grid adds)
      CartManager.addItem({
        id: productId,
        name: productName,
        size: 'M',
        qty: 1
      });

      announceToSR(`${productName} added to cart`);
      if (typeof showToast === 'function') showToast(`${productName} added to cart!`);

      setTimeout(() => {
        btn.textContent = originalText;
        btn.removeAttribute('disabled');
      }, 2000);
    }, 600);
  });
});

/* ── 7. CART BADGE (Moved to bottom) ───────────────────── */
/* ── 8. BACK TO TOP ──────────────────────────────────────── */
const backToTopBtn = document.getElementById('back-to-top');

if (backToTopBtn) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
      backToTopBtn.hidden = false;
    } else {
      backToTopBtn.hidden = true;
    }
  }, { passive: true });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => document.querySelector('.site-header')?.focus(), 500);
  });
}

/* ── 9. NEWSLETTER FORM ──────────────────────────────────── */
const newsletterForm = document.querySelector('.newsletter-form');

if (newsletterForm) {
  newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const emailInput = document.getElementById('newsletter-email');
    const submitBtn  = document.getElementById('newsletter-submit');
    const email      = emailInput?.value.trim();

    // Basic validation
    if (!email || !isValidEmail(email)) {
      emailInput.style.borderColor = '#c0392b';
      emailInput.setAttribute('aria-invalid', 'true');
      announceToSR('Please enter a valid email address');
      emailInput.focus();
      return;
    }

    emailInput.style.borderColor = '';
    emailInput.setAttribute('aria-invalid', 'false');

    if (submitBtn) {
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'Subscribing...';
      submitBtn.disabled = true;

      setTimeout(() => {
        submitBtn.textContent = 'Subscribed!';
        emailInput.value = '';
        announceToSR('Successfully subscribed to the Slay Circle newsletter');

        setTimeout(() => {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        }, 3000);
      }, 800);
    }
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ── 10. LIVE REGION (SR ANNOUNCER) ──────────────────────── */
let srAnnouncer = document.createElement('div');
srAnnouncer.setAttribute('aria-live', 'polite');
srAnnouncer.setAttribute('aria-atomic', 'true');
srAnnouncer.className = 'sr-only';
srAnnouncer.id = 'sr-announcer';
document.body.appendChild(srAnnouncer);

function announceToSR(message) {
  srAnnouncer.textContent = '';
  requestAnimationFrame(() => {
    srAnnouncer.textContent = message;
  });
}

/* ── 11. INTERSECTION OBSERVER — SCROLL ANIMATIONS ───────── */
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -40px 0px'
};

const animateObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      animateObserver.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe product cards with stagger
document.querySelectorAll('.product-card').forEach((card, i) => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(20px)';
  card.style.transition = `opacity 400ms ease ${i * 60}ms, transform 400ms ease ${i * 60}ms`;
  animateObserver.observe(card);
});

// Observe testimonials
document.querySelectorAll('.testimonial-card').forEach((card, i) => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(16px)';
  card.style.transition = `opacity 400ms ease ${i * 80}ms, transform 400ms ease ${i * 80}ms`;
  animateObserver.observe(card);
});

// Observe category tiles
document.querySelectorAll('.category-tile').forEach((tile, i) => {
  tile.style.opacity = '0';
  tile.style.transform = 'translateY(12px)';
  tile.style.transition = `opacity 350ms ease ${i * 50}ms, transform 350ms ease ${i * 50}ms`;
  animateObserver.observe(tile);
});

/* ── 12. REDUCED MOTION CHECK ────────────────────────────── */
const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

if (mediaQuery.matches) {
  // Instantly show all animated elements without transitions
  document.querySelectorAll('.product-card, .testimonial-card, .category-tile').forEach((el) => {
    el.style.opacity = '1';
    el.style.transform = 'none';
    el.style.transition = 'none';
  });
}

/* ── 13. COLOR SWATCH SELECTION ──────────────────────────── */
document.querySelectorAll('.product-swatches').forEach((swatchGroup) => {
  const swatches = swatchGroup.querySelectorAll('.swatch');

  swatches.forEach((swatch) => {
    swatch.addEventListener('click', () => {
      swatches.forEach((s) => {
        s.classList.remove('swatch--active');
        s.setAttribute('aria-pressed', 'false');
      });
      swatch.classList.add('swatch--active');
      swatch.setAttribute('aria-pressed', 'true');

      // Announce color selection
      const colorName = swatch.getAttribute('aria-label')?.replace(' - selected', '') || 'color';
      announceToSR(`${colorName} selected`);
    });

    // Keyboard support
    swatch.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        swatch.click();
      }
    });
  });
});

/* ── 14. DROPDOWN NAV KEYBOARD SUPPORT ───────────────────── */
document.querySelectorAll('.nav-item.has-dropdown').forEach((item) => {
  const trigger  = item.querySelector('.nav-link');
  const dropdown = item.querySelector('.nav-dropdown');
  const links    = dropdown?.querySelectorAll('.dropdown-link') || [];

  if (!trigger || !dropdown) return;

  // Open on Enter/Space, close on Escape, navigate with arrows
  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      trigger.setAttribute('aria-expanded', 'true');
      dropdown.style.visibility = 'visible';
      dropdown.style.opacity = '1';
      dropdown.style.pointerEvents = 'all';
      links[0]?.focus();
    }
  });


  dropdown.addEventListener('keydown', (e) => {
    const linkArr = [...links];
    const idx = linkArr.indexOf(document.activeElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      linkArr[(idx + 1) % linkArr.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      linkArr[(idx - 1 + linkArr.length) % linkArr.length]?.focus();
    } else if (e.key === 'Escape') {
      trigger.setAttribute('aria-expanded', 'false');
      trigger.focus();
    } else if (e.key === 'Tab') {
      trigger.setAttribute('aria-expanded', 'false');
    }
  });
});

/* ── 15. STATE MANAGEMENT (LOCALSTORAGE) ───────────────── */
// Cart Manager
const CartManager = {
  getCart() {
    return JSON.parse(localStorage.getItem('slayvana_cart')) || [];
  },
  saveCart(cart) {
    localStorage.setItem('slayvana_cart', JSON.stringify(cart));
    updateCartBadge();
  },
  addItem(item) {
    const cart = this.getCart();
    const existing = cart.find(i => i.id === item.id && i.size === item.size);
    if (existing) {
      existing.qty += item.qty;
    } else {
      cart.push(item);
    }
    this.saveCart(cart);
  },
  removeItem(id, size) {
    let cart = this.getCart();
    cart = cart.filter(i => !(i.id === id && i.size === size));
    this.saveCart(cart);
  },
  updateQty(id, size, qty) {
    const cart = this.getCart();
    const item = cart.find(i => i.id === id && i.size === size);
    if (item) {
      item.qty = Math.max(1, qty);
      this.saveCart(cart);
    }
  },
  getTotalCount() {
    return this.getCart().reduce((sum, item) => sum + item.qty, 0);
  }
};

// Wishlist Manager
const WishlistManager = {
  getWishlist() {
    return JSON.parse(localStorage.getItem('slayvana_wishlist')) || [];
  },
  saveWishlist(list) {
    localStorage.setItem('slayvana_wishlist', JSON.stringify(list));
  },
  toggleItem(id) {
    let list = this.getWishlist();
    if (list.includes(id)) {
      list = list.filter(i => i !== id);
    } else {
      list.push(id);
    }
    this.saveWishlist(list);
    return list.includes(id); // Returns true if added, false if removed
  },
  hasItem(id) {
    return this.getWishlist().includes(id);
  }
};

// Override the hardcoded cart badge update
function updateCartBadge() {
  const count = CartManager.getTotalCount();
  const badge = document.querySelector('.cart-badge');
  if (!badge) return;

  badge.textContent = count;
  badge.style.transform = 'scale(1.4)';
  setTimeout(() => { badge.style.transform = 'scale(1)'; badge.style.transition = 'transform 200ms'; }, 200);

  const cartBtn = document.querySelector('.cart-btn');
  if (cartBtn) {
    cartBtn.setAttribute('aria-label', `Shopping cart, ${count} items`);
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  
  // Sync wishlist UI state on load
  document.querySelectorAll('.product-wishlist-btn').forEach(btn => {
    const card = btn.closest('.product-card');
    if (card && card.dataset.id) {
      const inWishlist = WishlistManager.hasItem(card.dataset.id);
      btn.setAttribute('aria-pressed', String(inWishlist));
    }
  });
});

console.log('%cSlayvana — Modern Ethnic Fusion Fashion', 'font-size:14px; font-weight:bold; color:#c8874a;');
