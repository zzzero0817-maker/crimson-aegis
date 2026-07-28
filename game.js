const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const waveEl = document.getElementById("wave");
const hpFill = document.getElementById("hpFill");
const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const finalScoreEl = document.getElementById("finalScore");
const startBtn = document.getElementById("startBtn");
const retryBtn = document.getElementById("retryBtn");
const fireBtn = document.getElementById("fireBtn");

let w = 0;
let h = 0;
let dpr = 1;
let running = false;
let score = 0;
let wave = 1;
let enemyTimer = 0;
let lastTime = 0;
let shake = 0;

const keys = {};
const bullets = [];
const enemies = [];
const particles = [];
const stars = [];

const player = {
  x: 0,
  y: 0,
  r: 22,
  speed: 320,
  hp: 100,
  cooldown: 0
};

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  w = window.innerWidth;
  h = window.innerHeight;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (!running) {
    player.x = w / 2;
    player.y = h * 0.76;
  }

  if (stars.length === 0) {
    for (let i = 0; i < 90; i++) {
      stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 2 + 0.3,
        speed: Math.random() * 55 + 20
      });
    }
  }
}
window.addEventListener("resize", resize);
resize();

window.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
  if (e.code === "Space") {
    e.preventDefault();
    shoot();
  }
});
window.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

function resetGame() {
  score = 0;
  wave = 1;
  enemyTimer = 0;
  bullets.length = 0;
  enemies.length = 0;
  particles.length = 0;
  player.x = w / 2;
  player.y = h * 0.78;
  player.hp = 100;
  player.cooldown = 0;
  scoreEl.textContent = "0";
  waveEl.textContent = "1";
  hpFill.style.width = "100%";
}

function startGame() {
  resetGame();
  running = true;
  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function endGame() {
  running = false;
  finalScoreEl.textContent = score;
  gameOverScreen.classList.remove("hidden");
}

startBtn.addEventListener("click", startGame);
retryBtn.addEventListener("click", startGame);

function shoot() {
  if (!running || player.cooldown > 0) return;
  player.cooldown = 0.15;
  bullets.push(
    { x: player.x - 11, y: player.y - 24, vy: -620, r: 4 },
    { x: player.x + 11, y: player.y - 24, vy: -620, r: 4 }
  );
}

let fireHeld = false;
fireBtn.addEventListener("pointerdown", e => {
  e.preventDefault();
  fireHeld = true;
  shoot();
});
window.addEventListener("pointerup", () => fireHeld = false);

const stickArea = document.getElementById("stickArea");
const stickKnob = document.getElementById("stickKnob");
let stickPointer = null;
let stickX = 0;
let stickY = 0;

stickArea.addEventListener("pointerdown", e => {
  stickPointer = e.pointerId;
  stickArea.setPointerCapture(e.pointerId);
  updateStick(e);
});
stickArea.addEventListener("pointermove", e => {
  if (e.pointerId === stickPointer) updateStick(e);
});
stickArea.addEventListener("pointerup", e => {
  if (e.pointerId === stickPointer) {
    stickPointer = null;
    stickX = 0;
    stickY = 0;
    stickKnob.style.transform = "translate(0px, 0px)";
  }
});

function updateStick(e) {
  const rect = stickArea.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  let dx = e.clientX - cx;
  let dy = e.clientY - cy;
  const max = 42;
  const len = Math.hypot(dx, dy) || 1;
  if (len > max) {
    dx = dx / len * max;
    dy = dy / len * max;
  }
  stickX = dx / max;
  stickY = dy / max;
  stickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
}

function spawnEnemy() {
  const types = [
    { r: 18, hp: 1, speed: 110, value: 100 },
    { r: 25, hp: 3, speed: 78, value: 250 }
  ];
  const base = Math.random() < Math.min(0.22 + wave * 0.02, 0.5) ? types[1] : types[0];
  enemies.push({
    x: 30 + Math.random() * (w - 60),
    y: -35,
    r: base.r,
    hp: base.hp,
    speed: base.speed + wave * 7,
    value: base.value,
    phase: Math.random() * Math.PI * 2,
    sway: 30 + Math.random() * 55
  });
}

function explode(x, y, color = "#ff315d", count = 18) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = Math.random() * 220 + 40;
    particles.push({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: Math.random() * 0.55 + 0.3,
      maxLife: 0.8,
      size: Math.random() * 4 + 2,
      color
    });
  }
}

