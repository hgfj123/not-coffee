/* not coffee: botanical intro for the QR links page (/hello).
   Plays once per visit, can be tapped away, and never plays for people who
   have "reduce motion" turned on. If anything goes wrong, the page simply shows. */
(function () {
  'use strict';
  var root = document.documentElement;
  var KEY = 'nc-hello-intro';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var seen = false;
  try { seen = sessionStorage.getItem(KEY) === '1'; } catch (e) {}
  if (reduce || seen || !document.body || !document.body.animate) return;
  try { sessionStorage.setItem(KEY, '1'); } catch (e) {}

  var BOTS = ['/assets/img/botanical-moroccan-mint.webp',
              '/assets/img/botanical-jasmine-rose.webp',
              '/assets/img/botanical-earl-grey-cardamom.webp'];

  root.classList.add('intro');
  var overlay = document.createElement('div');
  overlay.className = 'hello-intro';
  overlay.setAttribute('role', 'button');
  overlay.setAttribute('tabindex', '0');
  overlay.setAttribute('aria-label', 'Skip intro');
  var hint = document.createElement('div');
  hint.className = 'hello-intro-skip';
  hint.textContent = 'Tap to skip';
  overlay.appendChild(hint);
  document.body.appendChild(overlay);

  // Fill the screen with a loose grid of drawings, sized to the screen.
  var vw = window.innerWidth, vh = window.innerHeight;
  var size = Math.max(150, Math.min(vw * 0.46, 340));
  var cols = Math.ceil(vw / (size * 0.78)) + 1;
  var rows = Math.ceil(vh / (size * 0.62)) + 1;
  var seed = 7;
  function rand() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
  var items = [];
  for (var r = 0; r < rows; r++) {
    for (var c = 0; c < cols; c++) {
      var img = document.createElement('img');
      img.alt = '';
      img.src = BOTS[(r + c * 2) % 3];
      img.style.width = size + 'px';
      var x = (c / (cols - 1)) * (vw + size * 0.3) - size * 0.65 + (r % 2 ? size * 0.25 : 0);
      var y = (r / (rows - 1)) * (vh + size * 0.2) - size * 0.55;
      img.style.left = x + 'px';
      img.style.top = y + 'px';
      overlay.insertBefore(img, hint);
      items.push({ el: img, x: x + size / 2, rot: Math.round(rand() * 48 - 24), s: 0.9 + rand() * 0.25, i: items.length, row: r, col: c });
    }
  }

  var done = false, timers = [];
  function finish() {
    if (done) return;
    done = true;
    timers.forEach(clearTimeout);
    root.classList.remove('intro');
    root.classList.add('intro-done');
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }
  overlay.addEventListener('click', finish);
  overlay.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') { e.preventDefault(); finish(); } });
  timers.push(setTimeout(finish, 4500)); // safety net: never block the page

  function play() {
    if (done) return;
    var OUT_AT = 1050, OUT_FOR = 520;
    items.forEach(function (it) {
      var rot = 'rotate(' + it.rot + 'deg) scale(' + it.s.toFixed(2) + ')';
      var delay = (it.col % 3) * 60 + it.row * 40;
      var dir = it.x < vw / 2 ? -1 : 1;
      it.el.animate([
        { opacity: 0, transform: 'translateY(46px) ' + rot },
        { opacity: 1, transform: 'translateY(0px) ' + rot, offset: 0.45 },
        { opacity: 1, transform: 'translateY(-26px) ' + rot }
      ], { duration: Math.max(300, OUT_AT - delay + 120), delay: delay, easing: 'ease-out', fill: 'both' });
      it.el.animate([
        { opacity: 1, transform: 'translate(0,-26px) ' + rot },
        { opacity: 0, transform: 'translate(' + (dir * 140) + '%, -70px) ' + rot }
      ], { duration: OUT_FOR, delay: OUT_AT + (it.col % 2 ? 40 : 0), easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' });
    });
    overlay.animate([{ backgroundColor: 'rgba(239,238,234,1)' }, { backgroundColor: 'rgba(239,238,234,0)' }],
      { duration: OUT_FOR, delay: OUT_AT + 80, easing: 'ease-in', fill: 'both' });
    hint.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, delay: OUT_AT, fill: 'both' });
    timers.push(setTimeout(function () { root.classList.remove('intro'); root.classList.add('intro-done'); }, OUT_AT + 160));
    timers.push(setTimeout(finish, OUT_AT + OUT_FOR + 200));
  }

  // Start once the three drawings are ready; if they're slow, skip the intro.
  var pending = BOTS.length;
  var waited = setTimeout(finish, 900);
  BOTS.forEach(function (src) {
    var im = new Image();
    im.onload = im.onerror = function () { if (--pending === 0) { clearTimeout(waited); play(); } };
    im.src = src;
  });
})();
