import React,{useState} from 'react';
import {Icon} from '../core/Icon.jsx';
const SLOT_ICONS={'Sáng':'sunrise','Trưa':'sun','Chiều':'sunset','Tối':'moon'};
function Item({it}){
const [hover,setHover]=useState(false);
return <div onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
 style={{display:'flex',gap:12,alignItems:'flex-start',padding:'12px 14px',background:'var(--surface-card)',border:'1px solid var(--border-default)',borderRadius:12,boxShadow:hover?'var(--shadow-raised)':'none',transition:'box-shadow var(--duration-fast) var(--ease-standard)'}}>
<span style={{width:32,height:32,borderRadius:'var(--radius-full)',background:'var(--surface-subtle)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-tertiary)',flexShrink:0}}>
<Icon name={it.icon||'map-pin'} size={16}/>
</span>
<div style={{minWidth:0,flex:1}}>
<div style={{fontSize:15,fontWeight:600,color:'var(--text-primary)',lineHeight:1.3}}>{it.title}</div>
{it.note&&<div style={{fontSize:13,color:'var(--text-secondary)',marginTop:2,lineHeight:1.5}}>{it.note}</div>}
{it.duration&&<div style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:12,color:'var(--text-secondary)',marginTop:6}}><Icon name="clock" size={12}/>{it.duration}</div>}
</div>
</div>;
}
export function ItineraryTimeline({slots=[],style}){
return <div style={{fontFamily:'var(--font-sans)',...style}}>
{slots.map((s,i)=>{
const last=i===slots.length-1;
return <div key={i} style={{display:'grid',gridTemplateColumns:'36px 1fr',columnGap:12}}>
<div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
<span style={{width:36,height:36,borderRadius:'var(--radius-full)',background:'var(--color-primary-soft)',color:'var(--color-primary)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
<Icon name={SLOT_ICONS[s.slot]||'clock'} size={18}/>
</span>
{!last&&<span style={{width:2,flex:1,background:'var(--border-default)',margin:'4px 0'}}></span>}
</div>
<div style={{paddingBottom:last?0:24,minWidth:0}}>
<div style={{display:'flex',alignItems:'center',gap:8,minHeight:36}}>
<span style={{fontSize:16,fontWeight:700,color:'var(--text-primary)'}}>{s.slot}</span>
{s.time&&<span style={{fontSize:14,color:'var(--text-secondary)'}}>{s.time}</span>}
</div>
<div style={{display:'flex',flexDirection:'column',gap:8,marginTop:8}}>
{(s.items||[]).map((it,j)=><Item key={j} it={it}/>)}
</div>
</div>
</div>;
})}
</div>;
}
