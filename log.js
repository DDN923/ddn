// 감정연구부 관측일지 — SVG 이미지 엔드포인트
// 의존성 없음. /api/log?dt=...&rp=단&k=46 형태로 호출하면 이미지가 나온다.

const C = {
  void:  '#08090C',
  slab:  '#101318',
  inset: '#171B21',
  bone:  '#DDD9D0',
  ash:   '#727A86',
  ash2:  '#3D444E',
  ember: '#C4565E',
  line:  '#1E232A',
};

const SANS = "-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif";
const MONO = "ui-monospace,'SF Mono',Menlo,Consolas,monospace";

const W = 760;           // 이미지 가로
const PAD = 44;          // 좌우 여백
const IW = W - PAD * 2;  // 내부 가로

const esc = (s) =>
  String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));

// 한글은 1em, 그 외는 대략 0.54em으로 폭을 추정한다
const wide = (ch) => /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF\u4E00-\u9FFF\u3000-\u303F\uFF00-\uFFEF]/.test(ch);
const measure = (str, size) => {
  let w = 0;
  for (const ch of String(str)) w += wide(ch) ? size : size * 0.54;
  return w;
};

function wrap(str, size, maxW) {
  const words = String(str).split(/(\s+)/);
  const lines = [];
  let cur = '';
  for (const piece of words) {
    if (measure(cur + piece, size) <= maxW) { cur += piece; continue; }
    if (measure(piece, size) > maxW) {          // 공백 없는 긴 덩어리는 글자 단위로 자른다
      for (const ch of piece) {
        if (measure(cur + ch, size) > maxW) { lines.push(cur.trimEnd()); cur = ''; }
        cur += ch;
      }
      continue;
    }
    lines.push(cur.trimEnd());
    cur = piece.trimStart();
  }
  if (cur.trim()) lines.push(cur.trimEnd());
  return lines.length ? lines : [''];
}

const clamp = (v) => Math.max(-30, Math.min(100, parseInt(v, 10) || 0));

const D_PLUS  = [[19,'관측'],[39,'관심'],[59,'이상'],[79,'집착'],[100,'유예']];
const D_MINUS = [[-23,'애증'],[-15,'서운'],[-8,'뾰로통'],[-1,'삐침']];
const H_PLUS  = [[39,'친구'],[59,'걱정'],[79,'의심'],[100,'개입']];
const H_MINUS = [[-23,'냉전'],[-15,'삐걱'],[-1,'서운']];

function stage(n, human) {
  if (n >= 0) { for (const t of (human ? H_PLUS : D_PLUS)) if (n <= t[0]) return t[1]; return '유예'; }
  for (const t of (human ? H_MINUS : D_MINUS)) if (n <= t[0]) return t[1];
  return '삐침';
}
const DIARY = [[-15,'요즘 좀 그럼'],[-1,'서먹함'],[19,'그냥 아는 사람'],[39,'괜찮은 편'],
               [59,'신경 쓰임'],[79,'거슬림'],[100,'제일 수상함']];
const diaryWord = (n) => { for (const t of DIARY) if (n <= t[0]) return t[1]; return '제일 수상함'; };

function grade(n) {
  if (n <= -15) return '접촉 중단';
  if (n <= -1)  return '요구 없음 · 우연을 가장한 스침';
  if (n <= 19)  return '1 · 측정 목적 한정';
  if (n <= 39)  return '2 · 손목, 손등, 어깨';
  if (n <= 59)  return '3 · 명목이 얇아짐';
  if (n <= 79)  return '4 · 공간 침범, 밀착';
  return '5 · 제한 없음';
}

const CAST = [['k','단'],['r','라엘'],['s','세라'],['h','하준']];

