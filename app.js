const STORAGE_KEY = 'aegis-v3';

const DEFAULT_DATA = {
  holdings: [
    {
      code: 'FPS',
      name: 'フォージェント・パワー・ソリューションズ',
      price: 39.44,
      buy: 33.4615,
      shares: 45,
      rsi: 50,
      volume: 1,
      history: [39.44, 39.44, 39.44, 39.44, 39.44, 39.44, 39.44]
    },
    {
      code: 'FRVO',
      name: 'ファーボ・エナジー',
      price: 16.91,
      buy: 16.5842,
      shares: 14,
      rsi: 50,
      volume: 1,
      history: [16.91, 16.91, 16.91, 16.91, 16.91, 16.91, 16.91]
    },
    {
      code: 'LYNX',
      name: 'リントリス',
      price: 13.69,
      buy: 13.557,
      shares: 10,
      rsi: 50,
      volume: 1,
      history: [13.69, 13.69, 13.69, 13.69, 13.69, 13.69, 13.69]
    }
  ]
};

const WATCH = [
  ['FPS', 'Forgent Power Solutions', '電力・AIインフラ'],
  ['FRVO', 'Fervo Energy', '次世代地熱'],
  ['LYNX', 'Lyntris', '防衛・先端技術'],
  ['ELMT', 'Elmet Group', '重要鉱物'],
  ['SPCX', 'SpaceX', '宇宙'],
  ['SPIR', 'Spire Global', '宇宙データ'],
  ['ITG', 'ITG', '成長株'],
  ['CSQR', 'CSQR', '成長株'],
  ['XTIA', 'XTI Aerospace', 'ドローン・航空'],
  ['RKLB', 'Rocket Lab', '宇宙'],
  ['NVDA', 'NVIDIA', 'AI・半導体'],
  ['TSLA', 'Tesla', 'AI・ロボティクス'],
  ['AAPL', 'Apple', 'テクノロジー']
];

