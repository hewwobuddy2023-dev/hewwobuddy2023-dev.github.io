/* Same application / scoring engine; isolated browser-only demo transport. */
window.startScoreboardDemo=async function(api){
  const eventMode=!!window.SCOREBOARD_EVENT,core=window.ALAPlaybackCore;
  document.body.classList.add('demo-mode');document.body.classList.toggle('event-mode',eventMode);
  document.querySelector('#reportButton').hidden=true;
  const bar=document.createElement('section');bar.className='replay-bar';bar.setAttribute('aria-label','Simulated presentation controls');
  bar.innerHTML=`<div class="replay-safety">SIMULATED DATA — NOT OFFICIAL CLASS RESULTS</div><button class="presenter-toggle" type="button" aria-expanded="false">Presenter controls</button><div class="replay-controls"><button class="primary" data-replay="play">${eventMode?'Pause':'Play'}</button><button data-replay="restart">Restart</button><button data-replay="step">Next result</button><button data-replay="week">Next week</button><button data-replay="final">Final</button><button data-replay="loop" aria-pressed="${eventMode}">Loop ${eventMode?'on':'off'}</button><select id="replaySpeed" aria-label="Playback speed"><option value="2600">Event pace</option><option value="1600">Normal pace</option><option value="300">Fast test</option></select><select id="replayScenario" aria-label="Scenario" ${eventMode?'hidden':''}><option value="race">Illustrative race</option><option value="original">Original scenario</option></select>${eventMode?'<select id="eventView" aria-label="Display view"><option value="momentum">Momentum</option><option value="measures">Measures</option><option value="leaderboard">Standings</option><option value="certifications">Certifications</option><option value="activity">Activity</option></select><button data-replay="fullscreen">Fullscreen</button>':''}</div><output class="replay-progress" id="replayProgress">Loading isolated scenario…</output>`;
  document.body.prepend(bar);
  bar.querySelector('.presenter-toggle').onclick=e=>{const open=bar.classList.toggle('controls-open');e.currentTarget.setAttribute('aria-expanded',String(open))};
  const selected=eventMode||new URLSearchParams(location.search).get('race')!=='0'?'race':'original';
  bar.querySelector('#replayScenario').value=selected;
  bar.querySelector('#replayScenario').onchange=e=>{const u=new URL(location.href);u.searchParams.set('race',e.target.value==='race'?'1':'0');location.href=u.href};
  try{
    let source=window.ALA_DEMO_SOURCE;
    if(!source){const response=await fetch(selected==='race'?'/demo-race.json':'/demo-original.json');if(!response.ok)throw Error('Scenario unavailable');source=await response.json()}
    const events=[...source.official_results.map(r=>({...r,kind:'result'})),...source.certifications.map(r=>({...r,kind:'cert'}))].sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp)||a.record_id.localeCompare(b.record_id));
    const key='ala4dx-event-ready-v1-'+selected+(eventMode?'-event':'-manual')+(window.ALA_REPLAY_NAMESPACE?'-'+String(window.ALA_REPLAY_NAMESPACE).slice(0,60):'');
    const owner=globalThis.crypto?.randomUUID?.()||'display-'+Date.now()+'-'+Math.random().toString(36).slice(2);
    let saved;try{saved=JSON.parse(localStorage.getItem(key)||'null')}catch(_){}
    let session=core.restore(saved,events.length,eventMode,owner),timer=0,lease=0,channel=null,closed=false,previousIndex=-1,previousCycle=session.cycles,received=0,transitions=0;