function hitPlayer(damage) {
  player.hp = Math.max(0, player.hp - damage);
  hpFill.style.width = player.hp + "%";
  shake = 12;
  explode(player.x, player.y, "#ff9bb0", 10);
  if (player.hp <= 0) {
    explode(player.x, player.y, "#ff183f", 45);
    endGame();
  }
}

function circleHit(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r;
}

function update(dt) {
  for (const s of stars) {
    s.y += s.speed * dt * (1 + wave * 0.04);
    if (s.y > h) {
      s.y = -5;
      s.x = Math.random() * w;
    }
  }

  let dx = 0, dy = 0;
  if (keys["arrowleft"] || keys["a"]) dx -= 1;
  if (keys["arrowright"] || keys["d"]) dx += 1;
  if (keys["arrowup"] || keys["w"]) dy -= 1;
  if (keys["arrowdown"] || keys["s"]) dy += 1;

  dx += stickX;
  dy += stickY;

  const len = Math.hypot(dx, dy);
  if (len > 1) {
    dx /= len;
    dy /= len;
  }

  player.x += dx * player.speed * dt;
  player.y += dy * player.speed * dt;
  player.x = Math.max(player.r + 4, Math.min(w - player.r - 4, player.x));
  player.y = Math.max(70, Math.min(h - player.r - 8, player.y));

  player.cooldown -= dt;
  if ((keys[" "] || fireHeld) && player.cooldown <= 0) shoot();

  enemyTimer -= dt;
  if (enemyTimer <= 0) {
    spawnEnemy();
    enemyTimer = Math.max(0.22, 0.72 - wave * 0.035) * (0.78 + Math.random() * 0.5);
  }

  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].y += bullets[i].vy * dt;
    if (bullets[i].y < -20) bullets.splice(i, 1);
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.y += e.speed * dt;
    e.x += Math.sin(e.y * 0.018 + e.phase) * e.sway * dt;

    if (circleHit(player, e)) {
      hitPlayer(e.r > 20 ? 28 : 18);
      enemies.splice(i, 1);
      continue;
    }

    if (e.y > h + 50) {
      enemies.splice(i, 1);
      hitPlayer(8);
      continue;
    }

    for (let j = bullets.length - 1; j >= 0; j--) {
      if (circleHit({ ...bullets[j], r: bullets[j].r }, e)) {
        bullets.splice(j, 1);
        e.hp -= 1;
        explode(e.x, e.y, "#ff5b78", 4);

        if (e.hp <= 0) {
          score += e.value;
          scoreEl.textContent = score;
          explode(e.x, e.y, "#ff315d", e.r > 20 ? 30 : 16);
          enemies.splice(i, 1);

          const newWave = Math.floor(score / 2000) + 1;
          if (newWave !== wave) {
            wave = newWave;
            waveEl.textContent = wave;
          }
        }
        break;
      }
    }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.98;
    p.vy *= 0.98;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }

  shake *= 0.88;
}

