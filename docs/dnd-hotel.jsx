// Drag-and-drop reorder + hotel search
// Exposes: useDragReorder, HotelSearchSheet

// ─── Drag reorder hook ──────────────────────────────────────
// Touch long-press to drag + HTML5 drag for desktop.
// onReorder(fromIdx, toIdx) called on drop.
function useDragReorder(onReorder, enabled=true) {
  // HTML5 (desktop)
  const [dragIdx, setDragIdx] = React.useState(null);
  const [overIdx, setOverIdx] = React.useState(null);

  // Touch long-press drag
  const [td, setTd] = React.useState(null); // {from,to,dy,startY,itemH}
  const tdRef = React.useRef(null);
  const timerRef = React.useRef(null);
  const elRefs = React.useRef({});

  React.useEffect(() => { tdRef.current = td; }, [td]);

  // Prevent body scroll while touch-dragging
  React.useEffect(() => {
    if (!td) return;
    const stop = (e) => e.preventDefault();
    document.addEventListener('touchmove', stop, { passive: false });
    return () => document.removeEventListener('touchmove', stop);
  }, [!!td]);

  const containerProps = {};

  const itemProps = (idx) => {
    // Touch handlers — always active regardless of `enabled`
    const onTouchStart = (e) => {
      const startY = e.touches[0].clientY;
      timerRef.current = setTimeout(() => {
        const el = elRefs.current[idx];
        const itemH = el ? el.getBoundingClientRect().height : 64;
        if (window.navigator?.vibrate) window.navigator.vibrate(14);
        setTd({ from: idx, to: idx, dy: 0, startY, itemH });
      }, 430);
    };
    const onTouchMove = (e) => {
      clearTimeout(timerRef.current);
      const d = tdRef.current;
      if (!d) return;
      const dy = e.touches[0].clientY - d.startY;
      const count = Object.keys(elRefs.current).length;
      const steps = Math.round(dy / d.itemH);
      const to = Math.max(0, Math.min(count - 1, d.from + steps));
      setTd(prev => prev ? { ...prev, dy, to } : null);
    };
    const onTouchEnd = () => {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      const d = tdRef.current;
      if (d) {
        if (d.from !== d.to) onReorder(d.from, d.to);
        setTd(null);
      }
    };

    // Visual style
    let style = {};
    if (td) {
      const { from, to, dy, itemH } = td;
      if (idx === from) {
        style = {
          transform: `translateY(${dy}px) scale(1.035)`,
          transition: 'transform 0s, box-shadow 0.15s, opacity 0.15s',
          zIndex: 50, opacity: 0.92, position: 'relative',
          boxShadow: '0 16px 40px rgba(0,0,0,0.24), 0 4px 8px rgba(0,0,0,0.12)',
        };
      } else {
        let shift = 0;
        if (from < to && idx > from && idx <= to) shift = -itemH;
        else if (from > to && idx >= to && idx < from) shift = itemH;
        const isTarget = from !== to && idx === to;
        style = {
          transform: `translateY(${shift}px)`,
          transition: 'transform 0.24s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.18s ease, background 0.18s ease',
          position: 'relative',
          ...(isTarget ? {
            outline: '2.5px solid #C14F2E',
            outlineOffset: '2px',
            background: 'rgba(193,79,46,0.07)',
          } : {}),
        };
      }
    } else if (enabled) {
      style = {
        opacity: dragIdx === idx ? 0.35 : 1,
        transition: 'opacity 0.15s, transform 0.15s',
        transform: overIdx === idx && dragIdx !== idx ? 'translateY(-2px)' : 'none',
      };
    }

    // HTML5 drag (desktop, gated by enabled)
    const html5 = !enabled ? {} : {
      draggable: true,
      onDragStart: (e) => {
        setDragIdx(idx);
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', String(idx)); } catch (_) {}
        const el = e.currentTarget;
        if (el && e.dataTransfer.setDragImage) e.dataTransfer.setDragImage(el, 20, 20);
      },
      onDragOver: (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (overIdx !== idx) setOverIdx(idx); },
      onDragEnter: (e) => { e.preventDefault(); setOverIdx(idx); },
      onDrop: (e) => {
        e.preventDefault();
        const from = dragIdx, to = idx;
        setDragIdx(null); setOverIdx(null);
        if (from == null || from === to) return;
        onReorder(from, to);
      },
      onDragEnd: () => { setDragIdx(null); setOverIdx(null); },
    };

    return {
      ref: (el) => { elRefs.current[idx] = el; },
      onTouchStart, onTouchMove, onTouchEnd,
      ...html5,
      style,
      'data-drag-over': !td && enabled && overIdx === idx && dragIdx !== null && dragIdx !== idx,
    };
  };

  return { containerProps, itemProps, dragIdx: td ? td.from : dragIdx, overIdx: td ? td.to : overIdx };
}

