/**
 * Webdesigner Studio — Interactive Scripts
 * CMS content loading, scroll-based reveals, counter animation, mobile nav, smooth scrolling, form handling
 */

(function () {
    'use strict';

    // ────────────────────────────────────────────
    // DOM ELEMENTS
    // ────────────────────────────────────────────
    const nav = document.getElementById('nav');
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    const navOverlay = document.getElementById('navOverlay');
    const contactForm = document.getElementById('contactForm');

    // ────────────────────────────────────────────
    // CMS CONTENT LOADING
    // Loads JSON content from /content/ folder
    // and populates the DOM dynamically.
    // Falls back to static HTML if fetch fails.
    // ────────────────────────────────────────────

    /**
     * Fetch a JSON content file from the content/ directory.
     * @param {string} filename - JSON filename (without path)
     * @returns {Promise<Object|null>}
     */
    async function fetchContent(filename) {
        try {
            const response = await fetch('content/' + filename);
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return await response.json();
        } catch (err) {
            console.warn('[CMS] Could not load ' + filename + ':', err.message);
            return null;
        }
    }

    /**
     * Icon SVG templates by name.
     */
    const SERVICE_ICONS = {
        monitor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
        search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>',
        performance: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
        default: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>'
    };

    /**
     * Load hero section content from CMS JSON.
     */
    async function loadHeroContent() {
        var data = await fetchContent('hero.json');
        if (!data) return;

        var eyebrow = document.querySelector('[data-cms="hero-eyebrow"]');
        if (eyebrow && data.eyebrow) eyebrow.textContent = data.eyebrow;

        var description = document.querySelector('[data-cms="hero-description"]');
        if (description && data.description) description.textContent = data.description;

        // Update stats
        if (data.stats && data.stats.length) {
            var statEls = document.querySelectorAll('.hero__stat');
            data.stats.forEach(function (stat, index) {
                if (statEls[index]) {
                    var numEl = statEls[index].querySelector('.hero__stat-number');
                    var labelEl = statEls[index].querySelector('.hero__stat-label');
                    if (numEl) {
                        numEl.setAttribute('data-count', stat.number);
                        if (stat.suffix) numEl.setAttribute('data-suffix', stat.suffix);
                        else numEl.removeAttribute('data-suffix');
                    }
                    if (labelEl) labelEl.textContent = stat.label;
                }
            });
        }
    }

    /**
     * Load services content from CMS JSON and render cards.
     */
    async function loadServicesContent() {
        var data = await fetchContent('services.json');
        if (!data || !data.items) return;

        var grid = document.getElementById('servicesGrid');
        if (!grid) return;

        grid.innerHTML = '';

        data.items.forEach(function (service, index) {
            var delayClass = index > 0 ? ' reveal--delay-' + index : '';
            var iconSvg = SERVICE_ICONS[service.icon] || SERVICE_ICONS.default;
            var featuresHtml = '';

            if (service.features && service.features.length) {
                featuresHtml = '<ul class="service-card__features">';
                service.features.forEach(function (feature) {
                    featuresHtml += '<li>' + escapeHtml(feature) + '</li>';
                });
                featuresHtml += '</ul>';
            }

            var card = document.createElement('article');
            card.className = 'service-card reveal' + delayClass;
            card.innerHTML =
                '<div class="service-card__icon">' + iconSvg + '</div>' +
                '<h3 class="service-card__title">' + escapeHtml(service.title) + '</h3>' +
                '<p class="service-card__text">' + escapeHtml(service.description) + '</p>' +
                featuresHtml;

            grid.appendChild(card);
        });

        // Re-observe new elements for scroll reveal
        reobserveReveals();
    }

    /**
     * Load testimonials content from CMS JSON and render cards.
     */
    async function loadTestimonialsContent() {
        var data = await fetchContent('testimonials.json');
        if (!data || !data.items) return;

        var grid = document.getElementById('testimonialsGrid');
        if (!grid) return;

        grid.innerHTML = '';

        data.items.forEach(function (testimonial, index) {
            var delayClass = index > 0 ? ' reveal--delay-' + index : '';
            var starsHtml = '';
            for (var i = 0; i < (testimonial.stars || 5); i++) {
                starsHtml += '★';
            }

            var card = document.createElement('article');
            card.className = 'testimonial-card reveal' + delayClass;
            card.innerHTML =
                '<div class="testimonial-card__stars">' + starsHtml + '</div>' +
                '<blockquote class="testimonial-card__quote">"' + escapeHtml(testimonial.quote) + '"</blockquote>' +
                '<div class="testimonial-card__author">' +
                '<div class="testimonial-card__avatar">' + escapeHtml(testimonial.initials) + '</div>' +
                '<div>' +
                '<div class="testimonial-card__name">' + escapeHtml(testimonial.name) + '</div>' +
                '<div class="testimonial-card__role">' + escapeHtml(testimonial.role) + '</div>' +
                '</div>' +
                '</div>';

            grid.appendChild(card);
        });

        reobserveReveals();
    }

    /**
     * Load settings and update footer / meta.
     */
    async function loadSettings() {
        var data = await fetchContent('settings.json');
        if (!data) return;

        var footerCopy = document.querySelector('.footer__copy');
        if (footerCopy && data.footer_text) footerCopy.textContent = data.footer_text;

        var emailLink = document.querySelector('.footer__link[href^="mailto:"]');
        if (emailLink && data.site_email) {
            emailLink.href = 'mailto:' + data.site_email;
            emailLink.textContent = data.site_email;
        }
    }

    /**
     * Escape HTML special characters.
     */
    function escapeHtml(text) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(text));
        return div.innerHTML;
    }

    /**
     * Re-observe newly added .reveal elements for the IntersectionObserver.
     */
    function reobserveReveals() {
        if (!window.__revealObserver) return;
        document.querySelectorAll('.reveal:not(.is-visible)').forEach(function (el) {
            window.__revealObserver.observe(el);
        });
    }

    /**
     * Initialize all CMS content loading.
     */
    function initCMS() {
        loadHeroContent();
        loadServicesContent();
        loadTestimonialsContent();
        loadSettings();
    }

    // Load CMS content on DOM ready
    initCMS();

    // ────────────────────────────────────────────
    // SCROLL-BASED NAV
    // ────────────────────────────────────────────
    var lastScroll = 0;
    function handleScroll() {
        var scrollY = window.scrollY;
        if (scrollY > 60) {
            nav.classList.add('is-scrolled');
        } else {
            nav.classList.remove('is-scrolled');
        }
        lastScroll = scrollY;
    }
    window.addEventListener('scroll', handleScroll, { passive: true });

    // ────────────────────────────────────────────
    // MOBILE NAV TOGGLE
    // ────────────────────────────────────────────
    function toggleMobileNav() {
        var isOpen = navLinks.classList.toggle('is-open');
        navToggle.classList.toggle('is-active', isOpen);
        navOverlay.classList.toggle('is-visible', isOpen);
        document.body.style.overflow = isOpen ? 'hidden' : '';
    }

    function closeMobileNav() {
        navLinks.classList.remove('is-open');
        navToggle.classList.remove('is-active');
        navOverlay.classList.remove('is-visible');
        document.body.style.overflow = '';
    }

    navToggle.addEventListener('click', toggleMobileNav);
    navOverlay.addEventListener('click', closeMobileNav);

    // Close on nav link click
    navLinks.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', closeMobileNav);
    });

    // ────────────────────────────────────────────
    // SMOOTH SCROLLING (for anchor links)
    // ────────────────────────────────────────────
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            var targetId = this.getAttribute('href');
            if (targetId === '#') return;
            var target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                var navHeight = nav.offsetHeight;
                var targetPos = target.getBoundingClientRect().top + window.scrollY - navHeight - 20;
                window.scrollTo({
                    top: targetPos,
                    behavior: 'smooth',
                });
            }
        });
    });

    // ────────────────────────────────────────────
    // INTERSECTION OBSERVER — REVEAL ON SCROLL
    // ────────────────────────────────────────────
    var revealElements = document.querySelectorAll('.reveal');

    if ('IntersectionObserver' in window) {
        var revealObserver = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        revealObserver.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.15,
                rootMargin: '0px 0px -40px 0px',
            }
        );

        revealElements.forEach(function (el) {
            revealObserver.observe(el);
        });

        // Store observer globally so CMS-loaded content can be re-observed
        window.__revealObserver = revealObserver;
    } else {
        // Fallback: show all immediately
        revealElements.forEach(function (el) {
            el.classList.add('is-visible');
        });
    }

    // ────────────────────────────────────────────
    // ANIMATED COUNTER — Hero Stats
    // ────────────────────────────────────────────
    var counters = document.querySelectorAll('[data-count]');

    function animateCounter(el) {
        var target = parseInt(el.getAttribute('data-count'), 10);
        var suffix = el.getAttribute('data-suffix') || '';
        var duration = 2000;
        var startTime = performance.now();

        function easeOutQuart(t) {
            return 1 - Math.pow(1 - t, 4);
        }

        function update(currentTime) {
            var elapsed = currentTime - startTime;
            var progress = Math.min(elapsed / duration, 1);
            var easedProgress = easeOutQuart(progress);
            var current = Math.floor(easedProgress * target);

            el.textContent = current + suffix;

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                el.textContent = target + suffix;
            }
        }

        requestAnimationFrame(update);
    }

    if ('IntersectionObserver' in window) {
        var counterObserver = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        animateCounter(entry.target);
                        counterObserver.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.5 }
        );

        counters.forEach(function (counter) {
            counterObserver.observe(counter);
        });
    } else {
        counters.forEach(function (el) {
            el.textContent = el.getAttribute('data-count') + (el.getAttribute('data-suffix') || '');
        });
    }

    // ────────────────────────────────────────────
    // CONTACT FORM HANDLING
    // ────────────────────────────────────────────
    contactForm.addEventListener('submit', function (e) {
        e.preventDefault();

        // Basic validation
        var name = document.getElementById('form-name');
        var email = document.getElementById('form-email');
        var message = document.getElementById('form-message');
        var isValid = true;

        [name, email, message].forEach(function (field) {
            if (!field.value.trim()) {
                field.style.borderColor = '#e05252';
                isValid = false;
            } else {
                field.style.borderColor = '';
            }
        });

        if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
            email.style.borderColor = '#e05252';
            isValid = false;
        }

        if (!isValid) return;

        // Show success state
        var formWrapper = contactForm.closest('.cta__form-wrapper');
        formWrapper.innerHTML =
            '<div class="form--success">' +
            '<div class="form--success__icon">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<polyline points="20 6 9 17 4 12"/>' +
            '</svg>' +
            '</div>' +
            '<h3 class="form--success__title">Bedankt voor uw aanvraag!</h3>' +
            '<p class="form--success__text">Ik neem binnen 24 uur contact met u op om een moment in te plannen voor uw vrijblijvende adviesgesprek.</p>' +
            '</div>';
    });

    // Clear error styling on input
    document.querySelectorAll('.form__input, .form__textarea').forEach(function (field) {
        field.addEventListener('input', function () {
            this.style.borderColor = '';
        });
    });

    // ────────────────────────────────────────────
    // INITIAL CHECK — run scroll handler
    // ────────────────────────────────────────────
    handleScroll();
})();