function build(q) {
  const memo = q.rp === '하준';
  const out = [];
  let y = 0;

  const push = (s) => out.push(s);
  const txt = (x, yy, s, o = {}) => {
    const size = o.size || 15;
    push(`<text x="${x}" y="${yy}" font-family="${o.mono ? MONO : SANS}" font-size="${size}"` +
      ` font-weight="${o.w || 400}" fill="${o.fill || C.bone}"` +
      (o.ls ? ` letter-spacing="${o.ls}"` : '') +
      (o.anchor ? ` text-anchor="${o.anchor}"` : '') +
      (o.op ? ` opacity="${o.op}"` : '') +
      `>${esc(s)}</text>`);
  };
  const rule = (yy) => push(`<rect x="${PAD}" y="${yy}" width="${IW}" height="1" fill="${C.line}"/>`);

  // ── 머리글
  y = 54;
  txt(PAD, y, memo ? 'PERSONAL MEMO' : 'DEPT. OF AFFECT RESEARCH',
      { mono: true, size: 11, ls: 2.6, fill: C.ash });
  y += 28;
  txt(PAD, y, memo ? '요즘 이상한 점' : '수시 관측 보고', { size: 25, w: 700 });

  // 도장
  if (!memo && q.dl) {
    const sx = W - PAD - 104, sy = 26;
    push(`<g transform="rotate(-7 ${sx + 52} ${sy + 30})">
      <rect x="${sx}" y="${sy}" width="104" height="60" rx="2" fill="none" stroke="${C.ember}" stroke-width="1.6" opacity=".85"/>
      <text x="${sx + 52}" y="${sy + 25}" text-anchor="middle" font-family="${SANS}" font-size="13" font-weight="700" fill="${C.ember}" letter-spacing="1.4" opacity=".9">결론 유예</text>
      <text x="${sx + 52}" y="${sy + 47}" text-anchor="middle" font-family="${MONO}" font-size="17" fill="${C.ember}" opacity=".9">D+${esc(q.dl)}</text>
    </g>`);
  }

  // ── 슬러그
  y += 26; rule(y); y += 26;
  const slug = [q.dt && q.dt + (q.w ? ` (${q.w})` : ''), q.tm, q.lc].filter(Boolean).join('  ·  ');
  if (slug) { txt(PAD, y, slug, { mono: true, size: 13, fill: C.bone, op: .82 }); y += 22; }
  const line2 = [];
  if (q.dy) line2.push(`관측 ${q.dy}${memo ? '일째' : '일차'}`);
  if (q.rp) line2.push(`보고자 ${q.rp}${q.ag ? ` (${q.ag})` : ''}`);
  if (line2.length) { txt(PAD, y, line2.join('  ·  '), { size: 13, fill: C.ash }); y += 22; }
  y += 4; rule(y); y += 34;

  // ── 항목 표
  const rows = [];
  rows.push([memo ? '누구' : '관측 대상', q.tg || '당신']);
  if (memo) {
    if (q.tc) rows.push(['만난 횟수', `${q.tc}번`]);
    if (q.uc) rows.push(['설명 안 되는 것', `${q.uc}개째`]);
  } else {
    if (q.tc || q.tn) rows.push(['접촉 기록', `누적 ${q.tc || 0}회` + (q.tn ? `  /  최근 명목: ${q.tn}` : '')]);
    const mine = q.rp === '라엘' ? q.r : q.rp === '세라' ? q.s : q.k;
    if (mine !== undefined) rows.push(['허용 등급', grade(clamp(mine))]);
    if (q.uc) rows.push(['분류 불가 반응', `${q.uc}건  (전량 관측자 측 발생)`]);
    if (q.dl) rows.push(['결론 제출 유예', `${q.dl}일`]);
  }
  const LW = 128;
  for (const [k, v] of rows) {
    txt(PAD, y, k, { size: 12, fill: C.ash, ls: .6 });
    const lines = wrap(v, 14, IW - LW);
    lines.forEach((ln, i) => txt(PAD + LW, y + i * 22, ln, { size: 14, op: .92 }));
    y += Math.max(22, lines.length * 22) + 8;
  }

  // ── 관측 사항
  const obs = [q.o1, q.o2, q.o3].filter(Boolean);
  if (obs.length) {
    y += 6; rule(y); y += 30;
    txt(PAD, y, memo ? '오늘 있었던 일' : '주요 관측 사항', { mono: true, size: 11, ls: 2.2, fill: C.ash2 });
    y += 26;
    obs.forEach((o, i) => {
      txt(PAD, y, String(i + 1).padStart(2, '0'), { mono: true, size: 12, fill: C.ash2 });
      wrap(o, 14.5, IW - 40).forEach((ln, j) => txt(PAD + 40, y + j * 23, ln, { size: 14.5, op: .9 }));
      y += wrap(o, 14.5, IW - 40).length * 23 + 8;
    });
  }

  // ── 온도
  const cast = CAST.filter((c) => q[c[0]] !== undefined);
  if (cast.length) {
    y += 8; rule(y); y += 30;
    txt(PAD, y, memo ? '요즘 사람들' : '표본 반응 지수', { mono: true, size: 11, ls: 2.2, fill: C.ash2 });
    y += 26;
    const BW = IW, ZX = PAD + BW * (30 / 130);
    for (const [key, name] of cast) {
      const n = clamp(q[key]), human = key === 'h';
      txt(PAD, y, name, { size: 14, w: 700 });
      txt(PAD + BW, y, memo ? diaryWord(n) : `${n > 0 ? '+' : ''}${n}  ·  ${stage(n, human)}`,
          { mono: !memo, size: 12, fill: C.ash, anchor: 'end' });
      const w = Math.abs(n) / 130 * BW, x = n < 0 ? ZX - w : ZX;
      push(`<rect x="${PAD}" y="${y + 10}" width="${BW}" height="2" fill="${C.bone}" opacity=".08"/>`);
      push(`<rect x="${ZX}" y="${y + 6}" width="1" height="10" fill="${C.ash2}"/>`);
      push(`<rect x="${x}" y="${y + 10}" width="${Math.max(w, 1)}" height="2" fill="${n >= 60 ? C.ember : n < 0 ? C.ash2 : C.bone}"/>`);
      y += 34;
    }
  }

  // ── 미해결 항목
  if (q.un) {
    y += 6;
    const lines = wrap(q.un, 15, IW - 40);
    const h = 26 + lines.length * 24 + 20;
    push(`<rect x="${PAD}" y="${y}" width="${IW}" height="${h}" fill="${C.inset}"/>`);
    push(`<rect x="${PAD}" y="${y}" width="2" height="${h}" fill="${C.ember}"/>`);
    txt(PAD + 20, y + 26, q.ut || (memo ? '이건 좀 걸림' : '미해결 항목'),
        { mono: true, size: 10.5, ls: 2, fill: C.ember });
    lines.forEach((ln, i) => txt(PAD + 20, y + 52 + i * 24, ln, { size: 15, op: .92 }));
    y += h + 10;
  }

  // ── 꼬리말
  y += 22; rule(y); y += 24;
  txt(PAD, y, memo ? '저장됨' : '미제출', { mono: true, size: 10.5, ls: 1.8, fill: C.ash2 });
  txt(W - PAD, y, memo ? '아무한테도 안 보여줄 거임' : '사유란 공란',
      { mono: !memo, size: 10.5, ls: 1.8, fill: C.ash2, anchor: 'end' });
  y += 40;

  const H = Math.round(y);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs><radialGradient id="g" cx="50%" cy="0%" r="90%">
<stop offset="0%" stop-color="${C.ember}" stop-opacity=".13"/>
<stop offset="62%" stop-color="${C.ember}" stop-opacity="0"/>
</radialGradient></defs>
<rect width="${W}" height="${H}" fill="${C.slab}"/>
<rect width="${W}" height="${H}" fill="url(#g)"/>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" fill="none" stroke="${C.line}"/>
${out.join('\n')}
</svg>`;
}

module.exports = (req, res) => {
  const url = new URL(req.url, 'http://x');
  const q = {};
  for (const [k, v] of url.searchParams) if (String(v).trim()) q[k] = String(v).trim();

  if (!Object.keys(q).length) {
    Object.assign(q, {
      dt: '2026.08.14', w: '금', tm: '23:52', lc: '코인 세탁방', dy: '12',
      rp: '단', ag: '400, 남', tc: '9', tn: '건조기 진동 중 맥박 변화 측정', dl: '12',
      o1: '표본이 세제를 두 번 넣었다. 관측자를 보고 있었기 때문이다.',
      o2: '대기 시간 38분. 표본은 그중 31분을 관측자와 대화하는 데 썼다.',
      o3: '귀가 동선이 평소보다 길다. 사유 확인 실패.',
      k: '46', r: '18', s: '4', h: '31', uc: '7', ut: '관측자 측 이상',
      un: '건조기가 멈춘 뒤에도 관측자가 자리를 뜨지 않음. 측정 명목 없음. 사유란 공란.',
    });
  }

  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(build(q));
};