// ─── Drag handle component ──────────────────────────────────
function DragHandle({ size=18, color='#7A756D' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{cursor:'grab'}}>
      <circle cx="9" cy="6" r="1.4"/><circle cx="15" cy="6" r="1.4"/>
      <circle cx="9" cy="12" r="1.4"/><circle cx="15" cy="12" r="1.4"/>
      <circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="18" r="1.4"/>
    </svg>
  );
}

// ─── Sample hotel database (since we can't hit a real API) ──
// Would normally be Booking.com / Google Places API.
const SAMPLE_HOTELS = [
  { name:'Kimpton Theta New York',        area:'Times Square',       stars:4, price:'$289', tags:['boutique','central'] },
  { name:'The Manhattan at Times Square', area:'Times Square',       stars:3, price:'$199', tags:['classic','central'] },
  { name:'The Standard High Line',        area:'Meatpacking',        stars:4, price:'$359', tags:['design','views'] },
  { name:'Ace Hotel New York',            area:'NoMad',              stars:4, price:'$329', tags:['design','lobby'] },
  { name:'The Hoxton, Williamsburg',      area:'Brooklyn',           stars:4, price:'$269', tags:['brooklyn','design'] },
  { name:'citizenM New York Times Square',area:'Times Square',       stars:4, price:'$259', tags:['modern','compact'] },
  { name:'Moxy Times Square',             area:'Times Square',       stars:3, price:'$229', tags:['rooftop','young'] },
  { name:'The Ludlow Hotel',              area:'Lower East Side',    stars:4, price:'$389', tags:['lounge','trendy'] },
  { name:'1 Hotel Central Park',          area:'Midtown',            stars:5, price:'$549', tags:['eco','luxe'] },
  { name:'Park Hyatt New York',           area:'Midtown West',       stars:5, price:'$899', tags:['luxe','spa'] },
  { name:'Pod 51 Hotel',                  area:'Midtown East',       stars:3, price:'$159', tags:['budget','pod'] },
  { name:'Yotel New York',                area:"Hell's Kitchen",     stars:3, price:'$189', tags:['compact','tech'] },
  { name:'The Bowery Hotel',              area:'East Village',       stars:4, price:'$449', tags:['boutique','classic'] },
  { name:'NoMad Hotel',                   area:'NoMad',              stars:5, price:'$519', tags:['library','luxe'] },
  { name:'Arlo SoHo',                     area:'SoHo',               stars:3, price:'$239', tags:['design','views'] },
  { name:'The Beekman, A Thompson Hotel', area:'Financial District', stars:5, price:'$479', tags:['historic','luxe'] },
];

// Simulated "found in email/calendar" hotels — matching the trip dates
const MAILBOX_HOTELS = [
  {
    name:'Kimpton Theta New York',
    area:'Times Square',
    checkin:'May 4, 2025',
    checkout:'May 13, 2025',
    confirmation:'BK-8471293',
    source:'Booking.com 예약 확인 · 2025-03-18',
    price:'$289/박 × 9박',
  },
];

