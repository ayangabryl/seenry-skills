// Unit validation of the exact browser-test assertion; these are synthetic AX records.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'transitions-library-palette-input.browser.mjs'),'utf8'),scope={assert};vm.createContext(scope);vm.runInContext(source.slice(source.indexOf('function assertPaletteAX('),source.indexOf('const open = page')),scope);
const node=(id,role,{name='',ignored=false,expanded}={})=>({backendDOMNodeId:id,role:{value:role},name:{value:name},ignored,properties:expanded===undefined?[]:[{name:'expanded',value:{value:expanded}}]});
const fixture=expanded=>({native:[node(1,'combobox',{name:'Search commands',expanded}),...(expanded?[node(2,'listbox'),node(3,'option'),node(4,'option'),node(5,'option')]:[node(2,'none',{ignored:true})])],resultBackendIds:[2,3,4,5,6],authoredOptionBackendIds:[3,4,5]});
let count=0;const good=(name,f,open)=>{scope.assertPaletteAX(f,open);count++;console.log('PASS',name);},bad=(name,f,open)=>{assert.throws(()=>scope.assertPaletteAX(f,open));count++;console.log('PASS rejects',name);};
good('open exposes input/list/3options',fixture(true),true);good('closed exposes input with ignored result placeholder',fixture(false),false);
let f=fixture(false);f.native=[];bad('empty native capture',f,false);
f=fixture(false);f.native[0].name.value='Wrong input';bad('wrong input scope',f,false);
f=fixture(false);f.native[0].properties[0].value.value=true;bad('wrong expanded state',f,false);
f=fixture(true);f.native=f.native.filter(n=>n.role.value!=='listbox');bad('missing open list',f,true);
f=fixture(true);f.native.pop();bad('missing open option',f,true);
f=fixture(false);f.native.push(node(2,'listbox'));bad('exposed closed list',f,false);
f=fixture(false);f.native.push(node(3,'option'));bad('exposed closed option',f,false);
f=fixture(false);f.native.push(node(6,'StaticText',{name:'Create project'}));bad('exposed result text with roles suppressed',f,false);
f=fixture(false);f.native.push(node(6,'generic'));bad('exposed generic result node',f,false);
f=fixture(false);f.native.push(node(6,'StaticText',{name:'Create project',ignored:true}));good('ignored result text remains excluded',f,false);
console.log(`${count}/${count} native AX assertion cases passed; browser collection still needs actual verification`);
