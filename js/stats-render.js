(async function () {
  const root = document.getElementById('stats-root');
  const loading = document.getElementById('stats-loading');
  const tpl = document.getElementById('stats-tpl');
  if (!root || !tpl) return;

  const fmtNum = n => (n == null ? '--' : Number(n).toLocaleString('zh-CN'));
  const fail = (msg) => { loading.textContent = msg; };

  let data;
  try {
    const r = await fetch('/data/stats.json', { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    data = await r.json();
  } catch (e) {
    return fail('数据加载失败：' + e.message);
  }

  if (!data.fetchedAt) {
    return fail('数据未生成。运行 `npm run fetch-stats` 拉取（需要 GOATCOUNTER_TOKEN 环境变量）');
  }

  // Wait for Chart.js to load (script tag is defer, may not be ready yet)
  while (typeof Chart === 'undefined') {
    await new Promise(r => setTimeout(r, 50));
  }

  // Render template
  loading.remove();
  root.appendChild(tpl.content.cloneNode(true));

  // Summary
  const total = data.total || {};
  setBind('total', fmtNum(total.total));
  setBind('totalUtc', fmtNum(total.total_utc));
  setBind('fetchedAt', new Date(data.fetchedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));

  // 30-day trend chart
  renderTrend(data.trend);

  // Locations bar chart
  renderLocations(data.locations);

  // Top pages
  renderList('hits', (data.hits && data.hits.hits) || [], h => ({
    name: h.title || h.path_id || h.path,
    href: h.path,
    count: h.count
  }));

  // Top refs
  renderList('refs', (data.refs && data.refs.stats) || [], r => ({
    name: r.name || '(直接访问)',
    href: null,
    count: r.count
  }));

  function setBind(key, val) {
    const el = root.querySelector(`[data-bind="${key}"]`);
    if (el) el.textContent = val;
  }

  function renderList(key, items, mapFn) {
    const ol = root.querySelector(`[data-list="${key}"]`);
    if (!ol) return;
    if (!items.length) {
      ol.innerHTML = '<li class="stats-empty" style="border:none">暂无数据</li>';
      return;
    }
    ol.innerHTML = items.map((item, i) => {
      const m = mapFn(item);
      const nameHtml = m.href
        ? `<a href="${m.href}">${escapeHTML(m.name)}</a>`
        : escapeHTML(m.name);
      return `<li><span class="rank">${i + 1}</span><span class="name">${nameHtml}</span><span class="count">${fmtNum(m.count)}</span></li>`;
    }).join('');
  }

  function renderTrend(trendData) {
    const ctx = document.getElementById('trend-chart');
    if (!ctx) return;
    // GoatCounter /stats/total returns { stats: [{ day: "YYYY-MM-DD", daily: N, hourly: [...] }, ...] }
    const stats = (trendData && trendData.stats) || [];
    const labels = stats.map(s => (s.day || '').slice(5)); // MM-DD
    const values = stats.map(s => s.daily || 0);
    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: values,
          borderColor: '#4a89dc',
          backgroundColor: 'rgba(74,137,220,.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 2,
          borderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } },
          x: { ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 10 } }
        }
      }
    });
  }

  function renderLocations(locData) {
    const ctx = document.getElementById('locations-chart');
    if (!ctx) return;
    const stats = (locData && locData.stats) || [];
    if (!stats.length) {
      ctx.parentElement.innerHTML = '<div class="stats-empty" style="background:none">暂无数据</div>';
      return;
    }
    const labels = stats.map(s => s.name || s.id || '?');
    const values = stats.map(s => s.count || 0);
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: '#5fbe7d',
          borderWidth: 0,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    });
  }

  function escapeHTML(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }
})();
