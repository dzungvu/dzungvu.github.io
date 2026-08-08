/**
 * Portfolio v2 — theme, navigation, scroll behaviour and small conveniences.
 * No dependencies; every feature degrades gracefully if its element is absent.
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- Experience figures -------------------------------------------------
     Derived from start dates so the page never goes stale, matching the
     calculations used on the classic site. */
  function updateYears() {
    var now = new Date().getFullYear();
    var values = {
      total: now - 2017.5,
      android: (now - 2019) + 0.5,
      lead: (now - 2022) + 0.5
    };
    document.querySelectorAll('[data-years]').forEach(function (el) {
      var value = values[el.dataset.years];
      if (value !== undefined) el.textContent = value;
    });
  }

  /* --- Theme -------------------------------------------------------------- */
  function initTheme() {
    var toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    toggle.addEventListener('click', function () {
      var next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      localStorage.setItem('theme', next);
      track('theme_change', next);
    });
  }

  /* --- Mobile menu -------------------------------------------------------- */
  function initMenu() {
    var toggle = document.getElementById('nav-toggle');
    var links = document.getElementById('nav-links');
    if (!toggle || !links) return;

    function close() {
      links.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }

    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });

    links.addEventListener('click', function (event) {
      if (event.target.closest('a')) close();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') close();
    });
  }

  /* --- Sticky header, active section, back-to-top ------------------------- */
  function initScroll() {
    var nav = document.getElementById('nav');
    var toTop = document.getElementById('to-top');
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav__links a'));
    var sections = links
      .map(function (link) { return document.querySelector(link.getAttribute('href')); })
      .filter(Boolean);

    function onScroll() {
      var y = window.scrollY;
      if (nav) nav.classList.toggle('is-stuck', y > 8);
      if (toTop) toTop.classList.toggle('is-shown', y > 600);

      // The section whose top has most recently passed the header wins.
      var activeIndex = -1;
      sections.forEach(function (section, index) {
        if (section.getBoundingClientRect().top <= 120) activeIndex = index;
      });
      links.forEach(function (link, index) {
        link.classList.toggle('is-active', index === activeIndex);
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (toTop) {
      toTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    }
  }

  /* --- Reveal on scroll --------------------------------------------------- */
  function initReveal() {
    var items = document.querySelectorAll('.reveal');

    // Show everything outright when the animation can't be trusted to run:
    // no observer support, a reduced-motion preference, or a viewport with no
    // height (embedded frames), where nothing would ever intersect.
    if (!('IntersectionObserver' in window) || reduceMotion || !window.innerHeight) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    items.forEach(function (el, index) {
      // Stagger siblings slightly so grids cascade instead of popping at once.
      el.style.transitionDelay = (index % 4) * 60 + 'ms';
      observer.observe(el);
    });
  }

  /* --- Lightbox ----------------------------------------------------------- */
  function initLightbox() {
    var box = document.getElementById('lightbox');
    var img = document.getElementById('lightbox-img');
    var close = document.getElementById('lightbox-close');
    if (!box || !img) return;

    var lastFocused = null;

    function open(src, alt) {
      lastFocused = document.activeElement;
      img.src = src;
      img.alt = alt || '';
      box.hidden = false;
      document.body.style.overflow = 'hidden';
      if (close) close.focus();
    }

    function hide() {
      box.hidden = true;
      img.src = '';
      document.body.style.overflow = '';
      if (lastFocused) lastFocused.focus();
    }

    document.querySelectorAll('[data-lightbox]').forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        var inner = trigger.querySelector('img');
        open(trigger.dataset.lightbox, inner ? inner.alt : trigger.getAttribute('aria-label'));
      });
    });

    if (close) close.addEventListener('click', hide);
    box.addEventListener('click', function (event) {
      if (event.target === box) hide();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !box.hidden) hide();
    });
  }

  /* --- Copy to clipboard -------------------------------------------------- */
  function initCopy() {
    document.querySelectorAll('[data-copy]').forEach(function (button) {
      button.addEventListener('click', function () {
        var text = button.dataset.copy;
        if (!navigator.clipboard) {
          toast('Copy failed — ' + text);
          return;
        }
        navigator.clipboard.writeText(text).then(
          function () { toast('Copied ' + text); track('copy_email', text); },
          function () { toast('Copy failed — ' + text); }
        );
      });
    });
  }

  var toastTimer;
  function toast(message) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-shown'); }, 2400);
  }

  /* --- Analytics ---------------------------------------------------------- */
  function track(action, label) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', action, { event_category: 'v2', event_label: label });
  }

  function initTracking() {
    document.querySelectorAll('.nav__links a').forEach(function (link) {
      link.addEventListener('click', function () {
        track('nav_click', link.getAttribute('href').replace('#', ''));
      });
    });

    var cv = document.getElementById('cv-download');
    if (cv) cv.addEventListener('click', function () { track('download', 'cv'); });
  }

  /* --- Boot --------------------------------------------------------------- */
  function init() {
    var year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();

    updateYears();
    initTheme();
    initMenu();
    initScroll();
    initReveal();
    initLightbox();
    initCopy();
    initTracking();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
