// Synthetic negatives for the actual browser fit assertion, not rendered evidence.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'transitions-library-reflow.browser.mjs'),'utf8'),scope={assert};vm.createContext(scope);vm.runInContext(source.slice(source.indexOf('function contentFits('),source.indexOf('async function titleFits(')),scope);
const rect=(left,top,right,bottom)=>({left,top,right,bottom,width:right-left,height:bottom-top});
const fixture=()=>({contentVisible:true,replayVisible:true,stage:rect(0,0,300,300),content:rect(20,20,280,220),replay:rect(100,250,200,294),texts:[{...rect(30,30,220,50),text:'Required complete message'}]});
let count=0;const good=b=>{scope.contentFits(b,'fixture',['Required complete message']);count++;},bad=(mutate)=>{const b=fixture();mutate(b);assert.throws(()=>scope.contentFits(b,'fixture',['Required complete message']));count++;};
good(fixture());bad(b=>b.contentVisible=false);bad(b=>b.replayVisible=false);bad(b=>b.content.width=0);bad(b=>b.content.height=0);bad(b=>b.texts=[]);bad(b=>b.texts[0].text='Wrong message');bad(b=>b.texts[0].right=301);bad(b=>b.texts[0].bottom=240);bad(b=>b.content.bottom=251);bad(b=>b.replay.width=0);bad(b=>b.replay.bottom=310);bad(b=>b.replay.left=-2);bad(b=>b.content.left=-3);
console.log(`${count}/${count} fit-assertion synthetic cases pass; actual DOM/pixels remain required`);