function drawDrone(x, y) {
  ctx.save();
  ctx.translate(x, y);

  ctx.shadowColor = "#ff2048";
  ctx.shadowBlur = 18;

  ctx.fillStyle = "#8d001c";
  ctx.beginPath();
  ctx.moveTo(0, -28);
  ctx.lineTo(17, 10);
  ctx.lineTo(8, 18);
  ctx.lineTo(0, 11);
  ctx.lineTo(-8, 18);
  ctx.lineTo(-17, 10);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ff234d";
  ctx.fillRect(-28, -3, 56, 7);

  ctx.fillStyle = "#2b060e";
  ctx.beginPath();
  ctx.arc(-31, 0, 10, 0, Math.PI * 2);
  ctx.arc(31, 0, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#ff718a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(-31, 0, 15, 0, Math.PI * 2);
  ctx.arc(31, 0, 15, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#ffb0bd";
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.lineTo(6, 4);
  ctx.lineTo(-6, 4);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,70,100,0.55)";
  ctx.beginPath();
  ctx.moveTo(-7, 16);
  ctx.lineTo(0, 38 + Math.random() * 8);
  ctx.lineTo(7, 16);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawEnemy(e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.rotate(Math.sin(e.y * 0.02) * 0.18);

  ctx.shadowColor = "#ff6a00";
  ctx.shadowBlur = 10;
  ctx.fillStyle = e.r > 20 ? "#3d4758" : "#5a2630";

  ctx.beginPath();
  ctx.moveTo(0, e.r);
  ctx.lineTo(e.r, -e.r * 0.3);
  ctx.lineTo(e.r * 0.35, -e.r);
  ctx.lineTo(-e.r * 0.35, -e.r);
  ctx.lineTo(-e.r, -e.r * 0.3);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ff7a00";
  ctx.fillRect(-4, -5, 8, 12);
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, w, h);

  ctx.save();
  if (shake > 0.5) {
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  }

  for (const s of stars) {
    ctx.globalAlpha = Math.min(1, s.size / 2);
    ctx.fillStyle = "#c6d5ff";
    ctx.fillRect(s.x, s.y, s.size, s.size * 2.2);
  }
  ctx.globalAlpha = 1;

  ctx.strokeStyle = "rgba(255, 20, 65, 0.08)";
  ctx.lineWidth = 1;
  const gap = 70;
  for (let y = (performance.now() * 0.05) % gap; y < h; y += gap) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  for (const b of bullets) {
    ctx.shadowColor = "#ff4168";
    ctx.shadowBlur = 14;
    ctx.fillStyle = "#ffe8ee";
    ctx.fillRect(b.x - 2, b.y - 12, 4, 18);
  }
  ctx.shadowBlur = 0;

  for (const e of enemies) drawEnemy(e);

  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }
  ctx.globalAlpha = 1;

  if (running) drawDrone(player.x, player.y);

  ctx.restore();
}

function loop(now) {
  if (!running) {
    draw();
    return;
  }
  const dt = Math.min((now - lastTime) / 1000, 0.034);
  lastTime = now;
  update(dt);
  draw();
  if (running) requestAnimationFrame(loop);
}

draw();


// iPhone / iOS behavior tuning
document.addEventListener("touchmove", e => e.preventDefault(), { passive: false });
document.addEventListener("gesturestart", e => e.preventDefault());

async function tryFullscreen() {
  const el = document.documentElement;
  try {
    if (el.requestFullscreen && !document.fullscreenElement) {
      await el.requestFullscreen();
    }
  } catch (_) {
    // Safariではホーム画面起動時に全画面相当になります。
  }
}

startBtn.addEventListener("click", tryFullscreen);
retryBtn.addEventListener("click", tryFullscreen);

// Page Visibility API: pause accidental background progression
document.addEventListener("visibilitychange", () => {
  if (document.hidden && running) {
    keys[" "] = false;
    fireHeld = false;
  }
});


