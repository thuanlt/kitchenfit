import { useState } from "react";

const TEAL="#1D9E75",AMBER="#EF9F27",RED="#E24B4A",GRAY="#B4B2A9";
const statusColor={ok:TEAL,degraded:AMBER,outage:RED,"no-data":GRAY};

function genBar(uptime){
  return Array.from({length:90},()=>{
    const r=Math.random();
    if(uptime>=99.9)return r<0.012?"degraded":"ok";
    if(uptime>=99.5)return r<0.035?(r<0.01?"outage":"degraded"):"ok";
    return r<0.06?(r<0.02?"outage":"degraded"):"ok";
  });
}
function calcUptime(bar){return(bar.filter(s=>s==="ok").length/bar.length*100).toFixed(2);}
function sColor(u){return u>=99.5?TEAL:u>=95?AMBER:RED;}
function sLabel(u){return u>=99.5?"Operational":u>=95?"Degraded":"Outage";}
function sliceBar(bar,range){
  const n=range==="24h"?1:range==="7d"?7:range==="30d"?30:90;
  return bar.slice(-n);
}

const CATEGORIES=[
  {group:"Large Language Model",metricLabel:"TTFT",models:[
    {name:"DeepSeek-R1",uptime:99.97,metric:"118ms"},
    {name:"DeepSeek-V3.2-Speciale",uptime:99.95,metric:"134ms"},
    {name:"GLM-4.5",uptime:99.98,metric:"105ms"},
    {name:"GLM-4.7",uptime:99.96,metric:"112ms"},
    {name:"gpt-oss-120b",uptime:99.93,metric:"198ms"},
    {name:"gpt-oss-20b",uptime:99.94,metric:"87ms"},
    {name:"Llama-3.3-70B-Instruct",uptime:99.99,metric:"142ms"},
    {name:"Llama-3.3-Swallow-70B-Instruct-v0.4",uptime:99.95,metric:"155ms"},
    {name:"Qwen2.5-Coder-32B-Instruct",uptime:99.97,metric:"128ms"},
    {name:"Qwen3-32B",uptime:99.98,metric:"121ms"},
    {name:"Qwen3-Coder-480B-A35B-Instruct",uptime:99.91,metric:"243ms"},
    {name:"SaoLa-Llama3.1-planner",uptime:99.96,metric:"138ms"},
    {name:"SaoLa3.1-medium",uptime:99.97,metric:"109ms"},
    {name:"SaoLa4-medium",uptime:99.98,metric:"103ms"},
    {name:"SaoLa4-small",uptime:99.99,metric:"76ms"},
  ]},
  {group:"Vision Language Model",metricLabel:"Latency",models:[
    {name:"DeepSeek-OCR",uptime:99.95,metric:"320ms"},
    {name:"FPT.AI-KIE-v1.7",uptime:99.97,metric:"410ms"},
    {name:"FPT.AI-Table-Parsing-v1.1",uptime:99.96,metric:"385ms"},
    {name:"gemma-3-27b-it",uptime:99.98,metric:"276ms"},
    {name:"Kimi-K2.5",uptime:99.93,metric:"298ms"},
    {name:"Qwen2.5-VL-7B-Instruct",uptime:99.97,metric:"254ms"},
    {name:"Qwen3-VL-8B-Instruct",uptime:99.95,metric:"261ms"},
  ]},
  {group:"Speech to Text",metricLabel:"Latency/min",models:[
    {name:"FPT.AI-whisper-large-v3-turbo",uptime:99.98,metric:"0.9s"},
    {name:"FPT.AI-whisper-medium",uptime:100,metric:"1.1s"},
    {name:"whisper-large-v3-turbo",uptime:99.97,metric:"0.8s"},
  ]},
  {group:"Text to Speech",metricLabel:"Latency",models:[
    {name:"FPT.AI-VITs",uptime:100,metric:"88ms"},
  ]},
  {group:"Embedding Model",metricLabel:"Latency",models:[
    {name:"multilingual-e5-large",uptime:100,metric:"28ms"},
    {name:"Vietnamese_Embedding",uptime:99.99,metric:"24ms"},
  ]},
  {group:"Guardrail Model",metricLabel:"Latency",models:[]},
  {group:"Rerank Model",metricLabel:"Latency",models:[
    {name:"bge-reranker-v2-m3",uptime:100,metric:"45ms"},
  ]},
  {group:"Vision Language Action",metricLabel:"Latency",models:[
    {name:"Alpamayo-R1-10B",uptime:99.94,metric:"520ms"},
  ]},
  {group:"Hybrid MoE LLM",metricLabel:"TTFT",models:[
    {name:"Nemotron-3-Super-120B-A12B",uptime:99.92,metric:"267ms"},
  ]},
];

