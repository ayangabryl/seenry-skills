// Two-state illustration controller. Application state must remain outside animation callbacks.
export function createLottieToggle({lottie,container,animationData,initial=false,onError=()=>{}}) {
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  let selected=Boolean(initial),ready=false,destroyed=false;
  const player=lottie.loadAnimation({container,renderer:'svg',loop:false,autoplay:false,animationData});
  const end=()=>Math.max(0,player.totalFrames-1);
  const settle=()=>player.goToAndStop(selected?end():0,true);
  function apply() {
    if(!ready||destroyed)return;
    if(media.matches||document.hidden){settle();return;}
    const target=selected?end():0;
    if(Math.abs(player.currentFrame-target)<.1){settle();return;}
    player.setDirection(selected?1:-1);
    player.play();
  }
  const loaded=()=>{ready=true;settle();};
  const motionChanged=()=>{if(ready){if(media.matches)settle();else apply();}};
  const visibilityChanged=()=>{if(ready&&document.hidden)settle();};
  player.addEventListener('DOMLoaded',loaded);
  player.addEventListener('data_failed',onError);
  media.addEventListener('change',motionChanged);
  document.addEventListener('visibilitychange',visibilityChanged);
  return {
    set(value){selected=Boolean(value);apply();},
    get state(){return selected;},
    get frame(){return player.currentFrame;},
    destroy(){if(destroyed)return;destroyed=true;media.removeEventListener('change',motionChanged);document.removeEventListener('visibilitychange',visibilityChanged);player.destroy();}
  };
}