// ===== CRIMSON AEGIS Ver.1.0 expansion =====
const bestScoreEl=document.getElementById("bestScore"),finalBestEl=document.getElementById("finalBest"),soundBtn=document.getElementById("soundBtn"),resetBestBtn=document.getElementById("resetBestBtn");
const enemyBullets=[],shockwaves=[];
let bestScore=Number(localStorage.getItem("crimsonAegisBest")||0),soundOn=localStorage.getItem("crimsonAegisSound")!=="off",audioCtx=null,audioMaster=null,musicTimer=null,musicStep=0;
bestScoreEl.textContent=bestScore;soundBtn.textContent="SOUND："+(soundOn?"ON":"OFF");
function audioInit(){if(!soundOn)return;if(!audioCtx){audioCtx=new(window.AudioContext||window.webkitAudioContext)();audioMaster=audioCtx.createGain();audioMaster.gain.value=.16;audioMaster.connect(audioCtx.destination)}if(audioCtx.state==="suspended")audioCtx.resume()}
function tone(f,d=.08,type="square",v=.07,slide=0){if(!soundOn)return;audioInit();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(f,audioCtx.currentTime);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,f+slide),audioCtx.currentTime+d);g.gain.setValueAtTime(v,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+d);o.connect(g);g.connect(audioMaster);o.start();o.stop(audioCtx.currentTime+d)}
function boom(d=.16,v=.14){if(!soundOn)return;audioInit();const n=Math.floor(audioCtx.sampleRate*d),b=audioCtx.createBuffer(1,n,audioCtx.sampleRate),a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=(Math.random()*2-1)*(1-i/n);const s=audioCtx.createBufferSource(),g=audioCtx.createGain();s.buffer=b;g.gain.value=v;s.connect(g);g.connect(audioMaster);s.start()}
function musicStart(){musicStop();if(!soundOn)return;const notes=[110,110,147,98,110,165,147,98];musicTimer=setInterval(()=>{if(running){const f=notes[musicStep++%notes.length];tone(f,.18,"triangle",.04);if(musicStep%2===0)tone(f*2,.07,"square",.02)}},240)}
function musicStop(){if(musicTimer){clearInterval(musicTimer);musicTimer=null}}
soundBtn.onclick=()=>{soundOn=!soundOn;localStorage.setItem("crimsonAegisSound",soundOn?"on":"off");soundBtn.textContent="SOUND："+(soundOn?"ON":"OFF");if(soundOn&&running)musicStart();else musicStop()};
resetBestBtn.onclick=()=>{bestScore=0;localStorage.removeItem("crimsonAegisBest");bestScoreEl.textContent=0;tone(220)};

const oldResetGame=resetGame;resetGame=function(){oldResetGame();enemyBullets.length=0;shockwaves.length=0};
const oldStartGame=startGame;startGame=function(){audioInit();oldStartGame();tone(440,.08);tone(660,.16);musicStart()};
startBtn.onclick=startGame;retryBtn.onclick=startGame;
const oldEndGame=endGame;endGame=function(){musicStop();if(score>bestScore){bestScore=score;localStorage.setItem("crimsonAegisBest",bestScore);bestScoreEl.textContent=bestScore}finalBestEl.textContent=bestScore;boom(.45,.22);tone(120,.65,"sawtooth",.12,-70);oldEndGame()};
const oldShoot=shoot;shoot=function(){const ready=running&&player.cooldown<=0;oldShoot();if(ready)tone(720,.05,"square",.045,-160)};

spawnEnemy=function(){const r=Math.random(),type=r<.16+Math.min(wave*.012,.18)?"hunter":r<.38?"shooter":r<.58?"tank":"scout";const s={scout:[17,1,118,100],shooter:[20,2,78,180],hunter:[19,2,104,220],tank:[28,5,55,400]}[type];enemies.push({type,x:35+Math.random()*(w-70),y:-40,r:s[0],hp:s[1],speed:s[2]+wave*6,value:s[3],phase:Math.random()*6.28,sway:25+Math.random()*50,shot:1+Math.random()*1.2})};
function enemyShoot(e,offset=0){const dx=player.x-(e.x+offset),dy=player.y-e.y,l=Math.hypot(dx,dy)||1,sp=e.type==="tank"?180:230;enemyBullets.push({x:e.x+offset,y:e.y+e.r*.5,vx:dx/l*sp,vy:dy/l*sp,r:e.type==="tank"?7:5});tone(180,.07,"sawtooth",.025,35)}
const oldExplode=explode;explode=function(x,y,color="#ff315d",count=18){oldExplode(x,y,color,count);shockwaves.push({x,y,r:4,life:.28,max:.28,color})};

