const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const scoreLeftEl = document.getElementById('score-left');
const scoreRightEl = document.getElementById('score-right');
const leftLabelEl = document.getElementById('team-left-label');
const rightLabelEl = document.getElementById('team-right-label');
const restartBtn = document.getElementById('restart-btn');
const menuEl = document.getElementById('menu');
const startBtn = document.getElementById('start-btn');
const tournamentBriefEl = document.getElementById('tournament-brief');
const menuTextEl = document.getElementById('menu-text');

const court = { x: 110, y: 80, width: 740, height: 320 };
const courtBottom = court.y + court.height;
const netX = court.x + court.width / 2;
const whiteCenterLineY = courtBottom - 120;
const netClearanceY = whiteCenterLineY;
const keys = {};

const tournamentSchedule = [
  { round: 'Quartas', opponent: 'ARGENTINA' },
  { round: 'Semifinal', opponent: 'ESPANHA' },
  { round: 'Final', opponent: 'FRANÇA' },
];

const state = {
  leftScore: 0,
  rightScore: 0,
  servingSide: 'left',
  winner: null,
  gameOver: false,
  phase: 'menu',
  lastPointText: 'Modo local vs IA',
  tournamentMode: true,
  tournamentIndex: 0,
  currentOpponent: tournamentSchedule[0].opponent,
};

function getLeftDisplayName() {
  return state.tournamentMode ? 'BRASIL' : 'Time A';
}

function getRightDisplayName() {
  return state.tournamentMode ? state.currentOpponent : 'Time B';
}

function updateMatchLabels() {
  leftLabelEl.textContent = getLeftDisplayName();
  rightLabelEl.textContent = getRightDisplayName();

  if (!state.tournamentMode) {
    tournamentBriefEl.innerHTML = '<span class="pill">Local</span><span class="matchup">BRASIL x IA</span>';
    return;
  }

  const nextRound = tournamentSchedule[state.tournamentIndex];
  if (!nextRound) {
    tournamentBriefEl.innerHTML = '<span class="pill">Final</span><span class="matchup">BRASIL x FRANÇA</span>';
    return;
  }

  tournamentBriefEl.innerHTML = `<span class="pill">${nextRound.round}</span><span class="matchup">BRASIL x ${nextRound.opponent}</span>`;
}

function setPauseMenu(isPaused) {
  const title = menuEl.querySelector('h1');
  const text = menuEl.querySelector('#menu-text');

  if (isPaused) {
    title.textContent = 'Jogo pausado';
    text.textContent = 'Aperte P para continuar a partida.';
    startBtn.textContent = 'Continuar';
    menuEl.classList.add('visible');
    return;
  }

  if (state.tournamentMode && state.phase === 'tournament-break') {
    const nextRound = tournamentSchedule[state.tournamentIndex];
    title.textContent = 'Próximo jogo';
    text.textContent = `${nextRound.round}: BRASIL x ${nextRound.opponent}.`;
    startBtn.textContent = 'Próximo jogo';
    menuEl.classList.add('visible');
    return;
  }

  if (state.tournamentMode && state.phase === 'menu') {
    title.textContent = 'Campeonato';
    text.textContent = 'BRASIL precisa vencer vários times até chegar na final e conquistar o título.';
    startBtn.textContent = 'Iniciar campeonato';
    menuEl.classList.add('visible');
    return;
  }

  title.textContent = 'Beach Volleyball 2D';
  text.textContent = 'Modo local: você controla um jogador do Time A e joga contra uma IA.';
  startBtn.textContent = 'Jogar contra IA';
  menuEl.classList.remove('visible');
}

function togglePause() {
  if (state.phase === 'menu' || state.gameOver) return;

  if (state.phase === 'playing') {
    state.phase = 'paused';
    setStatus('Jogo pausado');
    setPauseMenu(true);
    return;
  }

  if (state.phase === 'paused') {
    state.phase = 'playing';
    setStatus(state.lastPointText || 'Partida em andamento');
    setPauseMenu(false);
  }
}

