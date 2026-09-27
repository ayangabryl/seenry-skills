// Measure visible dark or light ink in named image regions at one physical-pixel scale.
// Regions JSON: {"regions":[{"name":"heading","box":[x,y,width,height],"polarity":"light","threshold":160,"tolerancePx":6}]}.
// Use flat-background crops containing one verified label; edge contact invalidates a crop.
// This checks geometry, not label identity, font identity or overall visual quality.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const values=process.argv.slice(2);
const flags=Object.fromEntries(values.reduce((pairs,value,index)=>value.startsWith('--')?[...pairs,[value.slice(2),values[index+1]]]:pairs,[]));
if(!flags.source||!flags.output||!flags.regions)throw new Error('Use --source IMAGE --output IMAGE --regions JSON [--playwright MODULE] [--executable-path BROWSER]');
const mime={'.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml'};
async function imageData(file){
  const extension=path.extname(file).toLowerCase();
  if(!mime[extension])throw new Error('Unsupported image extension: '+extension);
  const bytes=await readFile(file);
  return {path:path.resolve(file),sha256:createHash('sha256').update(bytes).digest('hex'),url:`data:${mime[extension]};base64,${bytes.toString('base64')}`};
}
const [source,output,config]=await Promise.all([imageData(flags.source),imageData(flags.output),readFile(flags.regions,'utf8').then(JSON.parse)]);
if(!Array.isArray(config.regions)||!config.regions.length)throw new Error('regions JSON must contain a nonempty regions array');
for(const region of config.regions){
  if(typeof region.name!=='string'||!region.name.trim()||!Array.isArray(region.box)||region.box.length!==4||!region.box.every(Number.isInteger)||region.box.some((n,i)=>n<0||(i>1&&n===0)))throw new Error('Each region needs a name and [x,y,width,height] integer box');
  if(region.polarity!==undefined&&!['dark','light'].includes(region.polarity))throw new Error('polarity must be dark or light');
  if(region.threshold!==undefined&&(!Number.isFinite(region.threshold)||region.threshold<0||region.threshold>255))throw new Error('threshold must be 0–255');
  if(region.tolerancePx!==undefined&&(!Number.isFinite(region.tolerancePx)||region.tolerancePx<0))throw new Error('tolerancePx must be nonnegative');
}
const {chromium}=await import(flags.playwright?pathToFileURL(path.resolve(flags.playwright)).href:'playwright');
const browser=await chromium.launch({headless:true,...(flags['executable-path']?{executablePath:flags['executable-path']}:{})});
try{
  const page=await browser.newPage();
  const measured=await page.evaluate(async ({sourceUrl,outputUrl,regions})=>{
    async function pixels(url){
      const image=new Image();image.src=url;await image.decode();
      const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
      const context=canvas.getContext('2d',{willReadFrequently:true});context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0);
      return {width:canvas.width,height:canvas.height,data:context.getImageData(0,0,canvas.width,canvas.height).data};
    }
    const [a,b]=await Promise.all([pixels(sourceUrl),pixels(outputUrl)]);
    if(a.width!==b.width||a.height!==b.height)throw new Error('Images must have identical physical dimensions; resize or capture at equal scale first');
    function bounds(image,region){
      const [x,y,width,height]=region.box;
      if(x+width>image.width||y+height>image.height)throw new Error('Region exceeds image: '+region.name);
      const limit=region.threshold??160;let left=Infinity,top=Infinity,right=-1,bottom=-1,count=0;
      for(let row=y;row<y+height;row++)for(let col=x;col<x+width;col++){
        const i=(row*image.width+col)*4,d=image.data;
        const luminance=d[i]*.2126+d[i+1]*.7152+d[i+2]*.0722;
        if(region.polarity==='light'?luminance<limit:luminance>limit)continue;
        left=Math.min(left,col);top=Math.min(top,row);right=Math.max(right,col);bottom=Math.max(bottom,row);count++;
      }
      return count?{x:left,y:top,width:right-left+1,height:bottom-top+1,inkPixels:count}:null;
    }
    return {width:a.width,height:a.height,regions:regions.map(region=>{
      const source= bounds(a,region),output=bounds(b,region),[x,y,width,height]=region.box;
      const edgeContact=b=>!!b&&(b.x<=x||b.y<=y||b.x+b.width>=x+width||b.y+b.height>=y+height);
      return {name:region.name,box:region.box,polarity:region.polarity??'dark',threshold:region.threshold??160,tolerancePx:region.tolerancePx??null,source,output,sourceEdgeContact:edgeContact(source),outputEdgeContact:edgeContact(output)};
    })};
  },{sourceUrl:source.url,outputUrl:output.url,regions:config.regions});
  const regions=measured.regions.map(region=>{
    const delta=region.source&&region.output?Object.fromEntries(['x','y','width','height'].map(key=>[key,region.output[key]-region.source[key]])):null;
    const invalidReason=!region.source||!region.output?'no ink in source or output region':region.sourceEdgeContact||region.outputEdgeContact?'ink touches region edge; widen or reposition crop':null;
    const withinTolerance=region.tolerancePx===null?null:invalidReason===null&&delta!==null&&Object.values(delta).every(value=>Math.abs(value)<=region.tolerancePx);
    return {...region,delta,invalidReason,withinTolerance};
  });
  console.log(JSON.stringify({source:{path:source.path,sha256:source.sha256},output:{path:output.path,sha256:output.sha256},image:{width:measured.width,height:measured.height},regions},null,2));
  if(regions.some(region=>region.invalidReason!==null||region.withinTolerance===false))process.exitCode=1;
}finally{await browser.close();}