update=function(dt){
 for(const s of stars){s.y+=s.speed*dt*(1+wave*.04);if(s.y>h){s.y=-5;s.x=Math.random()*w}}
 let dx=0,dy=0;if(keys.arrowleft||keys.a)dx--;if(keys.arrowright||keys.d)dx++;if(keys.arrowup||keys.w)dy--;if(keys.arrowdown||keys.s)dy++;dx+=stickX;dy+=stickY;let len=Math.hypot(dx,dy);if(len>1){dx/=len;dy/=len}player.x+=dx*player.speed*dt;player.y+=dy*player.speed*dt;player.x=Math.max(player.r+4,Math.min(w-player.r-4,player.x));player.y=Math.max(70,Math.min(h-player.r-8,player.y));player.cooldown-=dt;if((keys[" "]||fireHeld)&&player.cooldown<=0)shoot();
 enemyTimer-=dt;if(enemyTimer<=0){spawnEnemy();enemyTimer=Math.max(.2,.68-wave*.03)*(.75+Math.random()*.55)}
 for(let i=bullets.length-1;i>=0;i--){bullets[i].y+=bullets[i].vy*dt;if(bullets[i].y<-20)bullets.splice(i,1)}
 for(let i=enemyBullets.length-1;i>=0;i--){const b=enemyBullets[i];b.x+=b.vx*dt;b.y+=b.vy*dt;if(circleHit(player,b)){enemyBullets.splice(i,1);hitPlayer(12);boom(.1,.08);continue}if(b.x<-30||b.x>w+30||b.y>h+30)enemyBullets.splice(i,1)}
 for(let i=enemies.length-1;i>=0;i--){const e=enemies[i];if(e.type==="hunter"){e.x+=Math.sign(player.x-e.x)*Math.min(Math.abs(player.x-e.x),85)*dt;e.y+=e.speed*dt}else{e.y+=e.speed*dt;e.x+=Math.sin(e.y*(e.type==="tank"?.01:.018)+e.phase)*(e.type==="tank"?22:e.sway)*dt}if(e.type==="shooter"||e.type==="tank"){e.shot-=dt;if(e.shot<=0&&e.y>60){enemyShoot(e);if(e.type==="tank"){enemyShoot(e,-18);enemyShoot(e,18)}e.shot=e.type==="tank"?1.8:Math.max(.55,1.35-wave*.025)+Math.random()*.55}}
  if(circleHit(player,e)){hitPlayer(e.type==="tank"?34:20);explode(e.x,e.y,"#ff5b75",20);enemies.splice(i,1);continue}if(e.y>h+50){enemies.splice(i,1);hitPlayer(7);continue}
  for(let j=bullets.length-1;j>=0;j--){if(circleHit(bullets[j],e)){bullets.splice(j,1);e.hp--;oldExplode(e.x,e.y,"#ff6981",4);if(e.hp<=0){score+=e.value;scoreEl.textContent=score;explode(e.x,e.y,e.type==="tank"?"#ff9b35":"#ff315d",e.type==="tank"?40:19);boom(e.type==="tank"?.3:.13,e.type==="tank"?.18:.09);tone(e.type==="tank"?85:160,e.type==="tank"?.4:.16,"sawtooth",.07,-55);enemies.splice(i,1);const nw=Math.floor(score/2200)+1;if(nw!==wave){wave=nw;waveEl.textContent=wave;tone(440,.1);tone(660,.18)}}break}}
 }
 for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.976;p.vy*=.976;p.life-=dt;if(p.life<=0)particles.splice(i,1)}for(let i=shockwaves.length-1;i>=0;i--){const q=shockwaves[i];q.r+=310*dt;q.life-=dt;if(q.life<=0)shockwaves.splice(i,1)}shake*=.86;
};