function UptimeBar({bar}){
  const[tip,setTip]=useState(null);
  return(
    <div style={{display:"flex",gap:"1.5px",position:"relative"}}>
      {bar.map((s,i)=>(
        <div key={i} onMouseEnter={()=>setTip(i)} onMouseLeave={()=>setTip(null)}
          style={{flex:1,height:22,background:statusColor[s],borderRadius:2,cursor:"default",position:"relative"}}>
          {tip===i&&(
            <div style={{position:"absolute",bottom:"calc(100% + 5px)",left:"50%",transform:"translateX(-50%)",
              background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-secondary)",
              borderRadius:6,padding:"3px 8px",fontSize:11,whiteSpace:"nowrap",zIndex:100,
              color:"var(--color-text-primary)",pointerEvents:"none"}}>
              {bar.length-i}d ago · {s==="ok"?"Operational":s==="degraded"?"Degraded":"Outage"}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function MetricPill({label,value}){
  const isGood=!value.includes("–");
  return(
    <span style={{display:"inline-flex",alignItems:"center",gap:4,
      background:"var(--color-background-secondary)",
      border:"0.5px solid var(--color-border-tertiary)",
      borderRadius:5,padding:"1px 7px",fontSize:11,
      color:"var(--color-text-secondary)",whiteSpace:"nowrap"}}>
      <span style={{color:"var(--color-text-secondary)",opacity:0.7}}>{label}</span>
      <span style={{fontWeight:500,color:"var(--color-text-primary)"}}>{value}</span>
    </span>
  );
}

function ModelRow({model,bar,metricLabel}){
  const pct=calcUptime(bar);
  const sc=sColor(parseFloat(pct));
  return(
    <div style={{padding:"8px 0 6px",borderBottom:"0.5px solid var(--color-border-tertiary)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5,flexWrap:"wrap",gap:4}}>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          <svg width="15" height="15" viewBox="0 0 15 15" style={{flexShrink:0}}>
            <circle cx="7.5" cy="7.5" r="7.5" fill={sc} opacity="0.18"/>
            <circle cx="7.5" cy="7.5" r="5" fill={sc} opacity="0.35"/>
            <polyline points="4,7.5 6.5,10 11,5" stroke={sc} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{fontSize:13,fontFamily:"var(--font-mono)",letterSpacing:"-0.01em",color:"var(--color-text-primary)"}}>
            {model.name}
          </span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <MetricPill label={metricLabel} value={model.metric}/>
          <span style={{fontSize:11,color:"var(--color-text-secondary)",minWidth:80,textAlign:"right"}}>
            {pct}% uptime
          </span>
        </div>
      </div>
      <UptimeBar bar={bar}/>
    </div>
  );
}

function CategorySection({cat,bars}){
  const[open,setOpen]=useState(true);
  const isEmpty=cat.models.length===0;
  const worst=isEmpty?100:Math.min(...cat.models.map(m=>m.uptime));
  const hc=isEmpty?"#888780":sColor(worst);
  const sl=isEmpty?"No models":sLabel(worst);
  return(
    <div style={{marginBottom:16}}>
      <div onClick={()=>!isEmpty&&setOpen(!open)} style={{
        display:"flex",justifyContent:"space-between",alignItems:"center",
        padding:"9px 12px",background:"var(--color-background-secondary)",
        border:"0.5px solid var(--color-border-tertiary)",
        borderRadius:open&&!isEmpty?"8px 8px 0 0":"8px",
        cursor:isEmpty?"default":"pointer",userSelect:"none"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <svg width="12" height="12" viewBox="0 0 12 12" style={{flexShrink:0}}>
            <circle cx="6" cy="6" r="6" fill={hc} opacity="0.2"/>
            <circle cx="6" cy="6" r="3.5" fill={hc} opacity="0.5"/>
          </svg>
          <span style={{fontSize:13,fontWeight:500,color:"var(--color-text-primary)"}}>{cat.group}</span>
          {!isEmpty&&<span style={{fontSize:11,color:"var(--color-text-secondary)"}}>{cat.models.length} model{cat.models.length>1?"s":""}</span>}
          {!isEmpty&&<span style={{fontSize:11,color:"var(--color-text-secondary)",opacity:0.6}}>· {cat.metricLabel}</span>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:12,fontWeight:500,color:hc}}>{sl}</span>
          {isEmpty&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:5,background:"var(--color-background-primary)",border:"0.5px solid var(--color-border-tertiary)",color:"var(--color-text-secondary)"}}>Coming soon</span>}
          {!isEmpty&&<span style={{fontSize:11,color:"var(--color-text-secondary)"}}>{open?"▲":"▼"}</span>}
        </div>
      </div>
      {open&&!isEmpty&&(
        <div style={{border:"0.5px solid var(--color-border-tertiary)",borderTop:"none",borderRadius:"0 0 8px 8px",padding:"0 12px"}}>
          {cat.models.map(m=>(
            <ModelRow key={m.name} model={m} bar={sliceBar(bars[m.name],90)} metricLabel={cat.metricLabel}/>
          ))}
        </div>
      )}
    </div>
  );
}

function MetricCard({label,value,sub}){
  return(
    <div style={{background:"var(--color-background-secondary)",borderRadius:8,padding:"12px 16px",flex:1,minWidth:100}}>
      <div style={{fontSize:11,color:"var(--color-text-secondary)",marginBottom:4}}>{label}</div>
      <div style={{fontSize:20,fontWeight:500,color:"var(--color-text-primary)"}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:"var(--color-text-secondary)",marginTop:2}}>{sub}</div>}
    </div>
  );
}

function OverallBanner(){
  return(
    <div style={{background:"#E1F5EE",borderRadius:10,padding:"14px 20px",display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
      <span style={{fontSize:16,color:"#0F6E56"}}>✓</span>
      <span style={{fontWeight:500,fontSize:15,color:"#0F6E56"}}>All systems operational</span>
    </div>
  );
}

export default function StatusPage(){
  const[bars]=useState(()=>{
    const m={};
    CATEGORIES.forEach(c=>c.models.forEach(model=>{m[model.name]=genBar(model.uptime);}));
    return m;
  });
  const allModels=CATEGORIES.flatMap(c=>c.models);
  const avgUptime=(allModels.reduce((s,m)=>s+m.uptime,0)/allModels.length).toFixed(3);

  return(
    <div style={{fontFamily:"var(--font-sans)",maxWidth:880,margin:"0 auto",padding:"24px 16px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <svg width="32" height="32" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="7" fill="#185FA5"/>
            <text x="16" y="22" textAnchor="middle" fill="white" fontSize="16" fontWeight="500">F</text>
          </svg>
          <div>
            <div style={{fontSize:15,fontWeight:500,color:"var(--color-text-primary)"}}>FPT AI Marketplace</div>
            <div style={{fontSize:11,color:"var(--color-text-secondary)"}}>System Status · marketplace.fptcloud.com</div>
          </div>
        </div>
      </div>

      <OverallBanner/>

      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:24}}>
        <MetricCard label="Platform uptime (90d)" value={avgUptime+"%"} sub="across all models"/>
        <MetricCard label="Total models" value={allModels.length} sub="across all categories"/>
        <MetricCard label="Playground health" value="98.6%" sub="response · render · stream"/>
      </div>

      <div style={{display:"flex",justifyContent:"flex-end",gap:14,marginBottom:18,flexWrap:"wrap"}}>
        {[["Operational",TEAL],["Degraded",AMBER],["Outage",RED],["No data",GRAY]].map(([l,c])=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:5}}>
            <div style={{width:10,height:10,background:c,borderRadius:2}}/>
            <span style={{fontSize:12,color:"var(--color-text-secondary)"}}>{l}</span>
          </div>
        ))}
      </div>

      {CATEGORIES.map(cat=><CategorySection key={cat.group} cat={cat} bars={bars}/>)}

      <div style={{borderTop:"0.5px solid var(--color-border-tertiary)",paddingTop:14,marginTop:20,display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
        <span style={{fontSize:12,color:"var(--color-text-secondary)"}}>© 2026 FPT Cloud · FPT AI Marketplace</span>
        <div style={{display:"flex",gap:16}}>
          <a href="https://ai-docs.fptcloud.com/fpt-ai-marketplace/fpt-ai-inference" style={{fontSize:12,color:"#185FA5",textDecoration:"none"}}>Documentation</a>
          <a href="https://marketplace.fptcloud.com/en" style={{fontSize:12,color:"#185FA5",textDecoration:"none"}}>Portal</a>
          <a href="https://marketplace.fptcloud.com/en/playground" style={{fontSize:12,color:"#185FA5",textDecoration:"none"}}>Playground</a>
        </div>
      </div>
    </div>
  );
}
