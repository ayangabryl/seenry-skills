import test from 'node:test';
import assert from 'node:assert/strict';
import {createLottieToggle} from './lottie-toggle.mjs';

test('Lottie reversal, loading, reduction and cleanup preserve application choice',()=>{
 const originalMedia=globalThis.matchMedia,originalDocument=globalThis.document;
 const media=new EventTarget(),doc=new EventTarget();media.matches=false;doc.hidden=false;
 const events=new Map();let plays=0,destructions=0;
 const player={totalFrames:46,currentFrame:0,direction:1,addEventListener:(name,fn)=>events.set(name,fn),goToAndStop(frame){this.currentFrame=frame},setDirection(value){this.direction=value},play(){plays++},destroy(){destructions++}};
 globalThis.matchMedia=()=>media;globalThis.document=doc;
 try {
  const control=createLottieToggle({lottie:{loadAnimation:()=>player},container:{},animationData:{}});
  control.set(true);assert.equal(plays,0);events.get('DOMLoaded')();assert.equal(control.frame,45);
  player.currentFrame=24;control.set(false);assert.equal(player.direction,-1);assert.equal(control.frame,24);
  control.set(true);assert.equal(player.direction,1);assert.equal(control.frame,24);
  media.matches=true;media.dispatchEvent(new Event('change'));assert.equal(control.frame,45);
  control.set(false);assert.equal(control.frame,0);assert.equal(control.state,false);
  media.matches=false;doc.hidden=true;control.set(true);assert.equal(control.frame,45);
  control.destroy();control.destroy();assert.equal(destructions,1);
  const previous=plays;control.set(false);assert.equal(plays,previous);
 } finally {globalThis.matchMedia=originalMedia;globalThis.document=originalDocument;}
});
