import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {collectVisualInventory} from '../skills/seenry/scripts/visual_inventory.mjs';
const index=process.argv.indexOf('--playwright');
if(index<0)throw new Error('Pass --playwright /absolute/path/to/playwright/index.mjs');
const {chromium}=await import(pathToFileURL(process.argv[index+1]).href);
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:900,height:700}});
 await page.setContent(`<style>body{margin:0}#host{margin:24px;width:320px;border:1px solid #ddd}#heading{text-transform:uppercase}#transparent{border:3px solid transparent}#hidden-parent{opacity:0}#later{margin-top:900px}button{width:120px;height:44px}</style><main id="host"><p id="heading">Local image tool</p><p>800 × 1242</p><p>800 × 1242</p><button aria-label="Download"><svg width="20" height="20"></svg></button><input value="Private value"><span hidden>Hidden text</span><span id="hidden-parent"><b>Invisible child</b></span><p id="transparent">No visible border</p><p inert>Visible inert content</p><p id="later">Below fold</p></main>`);
 const source=collectVisualInventory.toString();
 const report=await page.evaluate(src=>Function('return ('+src+')(document.querySelector("#host"))')(),source);
 assert.equal(report.root.width,322);
 assert.equal(report.texts.items.find(x=>x.id==='heading').rendered,'LOCAL IMAGE TOOL');
 assert.equal(report.repeatedText.find(x=>x.text==='800 × 1242').indexes.length,2);
 assert.equal(report.controls.items.find(x=>x.tag==='button').text,'Download');
 assert.ok(!JSON.stringify(report).includes('Private value'));
 assert.ok(!report.texts.items.some(x=>/Hidden text|Invisible child/.test(x.text)));
 assert.ok(report.texts.items.some(x=>x.text==='Visible inert content'));
 assert.ok(report.texts.items.find(x=>x.id==='later').box.y>700);
 assert.ok(!report.boundaries.items.some(x=>x.id==='transparent'));
 const bounded=await page.evaluate(src=>Function('return ('+src+')(document.querySelector("#host"),1)')(),source);
 assert.equal(bounded.texts.items.length,1);assert.equal(bounded.texts.truncated,true);
 assert.ok(bounded.texts.total>1);assert.deepEqual(bounded.repeatedText,[]);
 console.log('Visual inventory: real rendered text, bounds, visibility, limits and privacy checks passed.');
} finally {await browser.close();}
