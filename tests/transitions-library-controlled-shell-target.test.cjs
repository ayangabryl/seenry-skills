// Execute production collapse and the browser harness's actual selector together.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const input=path.resolve(process.argv[2]||path.join(__dirname,'../skills/seenry/assets/components/transitions/seenry-transitions.js')),source=fs.readFileSync(input,'utf8');
const fixtureSource=fs.readFileSync(path.join(__dirname,'transitions-library-reduced-expand-reopen.test.cjs'),'utf8');
const scope={require,__dirname,process:{argv:['node','test',input]},console};vm.runInNewContext(fixtureSource.slice(0,fixtureSource.indexOf('(async()=>{'))+'\nthis.createFixture=fixture;',scope);
const native=fs.readFileSync(path.join(__dirname,'transitions-library-reduced-expand-reopen.browser.mjs'),'utf8'),a=native.indexOf('   function shellExit('),b=native.indexOf('   SeenryTransitions.collapse(detail)',a);assert(a>=0&&b>a);
const helper={};vm.createContext(helper);vm.runInNewContext(native.slice(a,b)+';this.find=shellExit;',helper);
const f=scope.createFixture(source,false,false,true);f.S.expand(f.source,f.detail);f.S.collapse(f.detail);
const views=target=>f.animations.filter(a=>a.owner===target&&!a.cancelled).map(a=>({constructor:{name:'Animation'},effect:{target,getKeyframes:()=>a.frames}}));
const real=views(f.surface),wrapper=views(f.detail),children=views(f.content);
assert.equal(wrapper.filter(a=>Number(a.effect.getKeyframes().at(-1)?.opacity)===0).length,0);
assert.equal(real.filter(a=>Number(a.effect.getKeyframes().at(-1)?.opacity)===0).length,1);
assert(children.some(a=>Number(a.effect.getKeyframes().at(-1)?.opacity)===0));
f.surface.getAnimations=()=>real;f.detail.getAnimations=()=>wrapper;
const found=helper.find(f.detail);assert(found);assert.equal(found.effect.target,f.surface);assert.equal(Number(found.effect.getKeyframes().at(-1).opacity),0);
const broken={};vm.createContext(broken);vm.runInNewContext(native.slice(a,b).replace("detail.querySelector('.st-expand-surface,.expand-surface')||detail",'detail')+';this.find=shellExit;',broken);assert.equal(broken.find(f.detail),undefined);
console.log('Full production collapse targets the inner shell; actual browser selector finds it, old wrapper selector fails');
