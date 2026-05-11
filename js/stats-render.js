// CF colo IATA 代码 → 中文城市/国家。覆盖常见节点；未命中显示原始 colo + "未知"。
// 参考 CF 数据中心列表：https://www.cloudflarestatus.com/
const COLO_MAP = {
  // 北美
  LAX: { city: '洛杉矶', country: '美国' },     SFO: { city: '旧金山', country: '美国' },
  SJC: { city: '圣何塞', country: '美国' },     SEA: { city: '西雅图', country: '美国' },
  PDX: { city: '波特兰', country: '美国' },     DEN: { city: '丹佛', country: '美国' },
  ORD: { city: '芝加哥', country: '美国' },     DFW: { city: '达拉斯', country: '美国' },
  IAH: { city: '休斯顿', country: '美国' },     ATL: { city: '亚特兰大', country: '美国' },
  IAD: { city: '阿什本', country: '美国' },     EWR: { city: '纽约', country: '美国' },
  BOS: { city: '波士顿', country: '美国' },     MIA: { city: '迈阿密', country: '美国' },
  YYZ: { city: '多伦多', country: '加拿大' },   YVR: { city: '温哥华', country: '加拿大' },
  MEX: { city: '墨西哥城', country: '墨西哥' }, GRU: { city: '圣保罗', country: '巴西' },
  // 欧洲
  LHR: { city: '伦敦', country: '英国' },       MAN: { city: '曼彻斯特', country: '英国' },
  DUB: { city: '都柏林', country: '爱尔兰' },   AMS: { city: '阿姆斯特丹', country: '荷兰' },
  FRA: { city: '法兰克福', country: '德国' },   MUC: { city: '慕尼黑', country: '德国' },
  HAM: { city: '汉堡', country: '德国' },       CDG: { city: '巴黎', country: '法国' },
  MAD: { city: '马德里', country: '西班牙' },   BCN: { city: '巴塞罗那', country: '西班牙' },
  MXP: { city: '米兰', country: '意大利' },     FCO: { city: '罗马', country: '意大利' },
  ARN: { city: '斯德哥尔摩', country: '瑞典' }, CPH: { city: '哥本哈根', country: '丹麦' },
  OSL: { city: '奥斯陆', country: '挪威' },     HEL: { city: '赫尔辛基', country: '芬兰' },
  WAW: { city: '华沙', country: '波兰' },       PRG: { city: '布拉格', country: '捷克' },
  VIE: { city: '维也纳', country: '奥地利' },   ZRH: { city: '苏黎世', country: '瑞士' },
  IST: { city: '伊斯坦布尔', country: '土耳其' },
  // 亚洲
  HKG: { city: '香港', country: '中国' },       TPE: { city: '台北', country: '中国台湾' },
  NRT: { city: '东京', country: '日本' },       HND: { city: '东京', country: '日本' },
  KIX: { city: '大阪', country: '日本' },       ICN: { city: '首尔', country: '韩国' },
  SIN: { city: '新加坡', country: '新加坡' },   KUL: { city: '吉隆坡', country: '马来西亚' },
  CGK: { city: '雅加达', country: '印度尼西亚' }, BKK: { city: '曼谷', country: '泰国' },
  SGN: { city: '胡志明', country: '越南' },     HAN: { city: '河内', country: '越南' },
  BOM: { city: '孟买', country: '印度' },       DEL: { city: '德里', country: '印度' },
  BLR: { city: '班加罗尔', country: '印度' },   MAA: { city: '钦奈', country: '印度' },
  // 中东 / 非洲 / 大洋洲
  DXB: { city: '迪拜', country: '阿联酋' },     DOH: { city: '多哈', country: '卡塔尔' },
  JNB: { city: '约翰内斯堡', country: '南非' }, CPT: { city: '开普敦', country: '南非' },
  LOS: { city: '拉各斯', country: '尼日利亚' }, NBO: { city: '内罗毕', country: '肯尼亚' },
  CAI: { city: '开罗', country: '埃及' },       SYD: { city: '悉尼', country: '澳大利亚' },
  MEL: { city: '墨尔本', country: '澳大利亚' }, AKL: { city: '奥克兰', country: '新西兰' },
};

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

  // 数据源切换：CF 模式下 JSON 带 _source: 'cloudflare'，
  // 替换两处 GoatCounter 时代措辞：底部归属 + meta 行的"刷新策略"说明。
  if (data._source === 'cloudflare') {
    const attr = root.querySelector('#stats-attribution');
    if (attr) attr.textContent = '数据由 Cloudflare Web Analytics 提供 · 无 cookies / 无追踪';

    const refresh = root.querySelector('[data-bind="refreshNote"]');
    if (refresh) refresh.textContent = '每 60 秒自动刷新';
  }

  // 服务节点信息：每次请求实时注入（不进缓存），来自 request.cf.colo。
  // IP 用 CF 为本域名广播的 Anycast IP（全球共用，路由到最近 colo）。
  renderServerInfo(data._server);

  function renderServerInfo(server) {
    if (!server || !server.colo) return;
    const info = COLO_MAP[server.colo] || { city: server.colo, country: '未知' };
    setBind('serverIp', '172.67.180.210 (Anycast)');
    setBind('serverCity', `${info.city} (${server.colo})`);
    setBind('serverCountry', info.country);
  }

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