let players = [];
const ball = {
  x: canvas.width / 2,
  y: 130,
  vx: 0,
  vy: 0,
  radius: 12,
  lastTouch: 'left',
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function setStatus(message) {
  statusEl.textContent = message;
}

function updateHud() {
  scoreLeftEl.textContent = String(state.leftScore);
  scoreRightEl.textContent = String(state.rightScore);
}

function makePlayer(team, index, isHuman, role = 'support') {
  const xBase = team === 'left'
    ? (role === 'net' ? court.x + 260 : court.x + 150)
    : (role === 'net' ? court.x + court.width - 260 : court.x + court.width - 150);

  return {
    team,
    index,
    role,
    human: isHuman,
    x: xBase,
    y: courtBottom - 42,
    vx: 0,
    vy: 0,
    radius: 18,
    stamina: 100,
    attackCharge: 0,
    defending: false,
    facing: team === 'left' ? 1 : -1,
    onGround: true,
    jumpHeld: false,
    attackHeld: false,
    color: team === 'left' ? '#ff6e6e' : '#5ec1ff',
  };
}

function buildPlayers() {
  players = [
    makePlayer('left', 0, true, 'net'),
    makePlayer('left', 1, false, 'defense'),
    makePlayer('right', 0, false, 'net'),
    makePlayer('right', 1, false, 'defense'),
  ];
}

function resetBall(side) {
  const baseX = side === 'left' ? court.x + 220 : court.x + court.width - 220;
  ball.x = baseX;
  ball.y = 120;
  ball.vx = side === 'left' ? 240 : -240;
  ball.vy = -110;
  ball.lastTouch = side;
}

function startMatch() {
  state.leftScore = 0;
  state.rightScore = 0;
  state.gameOver = false;
  state.phase = 'playing';
  state.winner = null;
  state.lastPointText = 'Partida em andamento';
  state.servingSide = 'left';
  menuEl.classList.remove('visible');
  updateHud();
  setStatus(`Partida em andamento · ${getLeftDisplayName()} x ${getRightDisplayName()}`);
  buildPlayers();
  resetBall('left');
}

function startTournamentRound() {
  const roundInfo = tournamentSchedule[state.tournamentIndex];
  if (!roundInfo) return;

  state.currentOpponent = roundInfo.opponent;
  state.leftScore = 0;
  state.rightScore = 0;
  state.gameOver = false;
  state.phase = 'playing';
  state.winner = null;
  state.lastPointText = 'Partida em andamento';
  state.servingSide = 'left';
  menuEl.classList.remove('visible');
  updateMatchLabels();
  updateHud();
  setStatus(`Campeonato · ${getLeftDisplayName()} x ${getRightDisplayName()}`);
  buildPlayers();
  resetBall('left');
}

function resetTournament() {
  state.tournamentMode = true;
  state.tournamentIndex = 0;
  state.currentOpponent = tournamentSchedule[0].opponent;
  updateMatchLabels();
  setPauseMenu(false);
  startTournamentRound();
}

function finishMatch(winner) {
  state.gameOver = true;
  state.phase = 'gameover';
  state.winner = winner;

  if (state.tournamentMode) {
    const winnerName = winner === 'left' ? 'BRASIL' : state.currentOpponent;
    const roundInfo = tournamentSchedule[state.tournamentIndex];

    if (winner === 'left') {
      if (state.tournamentIndex < tournamentSchedule.length - 1) {
        state.tournamentIndex += 1;
        state.currentOpponent = tournamentSchedule[state.tournamentIndex].opponent;
        state.phase = 'tournament-break';
        state.gameOver = false;
        setStatus(`Brasil venceu ${roundInfo.opponent}!`);
        menuEl.classList.add('visible');
        const title = menuEl.querySelector('h1');
        const text = menuEl.querySelector('#menu-text');
        title.textContent = 'Brasil avança';
        text.textContent = `${roundInfo.round}: BRASIL venceu ${roundInfo.opponent}. Próximo jogo: BRASIL x ${state.currentOpponent}.`;
        startBtn.textContent = 'Próximo jogo';
        updateMatchLabels();
        return;
      }

      state.phase = 'gameover';
      setStatus('BRASIL campeão!');
      menuEl.classList.add('visible');
      const title = menuEl.querySelector('h1');
      const text = menuEl.querySelector('#menu-text');
      title.textContent = 'BRASIL CAMPEÃO';
      text.textContent = 'O Brasil venceu a final e levantou o troféu do campeonato.';
      startBtn.textContent = 'Reiniciar campeonato';
      updateMatchLabels();
      return;
    }

    setStatus(`${state.currentOpponent} venceu a partida!`);
    menuEl.classList.add('visible');
    const title = menuEl.querySelector('h1');
    const text = menuEl.querySelector('#menu-text');
    title.textContent = `${state.currentOpponent} venceu`;
    text.textContent = 'O campeonato acabou para o Brasil. Clique para tentar novamente.';
    startBtn.textContent = 'Tentar novamente';
    updateMatchLabels();
    return;
  }

  setStatus(`Vitória do ${winnerName}!`);
  menuEl.classList.add('visible');
  const title = menuEl.querySelector('h1');
  const text = menuEl.querySelector('#menu-text');
  title.textContent = `Vitória do ${winnerName}`;
  text.textContent = 'Clique para jogar outra partida local contra a IA.';
  startBtn.textContent = 'Jogar novamente';
}

function checkWinCondition() {
  const lead = Math.abs(state.leftScore - state.rightScore);
  const leftWon = state.leftScore >= 5 && lead >= 2;
  const rightWon = state.rightScore >= 5 && lead >= 2;

  if (leftWon) {
    finishMatch('left');
    return true;
  }

  if (rightWon) {
    finishMatch('right');
    return true;
  }

  return false;
}

function scorePoint(team) {
  if (state.gameOver) return;

  if (team === 'left') {
    state.leftScore += 1;
    state.lastPointText = `Ponto para o ${getLeftDisplayName()}`;
  } else {
    state.rightScore += 1;
    state.lastPointText = `Ponto para o ${getRightDisplayName()}`;
  }

  updateHud();
  if (!checkWinCondition()) {
    state.servingSide = team === 'left' ? 'right' : 'left';
    const nextTeam = state.servingSide === 'left' ? getLeftDisplayName() : getRightDisplayName();
    setStatus(`${state.lastPointText} · Próximo saque: ${nextTeam}`);
    resetBall(state.servingSide);
  }
}

function handleHumanPlayer(player, dt) {
  const left = keys.a;
  const right = keys.d;
  const jump = !!keys.w;
  const attack = !!keys.s;
  const defend = !!keys.f;

  player.vx = 0;
  if (left) player.vx -= 1;
  if (right) player.vx += 1;

  if (player.onGround && jump && !player.jumpHeld) {
    player.vy = -430;
    player.onGround = false;
  } else if (!player.onGround && jump && player.vy < 0) {
    player.vy -= 220 * dt;
  }
  player.jumpHeld = jump;

  if (attack && player.onGround) {
    player.attackCharge = Math.min(player.attackCharge + dt * 1.4, 1.1);
  } else {
    player.attackCharge = Math.max(player.attackCharge - dt * 2.0, 0);
  }
  player.attackHeld = attack;

  player.defending = defend && player.stamina > 10;
  if (player.defending) {
    player.stamina = Math.max(0, player.stamina - dt * 12);
  } else {
    player.stamina = Math.min(100, player.stamina + dt * 9);
  }

  player.x += player.vx * 210 * dt;
  player.x = clamp(player.x, court.x + 35, netX - 30);
  if (player.vx !== 0) {
    player.facing = player.vx > 0 ? 1 : -1;
  }
}

function handleAIPlayer(player, dt) {
  const ballOnOwnSide = player.team === 'left' ? ball.x < netX : ball.x > netX;
  const nearBall = Math.abs(player.x - ball.x) < 120;

  const netOffset = player.role === 'net' ? 45 : 140;
  const direction = player.team === 'left' ? -1 : 1;

  let targetX = player.team === 'left'
    ? court.x + 190 + (player.role === 'net' ? 70 : 170)
    : court.x + court.width - 190 - (player.role === 'net' ? 70 : 170);

  if (ball.x > court.x && ball.x < court.x + court.width) {
    const ballTarget = ball.x + direction * netOffset;
    targetX = player.team === 'left'
      ? clamp(ballTarget, court.x + 40, netX - 30)
      : clamp(ballTarget, netX + 30, court.x + court.width - 40);

    if (player.role === 'defense') {
      targetX = player.team === 'left'
        ? clamp(ball.x - 120, court.x + 40, netX - 80)
        : clamp(ball.x + 120, netX + 80, court.x + court.width - 40);
    }
  }

  const trackingSpeed = player.role === 'net' ? 220 : 180;
  player.vx = 0;
  if (Math.abs(player.x - targetX) > 8) {
    player.vx = player.x < targetX ? 1 : -1;
  }

  player.x += player.vx * trackingSpeed * dt;
  player.x = player.team === 'left'
    ? clamp(player.x, court.x + 35, netX - 30)
    : clamp(player.x, netX + 30, court.x + court.width - 35);

  const shouldJump = player.onGround && (
    (nearBall && Math.abs(player.y - ball.y) < 110 && ball.y < 230) ||
    (Math.abs(player.x - ball.x) < 75 && ball.y < 255 && ball.y > court.y + 20)
  );

  if (shouldJump) {
    player.vy = -430;
    player.onGround = false;
  }

  const activeDefense = (ballOnOwnSide || ball.lastTouch === player.team) && Math.abs(player.x - ball.x) < 95 && ball.y > court.y + 30;
  player.defending = activeDefense && player.stamina > 5;

  if (player.defending) {
    player.stamina = Math.max(0, player.stamina - dt * 16);
  } else {
    player.stamina = Math.min(100, player.stamina + dt * 10);
  }

  const canCounter = Math.abs(player.x - ball.x) < 90 && Math.abs(player.y - ball.y) < 110 && ball.y < 240;
  if (canCounter) {
    player.attackCharge = Math.min(player.attackCharge + dt * 3.4, 1.4);
  } else {
    player.attackCharge = Math.max(player.attackCharge - dt * 1.9, 0);
  }

  if (ball.x !== player.x) {
    player.facing = player.team === 'left'
      ? (ball.x >= player.x ? 1 : -1)
      : (ball.x <= player.x ? -1 : 1);
  }

  if (Math.abs(player.x - ball.x) < 70 && ball.y > player.y - 18 && ball.y < player.y + 20) {
    player.attackCharge = Math.min(player.attackCharge + dt * 2.6, 1.5);
  }
}

function updatePlayers(dt) {
  for (const player of players) {
    if (player.human) {
      handleHumanPlayer(player, dt);
    } else {
      handleAIPlayer(player, dt);
    }

    if (!player.onGround) {
      player.vy += 980 * dt;
      player.y += player.vy * dt;
      if (player.y >= courtBottom - 42) {
        player.y = courtBottom - 42;
        player.vy = 0;
        player.onGround = true;
      }
    }

    if (Math.abs(ball.x - player.x) < player.radius + ball.radius + 10 && Math.abs(ball.y - player.y) < player.radius + ball.radius + 16) {
      const contactStrength = 1.35 + player.attackCharge * 0.9 + (player.defending ? 0.25 : 0);
      const horizontalBoost = player.facing * (240 + player.attackCharge * 320);
      const verticalBoost = -Math.max(200, 260 + player.attackCharge * 220 + (player.defending ? 40 : 0));
      const defenseMultiplier = player.defending && player.stamina > 0 ? 0.9 : 1;
      const impulse = (360 + player.attackCharge * 220) * defenseMultiplier;

      ball.vx = clamp((ball.x - player.x) * 1.2 + horizontalBoost * 0.55, -820, 820) * contactStrength;
      ball.vy = (verticalBoost - impulse * 0.1) * (1 + player.attackCharge * 0.3);
      ball.x += ball.vx * 0.03;
      ball.lastTouch = player.team;
      player.attackCharge = 0;
      player.defending = false;
    }
  }
}

function updateBall(dt) {
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  ball.vy += 700 * dt;

  if (ball.x < court.x + 12) {
    ball.x = court.x + 12;
    ball.vx *= -0.85;
  }

  if (ball.x > court.x + court.width - 12) {
    ball.x = court.x + court.width - 12;
    ball.vx *= -0.85;
  }

  if (ball.y < court.y + 12) {
    ball.y = court.y + 12;
    ball.vy *= -0.5;
  }

  const centerLineTouch = Math.abs(ball.x - netX) < 16 && Math.abs(ball.y - netClearanceY) < 12;
  if (centerLineTouch) {
    ball.x = ball.x < netX ? netX - 16 : netX + 16;
    ball.vx *= -0.75;
    ball.vy *= 0.7;
    return;
  }

  if (ball.y > courtBottom + 10) {
    const scoringSide = ball.x < netX ? 'right' : 'left';
    scorePoint(scoringSide);
    return;
  }

  if (ball.x < court.x - 14 || ball.x > court.x + court.width + 14) {
    const scoringSide = ball.x < court.x ? 'right' : 'left';
    scorePoint(scoringSide);
    return;
  }
}

function drawCourt() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, '#9ad6da');
  sky.addColorStop(1, '#c7f0b7');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#d7c48d';
  ctx.fillRect(court.x, court.y, court.width, court.height);

  ctx.strokeStyle = 'rgba(255,255,255,0.65)';
  ctx.lineWidth = 3;
  ctx.strokeRect(court.x, court.y, court.width, court.height);

  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillRect(netX - 10, courtBottom - 120, 20, 150);

  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let y = courtBottom - 110; y <= courtBottom + 18; y += 14) {
    ctx.moveTo(netX - 10, y);
    ctx.lineTo(netX + 10, y);
  }
  ctx.stroke();

  ctx.fillStyle = '#6d8c66';
  ctx.fillRect(court.x, courtBottom + 12, court.width, 28);
}

