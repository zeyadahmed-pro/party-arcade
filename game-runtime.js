(() => {
  const W = 960, H = 540;
  const PALETTE = ['#a99cff','#ff88a4','#73e0bf','#ffd37a','#67bdff','#f28bdf','#b8e577','#ff9b76'];
  const TITLES = {golf:'Golf',snowball:'Snowball Fight',football:'Mini 2D Football',basketball:'Mini 2D Basketball',chess:'Chess',pool:'Pool','broken-tiles':'Broken Tiles',racing:'Car Racing','dots-boxes':'Dots and Boxes','king-yard':'King of the Yard',memory:'Memory Game','paint-fight':'Paint Fight','mini-golf':'Mini 2D Golf',penalties:'Soccer Penalties',archery:'Archery Target','brain-rush':'Brain Rush','mind-games':'Mind Games'};
  const HELP = {golf:'Drag back from your ball to line up a shot · Sink it in as few strokes as you can', 'mini-golf':'Drag back from your ball to shoot · Watch for the bumpers',snowball:'WASD to move · Click to throw · A hit stuns your friend for a moment',football:'Walk into the ball to dribble · Drag back from the ball to kick (drag further for power) · Keepers block · First to 5',basketball:'Walk into the ball to dribble · Drag back from the ball to shoot · Aim at a hoop · First to 15',chess:'Click a piece, then its destination · Capture the king to win',pool:'Drag back from the cue ball to shoot · Sink the 8 ball last','broken-tiles':'WASD to hop across the floor · Keep moving, tiles disappear!',racing:'W / ↑ to accelerate · A / D or ← / → to steer · First to 3 laps','dots-boxes':'Take turns clicking an edge · Complete more boxes to win', 'king-yard':'WASD to move · Hold the glowing yard to score points','memory':'Take turns clicking cards · Find the most matching pairs','paint-fight':'WASD to move · Click to splatter paint · Color the arena and tag rivals','penalties':'Click and drag from the ball to aim and shoot · Keeper: WASD to dive','archery':'Drag from the archer to aim · Air suspension changes arrow drop','brain-rush':'Tap the right answer. Faster answers score more.','mind-games':'Riddles and puzzles. Tap the answer before the clock runs out.'};
  HELP.chess='Select a piece, then a destination · Checkmate wins';
  const game = { instance:null, scene:null, current:null };
  const colorValue = value => typeof value==='number' ? value : (parseInt(String(value).replace('#',''),16) || 0xffffff);

  function createState(gameId, players) {
    const state = { game:gameId, startedAt:Date.now(), tick:0, winner:null, players:players.map((p,i)=>({id:p.id,name:p.name,color:p.color||PALETTE[i%8],character:CHARACTERS[p.character]?p.character:'panda',x:160+(i%4)*200,y:190+Math.floor(i/4)*150,score:0,strokes:0,done:false,active:true,speed:0,lane:0,progress:0,lap:0})) };
    if (gameId==='golf'||gameId==='mini-golf') {
      state.hole={x:820,y:280,r:18}; state.obstacles=gameId==='mini-golf'?[{x:350,y:170,w:20,h:190},{x:560,y:275,w:20,h:170},{x:435,y:100,w:85,h:14}]:[{x:425,y:210,w:19,h:125}];
      state.players.forEach((p,i)=>{p.x=155;p.y=215+i*55;p.bx=155;p.by=215+i*55;p.vx=0;p.vy=0});
    }
    if (gameId==='snowball'||gameId==='paint-fight'||gameId==='king-yard'||gameId==='football'||gameId==='basketball') {
      state.players.forEach((p,i)=>{p.x=170+(i%4)*190;p.y=180+Math.floor(i/4)*170;p.vx=0;p.vy=0;p.cool=0;p.lastFire=false});
      state.projectiles=[]; state.ball={x:480,y:270,vx:0,vy:0}; state.timeLeft=(gameId==='football'||gameId==='basketball')?150:90;if(gameId==='snowball'){state.pickups=[];state.pickupClock=7;}
      if(gameId==='king-yard'){state.zone={x:480,y:275,r:84};state.zoneNextAt=0;}
      if(gameId==='paint-fight'){state.splats=[];state.cells=Array(PAINT_COLS*PAINT_ROWS).fill(null);}
      if(gameId==='football'||gameId==='basketball'){state.goalFlash=0;state.turn=0;state.players.forEach((p,i)=>{p.x=[432,528,432,528][i%4];p.y=[246,314,314,246][i%4];});}
      if(gameId==='football')state.keepers=[{x:104,y:280},{x:856,y:280}];state.ball.z=0;state.ball.vz=0;
    }
    if(gameId==='chess') {state.turn=0;state.selection=null;state.board=makeChessBoard();state.castling={wK:true,wQ:true,bK:true,bQ:true};state.lastMove=null;state.clock=[300,300];}
    if(gameId==='dots-boxes') {state.turn=0;state.grid=5;state.edges={};state.boxes={};}
    if(gameId==='memory') {state.turn=0;state.cards=makeCards();state.flipped=[];state.lockUntil=0;state.pairs=Array(players.length).fill(0);}
    if(gameId==='broken-tiles') {state.cols=9;state.rows=5;state.tileState=Array(45).fill(0);state.tileBreakAt=Array(45).fill(0);state.crumbleAt=0;state.crumbleGap=1700;state.players.forEach((p,i)=>{p.gx=1+(i%4)*2;p.gy=i<4?1:3;p.x=154+p.gx*80;p.y=165+p.gy*68;p.moveAt=0;p.active=true});}
    if(gameId==='racing') {state.players.forEach((p,i)=>{p.progress=0;p.lane=(i-(state.players.length-1)/2)*18;p.speed=0;p.lap=0});}
    if(gameId==='pool') {state.turn=0;state.balls=makePoolBalls();state.sunk=[];state.message='Break shot';state.groups={};state.groupsAssigned=false;state.potNow=[];state.foul=false;state.shotActive=false;}
    if(gameId==='penalties') {state.ball={x:210,y:280,vx:0,vy:0,flight:false};state.turn=0;state.goals=Array(players.length).fill(0);state.keeperX=800;state.keeperY=270;state.lastShotAt=0;}
    if(gameId==='archery') {state.airSuspension=1;state.arrows=[];state.target={x:815,y:250};state.timeLeft=60;}
      if(gameId==='brain-rush'||gameId==='mind-games')initQuiz(state,gameId);
    return state;
  }
  function makeChessBoard(){const b=Array(64).fill(null), back=['r','n','b','q','k','b','n','r'];for(let c=0;c<8;c++){b[c]=`b${back[c]}`;b[8+c]='bp';b[48+c]='wp';b[56+c]=`w${back[c]}`;}return b;}
  function makeCards(){const vals=['✦','●','▲','◆','☾','♥','✿','⬟'];const cards=[...vals,...vals].map((v,i)=>({v,id:i,open:false,matched:false}));for(let i=cards.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[cards[i],cards[j]]=[cards[j],cards[i]];}return cards;}
  function makePoolBalls(){const balls=[{n:0,x:245,y:270,vx:0,vy:0,r:11,color:'#ffffff',cue:true}];const colors=['#f5c045','#4d7fe6','#e7544f','#823eac','#e87931','#33a9a2','#c64344','#272837','#d6b968','#3b70cf','#da3e39','#7039a1','#df7b38','#219285','#bb3c3d'];let n=1;for(let row=0;row<5;row++)for(let col=0;col<=row;col++){const x=670+row*19,y=270+(col-row/2)*22;balls.push({n,x,y,vx:0,vy:0,r:10,color:colors[n-1],eight:n===8});n++;}return balls;}

  class GameScene extends Phaser.Scene {
    constructor(){super('GameScene');this.g=null;this.state=null;this.host=false;this.inputs={};this.virtual={};this.inputSeq=0;this.lastInput=0;this.lastSync=0;this.lastAction={};this.visual={};this.drag=null;this.selectedSquare=null;this.air=1;this.labelNodes=[];this.labelIndex=0;this.snaps=[];this.pending=[];this.pred=null;this.err={x:0,y:0};this.frameSeq=0;this.particles=[];this.popups=[];this.shake=0;this.lastSeen=null;}
    create(){this.g=this.add.graphics();this.title=this.add.text(26,20,'',{fontFamily:'Space Grotesk, system-ui, -apple-system, Segoe UI, sans-serif',fontSize:'15px',fontStyle:'bold',color:'#f7f5ff'}).setDepth(3).setVisible(false);this.meta=this.add.text(W-27,23,'',{fontFamily:'DM Sans, system-ui, -apple-system, Segoe UI, sans-serif',fontSize:'10px',color:'#ddd9ef',align:'right'}).setOrigin(1,0).setDepth(3).setVisible(false);this.keys=this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE');this.input.on('pointerdown',p=>{this.drag={x:p.worldX,y:p.worldY};});this.input.on('pointerup',p=>{if(this.drag){this.handlePointer(this.drag.x,this.drag.y,p.worldX,p.worldY);this.drag=null;}});game.scene=this;this.scale.on('resize',()=>this.paint());if(game.current)this.loadMatch(game.current);}
    loadMatch(payload){this.room=payload.room;this.me=payload.me;this.host=!!this.headless;this.state=payload.state;this.gameId=this.state.game;this.players=payload.room.players;this.inputMap={};this.lastAction={};this.selectedSquare=null;this.snaps=[];this.pending=[];this.pred=null;this.err={x:0,y:0};this.lastSeen=null;this.paint();}
    setRoom(room){this.room=room;this.players=room.players;this.host=!!this.headless;if(this.state){const ids=new Set(room.players.map(p=>p.id));this.state.players=this.state.players.filter(p=>ids.has(p.id));if(this.state.players.length)this.state.turn=(this.state.turn||0)%this.state.players.length;}}
    setState(state){if(!state)return;this.state=state;this.gameId=state.game;this.paint();}
    receiveInput(data){if(this.host)this.inputMap[data.id]=data.input;}
    receiveAction(data){if(this.host)this.applyAction(data.id,data.action);}
    act(action){if(!this.state)return;if(this.host)this.applyAction(this.me,action);else window.Arena.socket.emit('game:action',action);}
    readKeys(){const k=this.keys||{};return{up:!!(k.W&&k.W.isDown)||!!(k.UP&&k.UP.isDown)||!!this.virtual.up||(this.gameId==='racing'&&!!this.virtual.fire),down:!!(k.S&&k.S.isDown)||!!(k.DOWN&&k.DOWN.isDown)||!!this.virtual.down,left:!!(k.A&&k.A.isDown)||!!(k.LEFT&&k.LEFT.isDown)||!!this.virtual.left,right:!!(k.D&&k.D.isDown)||!!(k.RIGHT&&k.RIGHT.isDown)||!!this.virtual.right};}
    sendInput(){const keys=this.readKeys();const pointer=this.input.activePointer;const input={keys,aim:{x:pointer.worldX,y:pointer.worldY},fire:pointer.isDown||!!this.virtual.fire,seq:this.frameSeq};if(this.host)this.inputMap[this.me]=input;else window.Arena.socket.emit('game:input',input);}
    update(time,delta){if(!this.state)return;if(this.host){this.simulate(Math.min(delta,50)/1000,time);}
      const dt=Math.min(delta,80)/1000;
      if(!this.host&&PREDICTED.has(this.gameId)&&this.me){this.frameSeq++;const keys=this.readKeys();this.pending.push({seq:this.frameSeq,keys,dt});if(this.pending.length>240)this.pending.shift();if(this.pred)this.pred=stepPlayer(this.pred.x,this.pred.y,keys,dt);}
      this.err.x*=.86;this.err.y*=.86;
      this.stepFx(dt);
      this.paint();}
    onSnapshot(snap){
      if(!snap||!snap.s)return;
      const next=snap.s,now=performance.now();
      this.snaps.push({t:now,s:next});if(this.snaps.length>40)this.snaps.shift();
      const prev=this.lastSeen;this.lastSeen=next;
      this.state=next;this.gameId=next.game;
      if(PREDICTED.has(next.game)&&this.me){
        const me=(next.players||[]).find(p=>p.id===this.me);
        if(me){
          const shownBefore=this.pred?{x:this.pred.x+this.err.x,y:this.pred.y+this.err.y}:null;
          const ack=(snap.ack||{})[this.me]||0;
          this.pending=this.pending.filter(i=>i.seq>ack);
          let base={x:me.x,y:me.y};
          for(const i of this.pending)base=stepPlayer(base.x,base.y,i.keys,i.dt);
          this.pred=base;
          // Blend small corrections instead of snapping the player.
          this.err=shownBefore&&Math.hypot(shownBefore.x-base.x,shownBefore.y-base.y)<120?{x:shownBefore.x-base.x,y:shownBefore.y-base.y}:{x:0,y:0};
        }
      }
      this.detectFx(prev,next);
    }
    viewState(){
      const latest=this.state;if(!latest)return null;
      const buf=this.snaps;let v=latest;
      if(buf.length>=2){
        const renderT=performance.now()-RENDER_DELAY;
        let a=buf[0],b=buf[buf.length-1];
        for(let i=buf.length-1;i>0;i--){if(buf[i-1].t<=renderT){a=buf[i-1];b=buf[i];break;}}
        const alpha=Math.max(0,Math.min(1,(renderT-a.t)/Math.max(1,b.t-a.t)));
        const A=a.s,B=b.s,lerp=(p,q)=>p+(q-p)*alpha;
        v=Object.assign({},B);
        v.players=(B.players||[]).map(p=>{const q=(A.players||[]).find(x=>x.id===p.id);return q?Object.assign({},p,{x:lerp(q.x,p.x),y:lerp(q.y,p.y)}):p;});
        if(B.ball&&A.ball)v.ball=Object.assign({},B.ball,{x:lerp(A.ball.x,B.ball.x),y:lerp(A.ball.y,B.ball.y),z:lerp(A.ball.z||0,B.ball.z||0)});
        if(B.keepers&&A.keepers)v.keepers=B.keepers.map((k,i)=>A.keepers[i]?Object.assign({},k,{y:lerp(A.keepers[i].y,k.y)}):k);
        if(B.projectiles&&A.projectiles&&A.projectiles.length===B.projectiles.length)v.projectiles=B.projectiles.map((q,i)=>Object.assign({},q,{x:lerp(A.projectiles[i].x,q.x),y:lerp(A.projectiles[i].y,q.y)}));
      }
      if(PREDICTED.has(v.game)&&this.pred&&this.me){
        const e=this.err;v.players=v.players.map(p=>p.id===this.me?Object.assign({},p,{x:this.pred.x+e.x,y:this.pred.y+e.y}):p);
      }
      return v;
    }

    burst(x,y,color,n=12,speed=130){const c=typeof color==='string'?colorValue(color):color;for(let i=0;i<n&&this.particles.length<260;i++){const a=Math.random()*Math.PI*2,v=speed*(.3+Math.random()*.7);this.particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.5+Math.random()*.35,max:.85,c,r:2+Math.random()*3});}}
    popup(text,x,y,color){this.popups.push({text:String(text),x,y,life:1,color:color||'#ffffff'});if(this.popups.length>12)this.popups.shift();}
    stepFx(dt){
      for(const q of this.particles){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=.92;q.vy*=.92;q.life-=dt;}
      this.particles=this.particles.filter(q=>q.life>0);
      for(const p of this.popups)p.life-=dt*.9;
      this.popups=this.popups.filter(p=>p.life>0);
      this.shake*=.88;if(this.shake<.2)this.shake=0;
      const cam=this.cameras&&this.cameras.main;
      if(cam){const a=this.shake;cam.setScroll(a?(Math.random()-.5)*a*2:0,a?(Math.random()-.5)*a*2:0);}
    }
    drawFx(){
      for(const q of this.particles){const a=Math.max(0,q.life/q.max);this.circle(q.x,q.y,q.r*(.4+.6*a),q.c,a);}
      for(const p of this.popups)this.addLabel(p.x,p.y-(1-p.life)*34,p.text,13,p.color);
    }
    detectFx(prev,next){
      if(!prev||prev.game!==next.game)return;
      const id=next.game,byId=new Map((prev.players||[]).map(p=>[p.id,p]));
      for(const p of next.players||[]){
        const old=byId.get(p.id);if(!old)continue;
        const gain=Math.floor(p.score)-Math.floor(old.score);
        if(gain>0){this.happy=this.happy||{};this.happy[p.id]=performance.now()+1200;}
        if(gain>0&&id!=='king-yard'){this.burst(p.x,p.y,p.color,10+gain*4);this.popup(`+${gain}`,p.x,p.y-22,p.color);SFX.score();vibrate(20);}
        if(gain>0&&(id==='football'||id==='basketball'))this.shake=Math.max(this.shake,5);
        if(gain>0&&id==='king-yard'&&Math.random()<.15){this.burst(p.x,p.y,p.color,4,60);}
        if((p.stunUntil||0)>(old.stunUntil||0)){this.burst(p.x,p.y,'#bfe9ff',12,140);SFX.hit();vibrate(40);this.shake=Math.max(this.shake,3);}
        if((id==='golf'||id==='mini-golf')&&p.strokes>old.strokes){this.burst(p.x,p.y,p.color,6,60);SFX.hit();}
        if((id==='golf'||id==='mini-golf')&&p.done&&!old.done){this.burst(p.x,p.y,'#ffffff',18,160);SFX.score();}
        if(id==='broken-tiles'&&old.active&&!p.active){this.burst(p.x,p.y,p.color,24,200);this.shake=Math.max(this.shake,6);SFX.fail();vibrate(120);}
      }
      if(!prev.winner&&next.winner){
        SFX.win();this.shake=Math.max(this.shake,4);
        const cols=['#ffd37a','#ff88a4','#73e0bf','#a99cff'];
        for(let i=0;i<6;i++)setTimeout(()=>{if(this.gameId===id)this.burst(60+Math.random()*840,120+Math.random()*340,cols[i%4],22,220);},i*120);
      }
      if(next.ball&&prev.ball&&(id==='football'||id==='basketball')){
        const dv=Math.hypot(next.ball.vx-prev.ball.vx,next.ball.vy-prev.ball.vy);
        if(dv>120){this.burst(next.ball.x,next.ball.y,'#ffffff',8,110);SFX.kick();vibrate(15);}
        if((prev.ball.z||0)>0&&(next.ball.z||0)<=0&&id==='basketball')SFX.bounce();
      }
      if(id==='brain-rush'||id==='mind-games'){if(prev.q&&next.q&&prev.q.phase!==next.q.phase&&next.q.phase==='reveal')SFX.tick();if(prev.q&&next.q&&prev.q.n!==next.q.n)SFX.bounce();}
      if(id==='chess'&&prev.board&&next.board){
        let changed=0;for(let i=0;i<64;i++)if(prev.board[i]!==next.board[i])changed++;
        if(changed>=3)SFX.hit();else if(changed>0)SFX.bounce();
        if(next.check&&!prev.check){this.popup('CHECK',480,240,'#ff9aaf');SFX.fail();}
      }
      if(id==='pool'&&prev.sunk&&next.sunk&&next.sunk.length>prev.sunk.length){
        const pockets=[[80,104],[480,104],[880,104],[80,455],[480,455],[880,455]];const [px,py]=pockets[Math.floor(Math.random()*6)];
        this.burst(px,py,'#ffffff',12,120);SFX.score();
      }
      if(id==='dots-boxes'&&prev.boxes&&next.boxes){
        for(const k of Object.keys(next.boxes))if(!prev.boxes[k]){const [x,y]=k.split('-').map(Number);const owner=(next.players||[]).find(p=>p.id===next.boxes[k]);this.burst(310+x*68+34,105+y*68+34,owner?owner.color:'#ffffff',14,110);SFX.score();}
      }
      if(id==='memory'&&prev.cards&&next.cards){
        next.cards.forEach((c,i)=>{const o=prev.cards[i];if(!o)return;const cx=270+(i%4)*105+43,cy=135+Math.floor(i/4)*87+36;
          if(c.matched&&!o.matched){this.burst(cx,cy,'#91e3c2',12,120);SFX.score();}else if(c.open&&!o.open)SFX.tick();});
      }
      if(id==='broken-tiles'&&prev.tileState&&next.tileState){
        let fell=0;for(let i=0;i<next.tileState.length;i++){if(next.tileState[i]===2&&prev.tileState[i]!==2){fell++;this.burst(154+(i%9)*80+36,165+Math.floor(i/9)*68+34,'#8f88aa',6,80);}}
        if(fell)SFX.bounce();
      }
    }
    playerFor(id){return this.state.players.find(p=>p.id===id);}
    applyAction(id,a){const s=this.state;if(!s||!a)return;if(a.type==='answer'){this.quizAnswer(id,a);return;}
      const p=this.playerFor(id);if(!p)return;
      if((this.gameId==='snowball'||this.gameId==='paint-fight')&&a.type==='throw'&&Date.now()>(p.cool||0)){const dx=a.x-p.x,dy=a.y-p.y,m=Math.hypot(dx,dy)||1;s.projectiles.push({x:p.x,y:p.y,vx:dx/m*(this.gameId==='snowball'?390:340),vy:dy/m*(this.gameId==='snowball'?390:340),owner:p.id,life:2.1,color:p.color});p.cool=Date.now()+430;}
      else if(this.gameId==='golf'||this.gameId==='mini-golf'){
        if(a.type==='shot'&&!p.done){const m=Math.hypot(a.dx,a.dy)||1;const power=Math.min(760,Math.max(95,a.power||m*3));p.vx=(a.dx/m)*power;p.vy=(a.dy/m)*power;p.strokes++;}
      } else if(this.gameId==='pool'){
        if(a.type==='shot'&&!s.winner&&!s.shotActive&&id===s.players[s.turn%s.players.length].id&&!s.balls.some(b=>!b.sunk&&Math.hypot(b.vx,b.vy)>5)){const cue=s.balls[0],m=Math.hypot(a.dx,a.dy)||1,v=Math.min(760,Math.max(120,a.power||350));cue.vx=a.dx/m*v;cue.vy=a.dy/m*v;s.message=`${p.name} shoots`;s.shotActive=true;}
      } else if(this.gameId==='chess'&&a.type==='square') this.chessClick(id,a.x,a.y);
      else if(this.gameId==='dots-boxes'&&a.type==='dot')this.dotClick(id,a.x,a.y);
      else if(this.gameId==='memory'&&a.type==='card')this.memoryClick(id,a.index,timeNow());
      else if(this.gameId==='football'||this.gameId==='basketball'){
        if(a.type==='kick'&&this.gameId==='football'&&Date.now()>(p.kickAt||0)&&Math.hypot(s.ball.x-p.x,s.ball.y-p.y)<64){const m=Math.hypot(a.dx,a.dy)||1,pw=Math.max(.2,Math.min(1,Number(a.power)||.5)),v=300+360*pw;s.ball.vx=a.dx/m*v;s.ball.vy=a.dy/m*v;s.lastTouch=id;s.ball.shooter=null;p.kickAt=Date.now()+320;}
        else if(a.type==='shoot'&&this.gameId==='basketball'&&(s.ball.z||0)<=1&&Date.now()>(p.shootAt||0)&&Math.hypot(s.ball.x-p.x,s.ball.y-p.y)<64){
          const b=s.ball,hoops=[{x:104,y:280},{x:856,y:280}];
          let m=Math.hypot(a.dx,a.dy)||1,ux=a.dx/m,uy=a.dy/m;
          const pw=Math.max(.2,Math.min(1,Number(a.power)||.5));
          let range=130+340*pw;
          // Rim assist: a landing spot close to a hoop lands in that hoop.
          const land={x:b.x+ux*range,y:b.y+uy*range};
          const near=hoops.reduce((best,h)=>Math.hypot(land.x-h.x,land.y-h.y)<Math.hypot(land.x-best.x,land.y-best.y)?h:best);
          if(Math.hypot(land.x-near.x,land.y-near.y)<46){range=Math.hypot(near.x-b.x,near.y-b.y);ux=(near.x-b.x)/range;uy=(near.y-b.y)/range;}
          const T=.9,v=range/T;
          b.vx=ux*v;b.vy=uy*v;b.vz=520*T/2;b.z=.1;
          const dh=Math.min(...hoops.map(h=>Math.hypot(p.x-h.x,p.y-h.y)));
          b.shooter=id;b.shotPts=dh>260?3:2;s.lastTouch=id;p.shootAt=Date.now()+700;
        }
      } else if(this.gameId==='penalties'){
        if(a.type==='shot'&&!s.ball.flight&&id===s.players[s.turn%s.players.length].id){const dx=a.x-s.ball.x,dy=a.y-s.ball.y,m=Math.hypot(dx,dy)||1;s.ball.vx=dx/m*Math.min(850,Math.max(360,a.power||540));s.ball.vy=dy/m*Math.min(850,Math.max(360,a.power||540));s.ball.flight=true;s.lastShotAt=timeNow();}
      } else if(this.gameId==='archery'){
        if(a.type==='air')s.airSuspension=Math.max(0,Math.min(3,Number(a.value)||0));
        if(a.type==='shoot'&&Date.now()>(p.cool||0)&&s.timeLeft>0){const angle=a.angle||0,power=Math.max(250,Math.min(780,a.power||460));s.arrows.push({x:170,y:340,vx:Math.cos(angle)*power,vy:Math.sin(angle)*power,owner:id});p.cool=Date.now()+650;}
      }
    }
    chessClick(id,x,y){const s=this.state,turn=s.players[s.turn%s.players.length];if(!turn||turn.id!==id||x<220||x>740||y<92||y>508)return;const c=Math.max(0,Math.min(7,Math.floor((x-220)/65))),r=Math.max(0,Math.min(7,Math.floor((y-92)/52))),i=r*8+c,piece=s.board[i];if(this.selectedSquare===null){if(piece&&piece[0]===(s.turn%2?'b':'w'))this.selectedSquare=i;return;}if(i===this.selectedSquare){this.selectedSquare=null;return;}const moving=s.board[this.selectedSquare];if(moving&&this.validChessMove(this.selectedSquare,i,moving)){if(s.board[i]?.[1]==='k'){s.winner=turn.name;turn.score++;}s.board[i]=moving;s.board[this.selectedSquare]=null;s.turn=(s.turn+1)%s.players.length;}this.selectedSquare=null;}
    validChessMove(from,to,piece){const s=this.state,fx=from%8,fy=Math.floor(from/8),tx=to%8,ty=Math.floor(to/8),dx=tx-fx,dy=ty-fy,target=s.board[to];if(target&&target[0]===piece[0])return false;const kind=piece[1];if(kind==='n')return(Math.abs(dx)===1&&Math.abs(dy)===2)||(Math.abs(dx)===2&&Math.abs(dy)===1);if(kind==='p'){const d=piece[0]==='w'?-1:1;if(dx===0&&!target&&dy===d)return true;if(dx===0&&!target&&dy===2*d&&fy===(piece[0]==='w'?6:1)&&!s.board[from+d*8])return true;return Math.abs(dx)===1&&dy===d&&!!target;}if(kind==='k')return Math.max(Math.abs(dx),Math.abs(dy))===1;if(kind==='r'&&dx!==0&&dy!==0)return false;if(kind==='b'&&Math.abs(dx)!==Math.abs(dy))return false;if(kind==='q'&&dx!==0&&dy!==0&&Math.abs(dx)!==Math.abs(dy))return false;const sx=Math.sign(dx),sy=Math.sign(dy);let x=fx+sx,y=fy+sy;while(x!==tx||y!==ty){if(s.board[y*8+x])return false;x+=sx;y+=sy;}return true;}
    dotClick(id,x,y){const s=this.state,turn=s.players[s.turn%s.players.length];if(!turn||turn.id!==id||x<295||x>680||y<90||y>470)return;const cols=s.grid,cell=68,ox=310,oy=105,rx=(x-ox)/cell,ry=(y-oy)/cell,c=Math.round(rx),r=Math.round(ry);let key;if(Math.abs(rx-c)<Math.abs(ry-r)){if(c<0||c>cols||r<0||r>=cols)return;key=`v${c}-${r}`;}else{if(r<0||r>cols||c<0||c>=cols)return;key=`h${c}-${r}`;}if(s.edges[key])return;s.edges[key]=id;let gained=0;for(let cy=0;cy<cols;cy++)for(let cx=0;cx<cols;cx++){const box=`${cx}-${cy}`;if(s.boxes[box])continue;const all=s.edges[`h${cx}-${cy}`]&&s.edges[`h${cx}-${cy+1}`]&&s.edges[`v${cx}-${cy}`]&&s.edges[`v${cx+1}-${cy}`];if(all){s.boxes[box]=id;gained++;}}if(!gained)s.turn=(s.turn+1)%s.players.length;else turn.score+=gained;if(Object.keys(s.boxes).length===cols*cols)s.winner=leaderName(s.players);}
    memoryClick(id,index,now){const s=this.state,turn=s.players[s.turn%s.players.length];if(!turn||turn.id!==id||now<s.lockUntil)return;const c=s.cards[index];if(!c||c.matched||c.open)return;c.open=true;s.flipped.push(index);if(s.flipped.length===2){const [a,b]=s.flipped.map(i=>s.cards[i]);if(a.v===b.v){a.matched=b.matched=true;turn.combo=(turn.combo||0)+1;turn.score+=Math.min(3,turn.combo);s.flipped=[];if(s.cards.every(x=>x.matched))s.winner=leaderName(s.players);}else{turn.combo=0;s.lockUntil=now+900;s.turn=(s.turn+1)%s.players.length;}}}
    simulate(dt,now){const s=this.state;s.tick++;if(this.gameId==='chess')s.selected=this.selectedSquare;if(this.gameId==='chess'&&s.clock&&!s.winner){const k=s.turn%2;s.clock[k]=Math.max(0,s.clock[k]-dt);if(s.clock[k]===0)s.winner=s.players[1-k].name;}if(s.winner)return;
      if(this.gameId==='golf'||this.gameId==='mini-golf')this.simGolf(dt);
      if(['snowball','paint-fight','king-yard','football','basketball'].includes(this.gameId))this.simArena(dt,now);
      if(this.gameId==='pool')this.simPool(dt);
      if(this.gameId==='broken-tiles')this.simTiles(now);
      if(this.gameId==='racing')this.simRace(dt);
      if(this.gameId==='penalties')this.simPenalty(dt,now);
      if(this.gameId==='archery')this.simArchery(dt);
    if(this.gameId==='brain-rush'||this.gameId==='mind-games')this.simQuiz(dt);
      if(this.gameId==='memory'&&s.lockUntil&&now>=s.lockUntil){s.flipped.forEach(i=>s.cards[i].open=false);s.flipped=[];s.lockUntil=0;}
      
    }
    simGolf(dt){const s=this.state;for(const p of s.players){if(p.done)continue;p.bx+=p.vx*dt;p.by+=p.vy*dt;p.vx*=Math.pow(.984,dt*60);p.vy*=Math.pow(.984,dt*60);if(Math.hypot(p.vx,p.vy)<8){p.vx=p.vy=0;}if(p.bx<81||p.bx>879){p.vx*=-.72;p.bx=Math.max(81,Math.min(879,p.bx));}if(p.by<100||p.by>455){p.vy*=-.72;p.by=Math.max(100,Math.min(455,p.by));}for(const o of s.obstacles){if(p.bx>o.x-9&&p.bx<o.x+o.w+9&&p.by>o.y-9&&p.by<o.y+o.h+9){if(Math.abs(p.vx)>Math.abs(p.vy))p.vx*=-.7;else p.vy*=-.7;}}if(Math.hypot(p.bx-s.hole.x,p.by-s.hole.y)<s.hole.r+3&&Math.hypot(p.vx,p.vy)<390){p.done=true;p.vx=p.vy=0;p.score=Math.max(1,8-p.strokes);}}if(s.players.every(p=>p.done))s.winner=leastStrokesLeader(s.players);}
    simArena(dt){
      const s=this.state,id=this.gameId,t=Date.now();
      if(s.timeLeft!==undefined&&!s.winner){
        s.timeLeft=Math.max(0,s.timeLeft-dt);
        if(s.timeLeft===0){s.winner=leaderName(s.players);return;}
      }
      if(id==='snowball'){
        s.pickupClock=(s.pickupClock??7)-dt;
        if(s.pickupClock<=0){s.pickupClock=9;if(s.pickups.length<3)s.pickups.push({x:160+Math.random()*640,y:150+Math.random()*250,kind:Math.random()<.5?'shield':'triple'});}
        for(const p of s.players){if(!p.active)continue;for(const k of s.pickups){if(!k.taken&&Math.hypot(k.x-p.x,k.y-p.y)<24){k.taken=true;if(k.kind==='shield')p.shieldUntil=t+5000;else p.triple=3;}}}
        s.pickups=s.pickups.filter(k=>!k.taken);
      }
      const throws=id==='snowball'||id==='paint-fight';
      for(const p of s.players){
        if(!p.active)continue;
        const inp=this.inputMap[p.id]||{},k=inp.keys||{};
        const stunned=(p.stunUntil||0)>t;
        const dx=(k.right?1:0)-(k.left?1:0),dy=(k.down?1:0)-(k.up?1:0),len=Math.hypot(dx,dy)||1,speed=stunned?80:215;
        p.vx=dx/len*speed;p.vy=dy/len*speed;
        p.x=Math.max(83,Math.min(877,p.x+p.vx*dt));p.y=Math.max(105,Math.min(455,p.y+p.vy*dt));
        if(throws&&inp.fire&&!p.lastFire&&!stunned&&t>(p.cool||0)){
          const aim=inp.aim||{x:p.x+1,y:p.y},m=Math.hypot(aim.x-p.x,aim.y-p.y)||1,v=id==='snowball'?390:340;
          const dx=(aim.x-p.x)/m,dy=(aim.y-p.y)/m,spread=(p.triple||0)>0?[-.18,0,.18]:[0];for(const d of spread){const ca=Math.cos(d),sa=Math.sin(d);s.projectiles.push({x:p.x,y:p.y,vx:(dx*ca-dy*sa)*v,vy:(dx*sa+dy*ca)*v,owner:p.id,life:2.1,color:p.color});}if((p.triple||0)>0)p.triple--;
          p.cool=t+430;
        }
        p.lastFire=!!inp.fire;
      }
      if(throws){
        for(const q of s.projectiles){
          q.x+=q.vx*dt;q.y+=q.vy*dt;q.life-=dt;
          if(q.x<75||q.x>885||q.y<95||q.y>465)q.life=0;
          for(const p of s.players){
            if(q.life<=0)break;
            if(p.id===q.owner||!p.active||Math.hypot(q.x-p.x,q.y-p.y)>=22)continue;
            q.life=0;
            const thrower=this.playerFor(q.owner);
            if(thrower)thrower.score++;
            if(id==='snowball'){
              if((p.shieldUntil||0)<=t)p.stunUntil=t+900;
              const m=Math.hypot(q.vx,q.vy)||1;
              p.x=Math.max(90,Math.min(870,p.x+q.vx/m*26));p.y=Math.max(105,Math.min(455,p.y+q.vy/m*26));
            }else{p.stunUntil=t+500;}
          }
          if(id==='paint-fight'&&q.life<1.6&&Math.floor(q.life*30)%5===0){s.splats.push({x:q.x,y:q.y,color:q.color,r:14});paintCells(s,q.x,q.y,q.owner);}
        }
        s.projectiles=s.projectiles.filter(q=>q.life>0);
        if(id==='paint-fight')s.splats=s.splats.slice(-120);
      }
      if(id==='paint-fight'&&s.cells){const cnt={};for(const o of s.cells)if(o)cnt[o]=(cnt[o]||0)+1;for(const p of s.players)p.score+=(cnt[p.id]||0)/s.cells.length*dt*12;}
      if(id==='king-yard'){
        if(t>=(s.zoneNextAt||0)){
          const z=s.zone;let nx,ny,guard=0;
          do{nx=150+Math.random()*660;ny=150+Math.random()*260;guard++;}
          while(guard<50&&Math.hypot(nx-z.x,ny-z.y)<200);
          s.zone={x:nx,y:ny,r:z.r};s.zoneNextAt=t+12000;s.zoneOwner=null;s.capture=0;s.capturing=null;
        }
        const inside=s.players.filter(p=>p.active&&Math.hypot(p.x-s.zone.x,p.y-s.zone.y)<s.zone.r);
        if(inside.length>1){s.capture=0;s.capturing=null;}
        else if(inside.length===1){
          const pl=inside[0];
          if(s.zoneOwner===pl.id){pl.score+=dt*2;}
          else{
            if(s.capturing!==pl.id){s.capturing=pl.id;s.capture=0;}
            s.capture=Math.min(1,(s.capture||0)+dt/2.5);
            if(s.capture>=1){s.zoneOwner=pl.id;s.capture=0;s.capturing=null;}
          }
        }else{s.capture=Math.max(0,(s.capture||0)-dt);if(s.capture===0)s.capturing=null;}
      }
      if(id==='football'||id==='basketball')this.simBall(dt,t);
    }
    simBall(dt,t){
      const s=this.state,b=s.ball,bb=this.gameId==='basketball',g=bb?520:0;
      const hoops=[{x:104,y:280},{x:856,y:280}];
      b.z=b.z||0;b.vz=b.vz||0;
      // Walking into a ball on the ground nudges it along, so players can dribble.
      if(b.z<6)for(const p of s.players){
        if(!p.active)continue;
        const dx=b.x-p.x,dy=b.y-p.y,d=Math.hypot(dx,dy);
        if(d>0&&d<24){
          const nx=dx/d,ny=dy/d;
          b.x=p.x+nx*24;b.y=p.y+ny*24;
          b.vx+=nx*55+(p.vx||0)*.5;b.vy+=ny*55+(p.vy||0)*.5;
          s.lastTouch=p.id;b.shooter=null;
        }
      }
      // Football keepers track the ball on their half and block shots at the mouth.
      if(this.gameId==='football'&&s.keepers)for(const k of s.keepers){
        const onHalf=k.x<480?b.x<480:b.x>480;
        const target=onHalf?Math.max(228,Math.min(332,b.y)):280;
        k.y+=Math.max(-150*dt,Math.min(150*dt,target-k.y));
        if(Math.abs(b.x-k.x)<16&&Math.abs(b.y-k.y)<38&&b.z<6){
          const push=k.x<480?1:-1;
          b.x=k.x+push*18;b.vx=push*Math.max(170,Math.abs(b.vx)*.5);b.vy=(b.y-k.y)*2.5;
        }
      }
      b.vz-=g*dt;b.z+=b.vz*dt;
      b.x+=b.vx*dt;b.y+=b.vy*dt;
      const f=Math.pow(.985,dt*60);b.vx*=f;b.vy*=f;
      const sp=Math.hypot(b.vx,b.vy);
      if(sp>560){b.vx*=560/sp;b.vy*=560/sp;}
      if(sp<8){b.vx=b.vy=0;}
      if(b.y<105){b.y=105;b.vy=Math.abs(b.vy)*.8;}
      if(b.y>455){b.y=455;b.vy=-Math.abs(b.vy)*.8;}
      const reset=()=>{b.x=480;b.y=280;b.vx=b.vy=b.vz=0;b.z=0;b.shooter=null;};
      const score=points=>{const scorer=this.playerFor(b.shooter||s.lastTouch);this.scoreGoal(scorer,s,points);reset();};
      if(bb){
        // A ball dropping through the rim scores.
        if(b.vz<0&&b.z<=26&&b.z>=8){
          for(const h of hoops)if(Math.hypot(b.x-h.x,b.y-h.y)<13){score(b.shotPts||2);return;}
        }
        if(b.z<=0){
          b.z=0;
          if(b.vz<-60){
            if(hoops.some(h=>Math.hypot(b.x-h.x,b.y-h.y)<18)){score(b.shotPts||2);return;}
            b.vz=-b.vz*.4;b.vx*=.7;b.vy*=.7;
          }else b.vz=0;
        }
        if(b.x<75){b.x=75;b.vx=Math.abs(b.vx)*.8;}
        if(b.x>885){b.x=885;b.vx=-Math.abs(b.vx)*.8;}
      }else{
        // Football: any ball that crosses the line inside the mouth scores for the last touch.
        if(b.x<=78&&Math.abs(b.y-280)<62){score(1);return;}
        if(b.x>=882&&Math.abs(b.y-280)<62){score(1);return;}
        if(b.x<78){b.x=78;b.vx=Math.abs(b.vx)*.8;}
        if(b.x>882){b.x=882;b.vx=-Math.abs(b.vx)*.8;}
      }
      const target=bb?15:5,top=Math.max(...s.players.map(p=>p.score)),leaders=s.players.filter(p=>p.score===top);
      if(top>=target&&leaders.length===1)s.winner=leaders[0].name;
    }

    scoreGoal(p,s,points=1){if(p)p.score+=points;s.goalFlash=Date.now()+1400;s.lastGoal={name:p?p.name:'',points,at:Date.now()};}
    simPool(dt){const s=this.state;let moving=false;const pockets=[[80,104],[480,104],[880,104],[80,455],[480,455],[880,455]];for(const b of s.balls){if(b.sunk)continue;b.x+=b.vx*dt;b.y+=b.vy*dt;b.vx*=Math.pow(.991,dt*60);b.vy*=Math.pow(.991,dt*60);if(Math.hypot(b.vx,b.vy)>5)moving=true;const pocket=pockets.some(([x,y])=>Math.hypot(b.x-x,b.y-y)<19);if(pocket){if(b.cue){b.x=245;b.y=270;b.vx=b.vy=0;}else{b.sunk=true;s.sunk.push(b.n);if(b.eight&&s.lastShooter)s.winner=this.playerFor(s.lastShooter)?.name||'Player';}continue;}if(b.x<100||b.x>860)b.vx*=-.82;if(b.y<110||b.y>430)b.vy*=-.82;b.x=Math.max(100,Math.min(860,b.x));b.y=Math.max(110,Math.min(430,b.y));}for(let i=0;i<s.balls.length;i++)for(let j=i+1;j<s.balls.length;j++){const a=s.balls[i],b=s.balls[j];if(a.sunk||b.sunk)continue;const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d&&d<a.r+b.r){const nx=dx/d,ny=dy/d,v=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;a.vx-=v*nx;a.vy-=v*ny;b.vx+=v*nx;b.vy+=v*ny;const overlap=(a.r+b.r-d)/2;a.x-=nx*overlap;a.y-=ny*overlap;b.x+=nx*overlap;b.y+=ny*overlap;}}const stillMoving=s.balls.some(b=>!b.sunk&&Math.hypot(b.vx,b.vy)>6);if(s.wasMoving&&!stillMoving){s.turn=(s.turn+1)%s.players.length;s.message='Your turn';s.wasMoving=false;}}
    simTiles(now){
      const s=this.state,N=s.cols*s.rows;
      if(!s.crumbleAt)s.crumbleAt=now+1500;
      // Random intact tiles start cracking. The gap between cracks shrinks, so the floor gets faster.
      if(now>=s.crumbleAt){
        const intact=[];for(let i=0;i<N;i++)if(s.tileState[i]===0)intact.push(i);
        if(intact.length){const pick=intact[Math.floor(Math.random()*intact.length)];s.tileState[pick]=1;s.tileBreakAt[pick]=now+900;}
        s.crumbleGap=Math.max(480,s.crumbleGap*.975);
        s.crumbleAt=now+s.crumbleGap;
      }
      // Cracked tiles give way once their timer runs out.
      for(let i=0;i<N;i++)if(s.tileState[i]===1&&now>=s.tileBreakAt[i])s.tileState[i]=2;
      for(const p of s.players){
        if(!p.active)continue;
        if(s.tileState[p.gy*s.cols+p.gx]===2){p.active=false;p.moveAt=0;continue;}
        const inp=this.inputMap[p.id]||{},k=inp.keys||{};
        if(now<(p.moveAt||0))continue;
        let dx=(k.right?1:0)-(k.left?1:0),dy=(k.down?1:0)-(k.up?1:0);
        if(!dx&&!dy)continue;if(dx&&dy)dy=0;
        const nx=p.gx+dx,ny=p.gy+dy;
        if(nx<0||nx>=s.cols||ny<0||ny>=s.rows)continue;
        const ni=ny*s.cols+nx;
        if(s.tileState[ni]===2)continue;
        // Leaving an intact tile cracks it behind you.
        const old=p.gy*s.cols+p.gx;
        if(s.tileState[old]===0){s.tileState[old]=1;s.tileBreakAt[old]=now+450;}
        p.gx=nx;p.gy=ny;p.x=154+nx*80;p.y=165+ny*68;p.moveAt=now+185;p.score++;
      }
      if(!s.winner){
        const alive=s.players.filter(p=>p.active);
        if(alive.length===0||(alive.length===1&&s.players.length>1))s.winner=alive.length===1?alive[0].name:leaderName(s.players);
      }
    }
    simRace(dt){
      const s=this.state,now=Date.now();
      for(const p of s.players){
        const k=(this.inputMap[p.id]||{}).keys||{};
        const top=(p.boostUntil||0)>now?430:320;
        if(k.up||k.down)p.speed=Math.max(0,Math.min(top,p.speed+((k.up?1:0)-(k.down?.7:0))*260*dt));else p.speed=Math.max(70,p.speed-55*dt);
        p.lane=Math.max(-60,Math.min(60,p.lane+((k.right?1:0)-(k.left?1:0))*170*dt));
        const before=p.progress;p.progress+=p.speed*dt;
        // Boost pads at 300 and 900 along the lap
        for(const pad of [300,900])if(before<pad&&p.progress>=pad)p.boostUntil=now+1600;
        if(p.progress>=1200){p.progress-=1200;p.lap++;p.score=p.lap;if(p.lap>=3&&!s.winner)s.winner=p.name;}
      }
      // Cars bump: a close pair slows down and moves apart sideways
      for(let i=0;i<s.players.length;i++)for(let j=i+1;j<s.players.length;j++){
        const a=s.players[i],b=s.players[j],A=this.carXY(a),B=this.carXY(b);
        if(Math.hypot(A.x-B.x,A.y-B.y)<22){a.speed*=.6;b.speed*=.6;const sg=(a.lane>=b.lane)?1:-1;a.lane=Math.max(-60,Math.min(60,a.lane+sg*2.5));b.lane=Math.max(-60,Math.min(60,b.lane-sg*2.5));}
      }
    }
    carXY(p){const t=p.progress/1200*Math.PI*2-Math.PI/2,rx=285+p.lane,ry=132+p.lane*.45;return{x:480+Math.cos(t)*rx,y:280+Math.sin(t)*ry};}

    simPenalty(dt,now){const s=this.state,n=s.players.length,keeper=n>1?s.players[(s.turn+1)%n]:null,k=keeper?((this.inputMap[keeper.id]||{}).keys||{}):{};s.keeperX=805+((k.right?1:0)-(k.left?1:0))*4;s.keeperY=Math.max(130,Math.min(410,s.keeperY+((k.down?1:0)-(k.up?1:0))*240*dt));if(!keeper){const target=s.ball.flight?s.ball.y:280;s.keeperY+=Math.max(-190*dt,Math.min(190*dt,target-s.keeperY));}const b=s.ball;if(b.flight){b.x+=b.vx*dt;b.y+=b.vy*dt;b.vy+=145*dt;b.vx*=Math.pow(.995,dt*60);if(Math.hypot(b.x-s.keeperX,b.y-s.keeperY)<28){b.flight=false;b.x=210;b.y=280;b.vx=b.vy=0;s.turn=(s.turn+1)%s.players.length;s.shots=(s.shots||0)+1;if(s.shots>=5*s.players.length)s.winner=leaderName(s.players);}else if(b.x>880||b.y>475||b.y<80){const scored=b.x>805&&b.y>145&&b.y<395;if(scored){s.goals[s.turn]++;const p=s.players[s.turn];p.score++;}b.flight=false;b.x=210;b.y=280;b.vx=b.vy=0;s.turn=(s.turn+1)%s.players.length;s.shots=(s.shots||0)+1;if(s.shots>=5*s.players.length)s.winner=leaderName(s.players);}}}
    simArchery(dt){const s=this.state;s.windT=(s.windT??12)-dt;if(s.windT<=0){s.windT=12;s.wind=(Math.random()*2-1)*70;}s.wind=s.wind||0;if(s.timeLeft>0){s.timeLeft=Math.max(0,s.timeLeft-dt);if(s.timeLeft===0)s.winner=leaderName(s.players);}for(const a of s.arrows){a.x+=a.vx*dt;a.y+=a.vy*dt;a.vy+=190*s.airSuspension*dt;a.vx*=Math.pow(.999,dt*60);a.vx+=s.wind*dt;if(!a.hit&&Math.hypot(a.x-s.target.x,a.y-s.target.y)<35){const owner=this.playerFor(a.owner);if(owner)owner.score+=Math.max(1,Math.round(10-Math.hypot(a.x-s.target.x,a.y-s.target.y)/4));a.hit=true;}if(a.x>920||a.y>510)a.dead=true;}s.arrows=s.arrows.filter(a=>!a.dead);}
    handlePointer(x1,y1,x2,y2){if(!this.state)return;const id=this.me;switch(this.gameId){case'chess':this.act({type:'square',x:x2,y:y2});break;case'dots-boxes':this.act({type:'dot',x:x2,y:y2});break;case'memory':{const col=Math.floor((x2-270)/105),row=Math.floor((y2-135)/87);if(col>=0&&col<4&&row>=0&&row<4)this.act({type:'card',index:row*4+col});break;}case'snowball':case'paint-fight':this.act({type:'throw',x:x2,y:y2});break;case'golf':case'mini-golf':{const p=this.playerFor(id);if(!p||Math.hypot(x1-p.bx,y1-p.by)>48)return;const dx=x1-x2,dy=y1-y2;this.act({type:'shot',dx,dy,power:Math.hypot(dx,dy)*3.5});break;}case'pool':{const cue=this.state.balls[0];if(Math.hypot(x1-cue.x,y1-cue.y)>70)return;this.act({type:'shot',dx:x1-x2,dy:y1-y2,power:Math.hypot(x1-x2,y1-y2)*3.3});break;}case'football':case'basketball':{const b=this.state.ball;if(Math.hypot(x1-b.x,y1-b.y)>95)return;const dx=x1-x2,dy=y1-y2,len=Math.hypot(dx,dy);if(len<10)return;this.act({type:this.gameId==='basketball'?'shoot':'kick',dx,dy,power:Math.min(1,len/150)});break;}case'penalties':{if(Math.hypot(x1-this.state.ball.x,y1-this.state.ball.y)>80)return;const dx=x2-x1,dy=y2-y1;this.act({type:'shot',x:x1+dx*4,y:y1+dy*4,power:Math.hypot(dx,dy)*5});break;}case'brain-rush':case'mind-games':{const i=(x2>=120&&x2<460)?0:(x2>=500&&x2<840)?1:-1,row=(y2>=205&&y2<315)?0:(y2>=335&&y2<445)?1:-1;if(i>=0&&row>=0)this.act({type:'answer',index:row*2+i});break;}
      case'archery':{const dx=x2-x1,dy=y2-y1;const angle=Math.atan2(dy,dx);this.act({type:'shoot',angle,power:Math.min(780,Math.max(250,Math.hypot(dx,dy)*4))});break;}}
    }
    paint(){if(!this.g||!this.state)return;const real=this.state;const view=this.viewState();this.state=view||real;try{this.paintView();this.drawFx();}finally{this.state=real;}}
    paintView(){if(!this.g||!this.state)return;const s=this.state,g=this.g,id=this.gameId;g.clear();this.labelIndex=0;if(id==='chess')this.drawChess();else if(id==='dots-boxes')this.drawDots();else if(id==='memory')this.drawMemory();else if(id==='golf'||id==='mini-golf')this.drawGolf();else if(id==='pool')this.drawPool();else if(id==='broken-tiles')this.drawTiles();else if(id==='racing')this.drawRacing();else if(id==='penalties')this.drawPenalty();else if(id==='archery')this.drawArchery();else if(id==='brain-rush'||id==='mind-games')this.drawQuiz();else this.drawArena();for(let i=this.labelIndex;i<this.labelNodes.length;i++)this.labelNodes[i].setVisible(false);this.title.setText(TITLES[id]||'Party Arcade');this.meta.setText(this.scoreText());}
    scoreText(){const s=this.state;if(s.winner)return `WINNER · ${s.winner}`;if(this.gameId==='chess'&&s.clock)return `${s.players[s.turn%2]?.name||''} · ${fmtClock(s.clock[0])} / ${fmtClock(s.clock[1])}`;if(this.gameId==='chess'||this.gameId==='dots-boxes'||this.gameId==='memory'||this.gameId==='pool')return `${s.players[s.turn%s.players.length]?.name||''}’S TURN`;if(this.gameId==='archery'||this.gameId==='golf'||this.gameId==='mini-golf')return s.players.map(p=>`${p.name} ${this.gameId.includes('golf')?p.strokes:p.score}`).join('  ·  ');if(this.gameId==='penalties')return s.goals.map((n,i)=>`${s.players[i]?.name||'Player'} ${n}`).join('  ·  ');if(this.gameId==='brain-rush'||this.gameId==='mind-games')return s.q?`${s.q.n+1} of ${s.q.total}  ·  ${s.q.cat}`:'';if(this.gameId==='racing')return [...s.players].sort((a,b)=>(b.lap*1200+b.progress)-(a.lap*1200+a.progress)).map((p,i)=>`${i+1}. ${p.name} ${p.lap}/3`).join('  ·  ');const clock=s.timeLeft!==undefined?`${Math.ceil(s.timeLeft)}s  ·  `:'';return clock+s.players.map(p=>`${p.name} ${Math.floor(p.score)}`).join('  ·  ');}
    bg(color=0x1d2930){const g=this.g;g.fillStyle(color);g.fillRect(0,0,W,H);}
    rect(x,y,w,h,c,a=1){const g=this.g;g.fillStyle(colorValue(c),a);g.fillRect(x,y,w,h);}
    line(x1,y1,x2,y2,c=0xffffff,a=.3,width=2){const g=this.g;g.lineStyle(width,colorValue(c),a);g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.strokePath();}
    circle(x,y,r,c,a=1,stroke=null){const g=this.g;g.fillStyle(colorValue(c),a);g.fillCircle(x,y,r);if(stroke){g.lineStyle(2,colorValue(stroke),1);g.strokeCircle(x,y,r);}}
    arenaBase(color=0x1f3230){this.bg(color);this.rect(58,82,844,398,0x263a36);this.g.lineStyle(1,0xb5e1d1,.15);this.g.strokeRect(68,92,824,378);}
    drawPlayer(p,r=14){const v={x:p.x,y:p.y};this.circle(v.x,v.y,r+6,p.color,.16);this.drawCharacter(v.x,v.y,r,p);this.addName(v.x,v.y+r+9,p.name);}
    addName(x,y,name){this.g.fillStyle(0x11121b,.82);this.g.fillRoundedRect(x-31,y-7,62,16,5);this.addLabel(x,y,String(name).slice(0,10),8,'#f7f5ff');}
    drawArena(){
      const id=this.gameId,s=this.state,ball=id==='football'||id==='basketball';
      this.arenaBase(id==='snowball'?0x27323c:id==='paint-fight'?0x29283b:id==='basketball'?0x3a2a24:0x1f3530);
      if(id==='snowball'){this.rect(58,82,844,398,0xcbe9f6,.08);for(let i=0;i<7;i++)this.circle(110+i*125,104+(i%2)*11,38,0xe9f5f9,.07);for(let x=90;x<900;x+=68)this.circle(x,447+(x%3)*5,3,0xffffff,.5);}
      if(id==='paint-fight'){if(s.cells){const col={};for(const p of s.players)col[p.id]=p.color;s.cells.forEach((o,i)=>{if(o&&col[o])this.rect(83+(i%PAINT_COLS)*PAINT_CW,105+Math.floor(i/PAINT_COLS)*PAINT_CH,PAINT_CW+1,PAINT_CH+1,col[o],.28);});}for(const q of s.splats||[]){this.circle(q.x,q.y,q.r*.6,q.color,.18);}}
      if(id==='king-yard'){
        this.circle(s.zone.x,s.zone.y,s.zone.r,0x79e3bd,.09);this.g.lineStyle(3,0x79e3bd,.55);this.g.strokeCircle(s.zone.x,s.zone.y,s.zone.r);this.g.lineStyle(1,0x79e3bd,.24);this.g.strokeCircle(s.zone.x,s.zone.y,s.zone.r-12);
        const owner=s.players.find(p=>p.id===s.zoneOwner),capturer=s.players.find(p=>p.id===s.capturing);
        if(owner){this.g.lineStyle(5,colorValue(owner.color),.95);this.g.strokeCircle(s.zone.x,s.zone.y,s.zone.r+6);}
        if(capturer&&(s.capture||0)>0){this.g.lineStyle(5,colorValue(capturer.color),.95);this.g.beginPath();this.g.arc(s.zone.x,s.zone.y,s.zone.r+12,-Math.PI/2,-Math.PI/2+Math.PI*2*s.capture,false);this.g.strokePath();}
      }
      if(id==='football'){
        this.line(480,92,480,470,0xb8efd7,.18,2);this.g.lineStyle(2,0xb8efd7,.5);this.g.strokeCircle(480,280,64);
        this.rect(60,218,22,124,0x2a4d43);this.rect(878,218,22,124,0x2a4d43);
        this.g.lineStyle(2,0xf2fff8,.9);this.g.strokeRect(60,218,22,124);this.g.strokeRect(878,218,22,124);
        for(let y=226;y<342;y+=8){this.line(60,y,82,y,0xb8efd7,.22,1);this.line(878,y,900,y,0xb8efd7,.22,1);}
        this.rect(80,222,2,116,0xffffff,.6);this.rect(878,222,2,116,0xffffff,.6);
        for(const k of s.keepers||[]){this.circle(k.x,k.y,15,0x2d3340,1,0xf2fff8);this.addLabel(k.x,k.y,'GK',7,'#f2fff8');}
      }
      if(id==='basketball'){
        this.rect(60,92,840,378,0x9b6045);this.g.lineStyle(2,0xf4caa9,.55);this.g.strokeRect(60,92,840,378);
        this.g.strokeCircle(480,280,60);this.line(480,92,480,470,0xf4caa9,.3,2);
        this.g.lineStyle(2,0xf4caa9,.45);this.g.strokeCircle(104,280,92);this.g.strokeCircle(856,280,92);
        for(const hx of [104,856]){this.rect(hx-4,240,8,80,0xf4f0e6,.9);this.g.lineStyle(3,0xff9b77,1);this.g.strokeCircle(hx,280,16);}
      }
      if(ball){
        const b=s.ball,z=b.z||0;
        this.circle(b.x+2,b.y+3,Math.max(5,11-z*.04),0x000000,.28);
        if(id==='basketball'){
          this.circle(b.x,b.y-z,12,0xff964e,1,0x653f37);this.g.lineStyle(1,0x5d392e,.9);this.g.strokeCircle(b.x,b.y-z,11);this.line(b.x-11,b.y-z,b.x+11,b.y-z,0x5d392e,.8,1);
        }else this.circle(b.x,b.y,10,0xfff0c4,1,0x653f37);
        // Aim guide: drag back from the ball. The line points where the ball will go and its length shows power.
        const p=this.input?.activePointer;
        if(this.drag&&p&&!z&&Math.hypot(this.drag.x-b.x,this.drag.y-b.y)<95){
          const dx=this.drag.x-p.worldX,dy=this.drag.y-p.worldY,m=Math.hypot(dx,dy)||1,pw=Math.min(1,m/150);
          const len=id==='basketball'?130+340*pw:40+120*pw;
          this.line(b.x,b.y,b.x+dx/m*len,b.y+dy/m*len,0xffffff,.65,2);
          this.rect(b.x-30,b.y-30,60,6,0x000000,.5);this.rect(b.x-30,b.y-30,60*pw,6,0xffd37a,1);
        }
      }
      if(id==='snowball')for(const k of s.pickups||[]){const shield=k.kind==='shield';this.circle(k.x,k.y,15,shield?0x7ff5ff:0xffd37a,.25);this.circle(k.x,k.y,10,shield?0x7ff5ff:0xffd37a,.95);this.addLabel(k.x,k.y,shield?'S':'3',11,'#14131f');}
      for(const q of s.projectiles||[])this.circle(q.x,q.y,id==='snowball'?7:6,id==='snowball'?0xffffff:q.color,1,id==='snowball'?0xb9d6e9:null);
      for(const p of s.players){
        if(ball)this.drawPlayer(p,12);else this.drawPlayer(p,15);
        if((p.shieldUntil||0)>Date.now())this.circle(p.x,p.y,24,0x7ff5ff,.14,0x7ff5ff);
        if((p.stunUntil||0)>Date.now())this.circle(p.x,p.y-20,4,0xbfe9ff,1);
      }
      const labels={snowball:'GRAB S = SHIELD · 3 = TRIPLE THROW · AIM · THROW',['paint-fight']:'PAINT MORE OF THE FLOOR · TAG RIVALS · MOST TERRITORY WINS',football:'FIRST TO 5 GOALS · LAST TOUCH SCORES',basketball:'FIRST TO 15 · 3 POINTERS FROM FAR OUT'};
      if(id==='king-yard'){const left=Math.max(0,Math.ceil(((s.zoneNextAt||0)-Date.now())/1000));this.addLabel(480,493,`CAPTURE IT ALONE · OWNER EARNS 2X · CONTESTED SCORES NOTHING · MOVES IN ${left}s`,8,'#b3f5d5');}
      else if(labels[id])this.addLabel(480,493,labels[id],8,id==='snowball'?'#d8ecf8':id==='paint-fight'?'#dfcfff':id==='football'?'#d7f4e7':'#ffe1c3');
      if(ball&&s.lastGoal&&Date.now()-s.lastGoal.at<1500){
        const title=id==='football'?'GOAL!':`+${s.lastGoal.points}`;
        this.addLabel(480,200,`${title} ${String(s.lastGoal.name).toUpperCase()}`,24,'#ffffff');
      }
    }
    addLabel(x,y,text,size=10,color='#fff'){let obj=this.labelNodes[this.labelIndex];const fontSize=Math.round(size*(window.innerWidth<700?1.35:1));if(!obj){obj=this.add.text(x,y,text,{fontFamily:'DM Sans, system-ui, -apple-system, Segoe UI, sans-serif',fontSize:`${fontSize}px`,fontStyle:'bold',color,align:'center'}).setOrigin(.5).setDepth(2);this.labelNodes.push(obj);}obj.setVisible(true).setPosition(x,y).setText(String(text)).setStyle({fontFamily:'DM Sans, system-ui, -apple-system, Segoe UI, sans-serif',fontSize:`${fontSize}px`,fontStyle:'bold',color,align:'center'});this.labelIndex++;}
    drawGolf(){const s=this.state;this.bg(0x182d2a);this.rect(58,82,844,398,0x335848);this.rect(72,96,816,370,0x3b6650);for(let x=100;x<880;x+=48)this.line(x,96,x,466,0xd3ebbf,.04,1);this.rect(75,96,813,370,0x000000,0);this.circle(s.hole.x,s.hole.y,s.hole.r+9,0xa2d27b,.18);this.circle(s.hole.x,s.hole.y,s.hole.r,0x14231f,1);this.circle(s.hole.x,s.hole.y,7,0x05080a,1);this.line(s.hole.x+2,s.hole.y-3,s.hole.x+2,s.hole.y-72,0xf5f1df,.9,2);this.rect(s.hole.x+3,s.hole.y-71,27,15,0xff8fa9);for(const o of s.obstacles){this.rect(o.x,o.y,o.w,o.h,0x8cbd74,.9);this.g.lineStyle(1,0xd2f1b6,.25);this.g.strokeRect(o.x,o.y,o.w,o.h);}for(const p of s.players){this.circle(p.bx,p.by,11,p.color,.18);this.circle(p.bx,p.by,7,0xfff3c7,1,p.color);this.addLabel(p.bx,p.by-16,`${p.name} · ${p.strokes}`,8,'#fbf6dc');}this.addLabel(480,493,s.players.every(p=>p.done)?'COURSE COMPLETE':'DRAG BACK FROM YOUR BALL TO PUTT',8,'#d1efb3');}
    drawChess(){const s=this.state;this.bg(0x242333);const x0=220,y0=92,cell=65;for(let r=0;r<8;r++)for(let c=0;c<8;c++){const light=(r+c)%2===0;this.rect(x0+c*cell,y0+r*52,cell,52,light?0xe1d4bd:0x6c7183);if(this.selectedSquare===r*8+c)this.rect(x0+c*cell,y0+r*52,cell,52,0xa49aff,.7);const piece=s.board[r*8+c];if(piece){const symbol={k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'}[piece[1]];this.addLabel(x0+c*cell+32,y0+r*52+23,symbol,31,piece[0]==='w'?'#fff7df':'#282937');}}this.addLabel(480,514,'LIGHT MOVES FIRST · CAPTURE THE KING',8,'#d7d4e8');}
    drawDots(){const s=this.state;this.bg(0x252334);const ox=180,oy=110,cell=100,n=s.grid;for(let y=0;y<n;y++)for(let x=0;x<n;x++){const who=s.boxes[`${x}-${y}`];if(who){const p=this.playerFor(who);this.rect(ox+x*cell+2,oy+y*cell+2,cell-4,cell-4,parseInt((p?.color||'#a99cff').slice(1),16),.23);this.addLabel(ox+x*cell+50,oy+y*cell+42,p?.name?.slice(0,5)||'✓',9,p?.color||'#fff');}}for(let r=0;r<=n;r++)for(let c=0;c<=n;c++)this.circle(ox+c*cell,oy+r*cell,5,0xf4efff);for(const [key,owner] of Object.entries(s.edges)){const v=key[0]==='v',parts=key.slice(1).split('-').map(Number),x=ox+parts[0]*cell,y=oy+parts[1]*cell,p=this.playerFor(owner),col=parseInt((p?.color||'#fff').slice(1),16);if(v)this.rect(x-3,y+4,6,cell-8,col);else this.rect(x+4,y-3,cell-8,6,col);}this.addLabel(480,493,'CLICK AN EDGE TO CLAIM A BOX',8,'#ddd7f0');}
    drawMemory(){const s=this.state;this.bg(0x242332);for(let i=0;i<16;i++){const card=s.cards[i],x=270+(i%4)*105,y=135+Math.floor(i/4)*87;if(card.open||card.matched){this.rect(x,y,87,72,card.matched?0x344a48:0x484260);this.addLabel(x+43,y+34,card.v,25,card.matched?'#91e3c2':'#e6dfff');}else{this.rect(x,y,87,72,0x39364d);this.g.lineStyle(1,0xb2a5ff,.35);this.g.strokeRoundedRect(x,y,87,72,9);this.addLabel(x+43,y+31,'✳',20,'#aaa0df');}}this.addLabel(480,500,'FIND PAIRS · MATCH AS MANY AS YOU CAN',8,'#ded9ef');}
    drawTiles(){const s=this.state;this.bg(0x262637);const x0=154,y0=165,tw=80,th=68;for(let y=0;y<s.rows;y++)for(let x=0;x<s.cols;x++){const v=s.tileState[y*s.cols+x];if(v===2){this.rect(x0+x*tw,y0+y*th,tw-5,th-5,0x141520,.7);this.line(x0+x*tw+10,y0+y*th+12,x0+x*tw+58,y0+y*th+52,0x696879,.5);continue;}this.rect(x0+x*tw,y0+y*th,tw-5,th-5,v===1?0x574e68:0x47465e);this.g.lineStyle(1,0x9d96bd,.32);this.g.strokeRect(x0+x*tw,y0+y*th,tw-5,th-5);}for(const p of s.players)if(p.active)this.drawPlayer(p,14);this.addLabel(480,506,'DON’T STOP MOVING · THE FLOOR DOES',8,'#ded9f0');}
    drawRacing(){const s=this.state;this.bg(0x263039);this.g.lineStyle(75,0x343641,1);this.g.strokeEllipse(480,280,650,330);this.g.lineStyle(2,0xd8c77b,.5);this.g.strokeEllipse(480,280,650,330);for(let i=0;i<s.players.length;i++){const p=s.players[i],t=p.progress/1200*Math.PI*2-Math.PI/2,rx=285+p.lane,ry=132+p.lane*.45,x=480+Math.cos(t)*rx,y=280+Math.sin(t)*ry;this.rect(x-13,y-8,26,16,p.color);this.g.lineStyle(2,0x171821,.8);this.g.strokeRect(x-13,y-8,26,16);this.addLabel(x,y-19,p.name,8,'#f9f6ff');}for(const pad of [300,900]){const t=pad/1200*Math.PI*2-Math.PI/2;this.circle(480+Math.cos(t)*285,280+Math.sin(t)*132,11,0x73e0bf,.35,0xb8fff0);this.addLabel(480+Math.cos(t)*285,280+Math.sin(t)*132,'»',10,'#e9fff8');}this.addLabel(480,493,'3 LAPS · NITRO PADS · BUMP TO SLOW DOWN',8,'#ded9ef');}
    drawPenalty(){const s=this.state;this.bg(0x244037);this.rect(60,82,840,398,0x397254);this.g.lineStyle(2,0xe5f1db,.6);this.g.strokeRect(60,82,840,398);this.g.strokeRect(735,160,165,220);this.g.strokeRect(820,210,80,120);this.g.strokeCircle(480,280,64);this.rect(890,145,10,270,0xe8e6da);this.rect(805,150,88,9,0xffffff,.8);this.rect(805,401,88,9,0xffffff,.8);this.circle(s.keeperX,s.keeperY,20,0xff8e9f,.95,0xffffff);this.circle(s.ball.x,s.ball.y,12,0xfff2cc,1,0x53422d);this.addLabel(480,493,'SHOOTER DRAGS TO AIM · KEEPER MOVES WITH WASD',8,'#e5f1db');}
    drawPool(){const s=this.state;this.bg(0x1d2930);this.rect(58,82,844,398,0x6b3a22);this.rect(72,96,816,370,0x1f6b4f);
      this.g.lineStyle(1,0xffffff,.07);this.g.strokeRect(100,110,760,320);this.line(300,110,300,430,0xffffff,.07,1);this.g.lineStyle(1,0xffffff,.07);this.g.strokeCircle(680,270,50);
      for(const [x,y] of [[80,104],[480,104],[880,104],[80,455],[480,455],[880,455]])this.circle(x,y,19,0x07090d,1);
      for(const b of s.balls){if(b.sunk)continue;this.circle(b.x+2,b.y+3,b.r,0x000000,.28);
        this.circle(b.x,b.y,b.r,b.color,1,b.cue?null:0x14161c);
        if(!b.cue){this.circle(b.x,b.y,b.r*.42,0xffffff,.92);this.addLabel(b.x,b.y,String(b.n),7,'#14161c');}
        else this.circle(b.x-b.r*.3,b.y-b.r*.35,b.r*.25,0xffffff,.55);}
      // Aim guide while the local player is dragging back from the cue ball.
      const cue=s.balls[0],p=this.input?.activePointer;
      if(this.drag&&p&&!s.balls.some(b=>!b.sunk&&Math.hypot(b.vx,b.vy)>6)&&Math.hypot(this.drag.x-cue.x,this.drag.y-cue.y)<70){
        const dx=cue.x-p.worldX,dy=cue.y-p.worldY,m=Math.hypot(dx,dy)||1,len=Math.min(260,m*1.6);
        this.line(cue.x,cue.y,cue.x+dx/m*len,cue.y+dy/m*len,0xffffff,.55,2);
      }
      this.addLabel(480,493,s.message&&s.message!=='Break shot'?`${s.message.toUpperCase()}`:'DRAG BACK FROM THE CUE BALL TO SHOOT · SINK THE 8 LAST',8,'#d9f2e6');}
    drawArchery(){const s=this.state;this.bg(0x293545);this.rect(58,82,844,398,0x405067);this.rect(58,400,844,80,0x30463f);for(let i=0;i<9;i++)this.line(90+i*95,118,120+i*91,400,0xd2d7e4,.07,1);this.rect(161,328,18,47,0xb89167);this.circle(169,311,22,0xf2bd8f,1);this.line(176,300,206,327,0x9b7958,.9,4);this.line(190,320,213,330,0x8b6147,.9,6);for(const [r,c] of [[52,0xeae8dd],[41,0x72c8e2],[30,0xe9d46d],[18,0xf39065],[7,0xf2f0e4]]){this.circle(s.target.x,s.target.y,r,c,1);this.g.lineStyle(1,0x1d2632,.25);this.g.strokeCircle(s.target.x,s.target.y,r);}for(const a of s.arrows){this.line(a.x,a.y,a.x-27,a.y-a.vy*.035,0xf6e4bd,1,4);this.circle(a.x,a.y,3,0xffffff);}this.addLabel(480,493,`${s.timeLeft!==undefined?`${Math.ceil(s.timeLeft)}s LEFT · `:''}WIND ${Math.round(s.wind||0)} · AIR SUSPENSION · ${Number(s.airSuspension).toFixed(1)}`,8,'#e4e7ee');}
  }
  GameScene.prototype.chessAttacked=function(board,square,by){const tx=square%8,ty=Math.floor(square/8);for(let from=0;from<64;from++){const piece=board[from];if(!piece||piece[0]!==by)continue;const fx=from%8,fy=Math.floor(from/8),dx=tx-fx,dy=ty-fy,k=piece[1];if(k==='p'&&Math.abs(dx)===1&&dy===(by==='w'?-1:1))return true;if(k==='n'&&((Math.abs(dx)===1&&Math.abs(dy)===2)||(Math.abs(dx)===2&&Math.abs(dy)===1)))return true;if(k==='k'&&Math.max(Math.abs(dx),Math.abs(dy))===1)return true;const straight=dx===0||dy===0,diagonal=Math.abs(dx)===Math.abs(dy);if((k==='r'&&!straight)||(k==='b'&&!diagonal)||(k==='q'&&!straight&&!diagonal)||k==='p'||k==='n'||k==='k')continue;const sx=Math.sign(dx),sy=Math.sign(dy);let x=fx+sx,y=fy+sy,clear=true;while(x!==tx||y!==ty){if(board[y*8+x]){clear=false;break;}x+=sx;y+=sy;}if(clear)return true;}return false;};
  GameScene.prototype.chessInCheck=function(board,color){const king=board.findIndex(p=>p===`${color}k`);return king<0||this.chessAttacked(board,king,color==='w'?'b':'w');};
  GameScene.prototype.chessMoveAllowed=function(board,from,to,piece){const fx=from%8,fy=Math.floor(from/8),tx=to%8,ty=Math.floor(to/8),dx=tx-fx,dy=ty-fy,target=board[to],k=piece[1],color=piece[0],step=color==='w'?-1:1;let castle=false,enPassant=false;if(target&&(target[0]===color||target[1]==='k'))return false;if(k==='n'){if(!((Math.abs(dx)===1&&Math.abs(dy)===2)||(Math.abs(dx)===2&&Math.abs(dy)===1)))return false;}else if(k==='p'){if(dx===0&&!target&&dy===step){}else if(dx===0&&!target&&dy===2*step&&fy===(color==='w'?6:1)&&!board[from+step*8]){}else if(Math.abs(dx)===1&&dy===step&&target){}else if(Math.abs(dx)===1&&dy===step&&!target&&this.state.lastMove&&this.state.lastMove.piece[1]==='p'&&this.state.lastMove.piece[0]!==color&&this.state.lastMove.to===from+dx&&Math.abs(this.state.lastMove.from-this.state.lastMove.to)===16)enPassant=true;else return false;}else if(k==='k'){if(Math.max(Math.abs(dx),Math.abs(dy))===1){}else if(dy===0&&Math.abs(dx)===2){const home=color==='w'?7:0,side=dx>0?'K':'Q',rook=side==='K'?from+3:from-4,required=side==='K'?[from+1,from+2]:[from-1,from-2,from-3];if(fy!==home||fx!==4||!this.state.castling?.[color+side]||board[rook]!==`${color}r`||required.some(sq=>board[sq])||this.chessAttacked(board,from,color==='w'?'b':'w')||this.chessAttacked(board,from+Math.sign(dx),color==='w'?'b':'w')||this.chessAttacked(board,to,color==='w'?'b':'w'))return false;castle=true;}else return false;}else{const straight=dx===0||dy===0,diagonal=Math.abs(dx)===Math.abs(dy);if((k==='r'&&!straight)||(k==='b'&&!diagonal)||(k==='q'&&!straight&&!diagonal))return false;const sx=Math.sign(dx),sy=Math.sign(dy);let x=fx+sx,y=fy+sy;while(x!==tx||y!==ty){if(board[y*8+x])return false;x+=sx;y+=sy;}}const next=board.slice();next[to]=(k==='p'&&(ty===0||ty===7))?`${color}q`:piece;next[from]=null;if(enPassant)next[to-step*8]=null;if(castle){const rookFrom=dx>0?from+3:from-4,rookTo=dx>0?from+1:from-1;next[rookTo]=next[rookFrom];next[rookFrom]=null;}const king=next.findIndex(p=>p===`${color}k`);return king>=0&&!this.chessAttacked(next,king,color==='w'?'b':'w');};
  GameScene.prototype.chessHasMove=function(board,color){for(let from=0;from<64;from++){const piece=board[from];if(!piece||piece[0]!==color)continue;for(let to=0;to<64;to++)if(this.chessMoveAllowed(board,from,to,piece))return true;}return false;};
  GameScene.prototype.chessClick=function(id,x,y){const s=this.state,turn=s.players[s.turn%s.players.length];if(!turn||turn.id!==id||x<220||x>740||y<92||y>508)return;const c=Math.max(0,Math.min(7,Math.floor((x-220)/65))),r=Math.max(0,Math.min(7,Math.floor((y-92)/52))),i=r*8+c,piece=s.board[i],color=s.turn%2?'b':'w';if(this.selectedSquare===null){if(piece&&piece[0]===color)this.selectedSquare=i;return;}if(i===this.selectedSquare){this.selectedSquare=null;return;}const from=this.selectedSquare,moving=s.board[from];if(moving&&this.chessMoveAllowed(s.board,from,i,moving)){const captured=s.board[i],dx=i%8-from%8;if(moving[1]==='p'&&!captured&&Math.abs(dx)===1)s.board[i-(moving[0]==='w'?-8:8)]=null;if(moving[1]==='k'){s.castling[moving[0]+'K']=false;s.castling[moving[0]+'Q']=false;if(Math.abs(dx)===2){const rookFrom=dx>0?from+3:from-4,rookTo=dx>0?from+1:from-1;s.board[rookTo]=s.board[rookFrom];s.board[rookFrom]=null;}}if(moving[1]==='r'){if(from===56)s.castling.wQ=false;if(from===63)s.castling.wK=false;if(from===0)s.castling.bQ=false;if(from===7)s.castling.bK=false;}if(captured?.[1]==='r'){if(i===56)s.castling.wQ=false;if(i===63)s.castling.wK=false;if(i===0)s.castling.bQ=false;if(i===7)s.castling.bK=false;}s.board[i]=(moving[1]==='p'&&(r===0||r===7))?`${moving[0]}q`:moving;s.board[from]=null;s.lastMove={from,to:i,piece:moving};s.turn=(s.turn+1)%s.players.length;const nextColor=s.turn%2?'b':'w',checked=this.chessInCheck(s.board,nextColor);if(checked&&!this.chessHasMove(s.board,nextColor)){s.winner=turn.name;turn.score++;}else if(!checked&&!this.chessHasMove(s.board,nextColor))s.winner='Draw';s.check=checked;this.selectedSquare=null;}else if(piece&&piece[0]===color)this.selectedSquare=i;else this.selectedSquare=null;};
  const chessClickForTurn=GameScene.prototype.chessClick;
  GameScene.prototype.chessClick=function(id,x,y){if(x<272||x>688||y<92||y>508)return;if(this.selectedSquare!==null&&this.state){const color=this.state.turn%2?'b':'w';if(this.state.board[this.selectedSquare]?.[0]!==color)this.selectedSquare=null;}const boardX=220+((x-272)/52)*65+1;chessClickForTurn.call(this,id,boardX,y);};
  GameScene.prototype.drawChess=function(){const s=this.state;this.bg(0x242333);const x0=272,y0=92,cell=52;for(let r=0;r<8;r++)for(let c=0;c<8;c++){const light=(r+c)%2===0;this.rect(x0+c*cell,y0+r*cell,cell,cell,light?0xe1d4bd:0x6c7183);if(s.selected===r*8+c)this.rect(x0+c*cell,y0+r*cell,cell,cell,0xa49aff,.7);const piece=s.board[r*8+c];if(piece){const symbol={k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'}[piece[1]];this.addLabel(x0+c*cell+26,y0+r*cell+25,symbol,31,piece[0]==='w'?'#fff7df':'#282937');}}this.addLabel(480,514,s.check?'CHECK · FIND A WAY OUT':'LIGHT MOVES FIRST · CHECKMATE TO WIN',8,s.check?'#ff9aaf':'#d7d4e8');};
  GameScene.prototype.drawDots=function(){const s=this.state;this.bg(0x252334);const ox=310,oy=105,cell=68,n=s.grid;for(let y=0;y<n;y++)for(let x=0;x<n;x++){const who=s.boxes[`${x}-${y}`];if(who){const p=this.playerFor(who);this.rect(ox+x*cell+2,oy+y*cell+2,cell-4,cell-4,colorValue(p?.color||'#a99cff'),.23);this.addLabel(ox+x*cell+34,oy+y*cell+30,p?.name?.slice(0,5)||'✓',9,p?.color||'#fff');}}for(let r=0;r<=n;r++)for(let c=0;c<=n;c++)this.circle(ox+c*cell,oy+r*cell,5,0xf4efff);for(const [key,owner] of Object.entries(s.edges)){const v=key[0]==='v',parts=key.slice(1).split('-').map(Number),x=ox+parts[0]*cell,y=oy+parts[1]*cell,p=this.playerFor(owner),col=colorValue(p?.color||'#fff');if(v)this.rect(x-3,y+4,6,cell-8,col);else this.rect(x+4,y-3,cell-8,6,col);}this.addLabel(480,493,'CLICK AN EDGE TO CLAIM A BOX',8,'#ddd7f0');};
  GameScene.prototype.simPool=function(dt){const s=this.state,pockets=[[80,104],[480,104],[880,104],[80,455],[480,455],[880,455]];for(const b of s.balls){if(b.sunk)continue;b.x+=b.vx*dt;b.y+=b.vy*dt;b.vx*=Math.pow(.991,dt*60);b.vy*=Math.pow(.991,dt*60);if(pockets.some(([x,y])=>Math.hypot(b.x-x,b.y-y)<27)){if(b.cue){b.x=245;b.y=270;b.vx=b.vy=0;s.foul=true;}else{b.sunk=true;b.vx=b.vy=0;s.sunk.push(b.n);s.potNow.push(b.n);}continue;}if(b.x<100){b.x=100;b.vx=Math.abs(b.vx)*.82;}if(b.x>860){b.x=860;b.vx=-Math.abs(b.vx)*.82;}if(b.y<110){b.y=110;b.vy=Math.abs(b.vy)*.82;}if(b.y>430){b.y=430;b.vy=-Math.abs(b.vy)*.82;}}for(let i=0;i<s.balls.length;i++)for(let j=i+1;j<s.balls.length;j++){const a=s.balls[i],b=s.balls[j];if(a.sunk||b.sunk)continue;const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d&&d<a.r+b.r){const nx=dx/d,ny=dy/d,v=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;a.vx-=v*nx;a.vy-=v*ny;b.vx+=v*nx;b.vy+=v*ny;const overlap=(a.r+b.r-d)/2;a.x-=nx*overlap;a.y-=ny*overlap;b.x+=nx*overlap;b.y+=ny*overlap;}}const moving=s.balls.some(b=>!b.sunk&&Math.hypot(b.vx,b.vy)>6);if(s.shotActive&&!moving){s.shotActive=false;this.poolSettle();}};
  GameScene.prototype.poolSettle=function(){
    const s=this.state,n=s.players.length,shooter=s.players[s.turn%n];if(!shooter)return;
    const potted=s.potNow;s.potNow=[];const foul=!!s.foul;s.foul=false;
    const legal=potted.filter(x=>x!==8);
    // The first legal pot decides who has solids (1-7) and who has stripes (9-15).
    if(!s.groupsAssigned&&legal.length&&!foul){
      const solid=legal[0]<=7;s.groups[shooter.id]=solid?'solids':'stripes';
      const other=s.players.find(p=>p.id!==shooter.id);if(other)s.groups[other.id]=solid?'stripes':'solids';
      s.groupsAssigned=true;
    }
    const grp=s.groups[shooter.id];
    const own=grp==='solids'?[1,2,3,4,5,6,7]:grp==='stripes'?[9,10,11,12,13,14,15]:null;
    if(potted.includes(8)){
      const cleared=own?own.every(x=>s.sunk.includes(x)):false;
      const wins=cleared&&!foul;
      s.winner=wins?shooter.name:(s.players.find(p=>p.id!==shooter.id)||shooter).name;
      s.message=wins?'Eight ball, legal':'Eight ball too early';
      return;
    }
    if(foul){s.message='Foul · ball in hand for the next player';s.turn=(s.turn+1)%n;return;}
    const pottedOwn=own?potted.some(x=>own.includes(x)):legal.length>0;
    if(pottedOwn){s.message=`${shooter.name} continues`;}
    else{s.turn=(s.turn+1)%n;s.message=`${s.players[s.turn%n].name}'s turn`;}
  };

  function createHeadless(payload){const scene=new GameScene('GameScene');scene.headless=true;scene.loadMatch({room:payload.room,me:'server',host:true,state:payload.state});return scene;}
  // ===== Characters: one definition drives the lobby avatars and the in-game faces.
  const CHARACTERS={
    panda:{name:'Pip the Panda',body:'#f6f4fb',accent:'#2b2d3d',ears:'round',shape:'round',patch:'mask',eyes:'normal'},
    robot:{name:'Bolt the Robot',body:'#a9bcd0',accent:'#ffd37a',ears:'antenna',shape:'square',patch:'visor',eyes:'visor'},
    fox:{name:'Nova the Fox',body:'#ff9d5c',accent:'#fff3e3',ears:'pointy',shape:'round',patch:'muzzle',eyes:'normal'},
    cat:{name:'Mochi the Cat',body:'#ffc66b',accent:'#d9873d',ears:'pointy',shape:'round',patch:'none',eyes:'big'},
    octo:{name:'Captain Squish',body:'#b890ff',accent:'#ffffff',ears:'none',shape:'wide',patch:'muzzle',eyes:'big'},
    dino:{name:'Rex the Dino',body:'#7fd77c',accent:'#e9ffd9',ears:'spikes',shape:'round',patch:'muzzle',eyes:'normal'},
    owl:{name:'Luna the Owl',body:'#a98262',accent:'#ffe7b0',ears:'tufts',shape:'round',patch:'muzzle',eyes:'big'},
    frog:{name:'Ziggy the Frog',body:'#56d68d',accent:'#eafff3',ears:'none',shape:'wide',patch:'none',eyes:'big'}
  };
  // ===== Question bank. Entry: [kind, question, correct, [three wrong answers]]
  // kind: t = trivia, l = logic, r = riddle
  const QUIZ_BANK=[
    ['t','Which planet is known as the Red Planet?','Mars',['Venus','Jupiter','Mercury']],
    ['t','What is the largest ocean on Earth?','Pacific Ocean',['Atlantic Ocean','Indian Ocean','Arctic Ocean']],
    ['t','How many sides does a hexagon have?','6',['5','7','8']],
    ['t','Who painted the Mona Lisa?','Leonardo da Vinci',['Michelangelo','Raphael','Vincent van Gogh']],
    ['t','What is the chemical symbol for gold?','Au',['Ag','Gd','Go']],
    ['t','What is the capital of Australia?','Canberra',['Sydney','Melbourne','Perth']],
    ['t','Which gas do plants take in for photosynthesis?','Carbon dioxide',['Oxygen','Nitrogen','Helium']],
    ['t','What is the hardest natural substance?','Diamond',['Quartz','Topaz','Iron']],
    ['t','Which element has the atomic number 1?','Hydrogen',['Helium','Oxygen','Carbon']],
    ['t','In which year did World War II end?','1945',['1939','1918','1950']],
    ['t','Who wrote "Romeo and Juliet"?','William Shakespeare',['Charles Dickens','Jane Austen','Mark Twain']],
    ['t','What is the largest animal on Earth?','Blue whale',['African elephant','Giraffe','Colossal squid']],
    ['t','How many bones does an adult human typically have?','206',['180','250','312']],
    ['t','What is the smallest prime number?','2',['0','1','3']],
    ['t','Which country has the most natural lakes?','Canada',['Russia','Finland','Brazil']],
    ['t','What is the tallest mountain above sea level?','Mount Everest',['K2','Kilimanjaro','Mont Blanc']],
    ['t','Which organ pumps blood through the body?','Heart',['Liver','Lungs','Kidney']],
    ['t','How many players from one team are on the field in soccer?','11',['9','10','12']],
    ['t','What is the longest river in Africa?','Nile',['Congo','Niger','Zambezi']],
    ['t','Who developed the theory of general relativity?','Albert Einstein',['Isaac Newton','Niels Bohr','Galileo Galilei']],
    ['t','What is the currency of Japan?','Yen',['Won','Yuan','Rupee']],
    ['t','Which bird can fly backwards?','Hummingbird',['Eagle','Penguin','Ostrich']],
    ['t','How many strings does a standard guitar have?','6',['4','5','7']],
    ['t','At sea level, what is the boiling point of water in Celsius?','100',['90','212','0']],
    ['t','Which country gave the Statue of Liberty to the United States?','France',['Spain','England','Italy']],
    ['t','Which planet is closest to the Sun?','Mercury',['Venus','Mars','Earth']],
    ['t','Which chess piece moves in an L shape?','Knight',['Bishop','Rook','Queen']],
    ['t','How many minutes are in a day?','1440',['1240','1400','2400']],
    ['t','What is the capital of Canada?','Ottawa',['Toronto','Montreal','Vancouver']],
    ['t','Who was the first person to walk on the Moon?','Neil Armstrong',['Buzz Aldrin','Yuri Gagarin','John Glenn']],
    ['t','Which organelle is called the powerhouse of the cell?','Mitochondria',['Nucleus','Ribosome','Golgi body']],
    ['t','Which metal is liquid at room temperature?','Mercury',['Lead','Tin','Silver']],
    ['t','What is the largest planet in our solar system?','Jupiter',['Saturn','Neptune','Uranus']],
    ['t','What is the square root of 144?','12',['11','14','16']],
    ['t','How many hours are in a week?','168',['144','196','124']],
    ['t','Which language has the most native speakers?','Mandarin Chinese',['English','Spanish','Hindi']],
    ['t','Which continent is the Sahara Desert in?','Africa',['Asia','Australia','South America']],
    ['t','Which gas makes up most of Earth\'s atmosphere?','Nitrogen',['Oxygen','Carbon dioxide','Argon']],
    ['t','What do the angles of a triangle add up to?','180 degrees',['90 degrees','270 degrees','360 degrees']],
    ['t','Which famous ship sank on its maiden voyage in 1912?','Titanic',['Lusitania','Bismarck','Mayflower']],
    ['t','How many colours are traditionally in a rainbow?','7',['5','6','8']],
    ['l','What comes next: 2, 4, 8, 16, ?','32',['24','20','64']],
    ['l','What comes next: 1, 1, 2, 3, 5, 8, ?','13',['11','12','15']],
    ['l','What comes next: 1, 4, 9, 16, 25, ?','36',['30','49','35']],
    ['l','A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost?','5 cents',['10 cents','1 cent','15 cents']],
    ['l','Which one does not belong: 3, 5, 7, 9, 10?','10',['3','7','9']],
    ['l','Which letter comes next: A, C, E, G, ?','I',['H','J','K']],
    ['l','A snail climbs 3 metres a day and slides back 2 metres each night. The well is 10 metres deep. On which day does it get out?','Day 8',['Day 7','Day 9','Day 10']],
    ['l','If all bloops are razzies and all razzies are lazzies, are all bloops definitely lazzies?','Yes',['No','Only some','Impossible to say']],
    ['l','Five machines make five widgets in five minutes. How long do 100 machines take to make 100 widgets?','5 minutes',['100 minutes','20 minutes','1 minute']],
    ['l','How many times does the letter E appear in "seven eleven"?','5',['3','4','6']],
    ['l','Which word does not belong: apple, banana, carrot, grape?','Carrot',['Apple','Banana','Grape']],
    ['l','If you flip two fair coins, what is the chance both show heads?','1 in 4',['1 in 2','1 in 3','1 in 8']],
    ['l','A farmer has 17 sheep. All but 9 run away. How many are left?','9',['8','17','0']],
    ['l','How many squares are on a standard chessboard?','64',['36','49','81']],
    ['l','What is the next prime after 13?','17',['15','14','19']],
    ['l','What is 15% of 200?','30',['25','35','20']],
    ['l','If today is Monday, what day is it 10 days from now?','Thursday',['Wednesday','Friday','Saturday']],
    ['r','What has keys but cannot open any locks?','A piano',['A map','A keyboard computer','A calendar']],
    ['r','What gets wetter the more it dries?','A towel',['A sponge','The sea','Rain']],
    ['r','What has to be broken before you can use it?','An egg',['A pencil','A seal','A window']],
    ['r','I speak without a mouth and hear without ears. What am I?','An echo',['A radio','A ghost','The wind']],
    ['r','What can you catch but not throw?','A cold',['A ball','A frisbee','A breeze']],
    ['r','The more you take, the more you leave behind. What are they?','Footsteps',['Memories','Breaths','Photos']],
    ['r','What has an eye but cannot see?','A needle',['A storm','A potato','A camera']],
    ['r','What goes up but never comes down?','Your age',['A rocket','The price','A balloon']],
    ['r','What has hands but cannot clap?','A clock',['A glove','A statue','A tree']],
    ['r','What has many teeth but cannot bite?','A comb',['A saw','A zipper','A shark']],
    ['r','What runs but never walks?','Water',['A horse','A clock','A deer']],
    ['r','What has cities but no houses, forests but no trees, and water but no fish?','A map',['A dream','A painting','A globe']],
    ['r','What can fill a room but takes up no space?','Light',['Shadow','Music','Echo']],
    ['r','What belongs to you, yet other people use it more than you do?','Your name',['Your phone','Your shadow','Your car']],
    ['r','What has a head and a tail but no body?','A coin',['A snake','A comet','A kite']],
    ['r','What is so fragile that saying its name breaks it?','Silence',['A promise','Glass','A secret']],
    ['r','What has a bottom at the top?','Your legs',['A mountain','A bottle','A tree']],
    ['r','What begins with T, ends with T, and has T in it?','A teapot',['A tent','A taxi','A train']],
    ['t','What is the chemical symbol for sodium?','Na',['K','S','So']],
    ['t','What is the closest star to Earth?','The Sun',['Proxima Centauri','Sirius','Betelgeuse']],
    ['t','How many natural moons does Earth have?','1',['0','2','3']],
    ['t','At sea level, what is the freezing point of water in Celsius?','0',['32','-10','10']],
    ['t','Which blood type is the universal donor for red blood cells?','O negative',['AB positive','A positive','B negative']],
    ['t','Who wrote the novel "1984"?','George Orwell',['Aldous Huxley','Ray Bradbury','H. G. Wells']],
    ['t','What is the longest bone in the human body?','Femur',['Humerus','Tibia','Radius']],
    ['t','Which is the largest country by area?','Russia',['Canada','China','United States']],
    ['t','Which city hosted the 2016 Summer Olympics?','Rio de Janeiro',['Tokyo','Beijing','Athens']],
    ['t','Which sport is played with a shuttlecock?','Badminton',['Tennis','Squash','Table tennis']],
    ['t','How many players from one basketball team are on the court at once?','5',['6','7','11']],
    ['t','In which city is the Eiffel Tower?','Paris',['Rome','London','Berlin']],
    ['t','Which instrument has 47 strings in a standard concert version?','Harp',['Violin','Viola','Banjo']],
    ['t','What is the largest organ of the human body?','Skin',['Liver','Brain','Heart']],
    ['t','Which vitamin does sunlight help the body make?','Vitamin D',['Vitamin C','Vitamin K','Vitamin A']],
    ['t','Who was the first President of the United States?','George Washington',['Thomas Jefferson','John Adams','Abraham Lincoln']],
    ['t','What is the scientific study of earthquakes called?','Seismology',['Meteorology','Astrology','Ecology']],
    ['t','Which planet has the Great Red Spot?','Jupiter',['Mars','Saturn','Neptune']],
    ['t','What is the capital of Brazil?','Brasília',['Rio de Janeiro','São Paulo','Salvador']],
    ['t','What is the capital of Kenya?','Nairobi',['Mombasa','Kisumu','Nakuru']],
    ['t','How many keys does a standard piano have?','88',['76','92','64']],
    ['t','Who painted "The Starry Night"?','Vincent van Gogh',['Claude Monet','Edgar Degas','Pablo Picasso']],
    ['t','Which language is most widely spoken in Brazil?','Portuguese',['Spanish','French','English']],
    ['t','Which insect is the source of honey?','Honeybee',['Wasp','Ant','Beetle']],
    ['t','Which bird has the largest wingspan of any living bird?','Wandering albatross',['Andean condor','Bald eagle','Ostrich']],
    ['t','What is 9 times 8?','72',['63','81','74']],
    ['t','What is pi to two decimal places?','3.14',['3.12','3.16','3.41']],
    ['t','Which element has the chemical symbol Fe?','Iron',['Fluorine','Francium','Fermium']],
    ['t','How many degrees are in a right angle?','90',['45','180','360']],
    ['t','Which is the smallest ocean?','Arctic Ocean',['Indian Ocean','Southern Ocean','Atlantic Ocean']],
    ['t','Which planet is the hottest in the solar system?','Venus',['Mercury','Mars','Jupiter']],
    ['t','Which astronomer formulated the laws of planetary motion?','Johannes Kepler',['Nicolaus Copernicus','Galileo Galilei','Tycho Brahe']],
    ['t','Who discovered penicillin?','Alexander Fleming',['Louis Pasteur','Marie Curie','Robert Koch']],
    ['t','What is the main language spoken in Argentina?','Spanish',['Portuguese','Italian','French']],
    ['r','What has a neck but no head?','A bottle',['A giraffe','A shirt','A pillow']],
    ['r','What can you hold without ever touching it?','A breath',['A promise','A thought','A cup']],
    ['r','What has words but never speaks?','A book',['A radio','A song','A poster']],
    ['r','What gets bigger the more of it you take away?','A hole',['A debt','A shadow','A crowd']],
    ['r','What comes down but never goes up?','Rain',['A balloon','A kite','A river']],
    ['r','What has four fingers and a thumb but is not alive?','A glove',['A hand','A tree','A statue']],
    ['r','What can travel around the world while staying in one corner?','A stamp',['A mouse','A coin','A letter']],
    ['r','What has a tongue but cannot talk?','A shoe',['A tree','A cloud','A map']],
    ['r','The more of me you have, the less you see. What am I?','Darkness',['Fog','A window','A mirror']],
    ['l','What comes next: 3, 6, 12, 24, ?','48',['36','30','42']],
    ['l','What comes next: 100, 90, 80, 70, ?','60',['50','55','65']],
    ['l','What comes next: J, F, M, A, M, ?','J',['A','S','D']],
    ['l','If 3 cats catch 3 mice in 3 minutes, how long do 100 cats take to catch 100 mice?','3 minutes',['100 minutes','30 minutes','1 minute']],
    ['l','A lily pad doubles in size every day and covers a lake on day 48. On which day does it cover half the lake?','Day 47',['Day 24','Day 40','Day 46']],
    ['l','Which is heavier: a kilogram of feathers or a kilogram of steel?','Neither, they weigh the same',['Steel','Feathers','It depends on the shape']],
    ['l','If you rearrange the letters of CAT, which word can you make?','ACT',['TAR','COT','OAK']],
    ['l','How many months of the year have 28 days?','All 12',['1','2','7']],
    ['l','A rooster lays an egg on the peak of a sloped roof. Which way does the egg roll?','Roosters do not lay eggs',['Left','Right','It stays put']]
  ];
  const QUIZ_CAT={t:'TRIVIA',l:'LOGIC',r:'RIDDLE'};
  const QUIZ_SECONDS=15, QUIZ_ROUNDS=10;
  function shuffleArr(arr){const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  function wrapText(text,max){const words=String(text).split(' ');const lines=[];let line='';for(const w of words){if((line+' '+w).trim().length>max){lines.push(line.trim());line=w;}else line=line+' '+w;}if(line.trim())lines.push(line.trim());return lines.join('\n');}
  function buildQuestion(entry){const order=shuffleArr([0,1,2,3]);const all=[entry[2],...entry[3]];const choices=order.map(i=>all[i]);return{text:entry[1],choices,correct:choices.indexOf(entry[2]),cat:QUIZ_CAT[entry[0]]};}
  function initQuiz(state,gameId){
    const kinds=gameId==='brain-rush'?['t','l']:['r','l'];
    const picked=shuffleArr(QUIZ_BANK.filter(e=>kinds.includes(e[0]))).slice(0,QUIZ_ROUNDS).map(buildQuestion);
    const first=picked.shift();
    state.qSecret={queue:picked,correct:first.correct,log:{}};
    state.q={n:0,total:QUIZ_ROUNDS,cat:first.cat,text:first.text,choices:first.choices,phase:'question',timeLeft:QUIZ_SECONDS,revealLeft:0,answered:[],picks:{},revealed:null,gained:{}};
  }
  GameScene.prototype.simQuiz=function(dt){
    const s=this.state,q=s.q;if(!q)return;
    if(q.phase==='question'){
      q.timeLeft=Math.max(0,q.timeLeft-dt);
      const active=s.players.filter(p=>p.active!==false);
      const allIn=active.length>0&&active.every(p=>q.answered.includes(p.id));
      if(q.timeLeft===0||allIn)this.quizReveal();
    }else if(q.phase==='reveal'){
      q.revealLeft=Math.max(0,q.revealLeft-dt);
      if(q.revealLeft===0)this.quizNext();
    }
  };
  GameScene.prototype.quizAnswer=function(id,a){
    const s=this.state,q=s.q;
    if(!q||q.phase!=='question'||q.answered.includes(id)||!Number.isInteger(a.index)||a.index<0||a.index>=q.choices.length)return;
    q.answered.push(id);s.qSecret.log[id]={idx:a.index,left:q.timeLeft};
  };
  GameScene.prototype.quizReveal=function(){
    const s=this.state,q=s.q;
    q.phase='reveal';q.revealLeft=4;q.revealed=s.qSecret.correct;q.gained={};q.picks={};
    for(const [pid,ans] of Object.entries(s.qSecret.log)){
      q.picks[pid]=ans.idx;
      if(ans.idx===s.qSecret.correct){
        const pts=100+Math.round(60*Math.max(0,ans.left)/QUIZ_SECONDS);
        const p=s.players.find(x=>x.id===pid);if(p)p.score+=pts;
        q.gained[pid]=pts;
      }
    }
  };
  GameScene.prototype.quizNext=function(){
    const s=this.state,q=s.q;
    if(q.n+1>=q.total||!s.qSecret.queue.length){q.phase='done';s.winner=leaderName(s.players);return;}
    const nx=s.qSecret.queue.shift();
    s.qSecret.correct=nx.correct;s.qSecret.log={};
    q.n++;q.text=nx.text;q.choices=nx.choices;q.cat=nx.cat;
    q.phase='question';q.timeLeft=QUIZ_SECONDS;q.revealLeft=0;q.answered=[];q.picks={};q.revealed=null;q.gained={};
  };
  // ===== Character faces: drawn with simple shapes, with blinking, moods and a wince when stunned.
  GameScene.prototype.drawCharacter=function(cx,cy,r,p){
    const ch=CHARACTERS[p.character]||CHARACTERS.panda,g=this.g,now=performance.now();
    const hurt=(p.stunUntil||0)>Date.now(),happy=((this.happy||{})[p.id]||0)>now;
    const body=colorValue(ch.body),acc=colorValue(ch.accent),ink=0x14131f;
    // ears and crest
    if(ch.ears==='round'){this.circle(cx-r*.74,cy-r*.72,r*.4,body,1);this.circle(cx+r*.74,cy-r*.72,r*.4,body,1);}
    if(ch.ears==='pointy'){g.fillStyle(body,1);g.fillTriangle(cx-r*.95,cy-r*.2,cx-r*.55,cy-r*1.3,cx-r*.1,cy-r*.6);g.fillTriangle(cx+r*.95,cy-r*.2,cx+r*.55,cy-r*1.3,cx+r*.1,cy-r*.6);}
    if(ch.ears==='tufts'){g.fillStyle(body,1);g.fillTriangle(cx-r*.8,cy-r*.45,cx-r*.7,cy-r*1.15,cx-r*.25,cy-r*.7);g.fillTriangle(cx+r*.8,cy-r*.45,cx+r*.7,cy-r*1.15,cx+r*.25,cy-r*.7);}
    if(ch.ears==='spikes'){g.fillStyle(acc,1);g.fillTriangle(cx-r*.35,cy-r*.8,cx-r*.15,cy-r*1.45,cx+r*.05,cy-r*.8);g.fillTriangle(cx+r*.0,cy-r*.85,cx+r*.2,cy-r*1.55,cx+r*.4,cy-r*.85);g.fillTriangle(cx+r*.35,cy-r*.8,cx+r*.55,cy-r*1.35,cx+r*.72,cy-r*.7);}
    if(ch.ears==='antenna'){g.lineStyle(3,0x667088,1);g.beginPath();g.moveTo(cx,cy-r*.9);g.lineTo(cx,cy-r*1.45);g.strokePath();this.circle(cx,cy-r*1.5,r*.2,acc,1);}
    // head
    if(ch.shape==='square'){g.fillStyle(body,1);g.fillRoundedRect(cx-r*.9,cy-r*.9,r*1.8,r*1.8,r*.4);}
    else if(ch.shape==='wide'){g.fillStyle(body,1);g.fillEllipse(cx,cy,r*2.3,r*1.7);}
    else this.circle(cx,cy,r,body,1);
    // markings
    if(ch.patch==='muzzle')this.circle(cx,cy+r*.36,r*.48,acc,1);
    if(ch.patch==='mask'){this.circle(cx-r*.42,cy-r*.12,r*.36,acc,1);this.circle(cx+r*.42,cy-r*.12,r*.36,acc,1);}
    // eyes
    const ey=cy-r*.12,ex=r*.4,er=ch.eyes==='big'?r*.3:r*.22;
    if(ch.patch==='visor'){this.rect(cx-r*.66,ey-r*.2,r*1.32,r*.4,0x0d1020,.95);this.rect(cx-r*.5,ey-r*.06,r*.4,r*.1,0x7ff5ff,.95);this.rect(cx+r*.1,ey-r*.06,r*.4,r*.1,0x7ff5ff,.95);}
    else{
      const blink=((now+(p.id.charCodeAt(0)*131))%3800)<130;
      for(const sx of [-1,1]){
        const x=cx+sx*ex;
        if(hurt){g.lineStyle(2.5,ink,1);g.beginPath();g.moveTo(x-er,ey-er);g.lineTo(x+er,ey+er);g.moveTo(x+er,ey-er);g.lineTo(x-er,ey+er);g.strokePath();}
        else if(blink){g.lineStyle(2.5,ink,1);g.beginPath();g.moveTo(x-er,ey);g.lineTo(x+er,ey);g.strokePath();}
        else{this.circle(x,ey,er,0xffffff,1);this.circle(x+sx*er*.18,ey+er*.1,er*.52,ink,1);this.circle(x+sx*er*.3-er*.15,ey-er*.25,er*.16,0xffffff,.9);}
      }
    }
    // mouth
    g.lineStyle(2.2,ink,1);g.beginPath();
    if(hurt)g.arc(cx,cy+r*.62,r*.22,Math.PI+.4,-.4,false);
    else if(happy)g.arc(cx,cy+r*.3,r*.34,.2,Math.PI-.2,false);
    else g.arc(cx,cy+r*.3,r*.2,.3,Math.PI-.3,false);
    g.strokePath();
  };
  GameScene.prototype.drawQuiz=function(){
    const s=this.state,q=s.q;this.bg(0x14162a);
    this.circle(480,270,330,0x6c5cff,.07);this.circle(140,90,160,0x3fd0ff,.05);this.circle(820,460,180,0xff7aa8,.05);
    if(!q){return;}
    this.addLabel(480,70,`${q.cat}  ·  QUESTION ${q.n+1} OF ${q.total}`,10,'#b9b3e6');
    this.rect(120,90,720,6,0x2a2b44,1);
    const frac=q.phase==='question'?q.timeLeft/QUIZ_SECONDS:0;
    this.rect(120,90,720*Math.max(0,Math.min(1,frac)),6,frac>.3?0x73e0bf:0xff8fa4,1);
    this.addLabel(480,140,wrapText(q.text,48),q.text.length>90?16:20,'#ffffff');
    const letters=['A','B','C','D'];
    q.choices.forEach((c,i)=>{
      const x=120+(i%2)*380,y=205+Math.floor(i/2)*130,w=340,h=110;
      let fill=0x232540,edge=0x3d3f63;
      if(q.phase==='reveal'){if(i===q.revealed){fill=0x1d6b56;edge=0x73e0bf;}else{fill=0x1f2034;edge=0x2b2d48;}}
      this.rect(x,y,w,h,fill,1);
      this.g.lineStyle(2,colorValue(edge),1);this.g.strokeRoundedRect(x,y,w,h,14);
      this.circle(x+34,y+h/2,18,0x2e3055,1);
      this.addLabel(x+34,y+h/2,letters[i],14,'#d8d3ff');
      this.addLabel(x+w/2+22,y+h/2-(q.phase==='reveal'&&q.picks?12:0),wrapText(c,20),c.length>20?13:16,'#f2f0ff');
      if(q.phase==='reveal'){
        const names=Object.entries(q.picks||{}).filter(([,idx])=>idx===i).map(([pid])=>(s.players.find(p=>p.id===pid)||{}).name).filter(Boolean);
        if(names.length)this.addLabel(x+w/2+22,y+h-18,names.join(' · '),10,'#dcd7ff');
      }
    });
    const footer=q.phase==='question'?`${q.answered.length} of ${s.players.length} answered · tap your answer`:'Answer revealed';
    this.addLabel(480,470,footer,9,'#b9b3e6');
  };
  const RENDER_DELAY=100;
  const PREDICTED=new Set(['snowball','paint-fight','king-yard','football','basketball']);
  // Same movement rule as the server (simArena), used to predict the local player.
  function stepPlayer(x,y,keys,dt){const dx=(keys.right?1:0)-(keys.left?1:0),dy=(keys.down?1:0)-(keys.up?1:0),len=Math.hypot(dx,dy)||1;return{x:Math.max(83,Math.min(877,x+dx/len*215*dt)),y:Math.max(105,Math.min(455,y+dy/len*215*dt))};}
  // Sound: small synth tones, no audio files needed.
  let muted=false,audioCtx=null;
  function beep(freq,dur,type='square',vol=.05,slideTo=null,delay=0){if(muted)return;try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();const t=audioCtx.currentTime+delay,o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(slideTo)o.frequency.exponentialRampToValueAtTime(slideTo,t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(audioCtx.destination);o.start(t);o.stop(t+dur+.02);}catch{}}
  const SFX={
    hit:()=>beep(520,.12,'square',.04,220), kick:()=>beep(170,.12,'triangle',.14,60), bounce:()=>beep(320,.05,'sine',.06),
    score:()=>{beep(880,.08,'sine',.08);beep(1320,.12,'sine',.05,null,.07);}, tick:()=>beep(700,.03,'square',.025),
    goal:()=>{beep(523,.12,'triangle',.1);beep(659,.12,'triangle',.1,null,.11);beep(784,.26,'triangle',.1,null,.22);},
    win:()=>{[523,659,784,1047].forEach((f,i)=>beep(f,.22,'triangle',.11,null,i*.13));}, fail:()=>beep(170,.22,'sawtooth',.05,90)
  };
  function vibrate(ms){try{navigator.vibrate?.(ms);}catch{}}
  function fmtClock(t){t=Math.ceil(t);return Math.floor(t/60)+':'+String(t%60).padStart(2,'0');}
  const PAINT_COLS=36,PAINT_ROWS=18,PAINT_CW=794/36,PAINT_CH=350/18;
  function paintCells(s,x,y,owner,radius=30){for(let r=0;r<PAINT_ROWS;r++)for(let c=0;c<PAINT_COLS;c++){const cx=83+(c+.5)*PAINT_CW,cy=105+(r+.5)*PAINT_CH;if(Math.hypot(cx-x,cy-y)<radius)s.cells[r*PAINT_COLS+c]=owner;}}
  function timeNow(){return Date.now();}
  function leaderName(players){const top=Math.max(...players.map(p=>p.score)),best=players.filter(p=>p.score===top);return best.length>1?'Draw':best[0].name;}
  function leastStrokesLeader(players){const best=Math.min(...players.map(p=>p.strokes)),w=players.filter(p=>p.strokes===best);return w.length>1?'Draw':w[0].name;}
  let inputTimer=null;
  function start(payload){if(!inputTimer)inputTimer=setInterval(()=>{if(game.scene&&game.scene.state&&!game.scene.host)game.scene.sendInput();},50);if(!window.Phaser)throw new Error('Phaser failed to load.');game.current=payload;if(!game.instance){game.instance=new Phaser.Game({input:{activePointers:3},type:Phaser.AUTO,parent:'phaser-host',width:W,height:H,backgroundColor:'#171823',transparent:false,antialias:true,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[GameScene],render:{roundPixels:true},fps:{target:60,forceSetTimeOut:true}});}else if(game.scene)game.scene.loadMatch(payload);}
  function state(state){if(!state){if(game.scene){game.scene.state=null;game.scene.host=false;}return;}game.scene?.setState(state);}
  function room(room){game.scene?.setRoom(room);}
  function input(data){game.scene?.receiveInput(data);}
  function action(data){game.scene?.receiveAction(data);}
  window.GameRuntime={characters:CHARACTERS,createState,createHeadless,setMuted:v=>{muted=!!v;},snapshot:snap=>game.scene?.onSnapshot(snap),start,state,room,input,action,setVirtual:(key,active)=>{if(game.scene){game.scene.virtual[key]=active;if(active&&key==='fire'&&['snowball','paint-fight'].includes(game.scene.gameId)){const pointer=game.scene.input.activePointer;game.scene.act({type:'throw',x:pointer.worldX,y:pointer.worldY});}}},getState:()=>game.scene?.state||null};
})();