drawDrone=function(x,y){ctx.save();ctx.translate(x,y);ctx.shadowColor="#ff1c48";ctx.shadowBlur=20;ctx.fillStyle="#5e0719";ctx.beginPath();ctx.moveTo(0,-31);ctx.lineTo(14,-10);ctx.lineTo(20,16);ctx.lineTo(7,23);ctx.lineTo(0,15);ctx.lineTo(-7,23);ctx.lineTo(-20,16);ctx.lineTo(-14,-10);ctx.closePath();ctx.fill();ctx.fillStyle="#be0b31";ctx.fillRect(-37,-5,74,9);ctx.fillStyle="#e21c43";ctx.beginPath();ctx.moveTo(-18,-7);ctx.lineTo(-34,-18);ctx.lineTo(-39,-5);ctx.closePath();ctx.fill();ctx.beginPath();ctx.moveTo(18,-7);ctx.lineTo(34,-18);ctx.lineTo(39,-5);ctx.closePath();ctx.fill();for(const sx of[-38,38]){ctx.fillStyle="#17050a";ctx.beginPath();ctx.arc(sx,0,11,0,6.28);ctx.fill();ctx.strokeStyle="#ff7089";ctx.lineWidth=2;ctx.beginPath();ctx.arc(sx,0,16,0,6.28);ctx.stroke();ctx.strokeStyle="rgba(255,180,195,.35)";ctx.beginPath();ctx.moveTo(sx-14,-5);ctx.lineTo(sx+14,5);ctx.moveTo(sx-14,5);ctx.lineTo(sx+14,-5);ctx.stroke()}ctx.fillStyle="#f1d9df";ctx.beginPath();ctx.moveTo(0,-17);ctx.lineTo(7,3);ctx.lineTo(0,9);ctx.lineTo(-7,3);ctx.closePath();ctx.fill();ctx.shadowBlur=0;ctx.fillStyle="rgba(255,62,95,.5)";ctx.beginPath();ctx.moveTo(-8,20);ctx.lineTo(0,42+Math.random()*8);ctx.lineTo(8,20);ctx.fill();ctx.restore()};
const oldDrawEnemy=drawEnemy;drawEnemy=function(e){ctx.save();ctx.translate(e.x,e.y);ctx.rotate(Math.sin(e.y*.018)*.15);ctx.shadowColor=e.type==="tank"?"#ff9000":"#ff4b25";ctx.shadowBlur=10;ctx.fillStyle={scout:"#592633",shooter:"#313b50",hunter:"#53315d",tank:"#4d4c55"}[e.type]||"#592633";ctx.beginPath();ctx.moveTo(0,e.r);ctx.lineTo(e.r,-e.r*.25);ctx.lineTo(e.r*.38,-e.r);ctx.lineTo(-e.r*.38,-e.r);ctx.lineTo(-e.r,-e.r*.25);ctx.closePath();ctx.fill();ctx.fillStyle=e.type==="hunter"?"#d45cff":"#ff7c22";ctx.fillRect(-4,-6,8,13);if(e.type==="tank"){ctx.strokeStyle="#ff9a32";ctx.lineWidth=3;ctx.strokeRect(-e.r*.7,-e.r*.45,e.r*1.4,e.r*.65)}ctx.restore()};
const oldDraw=draw;draw=function(){oldDraw();ctx.save();for(const b of enemyBullets){ctx.shadowColor="#ff8a29";ctx.shadowBlur=13;ctx.fillStyle="#ffd082";ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,6.28);ctx.fill()}ctx.shadowBlur=0;for(const q of shockwaves){ctx.globalAlpha=Math.max(0,q.life/q.max);ctx.strokeStyle=q.color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(q.x,q.y,q.r,0,6.28);ctx.stroke()}ctx.restore()};
