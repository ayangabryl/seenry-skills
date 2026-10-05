import test from 'node:test';
import assert from 'node:assert/strict';
import {createNotificationState,notificationEvent} from './notification-state.mjs';
test('100 rapid additions bound both live and exiting presentation',()=>{
 let s=createNotificationState();
 for(let i=0;i<100;i++){s=notificationEvent(s,{type:'add',content:`Saved ${i}`});assert.ok(s.items.length<=3);assert.ok(s.items.length+Number(!!s.leaving)<=4)}
 assert.deepEqual(s.items.map(x=>x.id),[100,99,98]);assert.equal(s.leaving.id,97);
});
test('stale completion cannot remove a newer exit',()=>{
 let s=createNotificationState(1);for(let i=0;i<3;i++)s=notificationEvent(s,{type:'add'});
 const same=notificationEvent(s,{type:'exit-finished',id:1});assert.equal(same,s);
 assert.equal(notificationEvent(s,{type:'exit-finished',id:2}).leaving,null);
});
test('middle dismissal preserves identity and clear never recycles IDs',()=>{
 let s=createNotificationState();for(let i=0;i<3;i++)s=notificationEvent(s,{type:'add'});
 s=notificationEvent(s,{type:'dismiss',id:2});assert.deepEqual(s.items.map(x=>x.id),[3,1]);assert.equal(s.leaving.index,1);
 s=notificationEvent(s,{type:'clear'});s=notificationEvent(s,{type:'add'});assert.equal(s.items[0].id,4);
 assert.equal(notificationEvent(s,{type:'dismiss',id:999}),s);
});
