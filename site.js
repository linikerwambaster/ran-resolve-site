// Ran Resolve v2: WhatsApp com mensagem pronta e dividido entre os DOIS números (cada visitante cai sempre no mesmo),
// diz de onde a pessoa veio (Google, Instagram ou site), revelar ao rolar e cookies (Google e Meta só depois do "Aceitar").
(function () {
  var C = window.RAN || {};
  var local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  var nums = C.wpps || [];

  // número da vez: sorteado uma vez por visitante, para não lotar um WhatsApp só
  var idx = 0;
  try { idx = Number(localStorage.getItem('ran-wpp')); if (!(idx >= 0 && idx < nums.length)) { idx = Math.floor(Math.random() * nums.length); localStorage.setItem('ran-wpp', idx); } }
  catch (e) { idx = Math.floor(Math.random() * nums.length); }

  var q = new URLSearchParams(location.search), fonte = (q.get('utm_source') || '').toLowerCase(), ref = document.referrer || '';
  var origem = (q.get('gclid') || q.get('gbraid') || q.get('wbraid') || /google/.test(fonte) || /\/\/(www\.)?google\./.test(ref)) ? 'pelo Google'
    : (q.get('fbclid') || /(facebook|instagram|meta|^ig$|^fb$)/.test(fonte) || /(facebook|instagram)\.com/.test(ref)) ? 'pelo Instagram' : '';
  try { if (origem) sessionStorage.setItem('ran-origem', origem); else origem = sessionStorage.getItem('ran-origem') || 'pelo site'; }
  catch (e) { origem = origem || 'pelo site'; }

  function linkZap(caso, n) {
    var msg = 'Olá! Vi a Ran Resolve ' + origem + (caso ? '. ' + caso : ' e quero um orçamento.');
    return 'https://wa.me/' + (n || nums[idx]) + '?text=' + encodeURIComponent(msg);
  }
  document.querySelectorAll('.wz').forEach(function (a) {
    a.href = linkZap(a.getAttribute('data-caso'), a.getAttribute('data-num'));
    a.addEventListener('click', function () { evento(a.getAttribute('data-caso') || 'geral'); });
  });

  // palavra gigante do topo: ocupa a largura toda do título, em qualquer tela
  function encaixa() {
    document.querySelectorAll('[data-encaixa]').forEach(function (el) {
      el.style.fontSize = '';
      var larg = el.parentElement.clientWidth, atual = parseFloat(getComputedStyle(el).fontSize), w = el.getBoundingClientRect().width;
      if (w > 0 && larg > 0) el.style.fontSize = Math.min(250, atual * larg / w * 0.99) + 'px';
    });
  }
  encaixa();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(encaixa);
  var t; addEventListener('resize', function () { clearTimeout(t); t = setTimeout(encaixa, 120); });

  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: 0.12 });
  document.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });

  // ---------- cookies e medição (LGPD)
  var CHAVE = 'ran-cookies', aviso = document.getElementById('cookies');
  function ler() { try { return localStorage.getItem(CHAVE); } catch (e) { return null; } }
  function gravar(v) { try { localStorage.setItem(CHAVE, v); } catch (e) {} }
  function mostrar(on) { aviso.classList.toggle('on', on); document.body.classList.toggle('com-aviso', on); }
  var medindo = false;
  function ligaMedicao() {
    if (medindo) return; medindo = true;
    if (local) { console.log('[ran] medição ligada (localhost: não envia)'); return; }
    if (C.googleTag) {
      var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + C.googleTag; document.head.appendChild(s);
      window.dataLayer = window.dataLayer || []; window.gtag = function () { dataLayer.push(arguments); };
      gtag('js', new Date()); gtag('config', C.googleTag);
    }
    if (C.metaPixel) {
      !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v;
        s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', C.metaPixel); fbq('track', 'PageView');
    }
  }
  function evento(caso) {
    if (!medindo) return;
    if (local) { console.log('[ran] clique no WhatsApp:', caso, origem); return; }
    if (window.gtag) { gtag('event', 'generate_lead', { method: 'whatsapp', caso: caso }); if (C.googleConversao) gtag('event', 'conversion', { send_to: C.googleConversao }); }
    if (window.fbq) fbq('track', 'Contact', { content_name: caso });
  }
  var escolha = ler();
  if (escolha === 'aceito') ligaMedicao(); else if (escolha !== 'recusado') mostrar(true);
  document.getElementById('ck-sim').onclick = function () { gravar('aceito'); mostrar(false); ligaMedicao(); };
  document.getElementById('ck-nao').onclick = function () {
    gravar('recusado'); mostrar(false);
    if (window.fbq) fbq('consent', 'revoke');
    ['_fbp', '_fbc', '_ga', '_gcl_au'].forEach(function (n) { document.cookie = n + '=; Max-Age=0; path=/'; });
  };
  document.querySelectorAll('[data-cookies]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); mostrar(true); }); });

  // mapa do Google Maps (seção "Onde fica"): carrega sozinho perto da tela; se a pessoa recusou os cookies, só no toque
  var mapa = document.getElementById('mapa');
  function abreMapa() {
    if (!mapa || mapa.getAttribute('data-on')) return;
    mapa.setAttribute('data-on', '1');
    var f = document.createElement('iframe');
    f.src = mapa.getAttribute('data-src'); f.title = 'Mapa: Ran Resolve Emplacadora no Google Maps';
    f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade'; f.allowFullscreen = true;
    mapa.appendChild(f); mapa.classList.add('on');
  }
  if (mapa) {
    var bm = mapa.querySelector('[data-mapa]'); if (bm) bm.addEventListener('click', abreMapa);
    if (ler() !== 'recusado') {
      if ('IntersectionObserver' in window) {
        var om = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { abreMapa(); om.disconnect(); } }, { rootMargin: '400px' });
        om.observe(mapa);
      } else abreMapa();
    }
  }
})();
