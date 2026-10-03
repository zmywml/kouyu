import test from 'node:test';
import assert from 'node:assert/strict';
import {createState,loadState,reducer,lessons,lessonProgress,recommendLesson,respondToDialogue} from '../src/model.mjs';

test('new learners have no fabricated practice or scores',()=>{
  const state=createState();
  assert.equal(state.records.length,0);
  assert.equal(state.diagnostic,null);
  assert.equal(lessonProgress(state,'airport'),0);
  assert.equal(state.tasks[0].sample,true);
});
test('invalid saved state falls back safely',()=>{
  assert.deepEqual(loadState('{broken'),createState());
  assert.deepEqual(loadState('{"version":1}'),createState());
});
test('diagnostic recommendations use goal and readiness',()=>{
  assert.equal(recommendLesson({goal:'campus',confidence:'starting',answer:'skip'}),'campus');
  assert.equal(recommendLesson({goal:'travel',confidence:'comfortable',answer:'window'}),'opinion');
  assert.equal(recommendLesson({goal:'travel',confidence:'comfortable',answer:'aisle'}),'airport');
});
test('dialogue stays at the same objective for unrelated input and ends after the final goal',()=>{
  const l=lessons[0];
  assert.equal(respondToDialogue(l,0,'I enjoy swimming.').step,0);
  let result=respondToDialogue(l,0,'Here is my passport.');
  assert.equal(result.done,false);
  result=respondToDialogue(l,result.step,'I have one suitcase.');
  result=respondToDialogue(l,result.step,'A window seat, please.');
  assert.equal(result.done,true);
  assert.equal(result.step,3);
});
test('publish, record, submit, review and reload preserve the learning loop',()=>{
  let s=createState();
  s=reducer(s,{type:'task',task:{id:'week2',lesson:'campus',published:true,title:'Campus introduction'}});
  s=reducer(s,{type:'record',record:{id:'r1',lesson:'campus',duration:12,submitted:false,created:1000}});
  // A recording cannot be attached to a task for a different lesson.
  s=reducer(s,{type:'submit',id:'r1',task:'starter'});
  assert.equal(s.records[0].submitted,false);
  s=reducer(s,{type:'submit',id:'r1',task:'week2'});
  assert.equal(s.records[0].submitted,true);
  s=reducer(s,{type:'review',id:'r1',review:{at:5,text:'Pause between ideas.',created:2000}});
  for(const step of ['listening','speaking','dialogue','review'])s=reducer(s,{type:'progress',lesson:'campus',step});
  const restored=loadState(JSON.stringify(s));
  assert.equal(restored.reviews.r1.at,5);
  assert.equal(restored.records[0].task,'week2');
  assert.equal(lessonProgress(restored,'campus'),4);
  assert.equal(lessonProgress(restored,'airport'),0);
});
test('word collection toggles without duplicates',()=>{
  let s=reducer(createState(),{type:'word',word:'passport'});
  assert.deepEqual(s.words,['passport']);
  s=reducer(s,{type:'word',word:'passport'});
  assert.deepEqual(s.words,[]);
});
