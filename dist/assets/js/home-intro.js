/* not coffee: botanical opening for the homepage.
   Plays the first time someone visits, can be tapped away, and never plays for
   people with "reduce motion" turned on. A small check in the page <head> decides
   whether to play (class "intro-home" on <html>); if anything fails, the page shows. */
(function () {
  'use strict';
  var root = document.documentElement;
  if (!root.classList.contains('intro-home')) return;
  if (!document.body || !document.body.animate) { root.classList.remove('intro-home'); return; }
  try { localStorage.setItem('nc-home-intro', '1'); } catch (e) {}

  var BOTS = ['/assets/img/botanical-moroccan-mint.webp',
              '/assets/img/botanical-jasmine-rose.webp',
              '/assets/img/botanical-earl-grey-cardamom.webp'];
  var phone = window.innerWidth < 700;
  // Hand-placed bouquet framing the wordmark: x, y in % of the screen, w in % of width, r rotation.
  var LAYOUT = phone ? [
    { b: 1, x: -10, y: 6,  w: 52, r: -16 }, { b: 0, x: 58, y: 4,  w: 50, r: 18 },
    { b: 2, x: -14, y: 60, w: 52, r: 12 },  { b: 1, x: 60, y: 62, w: 50, r: -14 },
    { b: 0, x: 22,  y: 76, w: 40, r: -24 }, { b: 2, x: 30, y: -10, w: 40, r: 170 }
  ] : [
    { b: 1, x: 8,  y: 6,  w: 18, r: -18 }, { b: 0, x: 74, y: 4,  w: 17, r: 20 },
    { b: 2, x: 2,  y: 52, w: 17, r: 12 },  { b: 1, x: 80, y: 50, w: 17, r: -14 },
    { b: 0, x: 28, y: 64, w: 14, r: -26 }, { b: 2, x: 58, y: 66, w: 14, r: 24 },
    { b: 2, x: 34, y: -6, w: 12, r: 160 }, { b: 0, x: 54, y: -8, w: 12, r: -170 }
  ];

  var overlay = document.createElement('div');
  overlay.className = 'home-intro';
  overlay.setAttribute('role', 'button');
  overlay.setAttribute('tabindex', '0');
  overlay.setAttribute('aria-label', 'Skip intro');
  var bots = LAYOUT.map(function (p, i) {
    var img = document.createElement('img');
    img.alt = ''; img.src = BOTS[p.b]; img.className = 'hi-bot';
    img.style.left = p.x + '%'; img.style.top = p.y + '%'; img.style.width = p.w + '%';
    overlay.appendChild(img);
    return { el: img, p: p, i: i };
  });
  var mark = document.createElement('div');
  mark.className = 'hi-mark';
  mark.innerHTML = '<div class="wordmark hi-wm"><span>not</span><span>coffee</span></div>' +
                   '<div class="hi-rule"></div><div class="hi-sub">Real Tea. Real Brew.</div>';
  overlay.appendChild(mark);
  var skip = document.createElement('div');
  skip.className = 'hi-skip'; skip.textContent = 'Tap to skip';
  overlay.appendChild(skip);
  document.body.appendChild(overlay);

  root.classList.add('intro');          // hide hero copy and cans until the reveal
  root.classList.remove('intro-home');  // the overlay now covers the page

  var done = false, timers = [];
  function reveal() {
    root.classList.remove('intro');
    root.classList.add('intro-done');
  }
  function finish() {
    if (done) return;
    done = true;
    timers.forEach(clearTimeout);
    reveal();
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }
  overlay.addEventListener('click', finish);
  overlay.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') { e.preventDefault(); finish(); }
  });
  timers.push(setTimeout(finish, 5000)); // safety net: never block the page

  function anim(el, frames, opts) { return el.animate(frames, Object.assign({ fill: 'both' }, opts)); }

  function play() {
    if (done) return;
    var soft = 'cubic-bezier(.22,.8,.24,1)', OPEN = 1450, OUT = 700;
    bots.forEach(function (b) {
      var rot = 'rotate(' + b.p.r + 'deg)', d = 80 + b.i * 85;
      anim(b.el, [
        { opacity: 0, transform: rot + ' scale(.55) translateY(18px)', filter: 'blur(6px)' },
        { opacity: 1, transform: rot + ' scale(1.02) translateY(0)', filter: 'blur(0)', offset: 0.75 },
        { opacity: 1, transform: rot + ' scale(1) translateY(0)', filter: 'blur(0)' }
      ], { duration: 900, delay: d, easing: soft });
      anim(b.el, [{ translate: '0 0' }, { translate: '0 -6px' }, { translate: '0 0' }],
        { duration: 1600, delay: d + 700, easing: 'ease-in-out', fill: 'none' });
      var cx = b.p.x + b.p.w / 2, dx = cx < 50 ? -1 : 1, dy = b.p.y < 40 ? -1 : 1;
      anim(b.el, [
        { opacity: 1, transform: rot + ' scale(1)' },
        { opacity: 0, transform: 'translate(' + (dx * 30) + '%,' + (dy * 18) + '%) ' + rot + ' scale(1.12)' }
      ], { duration: OUT, delay: OPEN, easing: 'cubic-bezier(.55,0,.7,.3)', fill: 'forwards' });
    });
    var wm = mark.querySelector('.hi-wm'), rule = mark.querySelector('.hi-rule'), sub = mark.querySelector('.hi-sub');
    anim(wm, [{ opacity: 0, letterSpacing: '.04em', filter: 'blur(4px)' }, { opacity: 1, letterSpacing: '-.03em', filter: 'blur(0)' }],
      { duration: 700, delay: 380, easing: soft });
    anim(rule, [{ width: '0px' }, { width: '120px' }], { duration: 600, delay: 700, easing: soft });
    anim(sub, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 500, delay: 820, easing: soft });
    [wm, rule, sub].forEach(function (el) {
      anim(el, [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-14px)' }],
        { duration: 420, delay: OPEN - 40, easing: 'ease-in', fill: 'forwards' });
    });
    anim(skip, [{ opacity: 0.8 }, { opacity: 0 }], { duration: 240, delay: OPEN - 100 });
    anim(overlay, [{ backgroundColor: 'rgba(239,238,234,1)' }, { backgroundColor: 'rgba(239,238,234,0)' }],
      { duration: OUT, delay: OPEN + 120, easing: 'ease-in-out' });
    timers.push(setTimeout(reveal, OPEN + 220));
    timers.push(setTimeout(finish, OPEN + OUT + 260));
  }

  // Start once the drawings are ready; if they're slow, skip the opening.
  var pending = BOTS.length;
  var waited = setTimeout(finish, 1200);
  BOTS.forEach(function (src) {
    var im = new Image();
    im.onload = im.onerror = function () { if (--pending === 0) { clearTimeout(waited); play(); } };
    im.src = src;
  });
})();
