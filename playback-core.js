/* Deterministic replay transitions. No network, DOM, timers or official-data writes. */
window.ALAPlaybackCore=Object.freeze({
  restore(saved,total,eventMode,owner,now=Date.now()){
    const n=(v,d)=>Number.isFinite(Number(v))?Number(v):d;
    const s=saved&&typeof saved==='object'?saved:{};
    return {index:Math.max(0,Math.min(total,Math.trunc(n(s.index,0)))),playing:typeof s.playing==='boolean'?s.playing:eventMode,
      loop:typeof s.loop==='boolean'?s.loop:eventMode,speed:[300,1600,2600].includes(Number(s.speed))?Number(s.speed):(eventMode?2600:1600),
      phase:s.phase==='hold'?'hold':'play',cycles:Math.max(0,Math.trunc(n(s.cycles,0))),stamp:n(s.stamp,0),owner:typeof s.owner==='string'?s.owner:owner,
      nextDue:n(s.nextDue,now+(eventMode?1000:1600))};
  },
  advance(s,events,now=Date.now()){
    const next={...s};if(!s.playing)return next;
    if(s.phase==='hold'){if(!s.loop){next.playing=false;return next}next.index=0;next.cycles++;next.phase='play';next.nextDue=now+s.speed;return next}
    next.index=Math.min(events.length,s.index+1);
    if(next.index===events.length){if(s.loop){next.phase='hold';next.nextDue=now+(s.speed===300?5000:25000)}else next.playing=false}
    else {const boundary=events[next.index-1]?.reporting_period!==events[next.index]?.reporting_period;next.nextDue=now+s.speed+(s.loop&&boundary?(s.speed===300?700:6000):0)}
    return next;
  }
});
