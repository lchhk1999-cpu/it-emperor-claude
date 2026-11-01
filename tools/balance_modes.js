// Win rates of DSE / 帝王試煉 / 魔王限時 stages for four teams and three kinds
// of student (answer rate, seconds per question), and 答題衝刺 shards per day.
// Run from the repo root: ./scripts/jsc.sh tools/balance_modes.js

["src/core/rng.js","src/core/questions.js","src/core/battle.js","src/core/save.js","src/core/guildRaid.js","src/core/profile.js","src/core/missions.js","src/core/equipment.js","src/core/gacha.js","src/core/inventory.js","src/core/dungeons.js","src/core/stamina.js","src/core/growth.js","src/core/trial.js","src/core/rush.js","src/data/game_data.js"].forEach(f=>load(f));
const P=ITE.profile,B=ITE.battle,Dg=ITE.dungeons,T=ITE.trial,R=ITE.rush,data=ITE.gameData;
const allTopics=[].concat(...Dg.WORLDS.map(w=>w.topics));
const Q=[];for(const t of allTopics)for(const d of ["easy","medium","hard"])for(let i=0;i<15;i++)Q.push({question_id:`${t}-${d}-${i}`,topic_id:t,difficulty:d,stem:"Q",option_a:"a",option_b:"b",option_c:"c",option_d:"d",answer:"A",explanation:"e",review_status:"approved"});
const TEAMS={
 "新手：IT狗 Lv1 一人":{ids:["CH-ITDOG"],lv:1,evo:0},
 "第 2 週：3 人 Lv10":{ids:["CH-ITDOG","CH-DB","CH-OFFICE"],lv:10,evo:0},
 "中期：5 人 Lv20 一階":{ids:["CH-ITDOG","CH-DB","CH-OFFICE","CH-HACK","CH-BROADBAND"],lv:20,evo:1},
 "後期：5 人 Lv40 三階":{ids:["CH-ITDOG","CH-DB","CH-OFFICE","CH-HACK","CH-BROADBAND"],lv:40,evo:3},
};
function prof(t){const p=P.defaultProfile(data);const ch={};t.ids.forEach(id=>ch[id]={level:t.lv,evo:t.evo});return {...p,team:t.ids,owned:{...p.owned,characters:t.ids},growth:{characters:ch}};}
function play(stage,team,acc,secs,rng){
 const pool=Q.filter(q=>(!stage.topicIds||stage.topicIds.includes(q.topic_id))&&(!stage.questionDifficulties||stage.questionDifficulties.includes(q.difficulty)));
 let s=B.createBattle(stage,pool.length?pool:Q,rng,team,[]);
 while(!s.outcome){ if(stage.timed){s=T.tick(s,secs*1000); if(s.outcome)break;}
  const q=B.currentQuestion(s); s=B.answer(s,rng()<acc?q.answer:(q.answer==="A"?"B":"A")); if(s.outcome)break; s=B.next(s);}
 return s.outcome==="won";
}
const ACC=[[0.65,12],[0.75,9],[0.85,7]];
const N=300;
const stages=[];
const w=Dg.WORLDS[0];
for(const k of Dg.DIFFICULTY_ORDER){const st=Dg.worldStages(w).find(s=>s.difficulty===k);stages.push(["DSE "+Dg.DIFFICULTIES[k].name,{...st,questionDifficulties:Dg.DIFFICULTIES[k].questions}]);}
for(const k of T.TRIAL_RULES.order)stages.push(["帝王 "+T.TRIAL_RULES.tiers[k].name,T.stage(k)]);
for(const k of T.DEMON_RULES.order)stages.push(["魔王 "+T.DEMON_RULES.tiers[k].name,T.stage(k)]);
for(const [tn,t] of Object.entries(TEAMS)){
 const team=P.teamSnapshot(prof(t),data); const ts=P.teamStats(team);
 print(`\n### ${tn}（攻 ${ts.attack} HP ${ts.hp}）`);
 print("| 關卡 | 65%/12秒 | 75%/9秒 | 85%/7秒 |\n|---|---|---|---|");
 for(const [n,st] of stages){const row=ACC.map(([a,sec],i)=>{const rng=ITE.rng.createRng(7+i);let w=0;for(let k=0;k<N;k++)if(play(st,team,a,sec,rng))w++;return Math.round(w/N*100)+"%";});print(`| ${n} | ${row.join(" | ")} |`);}
}
print("\n### 答題衝刺（每局）");
print("| 學生 | 平均通過門 | 平均碎片 | 每日 3 局碎片 | 合成所需日數 |\n|---|---|---|---|---|");
for(const [a,sec] of [[0.6,12],[0.65,10],[0.75,8],[0.85,6],[0.95,4]]){
 const rng=ITE.rng.createRng(3);let doors=0,sh=0;const n=500;
 for(let k=0;k<n;k++){let s=R.start(Q,rng);let g=0;while(!s.over&&g++<500){s=R.tick(s,sec*1000);if(s.over)break;const q=s.current.q;s=R.choose(s,rng()<a?q.answer:s.current.doors.find(d=>d.letter!==q.answer).letter,rng);}doors+=s.passed;sh+=R.shardsFor(s.passed);}
 print(`| 答對 ${a*100}%、每題 ${sec} 秒 | ${(doors/n).toFixed(1)} | ${(sh/n).toFixed(2)} | ${(sh/n*3).toFixed(1)} | ${Math.ceil(R.RUSH_RULES.unlockShards/(sh/n*3))} |`);
}
