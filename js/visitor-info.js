(function () {
  const root = document.getElementById('visitor-info');
  if (!root) return;

  const ipEl = root.querySelector('.visitor-ip');
  const locEl = root.querySelector('.visitor-location');
  const ispEl = root.querySelector('.visitor-isp');

  // 两个源都走 HTTPS + CORS，在技术博客场景下足够稳定。
  // 迁移 CF Pages 后，在最前面插入自建 Workers endpoint 即可。
  const sources = [
    {
      name: 'ipinfo.io',
      url: 'https://ipinfo.io/json',
      parse: d => {
        if (!d || !d.ip) return null;
        // ipinfo 的 org 格式是 "AS4134 China Telecom"，去掉 ASN 前缀
        const isp = (d.org || '').replace(/^AS\d+\s+/, '');
        return {
          ip: d.ip,
          location: [d.country, d.region, d.city].filter(Boolean).join(' '),
          isp
        };
      }
    },
    {
      name: 'ipwho.is',
      url: 'https://ipwho.is/',
      parse: d => {
        if (!d || d.success === false) return null;
        const conn = d.connection || {};
        return {
          ip: d.ip,
          location: [d.country, d.region, d.city].filter(Boolean).join(' '),
          isp: conn.isp || conn.org || ''
        };
      }
    }
  ];

  (async () => {
    for (const src of sources) {
      try {
        const r = await fetch(src.url, { cache: 'no-store' });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const info = src.parse(await r.json());
        if (info && info.ip) {
          ipEl.textContent = info.ip;
          locEl.textContent = info.location || '未知地区';
          ispEl.textContent = info.isp || '';
          root.style.display = '';
          return;
        }
        throw new Error('empty payload');
      } catch (e) {
        console.warn('[visitor-info]', src.name, 'failed:', e.message);
      }
    }
    console.warn('[visitor-info] all sources failed; hiding widget');
  })();
})();
