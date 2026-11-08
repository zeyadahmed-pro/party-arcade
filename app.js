(() => {
  const GAMES = [
    {id:'golf',name:'Golf',emoji:'⛳',tag:'Sports',category:'sports',players:'2–8',desc:'A calm little course. A surprisingly competitive scoreboard.',accent:'#a9df95'},
    {id:'snowball',name:'Snowball Fight',emoji:'❄️',tag:'Action',category:'action',players:'2–8',desc:'Dodge, duck, and settle it with a perfectly thrown snowball.',accent:'#8ad8f3'},
    {id:'football',name:'Mini 2D Football',emoji:'⚽',tag:'Sports',category:'sports',players:'2–8',desc:'A tiny pitch, a big rivalry, and goals for days.',accent:'#72dfbd'},
    {id:'basketball',name:'Mini 2D Basketball',emoji:'🏀',tag:'Sports',category:'sports',players:'2–8',desc:'Run the court, find the ball, and make your shot count.',accent:'#ffc184'},
    {id:'chess',name:'Chess',emoji:'♟️',tag:'Strategy',category:'strategy',players:'2',desc:'The timeless head-to-head. Every move tells a story.',accent:'#d1c6aa'},
    {id:'pool',name:'Pool',emoji:'🎱',tag:'Chill',category:'chill',players:'2–8',desc:'Line up your shot, sink the 8, claim the bragging rights.',accent:'#86d4b9'},
    {id:'broken-tiles',name:'Broken Tiles',emoji:'🟪',tag:'Action',category:'action',players:'2–8',desc:'Keep moving. The floor is disappearing under your feet.',accent:'#b2a5ff'},
    {id:'racing',name:'Car Racing',emoji:'🏎️',tag:'Action',category:'action',players:'2–8',desc:'Grab a lane, hit the gas, and race your friends to three.',accent:'#ff9b88'},
    {id:'dots-boxes',name:'Dots and Boxes',emoji:'▦',tag:'Strategy',category:'strategy',players:'2–8',desc:'A little line here, a clever box there. Your turn.',accent:'#c4adff'},
    {id:'king-yard',name:'King of the Yard',emoji:'👑',tag:'Action',category:'action',players:'2–8',desc:'Hold your ground in the middle and make the yard yours.',accent:'#ffdc83'},
    {id:'memory',name:'Memory Game',emoji:'🧠',tag:'Chill',category:'chill',players:'2–8',desc:'Flip, remember, match. How good is that memory really?',accent:'#f29dd7'},
    {id:'paint-fight',name:'Paint Fight',emoji:'🎨',tag:'Action',category:'action',players:'2–8',desc:'Splash the arena, tag a rival, and cover the whole place.',accent:'#eb91d5'},
    {id:'mini-golf',name:'Mini 2D Golf',emoji:'🏌️',tag:'Sports',category:'sports',players:'2–8',desc:'Bumpers, tricky angles, and one satisfying little putt.',accent:'#acdb83'},
    {id:'penalties',name:'Soccer Penalties',emoji:'🥅',tag:'Sports',category:'sports',players:'2–8',desc:'Pick your corner. Read the keeper. Put it away.',accent:'#78d8b2'},
    {id:'archery',name:'Archery Target',emoji:'🏹',tag:'Chill',category:'chill',players:'2–8',desc:'Set your aim, tune the air suspension, hit the bullseye.',accent:'#f4b982'},
    {id:'brain-rush',name:'Brain Rush',emoji:'💡',tag:'Mind',category:'mind',players:'2–8',desc:'Ten rounds of trivia and logic. Faster correct answers score more.',accent:'#8fd8ff'},
    {id:'mind-games',name:'Mind Games',emoji:'🧩',tag:'Mind',category:'mind',players:'2–8',desc:'Riddles and puzzles against the clock. Outthink your friends.',accent:'#ff9ac7'}
  ];
  const HELP = {golf:'Drag back from your ball to line up a shot · Sink it in as few strokes as you can','mini-golf':'Drag back from your ball to shoot · Watch for the bumpers',snowball:'WASD to move · Click to throw snowballs at your friends',football:'Walk into the ball to dribble · Drag back from the ball to kick · Keepers block · First to 5',basketball:'Walk into the ball to dribble · Drag back from the ball to shoot · First to 15',chess:'Select a piece, then a destination · Checkmate wins',pool:'Drag back from the cue ball to shoot · Sink the 8 ball last','broken-tiles':'WASD to hop across the floor · Keep moving, tiles disappear!',racing:'W / ↑ to accelerate · A / D or ← / → to steer · First to 3 laps','dots-boxes':'Take turns clicking an edge · Complete more boxes to win','king-yard':'WASD to move · Hold the glowing yard to score points',memory:'Take turns clicking cards · Find the most matching pairs','paint-fight':'WASD to move · Click to splatter paint · Color the arena and tag rivals',penalties:'Click and drag from the ball to aim and shoot · Keeper: WASD to dive',archery:'Drag from the archer to aim · Air suspension changes arrow drop','brain-rush':'Tap the right answer. Faster answers score more.','mind-games':'Riddles and puzzles. Tap the answer before the clock runs out.'};
  const $ = id => document.getElementById(id);
  const socket = window.io ? io() : null;
  const app = {socket,room:null,chat:[],modalMode:'create',chosenGame:'golf',roomStarted:false,filter:'all',toastTimer:null};
  window.Arena = app;
  const displayGame = id => GAMES.find(g=>g.id===id)||GAMES[0];

    // ===== Characters in the lobby: the same definitions the games draw with.
  function characterSVG(id,size=40){
    const c=(window.GameRuntime&&window.GameRuntime.characters&&window.GameRuntime.characters[id])||{body:'#ccc',accent:'#fff',ears:'none',shape:'round',patch:'none',eyes:'normal'};
    const cx=50,cy=54;let s=`<svg viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">`;
    if(c.ears==='round')s+=`<circle cx="${cx-24}" cy="${cy-24}" r="11" fill="${c.body}"/><circle cx="${cx+24}" cy="${cy-24}" r="11" fill="${c.body}"/>`;
    if(c.ears==='pointy')s+=`<polygon points="${cx-31},${cy-4} ${cx-24},${cy-36} ${cx-6},${cy-18}" fill="${c.body}"/><polygon points="${cx+31},${cy-4} ${cx+24},${cy-36} ${cx+6},${cy-18}" fill="${c.body}"/>`;
    if(c.ears==='tufts')s+=`<polygon points="${cx-26},${cy-14} ${cx-22},${cy-36} ${cx-8},${cy-20}" fill="${c.body}"/><polygon points="${cx+26},${cy-14} ${cx+22},${cy-36} ${cx+8},${cy-20}" fill="${c.body}"/>`;
    if(c.ears==='spikes')s+=`<polygon points="${cx-16},${cy-24} ${cx-10},${cy-42} ${cx-4},${cy-24}" fill="${c.accent}"/><polygon points="${cx-4},${cy-26} ${cx+2},${cy-46} ${cx+8},${cy-26}" fill="${c.accent}"/><polygon points="${cx+8},${cy-24} ${cx+14},${cy-40} ${cx+20},${cy-22}" fill="${c.accent}"/>`;
    if(c.ears==='antenna')s+=`<line x1="${cx}" y1="${cy-26}" x2="${cx}" y2="${cy-40}" stroke="#667088" stroke-width="3"/><circle cx="${cx}" cy="${cy-42}" r="5" fill="${c.accent}"/>`;
    if(c.shape==='square')s+=`<rect x="${cx-29}" y="${cy-29}" width="58" height="58" rx="15" fill="${c.body}"/>`;
    else if(c.shape==='wide')s+=`<ellipse cx="${cx}" cy="${cy}" rx="36" ry="27" fill="${c.body}"/>`;
    else s+=`<circle cx="${cx}" cy="${cy}" r="31" fill="${c.body}"/>`;
    if(c.patch==='muzzle')s+=`<ellipse cx="${cx}" cy="${cy+12}" rx="15" ry="10" fill="${c.accent}"/>`;
    if(c.patch==='mask')s+=`<ellipse cx="${cx-13}" cy="${cy-4}" rx="11" ry="9" fill="${c.accent}"/><ellipse cx="${cx+13}" cy="${cy-4}" rx="11" ry="9" fill="${c.accent}"/>`;
    if(c.patch==='visor')s+=`<rect x="${cx-22}" y="${cy-10}" width="44" height="13" rx="6" fill="#0d1020"/><rect x="${cx-17}" y="${cy-6}" width="11" height="3" fill="#7ff5ff"/><rect x="${cx+6}" y="${cy-6}" width="11" height="3" fill="#7ff5ff"/>`;
    else{const er=c.eyes==='big'?8:6;s+=`<circle cx="${cx-12}" cy="${cy-4}" r="${er}" fill="#fff"/><circle cx="${cx+12}" cy="${cy-4}" r="${er}" fill="#fff"/><circle cx="${cx-11}" cy="${cy-3}" r="${er*.5}" fill="#14131f"/><circle cx="${cx+13}" cy="${cy-3}" r="${er*.5}" fill="#14131f"/>`;}
    s+=`<path d="M ${cx-8} ${cy+13} Q ${cx} ${cy+20} ${cx+8} ${cy+13}" stroke="#14131f" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;
    return s;
  }
  app.character=localStorage.getItem('pa-char')||'panda';
  function renderPicker(){
    const box=$('char-picker'),chars=(window.GameRuntime&&window.GameRuntime.characters)||{};
    if(!box)return;
    if(!chars[app.character])app.character='panda';
    box.innerHTML='';
    Object.keys(chars).forEach(id=>{
      const b=document.createElement('button');b.type='button';b.className='char-btn'+(id===app.character?' selected':'');
      b.title=chars[id].name;b.setAttribute('aria-label',chars[id].name);b.innerHTML=characterSVG(id,46);
      b.addEventListener('click',()=>{app.character=id;localStorage.setItem('pa-char',id);renderPicker();});
      box.append(b);
    });
    const label=$('char-name');if(label)label.textContent=chars[app.character]?chars[app.character].name:'';
  }
  function renderCards(){const grid=$('game-grid');grid.innerHTML='';GAMES.filter(g=>app.filter==='all'||g.category===app.filter).forEach(g=>{const card=document.createElement('article');card.className='game-card';card.style.setProperty('--accent',g.accent);card.style.setProperty('--glow',g.accent);card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-label',`Create a room for ${g.name}`);card.innerHTML=`<div class="card-top"><span class="game-icon">${g.emoji}</span><span class="card-arrow">↗</span></div><h3>${g.name}</h3><p>${g.desc}</p><div class="card-meta"><span class="genre-tag">${g.tag}</span><span class="player-tag">${g.players} players</span></div>`;card.addEventListener('click',()=>openModal('create',g.id));card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openModal('create',g.id);}});grid.appendChild(card);});}
  function fillGameSelect(){const select=$('game-select');select.innerHTML='';GAMES.forEach(g=>{const o=document.createElement('option');o.value=g.id;o.textContent=`${g.emoji}  ${g.name}`;select.appendChild(o);});}
  function openModal(mode='create',gameId='golf'){renderPicker();
    app.modalMode=mode;app.chosenGame=gameId;$('modal-backdrop').classList.remove('hidden');$('modal-error').textContent='';$('room-form').dataset.mode=mode;
    $('player-name').value=localStorage.getItem('pa-name')||'';
    $('player-name').classList.toggle('hidden',mode==='select');document.querySelector('label[for="player-name"]').classList.toggle('hidden',mode==='select');
    $('create-fields').classList.toggle('hidden',mode==='join');$('join-fields').classList.toggle('hidden',mode!=='join');
    $('modal-icon').textContent=mode==='join'?'⌁':mode==='select'?'▦':'✳';$('modal-eyebrow').textContent=mode==='join'?'YOUR SQUAD IS WAITING':mode==='select'?'SWITCH IT UP':'LET’S GET PLAYING';
    $('modal-title').textContent=mode==='join'?'Join your friends':mode==='select'?'Choose a game':'Create your room';$('modal-description').textContent=mode==='join'?'Enter your name and the three-digit code to get in.':mode==='select'?'Pick the next game for this room.':'Choose your name and we’ll set up a private room.';
    $('modal-submit').innerHTML=mode==='join'?'Join private room <span>→</span>':mode==='select'?'Set this game <span>→</span>':'Create private room <span>→</span>';
    $('game-select').value=gameId;
    if(mode==='join')setTimeout(()=>$('room-code-input').focus(),50);else if(mode!=='select')setTimeout(()=>$('player-name').focus(),50);
  }
  function closeModal(){$('modal-backdrop').classList.add('hidden');}
  function toast(msg){const el=$('toast');el.textContent=msg;el.classList.remove('hidden');el.classList.add('show');clearTimeout(app.toastTimer);app.toastTimer=setTimeout(()=>{el.classList.remove('show');el.classList.add('hidden');},2300);}
  function setView(room){$('home-view').classList.toggle('hidden',!!room);$('room-view').classList.toggle('hidden',!room);window.scrollTo({top:0,behavior:'smooth'});}
  function enterRoom(data){app.room=data.room;app.chat=data.chat||[];app.roomStarted=!!data.room.started;setView(true);renderRoom();$('chat-messages').innerHTML='';if(!app.chat.length)showChatWelcome();else app.chat.forEach(addChatMessage);if(data.room.started&&data.room.state)startLocalGame(data.room.state);}
  function renderRoom(){const r=app.room;if(!r)return;const g=displayGame(r.game);$('room-code-label').textContent=r.code;$('chat-room-code').textContent=r.code;$('room-game-label').textContent=g.name;$('selected-game-name').textContent=g.name;$('selected-game-emoji').textContent=g.emoji;$('selected-game-subtitle').textContent=app.roomStarted?'Game in progress':'Waiting to start';$('room-player-count').textContent=`${r.players.length} / 8 players`;$('in-room-count').textContent=r.players.length;
    $('room-player-list').innerHTML='';r.players.forEach((p,i)=>{const chip=document.createElement('span');chip.className='player-chip';chip.style.setProperty('--player-color',p.color||'#a99cff');const dot=document.createElement('i'),name=document.createElement('span');name.textContent=p.name;const av=document.createElement('span');av.className='chip-avatar';av.innerHTML=characterSVG(p.character||'panda',24);chip.append(av,name);if(p.id===r.hostId){const small=document.createElement('small');small.textContent='HOST';chip.append(small);}$('room-player-list').append(chip);});
    const isHost=socket&&r.hostId===socket.id;$('start-game').classList.toggle('hidden',!isHost);$('change-game').classList.toggle('hidden',!isHost);$('start-game').innerHTML=app.roomStarted?'Restart game <span>↻</span>':`Start ${g.name} <span>→</span>`;$('stage-pick-game').classList.toggle('hidden',!isHost);$('stage-empty').classList.toggle('hidden',app.roomStarted);$('stage-topbar').classList.toggle('hidden',!app.roomStarted);$('stage-hud').classList.toggle('hidden',!app.roomStarted);$('archery-control').classList.toggle('hidden',!app.roomStarted||r.game!=='archery');$('touch-controls').classList.toggle('hidden',!app.roomStarted||!['snowball','football','basketball','broken-tiles','racing','king-yard','paint-fight','penalties'].includes(g.id));$('touch-action').classList.toggle('hidden',!['snowball','paint-fight','racing'].includes(g.id));$('touch-action').textContent=g.id==='racing'?'GAS':g.id==='snowball'?'THROW':'PAINT';$('stage-game-name').textContent=g.name;$('game-instructions').textContent=HELP[g.id]||'Play together';$('game-score').textContent='';if(window.GameRuntime)window.GameRuntime.room(r);}
  function showChatWelcome(){const w=document.createElement('div');w.className='chat-welcome';w.innerHTML='<span>✳</span><b>Room chat is open</b><small>Say hi while everyone joins.</small>';$('chat-messages').append(w);}
  function addChatMessage(item){const box=$('chat-messages');box.querySelector('.chat-welcome')?.remove();const row=document.createElement('div');row.className='chat-message';const author=document.createElement('span');author.className='chat-author';author.textContent=item.player;const time=document.createElement('span');time.className='chat-time';time.textContent=new Date(item.time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});const text=document.createElement('p');text.textContent=item.text;row.append(author,time,text);box.append(row);box.scrollTop=box.scrollHeight;}
  function addSystemMessage(text){const el=document.createElement('div');el.className='chat-system';el.textContent=text;$('chat-messages').append(el);$('chat-messages').scrollTop=$('chat-messages').scrollHeight;}
  function startLocalGame(state){app.roomStarted=true;$('stage-empty').classList.add('hidden');$('stage-topbar').classList.remove('hidden');$('stage-hud').classList.remove('hidden');$('stage-state-label').textContent='IN PROGRESS';const current=displayGame(state.game);$('stage-game-name').textContent=current.name;$('game-instructions').textContent=HELP[current.id];$('archery-control').classList.toggle('hidden',current.id!=='archery');if(current.id==='archery'){$('air-suspension').value=state.airSuspension;$('air-value').textContent=Number(state.airSuspension).toFixed(1);}$('touch-controls').classList.toggle('hidden',!['snowball','football','basketball','broken-tiles','racing','king-yard','paint-fight','penalties'].includes(current.id));renderRoom();try{window.GameRuntime.start({room:app.room,me:socket.id,host:app.room.hostId===socket.id,state});}catch(e){toast(e.message||'Could not start the game.');}}
  // Scoreboard line, status label, and the match-over panel.
  let overFor=null;
  function scoreText(state,p){if(state.game==='golf'||state.game==='mini-golf')return `${p.strokes} strokes`;if(state.game==='racing')return `lap ${p.lap}/3`;return `${Math.floor(p.score)}`;}
  function hud(state){
    $('game-score').textContent=(state.players||[]).map(p=>`${p.name}: ${scoreText(state,p)}`).join(' · ');
    $('stage-state-label').textContent=state.winner?(state.winner==='Draw'?'DRAW GAME':`${String(state.winner).toUpperCase()} WINS`):'IN PROGRESS';
    const key=`${state.game}:${state.startedAt}`;
    if(!state.winner){$('game-over').classList.add('hidden');overFor=null;return;}
    if(overFor===key)return;
    overFor=key;
    $('go-winner').textContent=state.winner==='Draw'?'It’s a draw':`${state.winner} wins`;
    const box=$('go-scores');box.innerHTML='';
    [...(state.players||[])].sort((a,b)=>(state.game.includes('golf')?a.strokes-b.strokes:state.game==='racing'?(b.lap*1200+b.progress)-(a.lap*1200+a.progress):b.score-a.score)).forEach(p=>{const row=document.createElement('div');row.className='go-row';row.textContent=`${p.name}  ·  ${scoreText(state,p)}`;box.append(row);});
    const host=app.room&&app.room.hostId===socket.id;
    $('go-again').classList.toggle('hidden',!host);
    $('go-note').textContent=host?'':'Waiting for the host to start a rematch.';
    $('game-over').classList.remove('hidden');
  }
  $('go-again').addEventListener('click',()=>{socket.emit('game:start',{},r=>{if(r?.error)toast(r.error);});});
  $('go-lobby').addEventListener('click',()=>$('game-over').classList.add('hidden'));
  $('stage-mute').addEventListener('click',()=>{const on=$('stage-mute').dataset.on!=='1';$('stage-mute').dataset.on=on?'1':'0';$('stage-mute').textContent=on?'🔊':'🔈';window.GameRuntime?.setMuted(!on);});

  function leaveRoom(){if(socket)socket.emit('room:leave');app.room=null;app.roomStarted=false;app.chat=[];if(window.GameRuntime)window.GameRuntime.state(null);setView(false);}

  if(socket){
    socket.on('connect',()=>{document.querySelector('.online-indicator')?.classList.remove('offline');});
    socket.on('disconnect',()=>toast('Connection lost. Reconnecting…'));
    socket.on('room:update',room=>{if(!app.room||app.room.code!==room.code)return;const was=app.roomStarted;app.room=room;app.roomStarted=!!room.started;renderRoom();if(!room.started&&was){window.GameRuntime?.state(null);$('stage-empty').classList.remove('hidden');$('stage-topbar').classList.add('hidden');$('stage-hud').classList.add('hidden');$('archery-control').classList.add('hidden');$('touch-controls').classList.add('hidden');}if(room.started&&window.GameRuntime)window.GameRuntime.room(room);});
    socket.on('game:started',state=>{if(!app.room)return;app.roomStarted=true;app.room.started=true;startLocalGame(state);});
    socket.on('game:snap',snap=>{if(!app.room||!snap||!snap.s)return;window.GameRuntime?.snapshot(snap);const state=snap.s;if(state.game==='archery'){$('air-suspension').value=state.airSuspension;$('air-value').textContent=Number(state.airSuspension).toFixed(1);}hud(state);});
    socket.on('game:input',data=>window.GameRuntime?.input(data));socket.on('game:action',data=>window.GameRuntime?.action(data));
    socket.on('chat:message',item=>addChatMessage(item));socket.on('system:message',text=>addSystemMessage(text));
  }else{setTimeout(()=>toast('Socket.IO could not load. Start the Node server, then refresh.'),300);}

  $('room-form').addEventListener('submit',e=>{e.preventDefault();if(!socket){$('modal-error').textContent='Connect to the game server first.';return;}const mode=app.modalMode,name=$('player-name').value.trim()||'Player';localStorage.setItem('pa-name',name);$('modal-error').textContent='';
    if(mode==='select'){const gameId=$('game-select').value;socket.emit('room:game',gameId,result=>{if(result?.error){$('modal-error').textContent=result.error;return;}app.room.game=gameId;app.roomStarted=false;closeModal();renderRoom();});return;}
    $('modal-submit').disabled=true;
    if(mode==='join')socket.emit('room:join',{name,character:app.character,code:$('room-code-input').value},finishRoomRequest);else socket.emit('room:create',{name,character:app.character,game:$('game-select').value},finishRoomRequest);
    function finishRoomRequest(result){$('modal-submit').disabled=false;if(result?.error){$('modal-error').textContent=result.error;return;}closeModal();enterRoom(result);}
  });
  $('chat-form').addEventListener('submit',e=>{e.preventDefault();const input=$('chat-input'),msg=input.value.trim();if(!msg||!app.room)return;socket.emit('chat:send',msg);input.value='';});
  $('start-game').addEventListener('click',()=>{if(!app.room||app.room.hostId!==socket.id)return;socket.emit('game:start',{},result=>{if(result?.error)toast(result.error);});});
  $('stage-fs').addEventListener('click',()=>{const stage=$('game-stage');const on=!stage.classList.contains('is-fullscreen');stage.classList.toggle('is-fullscreen',on);$('stage-fs').textContent=on?'⤡':'⤢';if(on&&stage.requestFullscreen)stage.requestFullscreen().then(()=>screen.orientation?.lock?.('landscape')).catch(()=>{});else if(!on&&document.fullscreenElement)document.exitFullscreen?.().catch(()=>{});window.dispatchEvent(new Event('resize'));});
  document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement){$('game-stage').classList.remove('is-fullscreen');$('stage-fs').textContent='⤢';window.dispatchEvent(new Event('resize'));}});
  $('stage-pick-game').addEventListener('click',()=>openModal('select',app.room?.game||'golf'));$('change-game').addEventListener('click',()=>openModal('select',app.room?.game||'golf'));
  $('leave-room').addEventListener('click',leaveRoom);$('stage-exit').addEventListener('click',()=>{if(app.room?.hostId===socket.id){socket.emit('room:game',app.room.game,()=>{});app.roomStarted=false;renderRoom();}else toast('Ask the host to restart the room.');});
  $('copy-code').addEventListener('click',async()=>{if(!app.room)return;try{await navigator.clipboard.writeText(app.room.code);toast(`Room code ${app.room.code} copied`);}catch{toast(`Share room code: ${app.room.code}`);}});
  $('open-join').addEventListener('click',()=>openModal('join'));$('hero-join').addEventListener('click',()=>openModal('join'));$('browse-games').addEventListener('click',()=>$('games').scrollIntoView({behavior:'smooth'}));$('banner-start').addEventListener('click',()=>openModal('create','golf'));
  $('modal-close').addEventListener('click',closeModal);$('modal-backdrop').addEventListener('click',e=>{if(e.target===$('modal-backdrop'))closeModal();});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});$('room-code-input').addEventListener('input',e=>e.target.value=e.target.value.replace(/\D/g,'').slice(0,3));
  document.querySelectorAll('.filter').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.filter').forEach(b=>b.classList.remove('active'));btn.classList.add('active');app.filter=btn.dataset.filter;renderCards();}));
  $('air-suspension').addEventListener('input',e=>{const value=Number(e.target.value);$('air-value').textContent=value.toFixed(1);if(window.GameRuntime.getState()?.game==='archery')socket.emit('game:action',{type:'air',value});});
  document.querySelectorAll('[data-virtual]').forEach(button=>{const key=button.dataset.virtual,set=active=>window.GameRuntime?.setVirtual(key,active);button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);set(true);});button.addEventListener('pointerup',()=>set(false));button.addEventListener('pointercancel',()=>set(false));button.addEventListener('lostpointercapture',()=>set(false));});
  setInterval(()=>{if(!app.roomStarted)return;const s=window.GameRuntime?.getState();if(s)hud(s);},250);
  $('room-code-input').value='';fillGameSelect();renderCards();
})();
