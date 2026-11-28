// 広い画面（パソコンのブラウザ）では、左に目次を出し、本文をその右に置く。
// 目次は各ページの h2 から作り、日本語と英語（h1#en より後ろ）に分けて並べる。
// 狭い画面では目次を隠すので、これまでどおり 1 列で読める（script が動かなくても読める）。
(function () {
  var wrap = document.querySelector('.wrap');
  if (!wrap) return;

  // 本文を <main> にまとめ、その前に目次の欄を置く
  var main = document.createElement('main');
  while (wrap.firstChild) main.appendChild(wrap.firstChild);
  var aside = document.createElement('aside');
  aside.className = 'toc';
  aside.setAttribute('aria-label', '目次 / Contents');
  wrap.appendChild(aside);
  wrap.appendChild(main);
  wrap.classList.add('has-toc');

  var enStart = document.getElementById('en');
  var groups = [{ label: '日本語', lang: 'ja', target: 'top', items: [] },
                { label: 'English', lang: 'en', target: 'en', items: [] }];
  var heads = main.querySelectorAll('h2');
  var n = 0;
  heads.forEach(function (h) {
    if (!h.id) h.id = 'sec-' + (++n);
    var isEn = enStart && (enStart.compareDocumentPosition(h) & Node.DOCUMENT_POSITION_FOLLOWING);
    groups[isEn ? 1 : 0].items.push(h);
  });
  if (!document.getElementById('top')) {
    var first = main.querySelector('header') || main.firstElementChild;
    if (first) first.id = 'top';
  }

  // 節の中の h3 は、その節を読んでいる間だけ目次に開く（よくある質問は問いが長いので開かない）
  function subheads(h) {
    var out = [], el = h.nextElementSibling;
    if (/^support/.test(h.id)) return out;
    for (; el && el.tagName !== 'H2' && el.tagName !== 'H1' && el.tagName !== 'HR'; el = el.nextElementSibling) {
      if (el.tagName === 'H3') out.push(el);
    }
    return out;
  }
  function label(h) { return h.textContent.replace(/\s+/g, ' ').trim(); }

  var links = [];
  groups.forEach(function (g) {
    if (!g.items.length) return;
    var title = document.createElement('a');
    title.className = 'toc-lang';
    title.href = '#' + g.target;
    title.lang = g.lang;
    title.textContent = g.label;
    aside.appendChild(title);
    var ul = document.createElement('ul');
    ul.lang = g.lang;
    g.items.forEach(function (h) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + h.id;
      // 見出しの中の画像（ボタンのアイコン）は目次に入れない
      a.textContent = label(h);
      li.appendChild(a);
      links.push({ a: a, h: h, li: li });
      var subs = subheads(h);
      if (subs.length) {
        var sub = document.createElement('ul');
        sub.className = 'sub';
        subs.forEach(function (h3) {
          if (!h3.id) h3.id = h.id + '-' + (sub.children.length + 1);
          var sli = document.createElement('li');
          var sa = document.createElement('a');
          sa.href = '#' + h3.id;
          sa.textContent = label(h3);
          sli.appendChild(sa);
          sub.appendChild(sli);
          links.push({ a: sa, h: h3, li: li });
        });
        li.appendChild(sub);
      }
      ul.appendChild(li);
    });
    aside.appendChild(ul);
  });

  // いま読んでいる節を目次で示す
  var current = null;
  function update() {
    var y = 120, hit = null;
    for (var i = 0; i < links.length; i++) {
      if (links[i].h.getBoundingClientRect().top <= y) hit = links[i]; else break;
    }
    if (hit === current) return;
    if (current) { current.a.classList.remove('on'); current.li.classList.remove('open'); }
    current = hit;
    if (current) {
      current.a.classList.add('on');
      current.li.classList.add('open');
      // 目次そのものが縦に長いときは、示した項目が見える所まで目次を送る
      var r = current.a.getBoundingClientRect(), ar = aside.getBoundingClientRect();
      if (r.top < ar.top + 40) aside.scrollTop -= (ar.top + 40 - r.top);
      else if (r.bottom > ar.bottom - 40) aside.scrollTop += (r.bottom - ar.bottom + 40);
    }
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; update(); });
  }, { passive: true });
  update();
})();
