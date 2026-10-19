import test from 'node:test';
import assert from 'node:assert/strict';
import {quote,MODELS,normalizeMobile,validMobile,TRANSITIONS} from '../lib/console-rules.ts';
test('legacy valuation ranges and conditions',()=>{assert.deepEqual([quote({console:'PS2',model:'Slim',condition:'Best',firmware:''}).min,quote({console:'PS2',model:'Slim',condition:'Best',firmware:''}).max],[1500,2000]);assert.equal(quote({console:'PS2',model:'Slim',condition:'Normal',firmware:''}).min,1000);assert.equal(quote({console:'PS2',model:'Slim Rasila Combo (IDE HDD)',condition:'Best',firmware:''}).min,2500);assert.equal(quote({console:'PS3',model:'SuperSlim',condition:'Normal',firmware:''}).max,4000)});
test('every offered model has a finite positive working-console quote; repaired and faulty never eligible',()=>{for(const [console,models] of Object.entries(MODELS))for(const model of models){for(const condition of ['Best','Normal']){const q=quote({console,model,condition,firmware:'13.52'});assert(q.eligible);assert(q.min>0&&q.max>=q.min)}for(const condition of ['Poor','NotWorking'])assert.equal(quote({console,model,condition,firmware:'9.00'}).eligible,false)}});
test('reject unsupported and manipulated combinations',()=>{for(const d of [{console:'PS2',model:'Fat'},{console:'PS3',model:'Fat'},{console:'PS2',model:'Pro'},{console:'PC',model:'Slim'}])assert.equal(quote({...d,condition:'Best',firmware:''}).eligible,false);assert.equal(quote({console:'PS2',model:'Slim',condition:'FAKE',firmware:''}).eligible,false)});
test('updated PS4 prices use numeric firmware boundaries and never guess the gap',()=>{
 const slim=firmware=>quote({console:'PS4',model:'Slim',condition:'Best',firmware});
 for(const fw of ['8.52','9.00','12.00','13.50','13.52'])assert.equal(slim(fw).min,12000);
 for(const fw of ['13.60','13.6','13.72','14.00'])assert.equal(slim(fw).min,10000);
 for(const fw of ['13.53','13.59','Not sure','unknown','13.60.0']){assert.equal(slim(fw).min,null);assert.equal(slim(fw).max,null);assert(slim(fw).eligible)}
 assert.equal(slim('').eligible,false);
 for(const firmware of ['8.52','13.52','13.60','Not sure']){const q=quote({console:'PS4',model:'Fat',condition:'Normal',firmware});assert.deepEqual([q.min,q.max],[7000,8000])}
 assert.equal(quote({console:'PS4',model:'Pro',condition:'Best',firmware:'8.52'}).min,14000);
});
test('updated PS5 purchase prices are identical across working conditions',()=>{const prices={'Fat Disc':30000,'Fat Digital':25000,'Slim Digital':30000,'Slim Disc':35000,'Pro Digital':50000,'Pro Disc':50000};for(const [model,expected] of Object.entries(prices))for(const condition of ['Best','Normal']){const q=quote({console:'PS5',model,condition,firmware:'Not sure'});assert.deepEqual([q.min,q.max],[expected,expected])}});

test('normalize Indian mobiles without truncating unrelated digits',()=>{for(const n of ['+91 79836 24797','917983624797','07983624797','7983624797'])assert.equal(normalizeMobile(n),'7983624797');assert.equal(normalizeMobile('1234567890123'),'1234567890123');assert(!validMobile(normalizeMobile('1234567890123')));assert(!validMobile('1234567890'));assert(validMobile('7983624797'))});
test('admin cannot skip directly to paid; payment requires accepted offer',()=>{assert.deepEqual(TRANSITIONS.accepted,['paid']);assert(!TRANSITIONS.submitted.includes('paid'));assert(!TRANSITIONS.offer_sent.includes('paid'));assert.deepEqual(TRANSITIONS.paid,[])});
