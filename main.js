(function () {
  'use strict';

  var root = document.documentElement;
  var panels = Array.prototype.slice.call(document.querySelectorAll('.panel'));
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tabs a'));
  var oneScreen = window.matchMedia('(min-width: 900px) and (min-height: 600px)');
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)');
  var current = 0;

  // stagger order for the reveal of each panel
  panels.forEach(function (panel) {
    Array.prototype.forEach.call(panel.querySelectorAll('.r'), function (el, i) {
      el.style.setProperty('--i', i);
    });
  });

  function indexOf(id) {
    for (var i = 0; i < panels.length; i++) if (panels[i].id === id) return i;
    return -1;
  }

  function show(i, quiet) {
    if (i < 0 || i >= panels.length) return;
    current = i;
    panels.forEach(function (p, n) {
      var on = n === i;
      p.classList.toggle('is-active', on);
      if (oneScreen.matches) p.inert = !on; else p.inert = false;
    });
    tabs.forEach(function (t) {
      if (t.getAttribute('data-go') === panels[i].id) t.setAttribute('aria-current', 'true');
      else t.removeAttribute('aria-current');
    });
    if (!quiet && window.history && history.replaceState) {
      history.replaceState(null, '', i === 0 ? location.pathname : '#' + panels[i].id);
    }
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest ? e.target.closest('[data-go]') : null;
    if (!link || !oneScreen.matches) return;
    e.preventDefault();
    show(indexOf(link.getAttribute('data-go')));
  });

  var mark = document.querySelector('.mark');
  if (mark) mark.addEventListener('click', function (e) {
    if (!oneScreen.matches) return;
    e.preventDefault();
    show(0);
  });

  document.addEventListener('keydown', function (e) {
    if (typing) return;
    if (!oneScreen.matches || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { show(Math.min(current + 1, panels.length - 1)); e.preventDefault(); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { show(Math.max(current - 1, 0)); e.preventDefault(); }
    else if (/^[1-9]$/.test(e.key)) show(parseInt(e.key, 10) - 1);
  });

  function sync() { show(current, true); }
  if (oneScreen.addEventListener) oneScreen.addEventListener('change', sync);
  else if (oneScreen.addListener) oneScreen.addListener(sync);

  // ---------- typed headline ----------

  var typing = false;
  var finish = function () {};

  function type(h1) {
    var text = h1.textContent;
    var chars = [];
    h1.setAttribute('aria-label', text);
    h1.textContent = '';
    text.split(/(\s+)/).forEach(function (part) {
      if (!part) return;
      if (/^\s+$/.test(part)) { h1.appendChild(document.createTextNode(' ')); chars.push(null); return; }
      var word = document.createElement('span');
      word.setAttribute('aria-hidden', 'true');
      word.style.whiteSpace = 'nowrap';
      part.split('').forEach(function (c) {
        var s = document.createElement('span');
        s.className = 'ch';
        s.textContent = c;
        word.appendChild(s);
        chars.push(s);
      });
      h1.appendChild(word);
    });

    var caret = document.createElement('span');
    caret.className = 'caret';
    caret.setAttribute('aria-hidden', 'true');
    h1.insertBefore(caret, h1.firstChild);

    var i = 0, timer = null;
    typing = true;
    root.classList.add('typing');

    function place(after) {
      if (after.nextSibling) after.parentNode.insertBefore(caret, after.nextSibling);
      else after.parentNode.appendChild(caret);
    }

    function done() {
      if (!typing) return;
      typing = false;
      clearTimeout(timer);
      chars.forEach(function (s) { if (s) s.classList.add('on'); });
      var last = chars[chars.length - 1];
      if (last) place(last);
      root.classList.remove('typing');
      setTimeout(function () { caret.classList.add('out'); }, 1600);
      window.removeEventListener('keydown', skip, true);
      window.removeEventListener('pointerdown', skip, true);
    }

    function skip(e) {
      if (e.type === 'keydown' && (e.metaKey || e.ctrlKey || e.altKey || e.key === 'Tab')) return;
      done();
    }

    function step() {
      if (i >= chars.length) { timer = setTimeout(done, 420); return; }
      var s = chars[i++];
      var wait = 26 + Math.random() * 34;
      if (s) {
        s.classList.add('on');
        place(s);
        if (/[.,]/.test(s.textContent)) wait += 220;
      } else {
        wait += 18;
      }
      timer = setTimeout(step, wait);
    }

    finish = done;
    window.addEventListener('keydown', skip, true);
    window.addEventListener('pointerdown', skip, true);
    timer = setTimeout(step, 650);
  }

  var start = indexOf((location.hash || '').slice(1));
  var h1 = document.getElementById('headline');

  if (start > 0) {
    show(start, true);
  } else {
    show(0, true);
    if (h1 && oneScreen.matches && !calm.matches) type(h1);
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) finish();
  });
})();
