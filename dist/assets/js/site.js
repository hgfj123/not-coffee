/* not coffee — site behavior. No dependencies.
   Products come from /assets/js/products.js (generated from src/data/products.json).
   Checkout is a placeholder until Shopify is connected: see CHECKOUT_URL below. */
(function () {
  'use strict';
  document.documentElement.classList.remove('no-js');

  var CHECKOUT_URL = null; // e.g. Shopify cart permalink base, set at launch
  var STORE_KEY = 'nc-bag-v1';
  var DATA = window.NC_PRODUCTS || { products: {}, currency: 'USD' };
  // Base URL of the site, worked out from this script's own address (works at any folder depth).
  var BASE = (document.currentScript && document.currentScript.src || '').replace(/assets\/js\/site\.js.*$/, '');
  var SHOP_HREF = (document.querySelector('.nav a') || { getAttribute: function () { return '/shop'; } }).getAttribute('href');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function money(n) {
    try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: DATA.currency || 'USD' }).format(n); }
    catch (e) { return '$' + n.toFixed(2); }
  }

  /* ---------- storage (fails quietly) ---------- */
  function load() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch (e) { return []; } }
  function save(b) { try { localStorage.setItem(STORE_KEY, JSON.stringify(b)); } catch (e) {} }
  var bag = load().filter(function (l) { return DATA.products[l.id]; });

  /* ---------- body lock for overlays ---------- */
  var lastFocus = null;
  function lock(on) { document.body.classList.toggle('locked', on); }

  /* ---------- mobile nav ---------- */
  var mnav = $('#mobile-nav');
  $$('[data-open-menu]').forEach(function (b) {
    b.addEventListener('click', function () {
      lastFocus = b; mnav.classList.add('open'); mnav.setAttribute('aria-hidden', 'false'); lock(true);
      var f = $('[data-close-menu]', mnav); if (f) f.focus();
    });
  });
  $$('[data-close-menu]').forEach(function (b) {
    b.addEventListener('click', closeMenu);
  });
  function closeMenu() {
    if (!mnav || !mnav.classList.contains('open')) return;
    mnav.classList.remove('open'); mnav.setAttribute('aria-hidden', 'true'); lock(false);
    if (lastFocus) lastFocus.focus();
  }

  /* ---------- bag drawer ---------- */
  var drawer = $('#bag'), scrim = $('#scrim');
  function openBag(trigger) {
    lastFocus = trigger || document.activeElement;
    render(); drawer.classList.add('open'); scrim.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false'); lock(true);
    var c = $('[data-close-bag]', drawer); if (c) c.focus();
  }
  function closeBag() {
    if (!drawer.classList.contains('open')) return;
    drawer.classList.remove('open'); scrim.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true'); lock(false);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  $$('[data-open-bag]').forEach(function (b) { b.addEventListener('click', function () { openBag(b); }); });
  $$('[data-close-bag]').forEach(function (b) { b.addEventListener('click', closeBag); });
  if (scrim) scrim.addEventListener('click', closeBag);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeBag(); closeMenu(); }
  });

  function count() { return bag.reduce(function (n, l) { return n + l.qty; }, 0); }
  function updateCount() {
    var n = count();
    $$('[data-bag-count]').forEach(function (el) { el.textContent = n; el.hidden = n === 0; });
    $$('[data-open-bag]').forEach(function (b) { b.setAttribute('aria-label', 'Bag, ' + n + (n === 1 ? ' item' : ' items')); });
  }

  function add(id, qty) {
    var line = bag.filter(function (l) { return l.id === id; })[0];
    if (line) line.qty = Math.min(line.qty + qty, 50); else bag.push({ id: id, qty: qty });
    save(bag); updateCount(); toast('Added to your bag');
  }
  function setQty(id, qty) {
    bag = bag.map(function (l) { return l.id === id ? { id: id, qty: qty } : l; }).filter(function (l) { return l.qty > 0; });
    save(bag); updateCount(); render();
  }

  function render() {
    var body = $('#bag-body'), foot = $('#bag-foot');
    if (!body) return;
    body.textContent = '';
    if (!bag.length) {
      body.innerHTML = '<div class="drawer-empty"><p class="serif" style="font-size:28px">Your bag is empty.</p><a class="btn btn-sm" href="' + SHOP_HREF + '">Shop the lineup</a></div>';
      foot.hidden = true; return;
    }
    foot.hidden = false;
    var allPriced = true, total = 0;
    bag.forEach(function (l) {
      var p = DATA.products[l.id];
      if (p.price == null) allPriced = false; else total += p.price * l.qty;
      var row = document.createElement('div'); row.className = 'line';
      row.innerHTML =
        '<div class="line-media"><img src="' + BASE + p.thumb + '" alt=""></div>' +
        '<div><div class="line-name"></div><div class="line-meta"></div>' +
        '<div class="line-qty"><button type="button" aria-label="Decrease">−</button><output aria-live="polite"></output><button type="button" aria-label="Increase">+</button></div></div>' +
        '<div style="text-align:right"><div class="line-price" style="font-size:15px"></div><button type="button" class="line-remove">Remove</button></div>';
      $('.line-name', row).textContent = p.name;
      $('.line-meta', row).textContent = p.pack;
      $('output', row).textContent = l.qty;
      $('.line-price', row).textContent = p.price == null ? '' : money(p.price * l.qty);
      var btns = $$('.line-qty button', row);
      btns[0].addEventListener('click', function () { setQty(l.id, l.qty - 1); });
      btns[1].addEventListener('click', function () { setQty(l.id, Math.min(l.qty + 1, 50)); });
      $('.line-remove', row).addEventListener('click', function () { setQty(l.id, 0); });
      body.appendChild(row);
    });
    $('#bag-total').textContent = allPriced ? money(total) : 'Price coming soon';
    var co = $('#checkout');
    co.disabled = !CHECKOUT_URL || !allPriced;
    $('#checkout-note').textContent = co.disabled ? 'Online checkout opens at launch.' : 'Shipping and taxes calculated at checkout.';
  }
  var co = $('#checkout');
  if (co) co.addEventListener('click', function () { if (CHECKOUT_URL) window.location.href = CHECKOUT_URL; });

  /* ---------- toast ---------- */
  var toastEl = $('#toast'), toastT;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 2200);
  }

  /* ---------- product page: quantity + add ---------- */
  $$('[data-buy]').forEach(function (box) {
    var out = $('output', box), q = 1;
    $('[data-dec]', box).addEventListener('click', function () { q = Math.max(1, q - 1); out.textContent = q; });
    $('[data-inc]', box).addEventListener('click', function () { q = Math.min(24, q + 1); out.textContent = q; });
    $('[data-add]', box).addEventListener('click', function (e) { add(box.getAttribute('data-buy'), q); openBag(e.currentTarget); });
  });

  /* ---------- tabs ---------- */
  $$('[role="tablist"]').forEach(function (list) {
    var tabs = $$('[role="tab"]', list);
    function select(t) {
      tabs.forEach(function (x) {
        var on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1;
        $('#' + x.getAttribute('aria-controls')).hidden = !on;
      });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null;
        if (j === null) return;
        e.preventDefault(); var n = tabs[(j + tabs.length) % tabs.length]; select(n); n.focus();
      });
    });
  });

  /* ---------- shop filters ---------- */
  var filterBtns = $$('[data-filter]');
  filterBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var f = b.getAttribute('data-filter');
      filterBtns.forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      $$('[data-kind]').forEach(function (t) { t.hidden = !(f === 'all' || t.getAttribute('data-kind') === f); });
    });
  });

  /* ---------- forms: compose an email until a form service is connected ---------- */
  $$('form[data-mailto]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var lines = $$('input, select, textarea', form).filter(function (el) { return el.name; }).map(function (el) {
        return (el.getAttribute('data-label') || el.name) + ': ' + el.value;
      });
      var subject = form.getAttribute('data-subject') || 'Hello from the website';
      window.location.href = 'mailto:' + form.getAttribute('data-mailto') + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lines.join('\n'));
      var note = $('.form-note', form); if (note) note.textContent = 'Opening your email app. If nothing happens, write to ' + form.getAttribute('data-mailto') + '.';
    });
  });

  /* ---------- reveal on scroll ---------- */
  var rev = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    rev.forEach(function (el) { io.observe(el); });
  } else { rev.forEach(function (el) { el.classList.add('in'); }); }

  updateCount();
})();