let state = load();

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved && Array.isArray(saved.holdings) ? saved : clone(DEFAULT_DATA);
  } catch (error) {
    return clone(DEFAULT_DATA);
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function usd(value) {
  const number = Number(value) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(number);
}

function safeHistory(p) {
  const list = Array.isArray(p.history)
    ? p.history.map(Number).filter(Number.isFinite)
    : [];
  if (list.length >= 2) return list;
  const price = Number(p.price) || 0;
  return [price, price];
}

function signal(p) {
  if (!p) {
    return { score: 0, label: '中立', trend: 0, gap: 0, cls: 'neutral' };
  }

  let score = 0;
  const price = Number(p.price) || 0;
  const buy = Number(p.buy) || 0;
  const history = safeHistory(p);
  const first = history[0] || price || 1;
  const last = history.at(-1) || price;
  const gap = buy > 0 ? (price / buy - 1) * 100 : 0;
  const trend = first > 0 ? (last / first - 1) * 100 : 0;
  const rsi = Number(p.rsi) || 50;
  const volume = Number(p.volume) || 1;

  if (gap < -12) score += 2;
  else if (gap < -4) score += 1;
  else if (gap > 20) score -= 2;
  else if (gap > 10) score -= 1;

  if (trend > 4) score += 2;
  else if (trend > 1) score += 1;
  else if (trend < -4) score -= 2;
  else if (trend < -1) score -= 1;

  if (rsi < 30) score += 2;
  else if (rsi < 45) score += 1;
  else if (rsi > 75) score -= 2;
  else if (rsi > 65) score -= 1;

  if (volume >= 1.5) score += 1;
  else if (volume < 0.7) score -= 1;

  const label = score >= 4
    ? '強い買い'
    : score >= 2
      ? '買い'
      : score <= -4
        ? '強い売り'
        : score <= -2
          ? '売り'
          : '中立';

  const cls = label === '強い買い'
    ? 'strong-buy'
    : label === '買い'
      ? 'buy'
      : label === '強い売り'
        ? 'strong-sell'
        : label === '売り'
          ? 'sell'
          : 'neutral';

  return { score, label, trend, gap, cls };
}

function setText(id, text) {
  const element = document.getElementById(id);
  if (element) element.textContent = text;
}

function render() {
  let asset = 0;
  let cost = 0;
  let buyCount = 0;
  const cards = document.getElementById('portfolioCards');
  const tbody = document.getElementById('portfolioBody');
  const ai = document.getElementById('aiCards');

  if (!cards || !tbody || !ai) return;
  cards.innerHTML = '';
  tbody.innerHTML = '';
  ai.innerHTML = '';

  state.holdings.forEach((p) => {
    const sig = signal(p);
    const price = Number(p.price) || 0;
    const buy = Number(p.buy) || 0;
    const shares = Number(p.shares) || 0;
    const profit = (price - buy) * shares;
    const rate = buy > 0 ? (price / buy - 1) * 100 : 0;

    asset += price * shares;
    cost += buy * shares;
    if (sig.label.includes('買い')) buyCount += 1;

    cards.insertAdjacentHTML('beforeend', `
      <div class="portfolio-card">
        <div>
          <strong>${p.name}</strong>
          <div class="ticker">${p.code}・${shares}株</div>
        </div>
        <div>
          <strong>${usd(price)}</strong>
          <div class="${profit >= 0 ? 'positive' : 'negative'}">${usd(profit)}</div>
        </div>
      </div>
    `);

    tbody.insertAdjacentHTML('beforeend', `
      <tr>
        <td><strong>${p.name}</strong><div class="ticker">${p.code}</div></td>
        <td>${usd(price)}</td>
        <td class="${rate >= 0 ? 'positive' : 'negative'}">${rate.toFixed(1)}%</td>
        <td><span class="signal-badge ${sig.cls}">${sig.label}</span></td>
      </tr>
    `);

    ai.insertAdjacentHTML('beforeend', `
      <article class="card ai-card">
        <div class="section-title-row">
          <div><h3>${p.name}</h3><span class="ticker">${p.code}</span></div>
          <span class="signal-badge ${sig.cls}">${sig.label}</span>
        </div>
        <div class="scorebar">
          <div style="width:${Math.max(5, Math.min(95, (sig.score + 6) / 12 * 100))}%"></div>
        </div>
        <p class="body-copy">7日トレンド ${sig.trend.toFixed(1)}%／RSI ${Number(p.rsi) || 50}／出来高 ${(Number(p.volume) || 1).toFixed(2)}倍</p>
      </article>
    `);
  });

  const profit = asset - cost;
  setText('assetValue', usd(asset));
  const profitElement = document.getElementById('assetProfit');
  if (profitElement) {
    profitElement.textContent = `評価損益 ${usd(profit)}`;
    profitElement.className = `asset-sub ${profit >= 0 ? 'positive' : 'negative'}`;
  }
  setText('holdingCount', state.holdings.length);
  setText('buyCount', buyCount);
  setText('updatedAt', '端末保存データ・米ドル表示');

  renderFeatured();
  renderMainSignal();
  renderWatch();
  renderForms();
}

function renderMainSignal() {
  if (!state.holdings.length) {
    setText('mainSignal', '未登録');
    setText('signalTitle', '銘柄を登録してください');
    setText('signalReason', '設定画面から保有銘柄を追加できます。');
    return;
  }

  const ranked = state.holdings
    .map((p) => ({ p, s: signal(p) }))
    .sort((a, b) => b.s.score - a.s.score);
  const top = ranked[0];
  const ring = document.getElementById('mainSignal');
  if (ring) {
    ring.textContent = top.s.label;
    ring.className = `signal-ring ${top.s.cls}`;
  }
  setText('signalTitle', `${top.p.name}を重点確認`);
  setText('signalReason', `7日トレンド ${top.s.trend.toFixed(1)}%、RSI ${Number(top.p.rsi) || 50}、出来高 ${(Number(top.p.volume) || 1).toFixed(2)}倍。`);
}

function renderFeatured() {
  const p = state.holdings.find((holding) => holding.code === 'FPS') || state.holdings[0];
  if (!p) return;

  const s = signal(p);
  const price = Number(p.price) || 0;
  const buy = Number(p.buy) || 0;
  const shares = Number(p.shares) || 0;
  const profit = (price - buy) * shares;
  const rate = buy > 0 ? (price / buy - 1) * 100 : 0;

  ['acslPrice', 'acslDetailPrice'].forEach((id) => setText(id, usd(price)));
  setText('acslProfit', usd(profit));
  const profitElement = document.getElementById('acslProfit');
  if (profitElement) profitElement.className = profit >= 0 ? 'positive' : 'negative';
  setText('acslRsi', Number(p.rsi) || 50);
  setText('acslDetailRsi', Number(p.rsi) || 50);
  setText('acslDetailRate', `${rate.toFixed(1)}%`);
  const rateElement = document.getElementById('acslDetailRate');
  if (rateElement) rateElement.className = rate >= 0 ? 'positive' : 'negative';
  setText('acslVolume', `${(Number(p.volume) || 1).toFixed(2)}倍`);

  ['acslBadge', 'acslDetailSignal'].forEach((id) => {
    const element = document.getElementById(id);
    if (!element) return;
    element.textContent = s.label;
    element.className = `badge ${s.cls}`;
  });

  const marker = document.getElementById('acslMarker');
  if (marker) {
    const min = buy > 0 ? buy * 0.7 : price * 0.7;
    const max = buy > 0 ? buy * 1.5 : price * 1.5;
    marker.style.left = `${Math.max(0, Math.min(100, (price - min) / (max - min) * 100))}%`;
  }

  drawChart(p);
}

function renderWatch() {
  const element = document.getElementById('watchList');
  if (!element) return;
  element.innerHTML = '';
  WATCH.forEach(([code, name, theme]) => {
    const owned = state.holdings.find((p) => p.code === code);
    const sig = owned ? signal(owned) : { label: '監視', cls: 'neutral' };
    element.insertAdjacentHTML('beforeend', `
      <div class="signal-item">
        <div><strong>${name}</strong><p>${code}・${theme}</p></div>
        <span class="signal-badge ${sig.cls}">${sig.label}</span>
      </div>
    `);
  });
}

function renderForms() {
  const element = document.getElementById('assetForms');
  if (!element) return;
  element.innerHTML = '';

  state.holdings.forEach((p, index) => {
    element.insertAdjacentHTML('beforeend', `
      <div class="asset-form">
        <div class="section-title-row">
          <h3>${p.name}（${p.code}）</h3>
          <button type="button" class="delete-holding" data-delete-index="${index}">削除</button>
        </div>
        <div class="form-grid">
          <label>ティッカー<input data-i="${index}" data-k="code" value="${p.code}"></label>
          <label>銘柄名<input data-i="${index}" data-k="name" value="${p.name}"></label>
          <label>現在値（ドル）<input data-i="${index}" data-k="price" type="number" step="0.0001" value="${p.price}"></label>
          <label>取得価格（ドル）<input data-i="${index}" data-k="buy" type="number" step="0.0001" value="${p.buy}"></label>
          <label>株数<input data-i="${index}" data-k="shares" type="number" step="1" value="${p.shares}"></label>
          <label>RSI<input data-i="${index}" data-k="rsi" type="number" min="0" max="100" value="${p.rsi}"></label>
          <label>出来高倍率<input data-i="${index}" data-k="volume" type="number" step="0.01" value="${p.volume}"></label>
          <label>7日価格（カンマ区切り）<input data-i="${index}" data-k="history" value="${safeHistory(p).join(',')}"></label>
        </div>
      </div>
    `);
  });

  element.insertAdjacentHTML('beforeend', `
    <button type="button" id="addHolding" class="aegis-add-button">＋ 保有銘柄を追加</button>
  `);

  document.querySelectorAll('.delete-holding').forEach((button) => {
    button.onclick = () => {
      const index = Number(button.dataset.deleteIndex);
      if (!Number.isInteger(index)) return;
      if (confirm(`${state.holdings[index].name}を削除しますか？`)) {
        state.holdings.splice(index, 1);
        save();
        render();
      }
    };
  });

  const addButton = document.getElementById('addHolding');
  if (addButton) {
    addButton.onclick = () => {
      state.holdings.push({
        code: 'NEW',
        name: '新しい銘柄',
        price: 0,
        buy: 0,
        shares: 0,
        rsi: 50,
        volume: 1,
        history: [0, 0, 0, 0, 0, 0, 0]
      });
      save();
      render();
    };
  }
}

function drawChart(p) {
  const canvas = document.getElementById('priceChart');
  if (!canvas || !p) return;
  const ctx = canvas.getContext('2d');
  const data = safeHistory(p);
  const buy = Number(p.buy) || Number(p.price) || 0;
  const ratio = devicePixelRatio || 1;
  const width = canvas.clientWidth || 600;
  const height = 280;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const pad = 34;
  let min = Math.min(...data, buy);
  let max = Math.max(...data, buy);
  if (min === max) {
    min *= 0.97;
    max *= 1.03;
    if (min === max) max = min + 1;
  } else {
    min *= 0.97;
    max *= 1.03;
  }

  for (let i = 0; i < 5; i += 1) {
    const y = pad + (height - pad * 2) * i / 4;
    ctx.strokeStyle = 'rgba(143,167,189,.18)';
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(width - pad, y);
    ctx.stroke();
  }

  const xy = (value, index) => [
    pad + (width - pad * 2) * index / Math.max(1, data.length - 1),
    height - pad - (value - min) / (max - min) * (height - pad * 2)
  ];

  ctx.strokeStyle = '#38d5ff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  data.forEach((value, index) => {
    const [x, y] = xy(value, index);
    if (index) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  });
  ctx.stroke();

  const buyY = xy(buy, 0)[1];
  ctx.strokeStyle = '#f1c46c';
  ctx.setLineDash([7, 6]);
  ctx.beginPath();
  ctx.moveTo(pad, buyY);
  ctx.lineTo(width - pad, buyY);
  ctx.stroke();
  ctx.setLineDash([]);
}

