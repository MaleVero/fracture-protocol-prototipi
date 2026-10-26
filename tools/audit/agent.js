// Agente tattico per il banco di bilanciamento. Gira DENTRO la pagina del gioco
// (si inietta con page.evaluate(fs.readFileSync('agent.js','utf8'))) e usa le sue
// stesse funzioni: `pAttack`, `push`, `dmg`, `moveRange`, `snapshot`...
//
// Come gioca: a ogni turno prova, su una copia dello stato (snapshot/restore del
// gioco), ogni coppia (casella raggiungibile, bersaglio) di ogni mech, e applica
// la migliore. Il punteggio guarda il campo DOPO l'azione: nemici rimasti, vita
// dei mech, progresso dell'obiettivo, e quanto danno telegrafato cade sui mech
// (i Kaucha annunciano dove colpiranno, quindi l'esposizione è esatta).
//
// ⚠ Cosa NON usa, di proposito per ora: le abilità dei telai e gli interventi di
// Lazy J. Quindi misura la difficoltà di una squadra che spara, muove e spinge: è
// un LIMITE INFERIORE dell'abilità di un giocatore, non una stima del giocatore.
// Per confrontare missioni fra loro basta; per dire «è facile» no.
(function () {
  const A = window.AGENT = { W: {}, stats: {} };
  A.W = {
    foeHp: 10, foeCount: 24, mechHp: 26, mechAlive: 150, exposeKill: 160, exposeHp: 16,
    approach: 2.5, civic: 14, relicStand: 50, relicDist: 3, relicDone: 80,
    pylonDist: 2, pylonDone: 80, pylonHp: 10, terrKill: 70, evac: 80, civAlive: 30, civExpose: 90,
    riftHp: 90, riftDist: 6, bossHp: 12, relayExpose: 90, relayHp: 20, bunkerExpose: 30,
    killBonus: 0, noise: 0.5,
  };
  // Livelli di abilità: stessa ricerca, ma con una percezione più povera.
  //  esperto  — vede tutte le minacce e sceglie quasi sempre la mossa migliore
  //  medio    — sottovaluta le minacce (×0,35) e sbaglia spesso (rumore 30)
  //  novizio  — ignora le minacce telegrafate e gioca quasi a caso fra le mosse buone (rumore 70)
  // Non pretendono di essere «un giocatore»: bracketano il giudizio. Se una missione
  // si vince solo da esperto, è dura; se la vince anche il novizio, è facile.
  A.SKILL = {
    esperto: {},
    medio: { exposeKill: 55, exposeHp: 6, noise: 30 },
    novizio: { exposeKill: 0, exposeHp: 0, noise: 70, approach: 4 },
  };
  A.setSkill = function (name) {
    if (!A._base) A._base = Object.assign({}, A.W);
    A.W = Object.assign({}, A._base, A.SKILL[name] || {});
  };
  const noop = () => {};

  // ── silenzio: niente DOM, niente animazioni, niente effetti sulla campagna ─────
  const real = {};
  function quiet() {
    for (const n of ['bRender', 'floatDmg', 'atkBanner', 'toast', 'commitUndo', 'endPlayer', 'finish', 'bDeselect']) {
      if (!(n in real)) real[n] = window[n];
    }
    window.bRender = noop; window.floatDmg = noop; window.atkBanner = noop; window.toast = noop;
    window.commitUndo = noop;
    window.bDeselect = function () { B.selected = null; B.selRange = null; B.inspected = null; B.aimed = null; B.abilityMode = null; };
    // pAttack & co. chiudono il turno da soli quando tutti hanno agito: qui lo decide l'agente
    window.endPlayer = function () { A._endRequested = true; };
    window.finish = function (victory, reason, retreat) {
      if (B.over) return; B.over = true; B.busy = true;
      B.result = { victory: !!victory, reason: reason || null, retreat: !!retreat };
    };
  }
  A.quiet = quiet;

  // ── cause di morte di civili e relay: chi li uccide, e a che round ─────────────
  A.causes = {};
  function hookDmg() {
    if (A._dmgHooked) return; A._dmgHooked = true;
    const orig = window.dmg;
    window.dmg = function (t, n, why) {
      const was = t && t.hp, hadGuscio = t && t._guscio;
      const r = orig.apply(this, arguments);
      // solo fuori dal turno del giocatore: dentro, le prove dell'agente su copie dello stato inquinerebbero il conto
      if (t && (t.civil || t.type === 'relay') && was > 0 && t.hp <= 0 && !hadGuscio && B.phase !== 'player') {
        const kind = t.civil ? 'civ' : 'relay';
        const w = String(why || '?').replace(/-[α-ωΑ-Ω]+/g, '').replace(/ ?\(scheggia\)/, ' (area)');
        const key = kind + ':' + w + '@r' + B.round + (B.phase ? '/' + B.phase : '');
        A.causes[key] = (A.causes[key] || 0) + 1;
      }
      return r;
    };
  }
  A.hook = hookDmg;

  // ── stato: snapshot del gioco + i campi che il giro dei Kaucha cambia ──────────
  function snap2() {
    const s = snapshot();
    s.round = B.round; s.over = B.over; s.busy = B.busy; s.phase = B.phase; s.awaitRetreat = B.awaitRetreat;
    s.maxRound = B.maxRound; s.uid = UID; s.result = B.result || null;
    return s;
  }
  function rest2(s) {
    restoreSnapshot(s);
    B.round = s.round; B.over = s.over; B.busy = s.busy; B.phase = s.phase; B.awaitRetreat = s.awaitRetreat;
    B.maxRound = s.maxRound; UID = s.uid; B.result = s.result; A._endRequested = false;
  }
  const unit = id => B.units.find(u => u.id === id);

  // ── minaccia telegrafata: casella → danno ─────────────────────────────────────
  function threatMap() {
    const m = new Map(); const bonus = kauchaDmgBonus();
    const add = (x, y, d) => { if (inb(x, y)) m.set(k(x, y), (m.get(k(x, y)) || 0) + d); };
    for (const u of kauchas()) {
      if (u.frozen > 0 || u.noAttack) continue;
      const d = u.dmg + bonus;
      const t = intentTile(u);
      if (t) { add(t[0], t[1], d); if (u.splash) for (const [dx, dy] of ORTH) add(t[0] + dx, t[1] + dy, d); }
      if (u.planCells) for (const [x, y] of u.planCells) add(x, y, d);
    }
    return m;
  }
  const sum = (a, f) => a.reduce((s, x) => s + f(x), 0);
  const minDist = (pts, p) => pts.length ? Math.min(...pts.map(q => Math.abs(q.x - p.x) + Math.abs(q.y - p.y))) : 0;

  // ── valutazione del campo ─────────────────────────────────────────────────────
  function score() {
    const W = A.W;
    if (B.over) return (B.result && B.result.victory) ? 1e6 + sum(mechs(), m => m.hp) * 100 : -1e6;
    const F = kauchas(), M = mechs();
    let s = 0;
    s -= W.foeHp * sum(F, f => f.hp) + W.foeCount * F.length;
    s += W.mechHp * sum(M, m => m.hp) + W.mechAlive * M.length;
    s -= W.civic * B.mission.civic;
    const thr = threatMap();
    for (const m of M) {
      const d = (thr.get(k(m.x, m.y)) || 0) - (m.guard || 0);
      if (d > 0) s -= (d >= m.hp + (m.scudoInt > 0 ? 1 : 0)) ? W.exposeKill : W.exposeHp * d;
    }
    // avvicinarsi: sempre un po', altrimenti nessuno si muove finché i nemici non arrivano
    if (F.length) for (const m of M) s -= W.approach * minDist(F, m);
    if (B.rift && B.rift.open) { s -= W.riftHp * B.rift.hp; for (const m of M) s -= W.riftDist * minDist([B.rift], m); }
    const goal = B.goal, mc = B.mission;
    if (goal === 'recover') {
      s += W.relicDone * mc.relics;
      for (const key of B.relics || []) {
        const [x, y] = key.split(',').map(Number); const o = unitAt(x, y);
        if (o && o.player && !o.structure) s += W.relicStand; else s -= W.relicDist * minDist(M, { x, y });
      }
    } else if (goal === 'demolish') {
      s += W.pylonDone * mc.pylons;
      for (const key of B.pylons || []) {
        const [x, y] = key.split(',').map(Number); const t = terrAt(x, y);
        s -= W.pylonHp * (t ? t.hp : 0) + W.pylonDist * minDist(M, { x, y });
      }
    } else if (goal === 'terrainKill') {
      s += W.terrKill * mc.terrainKills;
    } else if (goal === 'evacuate') {
      s += W.evac * mc.evacuated + W.civAlive * civilians().length;
      for (const c of civilians()) if ((thr.get(k(c.x, c.y)) || 0) > 0) s -= W.civExpose;
    } else if (goal === 'boss') {
      for (const f of F) if (f.type === 'matria' || f.type === 'palinsesto' || f.boss) s -= W.bossHp * f.hp;
    }
    const ry = relay();
    if (ry) { if ((thr.get(k(ry.x, ry.y)) || 0) > 0) s -= W.relayExpose; s += W.relayHp * ry.hp; }
    for (const b of living().filter(v => v.type === 'bunker')) if ((thr.get(k(b.x, b.y)) || 0) > 0) s -= W.bunkerExpose;
    return s + (A.rng() - 0.5) * W.noise;
  }
  // rumore del punteggio: un generatore a parte, così non consuma il flusso del gioco
  let _ns = 12345;
  A.rng = () => (_ns = (Math.imul(_ns, 1664525) + 1013904223) >>> 0) / 4294967296;
  A.seedNoise = n => { _ns = (n >>> 0) || 12345; };

  // ── azioni di un mech ─────────────────────────────────────────────────────────
  function actionsFor(m) {
    const acts = [];
    const cells = [[m.x, m.y]];
    if (!m.moved && m.move > 0) for (const key of moveRange(m).keys()) cells.push(key.split(',').map(Number));
    const foes = kauchas();
    const dark = typeof alBuio === 'function' && alBuio(m);
    for (const c of cells) {
      acts.push({ cell: c, t: null });
      if (m.attacked || dark || m.rmax === 0) continue;
      const inR = (x, y) => { const d = Math.abs(c[0] - x) + Math.abs(c[1] - y); return d >= m.rmin && d <= m.rmax; };
      for (const f of foes) if (inR(f.x, f.y)) acts.push({ cell: c, t: { kind: 'unit', id: f.id } });
      if (B.rift && B.rift.open && inR(B.rift.x, B.rift.y)) acts.push({ cell: c, t: { kind: 'rift' } });
      for (const key of B.terrain.keys()) {
        const [x, y] = key.split(',').map(Number);
        if (terrTargetable(x, y) && inR(x, y)) acts.push({ cell: c, t: { kind: 'terr', x, y } });
      }
    }
    return acts;
  }
  async function apply(id, a) {
    const m = unit(id); if (!m) return;
    if (a.cell[0] !== m.x || a.cell[1] !== m.y) { m.passiFatti = Math.abs(a.cell[0] - m.x) + Math.abs(a.cell[1] - m.y); m.x = a.cell[0]; m.y = a.cell[1]; }
    m.moved = true;
    if (!a.t) { m.attacked = true; return; }   // «ho finito»: niente attacco
    if (a.t.kind === 'unit') { const f = unit(a.t.id); if (f && f.hp > 0) await pAttack(m, f); else m.attacked = true; }
    else if (a.t.kind === 'rift') await pRift(m);
    else await pAttackTerr(m, a.t.x, a.t.y);
    B.busy = false;
  }

  // ── un turno: greedy, la migliore azione fra tutti i mech ancora liberi ───────
  async function planTurn() {
    const done = new Set();
    for (let iter = 0; iter < 8 && !B.over; iter++) {
      const free = mechs().filter(m => !m.attacked && !done.has(m.id));
      if (!free.length) break;
      const base = snap2();
      let best = null;
      for (const m0 of free) {
        const id = m0.id;
        // dopo ogni ripristino le unità sono oggetti nuovi: si rilegge per id
        for (const a of actionsFor(unit(id))) {
          await apply(id, a);
          const sc = score();
          if (!best || sc > best.sc) best = { id, a, sc };
          rest2(base);
        }
      }
      if (!best) break;
      await apply(best.id, best.a);
      done.add(best.id);
      A.stats.actions = (A.stats.actions || 0) + 1;
    }
  }

  const wait = async (c, ms = 5000) => { const t = Date.now(); while (!c()) { if (Date.now() - t > ms) return false; await new Promise(r => setTimeout(r, 0)); } return true; };

  // ── una missione intera ───────────────────────────────────────────────────────
  A.play = async function (missionId, opts) {
    opts = opts || {};
    quiet(); hookDmg(); RITMO = 0; A.causes = {};
    if (typeof opts.seed === 'number') { window.__setSeed(opts.seed); A.seedNoise(opts.seed * 7919 + 17); }
    const m = MISSIONS.find(x => x.id === missionId);
    /* Stato di campagna. Il generatore dipende da `cleared` (escalation: +1,5 per nodo, budget
       fino a +10, élite nei pool) e da `currentSector` (il gate del bestiario conta per settore).
       'inizio'   = come si apre il gioco (solo m1 contenuta): VALE SOLO PER Cassandra.
       'campagna' = settori precedenti contenuti + antenati del nodo nel suo settore. */
    window.__campagnaOrig = window.__campagnaOrig || { cleared: new Set(cleared), sector: currentSector };
    cleared.clear(); window.__campagnaOrig.cleared.forEach(id => cleared.add(id));
    currentSector = m.sector;
    if (opts.progress !== 'inizio') {
      const i = SECTORS.findIndex(s => s.id === m.sector);
      MISSIONS.filter(x => SECTORS.findIndex(s => s.id === x.sector) < i).forEach(x => cleared.add(x.id));
      const anc = new Set(), st = [missionId];
      while (st.length) { const id = st.pop(); EDGES.filter(([a, b]) => b === id).forEach(([a]) => { if (!anc.has(a)) { anc.add(a); st.push(a); } }); }
      if (m.boss) sectorNodes(m.sector).filter(x => !x.boss).forEach(x => anc.add(x.id));
      anc.forEach(id => cleared.add(id));
    }
    if (opts.noise0) A.W.noise = 0;
    if (opts.resume) {
      // riprende da un checkpoint salvato dal gioco (stringa JSON): niente startBattle
      localStorage.setItem(chiaveBattaglia(slotAttivo), opts.resume);
      if (!ripristinaBattaglia()) return { id: missionId, error: 'ripristino fallito' };
    } else { activeMission = m; startBattle(m); }
    const out = { id: missionId, seed: opts.seed, mode: opts.mode || 'smart', turns: 0, error: null };
    try {
      out.mechs0 = mechs().length; out.hp0 = sum(mechs(), u => u.hp); out.foes0 = kauchas().length; out.foeHp0 = sum(kauchas(), u => u.hp);
      out.goal = B.goal; out.maxRound = B.maxRound;
      let guard = 0;
      while (!B.over && guard++ < 40) {
        if (!(await wait(() => B.over || B.awaitRetreat || (B.phase === 'player' && !B.busy), 4000))) { out.error = 'stuck phase=' + B.phase; break; }
        if (B.over) break;
        if (opts.stopAtTurn && !opts.resume && out.turns + 1 === opts.stopAtTurn) {
          out.checkpoint = localStorage.getItem(chiaveBattaglia(slotAttivo)); out.stoppedAt = out.turns + 1; return out;
        }
        if (B.awaitRetreat) { B.awaitRetreat = false; B.over = true; B.result = { victory: false, reason: 'timeout', retreat: true }; break; }
        out.turns++;
        // al primo turno: cosa è già puntato, PRIMA che il giocatore faccia qualcosa
        if (out.turns === 1) {
          const thr = threatMap(), ry = relay();
          out.relayHp0 = ry ? ry.hp : null; out.relayThr0 = ry ? (thr.get(k(ry.x, ry.y)) || 0) : null;
          out.civ0 = civilians().length; out.civThr0 = civilians().filter(c => (thr.get(k(c.x, c.y)) || 0) > 0).length;
          out.evacGoal = B.evacGoal || 0; out.attackers0 = kauchas().filter(u => intentTile(u)).length;
          out.minDistRelay0 = ry ? Math.min(...kauchas().map(f => Math.abs(f.x - ry.x) + Math.abs(f.y - ry.y))) : null;
          // chi colpisce il relay: [danno, distanza dal mech più vicino] — serve a decidere chi si può fermare
          if (ry) {
            const hit = [];
            for (const f of kauchas()) {
              const t = intentTile(f); const cells = [];
              if (t) { cells.push(t); if (f.splash) ORTH.forEach(([dx, dy]) => cells.push([t[0] + dx, t[1] + dy])); }
              (f.planCells || []).forEach(c => cells.push(c));
              if (cells.some(c => c[0] === ry.x && c[1] === ry.y)) hit.push([f.dmg + kauchaDmgBonus(), Math.min(...mechs().map(m => Math.abs(m.x - f.x) + Math.abs(m.y - f.y)))]);
            }
            out.relayAtt = hit;
          }
        }
        if (opts.mode !== 'idle') await planTurn();
        if (out.turns === 1) {
          const thr = threatMap(), ry = relay();
          out.relayThr1 = ry ? (thr.get(k(ry.x, ry.y)) || 0) : null;
          out.civThr1 = civilians().filter(c => (thr.get(k(c.x, c.y)) || 0) > 0).length;
        }
        if (B.over) break;
        A._endRequested = false;
        // il turno si chiude: si lancia direttamente la fase Kaucha
        bDeselect(); execPhase();
        await wait(() => B.over || B.awaitRetreat || (B.phase === 'player' && !B.busy && B.round > 0), 4000);
        await new Promise(r => setTimeout(r, 0));
      }
      const r = B.result || (B.awaitRetreat ? { victory: false, reason: 'timeout' } : null);
      out.victory = !!(r && r.victory); out.reason = r ? r.reason : (B.over ? 'unknown' : 'notover');
      out.rounds = B.round; out.mechsLeft = mechs().length; out.hpLeft = sum(mechs(), u => u.hp);
      out.foesLeft = kauchas().length; out.civic = B.mission.civic; out.pushes = B.mission.pushCount;
      out.terrainKills = B.mission.terrainKills; out.drowned = B.mission.drowned; out.evacuated = B.mission.evacuated;
      out.relics = B.mission.relics; out.pylons = B.mission.pylons;
      out.causes = A.causes;
    } catch (e) { out.error = 'EXC ' + e.message + ' @ ' + ((e.stack || '').split('\n')[1] || ''); }
    return out;
  };
})();
