const portfolio = [
  {code:'590A',name:'ギフティグループ',price:1418,buy:1320,shares:100,signal:'買い'},
  {code:'6232',name:'ACSL',price:1762,buy:1885,shares:100,signal:'中立'},
  {code:'2315',name:'カイカデジタル',price:66,buy:61,shares:200,signal:'買い'}
];
const watch = [
  ['さくらインターネット','買い','上昇トレンドを維持'],['テラスカイ','中立','方向感を確認'],['AI inside','中立','出来高待ち'],['HEROZ','売り','短期弱含み'],['SAPEET','買い','テーマ性を監視'],['Kudan','中立','値動きが大きい'],['アクセルスペースHD','買い','宇宙関連材料を監視']
];
const chartData={
  ACSL:[1710,1745,1732,1780,1810,1778,1762],
  GIFTY:[1340,1368,1390,1372,1410,1432,1418],
  CAICA:[59,61,60,63,65,64,66]
};
const chartBuy={ACSL:1885,GIFTY:1320,CAICA:61};
function yen(n){return new Intl.NumberFormat('ja-JP',{style:'currency',currency:'JPY',maximumFractionDigits:0}).format(n)}
function renderPortfolio(){
 let asset=0,cost=0,buyCount=0; const body=document.getElementById('portfolioBody'); body.innerHTML='';
 portfolio.forEach(p=>{const value=p.price*p.shares, base=p.buy*p.shares, profit=value-base, rate=profit/base*100; asset+=value; cost+=base;if(p.signal==='買い')buyCount++;
 const cls=profit>=0?'positive':'negative'; const sig=p.signal==='買い'?'buy':p.signal==='売り'?'sell':'neutral';
 body.insertAdjacentHTML('beforeend',`<tr><td><strong>${p.name}</strong><div class="ticker">${p.code}</div></td><td>${yen(p.price)}</td><td>${yen(p.buy)}</td><td>${p.shares}</td><td class="${cls}">${yen(profit)}<div>${rate.toFixed(1)}%</div></td><td><span class="signal-badge ${sig}">${p.signal}</span></td></tr>`)});
 document.getElementById('assetValue').textContent=yen(asset); const profit=asset-cost; const el=document.getElementById('assetProfit'); el.textContent=`評価損益 ${yen(profit)}`;el.className='asset-sub '+(profit>=0?'positive':'negative');document.getElementById('buyCount').textContent=buyCount;
 const acsl=portfolio.find(p=>p.code==='6232'); const rate=(acsl.price/acsl.buy-1)*100;document.getElementById('acslPrice').textContent=yen(acsl.price);document.getElementById('acslRate').textContent=`${rate.toFixed(1)}%`;document.getElementById('acslRate').className=rate>=0?'positive':'negative';document.getElementById('acslMeter').style.width=Math.max(5,Math.min(100,(acsl.price-1600)/(2300-1600)*100))+'%';
}
function renderSignals(){const list=document.getElementById('signalList');watch.forEach(([name,sig,reason])=>{const cls=sig==='買い'?'buy':sig==='売り'?'sell':'neutral';list.insertAdjacentHTML('beforeend',`<div class="signal-item"><div><strong>${name}</strong><p>${reason}</p></div><span class="signal-badge ${cls}">${sig}</span></div>`)})}
function drawChart(key='ACSL'){const c=document.getElementById('priceChart'),ctx=c.getContext('2d'),d=chartData[key],buy=chartBuy[key];const ratio=devicePixelRatio||1;const w=c.clientWidth,h=300;c.width=w*ratio;c.height=h*ratio;ctx.scale(ratio,ratio);ctx.clearRect(0,0,w,h);const pad=34,min=Math.min(...d,buy)*.97,max=Math.max(...d,buy)*1.03;ctx.strokeStyle='rgba(143,167,189,.18)';ctx.lineWidth=1;for(let i=0;i<5;i++){let y=pad+(h-pad*2)*i/4;ctx.beginPath();ctx.moveTo(pad,y);ctx.lineTo(w-pad,y);ctx.stroke()}const xy=(v,i)=>[pad+(w-pad*2)*i/(d.length-1),h-pad-(v-min)/(max-min)*(h-pad*2)];ctx.strokeStyle='#39d5ff';ctx.lineWidth=3;ctx.beginPath();d.forEach((v,i)=>{const [x,y]=xy(v,i);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();ctx.fillStyle='#39d5ff';d.forEach((v,i)=>{const [x,y]=xy(v,i);ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill()});const y=xy(buy,0)[1];ctx.strokeStyle='#ffbd4a';ctx.setLineDash([7,6]);ctx.beginPath();ctx.moveTo(pad,y);ctx.lineTo(w-pad,y);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#8fa7bd';ctx.font='11px sans-serif';ctx.fillText(yen(d[d.length-1]),w-95,22);}
function updateClock(){document.getElementById('clock').textContent=new Date().toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'})}
document.getElementById('chartSelect').addEventListener('change',e=>drawChart(e.target.value));document.getElementById('refreshButton').addEventListener('click',()=>{portfolio.forEach(p=>p.price=Math.max(1,Math.round(p.price*(1+(Math.random()-.5)*.025))));renderPortfolio();drawChart(document.getElementById('chartSelect').value)});window.addEventListener('resize',()=>drawChart(document.getElementById('chartSelect').value));
renderPortfolio();renderSignals();drawChart();updateClock();setInterval(updateClock,30000);
if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js').catch(()=>{})}