if(!saved)session.owner=owner;
    if(window.ALA_BROADCAST)session.playing=false;
    if(window.SCOREBOARD_CONFIG?.PUBLIC_DEMO&&!eventMode&&!saved)session.index=events.length;
    function stateLabel(){if(!session.playing)return 'PAUSED';if(session.phase==='hold')return 'COMPLETE · next cycle in '+Math.max(0,Math.ceil((session.nextDue-Date.now())/1000))+'s';return eventMode?'EVENT REPLAY':'PLAYING'}
    function controls(){bar.querySelector('#replayProgress').textContent=`${session.index}/${events.length} · ${stateLabel()}${session.loop?' · LOOP '+(session.cycles+1):''}`;bar.querySelector('[data-replay=play]').textContent=session.playing?'Pause':'Resume';bar.querySelector('[data-replay=loop]').textContent='Loop '+(session.loop?'on':'off');bar.querySelector('[data-replay=loop]').setAttribute('aria-pressed',String(session.loop));bar.querySelector('#replaySpeed').value=String(session.speed)}
    function display(){const subset=events.slice(0,session.index),period=subset.at(-1)?.reporting_period||source.periods[0].period_id,reset=previousIndex>session.index||previousCycle!==session.cycles;
      window.SCOREBOARD_REPLAY_FAST=session.speed===300;
      window.ALA_EVENT_NOTICE=eventMode?(session.phase==='hold'?'Ten-week simulation complete. A new replay starts shortly.':reset?'New replay · all scores are simulated, never official.':'Teacher-reviewed class activities drive 4DX points. Certifications stay separate.') : '';
api.apply({...source,revision:`demo-${selected}-${session.cycles}-${session.index}`,settings:{...source.settings,current_reporting_period:period},official_results:subset.filter(r=>r.kind==='result'),certifications:subset.filter(r=>r.kind==='cert'),announcements:[]},false,{animate:!reset&&!['identity','academy'].includes(window.ALA_BROADCAST_VIEW)});
      if(session.phase==='hold'){const strip=document.querySelector('.event-strip strong');if(strip)strip.textContent=window.ALA_EVENT_NOTICE}
      previousIndex=session.index;previousCycle=session.cycles;controls();
      document.querySelectorAll('a[data-link]').forEach(a=>{if(location.protocol==='file:')return;const u=new URL(a.href);u.searchParams.set('demo','1');u.searchParams.set('race',selected==='race'?'1':'0');if(eventMode)u.searchParams.set('event','1');a.href=u.href});
    }
    function publish(){session.stamp=Math.max(Date.now(),session.stamp+1);try{localStorage.setItem(key,JSON.stringify(session))}catch(_){}channel?.postMessage(session);display()}
    function clock(){clearTimeout(timer);timer=0;if(closed||document.hidden||!session.playing||session.owner!==owner)return;timer=setTimeout(()=>{timer=0;if(document.hidden)return;session=core.advance(session,events);transitions++;publish();clock()},Math.max(25,session.nextDue-Date.now()))}
    function takeControl(){session.owner=owner;session.nextDue=Date.now()+session.speed}
    function receive(next){if(!next||Number(next.stamp)<=session.stamp)return;session=core.restore(next,events.length,eventMode,owner);received++;display();clock()}
    function resync(){try{const value=JSON.parse(localStorage.getItem(key)||'null');if(value)receive(value)}catch(_){}if(document.hidden){clearTimeout(timer);timer=0;return}if(session.playing&&(session.owner===owner||Date.now()-session.stamp>4500)){takeControl();publish();clock()}else controls()}
    const onStorage=e=>{if(e.key===key&&e.newValue)try{receive(JSON.parse(e.newValue))}catch(_){}};
    const onView=()=>{if(!eventMode)return;const view=['momentum','measures','leaderboard','certifications','activity'].includes((location.hash.slice(1)||location.pathname.replace(/\/$/,'').split('/').at(-1)))?(location.hash.slice(1)||location.pathname.replace(/\/$/,'').split('/').at(-1)):'momentum';bar.querySelector('#eventView').value=view;window.ALAUI.render(api,false)};
    function activate(){closed=false;try{channel=new BroadcastChannel(key);channel.onmessage=e=>receive(e.data)}catch(_){}clearInterval(lease);lease=setInterval(()=>{if(document.hidden)return;if(session.owner===owner&&session.playing){session.stamp=Math.max(Date.now(),session.stamp+1);try{localStorage.setItem(key,JSON.stringify(session))}catch(_){}channel?.postMessage(session);controls()}else if(session.playing&&Date.now()-session.stamp>4500){takeControl();publish();clock()}},2000);resync()}
    function stop(){closed=true;clearTimeout(timer);timer=0;clearInterval(lease);lease=0;channel?.close();channel=null}
    bar.addEventListener('click',async e=>{const action=e.target.closest('[data-replay]')?.dataset.replay;if(!action)return;if(action==='fullscreen'){try{document.fullscreenElement?await document.exitFullscreen():await document.documentElement.requestFullscreen()}catch(_){bar.querySelector('#replayProgress').textContent='Use F11 for browser fullscreen.'}return}clearTimeout(timer);timer=0;takeControl();
      if(action==='play'){if(session.index===events.length&&!session.loop){session.index=0;session.phase='play'}session.playing=!session.playing;if(session.phase==='hold')session.nextDue=Date.now()+(session.speed===300?5000:25000)}
      else if(action==='loop'){session.loop=!session.loop;if(!session.loop&&session.phase==='hold')session.playing=false;if(session.index===events.length&&session.loop){session.phase='hold';session.nextDue=Date.now()+(session.speed===300?5000:25000)}}
      else {session.playing=false;session.phase='play';if(action==='restart'){session.index=0;session.playing=eventMode;session.cycles=0}if(action==='step')session.index=Math.min(events.length,session.index+1);if(action==='final')session.index=events.length;if(action==='week'){const current=events[session.index]?.reporting_period||events.at(-1).reporting_period;const end=events.findIndex((r,i)=>i>=session.index&&r.reporting_period!==current);session.index=end<0?events.length:end}}
      publish();clock();
    });
    bar.querySelector('#replaySpeed').onchange=e=>{session.speed=Number(e.target.value);takeControl();if(session.phase==='hold')session.nextDue=Date.now()+(session.speed===300?5000:25000);publish();clock()};
    if(eventMode){bar.querySelector('#eventView').onchange=e=>{location.hash=e.target.value};addEventListener('hashchange',onView);onView()}
    addEventListener('storage',onStorage);document.addEventListener('visibilitychange',resync);addEventListener('pagehide',stop);addEventListener('pageshow',e=>{if(e.persisted)location.reload()});
    display();activate();clock();
    window.ALAReplay={state:()=>({...session}),events,source,jump(index){takeControl();session.index=Math.max(0,Math.min(events.length,index));session.phase='play';session.playing=false;publish();clock()},activeTimer:()=>!!timer,diagnostics:()=>({timer:!!timer,lease:!!lease,channel:!!channel,closed,received,transitions,listenerSets:1}),stop};
  }catch(e){bar.querySelector('#replayProgress').textContent='Scenario could not load. Open event-offline.html for the self-contained fallback.';bar.querySelectorAll('button,select').forEach(b=>b.disabled=true)}
};
