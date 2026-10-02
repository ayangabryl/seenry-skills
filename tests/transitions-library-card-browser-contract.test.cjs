// Source contract for explicit Blur coverage and truthful optional video labels.
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const arg=process.argv[2],file=arg?.endsWith('.browser.mjs')?path.resolve(arg):path.join(__dirname,'transitions-library-close-attachment.browser.mjs'),s=fs.readFileSync(file,'utf8');
const matrix=s.slice(s.indexOf(' for(const profile'),s.indexOf(' // Optional single continuous recording'));
assert(matrix.includes("await page.locator('#blur-toggle').check()"));assert(matrix.includes("assert.equal(run.layout.blurEnabled,true"));assert(matrix.includes("assert.equal(row.blurEnabled,true"));assert(matrix.includes("filter:s.filter,ancestorFilters:"));assert(matrix.includes('Keyboard Close must be sharp'));
const video=s.slice(s.indexOf(' if(recordVideo){'),s.indexOf('}finally{await browser.close()'));
assert(video.includes('recordVideo:{dir:'));assert(!video.includes('.screenshot(')&&!video.includes('.pause('));assert(video.includes("detail.dataset.stClosing==='true'"));assert(video.includes('a.currentTime>0&&a.currentTime<a.duration'));assert(video.includes("if(!valid)throw Error('Video precondition:"));assert(video.includes('sha256=sha('));assert(video.includes("report.video.status='blocked'"));assert(video.includes('process.exitCode=1'));
console.log('12/12 Card browser coverage contracts pass; recording and actual Blur-on pixels still require browser execution');
