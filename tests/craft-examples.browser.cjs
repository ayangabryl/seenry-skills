const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const path=require('path');
const fs=require('fs');
const output=path.resolve(process.env.CRAFT_EVIDENCE || 'craft-evidence');fs.mkdirSync(output,{recursive:true});
(async()=>{
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH ? {executablePath:process.env.CHROME_PATH} : {}),args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1000,height:900}});
const names=['layout','typography','color','controls','motion','art-direction'];const results=[];let errors=[];
page.on('pageerror',e=>errors.push(e.message));
for(const name of names){
await page.goto('file://'+path.resolve(__dirname,'../skills/seenry/assets/craft/'+name+'.html'));
if(name==='layout'){await page.selectOption('#composition','stacked');await page.click('#confirm');if(!await page.locator('#result').textContent())throw Error('No layout confirmation');await page.locator('#width').fill('280');}
if(name==='typography'){await page.selectOption('#family','Georgia, serif');await page.locator('#size').fill('22');}
if(name==='color'){for(const value of ['Neutral','Workshop','Night']){await page.selectOption('#palette',value);const expected=JSON.parse(fs.readFileSync(path.resolve(__dirname,'fixtures/craft-contrast.json'))).find(p=>p.palette===value);const measured=await page.locator('#ratios').textContent();for(const role of ['body','support','action'])if(!measured.includes(expected[role].toFixed(2)+':1'))throw Error('Independent ratio mismatch '+value+' '+role)}await page.click('#reserve');}
if(name==='controls'){await page.click('#save');if(await page.locator('#save').getAttribute('aria-pressed')!=='true')throw Error('save state');await page.click('#undo');if(await page.locator('#save').getAttribute('aria-pressed')!=='false')throw Error('undo state');}
if(name==='motion'){await page.click('#toggle');await page.locator('#question').fill('Bring a chair?');await page.click('#toggle');await page.click('#toggle');if(await page.locator('#question').inputValue()!=='Bring a chair?')throw Error('input loss');await page.locator('#question').focus();await page.evaluate(()=>document.querySelector('#toggle').click());if(await page.evaluate(()=>document.activeElement.id)!=='toggle')throw Error('focus stranded');for(let i=0;i<8;i++){await page.evaluate(()=>document.querySelector('#toggle').click());await page.waitForTimeout(25)}if(await page.locator('#toggle').getAttribute('aria-expanded')!=='false')throw Error('rapid reverse wrong state');await page.click('#toggle');await page.waitForTimeout(260);await page.screenshot({path:path.resolve(output,'motion-expanded.png'),fullPage:true});await page.check('#reduce');await page.click('#toggle');if(!await page.locator('#details').evaluate(el=>el.inert))throw Error('collapsed not inert');}
if(name==='art-direction'){for(const v of ['comparison','material','sequence'])await page.selectOption('#direction',v);await page.click('#disclose');if(!await page.locator('#detail').isVisible())throw Error('disclosure');}
await page.screenshot({path:path.resolve(output,name+'-desktop.png'),fullPage:true});
await page.setViewportSize({width:320,height:850});
const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
if(overflow)throw Error(name+' overflow');
await page.screenshot({path:path.resolve(output,name+'-mobile.png'),fullPage:true});
await page.setViewportSize({width:1000,height:900});
results.push({name,interaction:'pass',overflow320:'pass'});
}
await browser.close();fs.writeFileSync(path.resolve(output,'results.json'),JSON.stringify({results,errors},null,2));console.log(JSON.stringify({results,errors}));if(errors.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
