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
     * Update an element's text content.
     */
    function updateElementText(selector, text) {
        var el = document.querySelector(selector);
        if (el && text !== undefined) el.textContent = text;
    }

    /**
     * Update an element's inner HTML (use with caution).
     */
    function updateElementHTML(selector, html) {
        var el = document.querySelector(selector);
        if (el && html !== undefined) el.innerHTML = html;
    }

    /**
     * Load hero section content.
     */
    async function loadHeroContent() {
        var data = await fetchContent('hero.json');
        if (!data) return;

        updateElementText('[data-cms="hero-eyebrow"]', data.eyebrow);
        updateElementHTML('[data-cms="hero-title"]', data.title);
        updateElementText('[data-cms="hero-description"]', data.description);
        updateElementText('[data-cms="hero-cta-primary"]', data.cta_primary_text);
        updateElementText('[data-cms="hero-cta-secondary"]', data.cta_secondary_text);

        if (data.stats && data.stats.length) {
            var statsGrid = document.getElementById('heroStats');
            if (statsGrid) {
                statsGrid.innerHTML = '';
                data.stats.forEach(function (stat) {
                    var div = document.createElement('div');
                    div.className = 'hero__stat';
                    div.innerHTML =
                        '<div class="hero__stat-number" data-count="' + stat.number + '"' +
                        (stat.suffix ? ' data-suffix="' + stat.suffix + '"' : '') + '>0</div>' +
                        '<div class="hero__stat-label">' + escapeHtml(stat.label) + '</div>';
                    statsGrid.appendChild(div);
                });
                // Initialize counters for new elements
                document.querySelectorAll('[data-count]').forEach(observeCounter);
            }
        }
    }

    /**
     * Load problem section content.
     */
    async function loadProblemContent() {
        var data = await fetchContent('problem.json');
        if (!data) return;

        updateElementText('[data-cms="problem-label"]', data.section_label);
        updateElementHTML('[data-cms="problem-title"]', data.section_title);
        updateElementText('[data-cms="problem-description"]', data.section_subtitle);

        if (data.list_items) {
            var list = document.getElementById('problemList');
            if (list) {
                list.innerHTML = '';
                data.list_items.forEach(function (item) {
                    var li = document.createElement('li');
                    li.innerHTML = item; // Allow HTML for bolding numbers
                    list.appendChild(li);
                });
            }
        }

        if (data.stats) {
            var statsContainer = document.getElementById('problemStats');
            if (statsContainer) {
                var html = '<div class="problem__card">';
                data.stats.forEach(function (stat) {
                    var typeClass = stat.type === 'positive' ? 'problem__stat-value--positive' : 'problem__stat-value--negative';
                    html +=
                        '<div class="problem__stat-row">' +
                        '<span class="problem__stat-label">' + escapeHtml(stat.label) + '</span>' +
                        '<span class="problem__stat-value ' + typeClass + '">' + escapeHtml(stat.value) + '</span>' +
                        '</div>';
                });
                html += '</div>';
                statsContainer.innerHTML = html;
            }
        }
    }

    /**
     * Load services content.
     */
    async function loadServicesContent() {
        var data = await fetchContent('services.json');
        if (!data) return;

        updateElementText('[data-cms="services-label"]', data.section_label);
        updateElementHTML('[data-cms="services-title"]', data.section_title);
        updateElementText('[data-cms="services-description"]', data.section_subtitle);

        if (!data.items) return;
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

        reobserveReveals();
    }

    /**
     * Load testimonials content.
     */
    async function loadTestimonialsContent() {
        var data = await fetchContent('testimonials.json');
        if (!data) return;

        updateElementText('[data-cms="testimonials-label"]', data.section_label);
        updateElementHTML('[data-cms="testimonials-title"]', data.section_title);
        updateElementText('[data-cms="testimonials-description"]', data.section_subtitle);

        if (!data.items) return;
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
     * Load CTA content.
     */
    async function loadCTAContent() {
        var data = await fetchContent('cta.json');
        if (!data) return;

        updateElementText('[data-cms="cta-label"]', data.section_label);
        updateElementHTML('[data-cms="cta-title"]', data.section_title);
        updateElementText('[data-cms="cta-description"]', data.section_subtitle);
        updateElementText('[data-cms="form-title"]', data.form_title);
        updateElementText('[data-cms="form-description"]', data.form_subtitle);
        updateElementText('[data-cms="form-submit-text"]', data.form_submit_text);

        if (data.benefits) {
            var list = document.getElementById('ctaBenefits');
            if (list) {
                list.innerHTML = '';
                data.benefits.forEach(function (benefit) {
                    var li = document.createElement('li');
                    li.innerHTML =
                        '<svg viewBox="0 0 20 20" fill="none" aria-hidden="true">' +
                        '<path d="M16.667 5L7.5 14.167 3.333 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />' +
                        '</svg>' + escapeHtml(benefit);
                    list.appendChild(li);
                });
            }
        }
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

        if (data.site_name) {
            document.title = data.site_name + ' — ' + (data.site_description ? data.site_description.substring(0, 50) : 'Webdesign');
        }
    }

    /**
     * Escape HTML special characters.
     */
    function escapeHtml(text) {
        if (!text) return '';
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

    // ────────────────────────────────────────────
    // ANIMATED COUNTER — Hero Stats
    // ────────────────────────────────────────────
    var counterObserver = null;

    function animateCounter(el) {
        var targetText = el.getAttribute('data-count');
        if (!targetText) return;

        var target = parseInt(targetText, 10);
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

    function observeCounter(el) {
        if (counterObserver) {
            counterObserver.observe(el);
        } else {
            // Fallback if no IntersectionObserver
            el.textContent = el.getAttribute('data-count') + (el.getAttribute('data-suffix') || '');
        }
    }

    if ('IntersectionObserver' in window) {
        counterObserver = new IntersectionObserver(
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
    }

    /**
     * Initialize all CMS content loading.
     */
    function initCMS() {
        loadSettings();
        loadHeroContent();
        loadProblemContent();
        loadServicesContent();
        loadTestimonialsContent();
        loadCTAContent();
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