function drawHumanoid(player) {
  const facing = player.facing >= 0 ? 1 : -1;
  const bodyColor = player.team === 'left' ? '#ff7d7d' : '#89d0ff';

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.scale(facing, 1);

  ctx.fillStyle = '#f2c7a0';
  ctx.beginPath();
  ctx.arc(0, -30, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = bodyColor;
  ctx.fillRect(-10, -18, 20, 26);

  ctx.strokeStyle = '#1d2430';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-10, -8);
  ctx.lineTo(-18, 12);
  ctx.moveTo(10, -8);
  ctx.lineTo(18, 12);
  ctx.moveTo(-4, 8);
  ctx.lineTo(-10, 26);
  ctx.moveTo(4, 8);
  ctx.lineTo(10, 26);
  ctx.stroke();

  ctx.strokeStyle = '#3d4c5a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-6, -18);
  ctx.lineTo(-14, -2);
  ctx.moveTo(6, -18);
  ctx.lineTo(14, -2);
  ctx.stroke();

  ctx.restore();

  ctx.fillStyle = '#f5f6ff';
  ctx.fillRect(player.x - 22, player.y - 42, 44, 7);
  ctx.fillStyle = player.team === 'left' ? '#ff8a8a' : '#84d6ff';
  ctx.fillRect(player.x - 22, player.y - 42, 44 * (player.stamina / 100), 7);

  if (player.attackCharge > 0.04) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(player.x - 18, player.y - 56, 36, 6);
    ctx.fillStyle = '#ffd76b';
    ctx.fillRect(player.x - 18, player.y - 56, 36 * (player.attackCharge / 1.6), 6);
  }
}