// ─── Hotel search sheet ─────────────────────────────────────
function HotelSearchSheet({ COLORS, SERIF, SANS, MONO, Icon, onPick, onClose }) {
  const [q, setQ] = React.useState('');
  const [tab, setTab] = React.useState('search'); // search | mailbox
  const [scanning, setScanning] = React.useState(false);
  const [found, setFound] = React.useState(null);

  const filtered = SAMPLE_HOTELS.filter(h =>
    !q || h.name.toLowerCase().includes(q.toLowerCase()) ||
    h.area.toLowerCase().includes(q.toLowerCase()) ||
    h.tags.some(t => t.includes(q.toLowerCase()))
  );

  const scanMailbox = () => {
    setScanning(true); setFound(null);
    // Simulate scan
    const steps = [
      '이메일 스캔 중…',
      '캘린더 이벤트 확인 중…',
      '예약 확인 메일 분석 중…',
      '일정과 매칭 중…',
    ];
    let i = 0;
    const t = setInterval(() => {
      i++;
      if (i >= steps.length) {
        clearInterval(t);
        setScanning(false);
        setFound(MAILBOX_HOTELS);
      }
    }, 600);
  };

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:110, background:'rgba(0,0,0,0.35)',
      display:'flex', flexDirection:'column', justifyContent:'flex-end',
    }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:COLORS.bg, borderRadius:'22px 22px 0 0',
        maxHeight:'90%', display:'flex', flexDirection:'column',
      }}>
        <div style={{ display:'flex', justifyContent:'center', padding:'8px 0 4px' }}>
          <div style={{ width:36, height:4, background:COLORS.line, borderRadius:2 }}/>
        </div>

        <div style={{ padding:'6px 20px 8px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
          <div style={{ fontFamily:SERIF, fontSize:24, color:COLORS.ink, flex:1, whiteSpace:'nowrap' }}>호텔 검색</div>
          <button onClick={onClose} style={{
            width:28, height:28, borderRadius:14, border:'none',
            background:COLORS.card, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <Icon name="x" size={14} color={COLORS.mute} stroke={2}/>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ padding:'0 16px 10px', display:'flex', gap:6 }}>
          {[
            { id:'search',  label:'검색' },
            { id:'mailbox', label:'이메일·캘린더에서 찾기' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex:1, border:'none', borderRadius:10, padding:'9px 10px',
              background: tab === t.id ? COLORS.ink : COLORS.card,
              color:      tab === t.id ? COLORS.bg  : COLORS.ink,
              fontFamily:SANS, fontSize:12, fontWeight:500, cursor:'pointer',
            }}>{t.label}</button>
          ))}
        </div>

        {tab === 'search' ? (
          <>
            <div style={{ padding:'0 16px 10px' }}>
              <div style={{
                background:COLORS.card, borderRadius:10, padding:'10px 12px',
                display:'flex', gap:8, alignItems:'center',
              }}>
                <Icon name="search" size={14} color={COLORS.mute} stroke={1.8}/>
                <input autoFocus value={q} onChange={e=>setQ(e.target.value)}
                  placeholder="호텔명, 지역, 스타일"
                  style={{ border:'none', outline:'none', background:'transparent',
                    flex:1, fontFamily:SANS, fontSize:13, color:COLORS.ink }}/>
              </div>
            </div>
            <div style={{ flex:1, overflow:'auto', padding:'0 16px 40px' }}>
              <div style={{ background:COLORS.card, borderRadius:14, overflow:'hidden' }}>
                {filtered.map((h, i) => (
                  <button key={i}
                    onClick={() => { onPick(h.name + ' (' + h.area + ')'); onClose(); }}
                    style={{
                      width:'100%', border:'none', background:'transparent',
                      padding:'12px 14px', textAlign:'left', cursor:'pointer',
                      borderBottom: i < filtered.length-1 ? `1px solid ${COLORS.line}` : 'none',
                    }}>
                    <div style={{ display:'flex', gap:8, alignItems:'baseline', justifyContent:'space-between' }}>
                      <div style={{ fontFamily:SANS, fontSize:13.5, color:COLORS.ink, fontWeight:500 }}>
                        {h.name}
                      </div>
                      <div style={{ fontFamily:MONO, fontSize:10.5, color:COLORS.accent, flexShrink:0 }}>
                        {h.price}
                      </div>
                    </div>
                    <div style={{ marginTop:3, fontFamily:SANS, fontSize:11.5, color:COLORS.mute,
                      display:'flex', gap:6, alignItems:'center' }}>
                      <Icon name="pin" size={11} stroke={1.8}/>
                      <span>{h.area}</span>
                      <span style={{ opacity:0.4 }}>·</span>
                      <span>{'★'.repeat(h.stars)}{'☆'.repeat(5-h.stars)}</span>
                    </div>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <div style={{ padding:20, fontFamily:SANS, fontSize:13, color:COLORS.mute, textAlign:'center' }}>
                    결과 없음
                  </div>
                )}
              </div>
              <div style={{ marginTop:10, padding:'10px 12px', background:COLORS.softer, borderRadius:10,
                fontFamily:SANS, fontSize:11, color:COLORS.mute, lineHeight:1.45 }}>
                💡 실제 앱에서는 Booking.com·Expedia·Google Places API에서 실시간 가격과 가용 객실을 가져옵니다.
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex:1, overflow:'auto', padding:'0 16px 40px' }}>
            {!scanning && !found && (
              <div style={{ background:COLORS.card, borderRadius:14, padding:18 }}>
                <div style={{ fontFamily:SERIF, fontSize:18, color:COLORS.ink, lineHeight:1.3 }}>
                  이메일과 캘린더에서 호텔 예약을 자동으로 찾아드려요
                </div>
                <div style={{ marginTop:8, fontFamily:SANS, fontSize:12.5, color:COLORS.mute, lineHeight:1.5 }}>
                  여행 기간(May 4–13, 2025)에 맞는 호텔 예약 확인 메일을 스캔합니다.
                  Booking.com, Agoda, Expedia 등의 확인 메일과 Google 캘린더 이벤트를 분석해요.
                </div>
                <button onClick={scanMailbox} style={{
                  marginTop:14, width:'100%', border:'none', cursor:'pointer',
                  background:COLORS.ink, color:COLORS.bg, borderRadius:12,
                  padding:'13px', fontFamily:SANS, fontSize:14, fontWeight:500,
                  display:'flex', gap:8, alignItems:'center', justifyContent:'center',
                }}>
                  <Icon name="search" size={14} color={COLORS.bg} stroke={1.8}/>
                  스캔 시작
                </button>
                <div style={{ marginTop:12, display:'flex', gap:6, flexWrap:'wrap' }}>
                  {['Gmail', 'Outlook', 'Google Calendar'].map(s => (
                    <span key={s} style={{
                      padding:'4px 8px', borderRadius:6, background:COLORS.softer,
                      fontFamily:MONO, fontSize:10, color:COLORS.mute, letterSpacing:'0.04em',
                    }}>{s}</span>
                  ))}
                </div>
                <div style={{ marginTop:14, padding:'10px 12px', background:COLORS.softer, borderRadius:10,
                  fontFamily:SANS, fontSize:11, color:COLORS.mute, lineHeight:1.45 }}>
                  ⚠️ 이 데모에서는 샘플 데이터를 반환해요. 실제 구현 시 OAuth로 Gmail·Google Calendar API에 접근합니다.
                </div>
              </div>
            )}

            {scanning && (
              <div style={{ background:COLORS.card, borderRadius:14, padding:24, textAlign:'center' }}>
                <div style={{ display:'inline-block',
                  width:36, height:36, borderRadius:18,
                  border:`2.5px solid ${COLORS.line}`,
                  borderTopColor: COLORS.accent,
                  animation:'spin 0.8s linear infinite',
                }}/>
                <div style={{ marginTop:14, fontFamily:SANS, fontSize:13, color:COLORS.ink }}>
                  메일함 스캔 중…
                </div>
                <div style={{ marginTop:4, fontFamily:MONO, fontSize:10, color:COLORS.mute, letterSpacing:'0.08em' }}>
                  GMAIL · CALENDAR · BOOKING CONFIRMATIONS
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}

            {found && (
              <>
                <div style={{ padding:'4px 4px 10px', fontFamily:MONO, fontSize:10,
                  color:COLORS.accent, letterSpacing:'0.12em' }}>
                  ✓ {found.length}개 예약 발견
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {found.map((h, i) => (
                    <button key={i}
                      onClick={() => { onPick(h.name + ' (' + h.area + ')'); onClose(); }}
                      style={{
                        background:COLORS.card, border:'none', borderRadius:14,
                        padding:'14px 16px', textAlign:'left', cursor:'pointer',
                      }}>
                      <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                        <div style={{ width:40, height:40, borderRadius:10, background:COLORS.softer,
                          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <Icon name="hotel" size={18} color={COLORS.ink} stroke={1.8}/>
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontFamily:SANS, fontSize:14, color:COLORS.ink, fontWeight:500 }}>
                            {h.name}
                          </div>
                          <div style={{ marginTop:2, fontFamily:SANS, fontSize:12, color:COLORS.mute }}>
                            {h.area}
                          </div>
                          <div style={{ marginTop:8, display:'grid',
                            gridTemplateColumns:'86px 1fr', gap:'3px 10px',
                            fontFamily:MONO, fontSize:10, color:COLORS.mute, letterSpacing:'0.04em',
                          }}>
                            <span style={{ whiteSpace:'nowrap' }}>CHECK-IN</span><span style={{ color:COLORS.ink }}>{h.checkin}</span>
                            <span style={{ whiteSpace:'nowrap' }}>CHECKOUT</span><span style={{ color:COLORS.ink }}>{h.checkout}</span>
                            <span style={{ whiteSpace:'nowrap' }}>예약번호</span><span style={{ color:COLORS.ink }}>{h.confirmation}</span>
                            <span style={{ whiteSpace:'nowrap' }}>요금</span>    <span style={{ color:COLORS.ink }}>{h.price}</span>
                          </div>
                          <div style={{ marginTop:8, fontFamily:SANS, fontSize:10.5, color:COLORS.mute, fontStyle:'italic' }}>
                            출처: {h.source}
                          </div>
                        </div>
                      </div>
                      <div style={{ marginTop:10, padding:'8px 10px', background:COLORS.softer, borderRadius:8,
                        fontFamily:SANS, fontSize:11.5, color:COLORS.ink, textAlign:'center', fontWeight:500 }}>
                        이 호텔로 설정하기 →
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { useDragReorder, DragHandle, HotelSearchSheet });
