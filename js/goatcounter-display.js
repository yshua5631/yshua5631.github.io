(function () {
  const root = document.getElementById('visitor-stats');
  if (!root) return;

  const siteEl = root.querySelector('#gc-site-total');
  const pageEl = root.querySelector('#gc-page-views');
  const base = 'https://yshua5631.goatcounter.com/counter';

  // GoatCounter 公开计数 API。需要在后台 Settings 中开启
  // "Allow displaying visitor counts on your website"。
  // 返回示例：{"count": "1,234"}
  const fetchCount = async (path) => {
    const url = `${base}/${encodeURIComponent(path)}.json`;
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    return (data.count || '0').toString();
  };

  (async () => {
    let any = false;
    try {
      siteEl.textContent = await fetchCount('TOTAL');
      any = true;
    } catch (e) {
      console.warn('[goatcounter] site total failed:', e.message);
    }
    try {
      pageEl.textContent = await fetchCount(location.pathname);
      any = true;
    } catch (e) {
      console.warn('[goatcounter] page count failed:', e.message);
    }
    if (any) root.style.display = '';
  })();
})();