function drawPlayers() {
  for (const player of players) {
    drawHumanoid(player);
  }
}

function drawBall() {
  ctx.fillStyle = '#fff8d0';
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d2b75d';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function draw() {
  drawCourt();
  drawPlayers();
  drawBall();
}

function update(dt) {
  if (state.phase !== 'playing' || state.gameOver) return;

  updatePlayers(dt);
  updateBall(dt);
  setStatus(state.lastPointText || 'Partida em andamento');
}

function loop(timestamp) {
  if (!loop.lastTime) loop.lastTime = timestamp;
  const dt = Math.min((timestamp - loop.lastTime) / 1000, 0.033);
  loop.lastTime = timestamp;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener('keydown', (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

  if (key === 'p') {
    event.preventDefault();
    togglePause();
    return;
  }

  keys[key] = true;
  if (event.code === 'Space') event.preventDefault();
});

window.addEventListener('keyup', (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys[key] = false;
});

restartBtn.addEventListener('click', () => {
  if (state.tournamentMode) {
    resetTournament();
    return;
  }

  state.leftScore = 0;
  state.rightScore = 0;
  state.winner = null;
  state.gameOver = false;
  state.phase = 'playing';
  state.lastPointText = 'Partida em andamento';
  updateHud();
  setStatus('Partida em andamento');
  setPauseMenu(false);
  buildPlayers();
  resetBall('left');
  startBtn.textContent = 'Jogar contra IA';
});

startBtn.addEventListener('click', () => {
  if (state.phase === 'paused') {
    togglePause();
    return;
  }

  if (state.tournamentMode && state.phase === 'tournament-break') {
    setPauseMenu(false);
    startTournamentRound();
    return;
  }

  if (state.phase === 'menu' && state.tournamentMode) {
    setPauseMenu(false);
    startTournamentRound();
    return;
  }

  if (state.gameOver && state.tournamentMode) {
    resetTournament();
    return;
  }

  setPauseMenu(false);
  startMatch();
});

updateMatchLabels();
updateHud();
setStatus('Modo local vs IA');
state.tournamentMode = true;
state.tournamentIndex = 0;
state.currentOpponent = tournamentSchedule[0].opponent;
setPauseMenu(false);
buildPlayers();
resetBall('left');
requestAnimationFrame(loop);