function nav(id) {
  document.querySelectorAll('.page').forEach((page) => {
    page.classList.toggle('active', page.id === id);
  });
  document.querySelectorAll('.bottom-nav button').forEach((button) => {
    button.classList.toggle('active', button.dataset.page === id);
  });
  scrollTo({ top: 0, behavior: 'smooth' });
  if (id === 'acsl') setTimeout(renderFeatured, 50);
}

function installSmallStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .delete-holding{border:1px solid #ff6b6b;color:#ff8a8a;background:transparent;border-radius:10px;padding:7px 12px;font-weight:700}
    .aegis-add-button{width:100%;margin:14px 0 24px;padding:15px;border:1px solid #38d5ff;border-radius:14px;background:rgba(56,213,255,.08);color:#38d5ff;font-weight:800;font-size:16px}
  `;
  document.head.appendChild(style);
}

function replaceLegacyLabels() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    node.nodeValue = node.nodeValue
      .replaceAll('ACSL', 'FPS')
      .replaceAll('日本株', '米国株');
  });
}

document.addEventListener('click', (event) => {
  const id = event.target.dataset.page;
  if (id) nav(id);
});

const saveButton = document.getElementById('saveAssets');
if (saveButton) {
  saveButton.onclick = () => {
    document.querySelectorAll('#assetForms input').forEach((input) => {
      const p = state.holdings[Number(input.dataset.i)];
      const key = input.dataset.k;
      if (!p || !key) return;
      if (key === 'history') {
        p[key] = input.value.split(',').map(Number).filter(Number.isFinite);
      } else if (key === 'code') {
        p[key] = input.value.trim().toUpperCase();
      } else if (key === 'name') {
        p[key] = input.value.trim();
      } else {
        p[key] = Number(input.value);
      }
    });
    save();
    render();
    nav('home');
    alert('保存しました');
  };
}

const resetButton = document.getElementById('resetData');
if (resetButton) {
  resetButton.onclick = () => {
    if (confirm('入力内容を初期値に戻しますか？')) {
      state = clone(DEFAULT_DATA);
      save();
      render();
    }
  };
}

const recalcButton = document.getElementById('recalcButton');
if (recalcButton) {
  recalcButton.onclick = () => {
    render();
    alert('入力データからAI判定を再計算しました');
  };
}

const tradingViewButton = document.getElementById('openTradingView');
if (tradingViewButton) {
  tradingViewButton.onclick = () => {
    const ticker = state.holdings.find((p) => p.code === 'FPS')?.code || state.holdings[0]?.code || 'FPS';
    window.open(`https://www.tradingview.com/symbols/NASDAQ-${ticker}/`, '_blank');
  };
}

function clock() {
  setText('clock', new Date().toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit'
  }));
}

installSmallStyles();
replaceLegacyLabels();
window.addEventListener('resize', renderFeatured);
render();
clock();
setInterval(clock, 30000);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
