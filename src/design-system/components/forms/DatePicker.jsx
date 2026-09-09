import React,{useState} from 'react';
import {Icon} from '../core/Icon.jsx';
const WD=['T2','T3','T4','T5','T6','T7','CN'];
function monthDays(y,m){const first=new Date(y,m,1);let off=(first.getDay()+6)%7;const n=new Date(y,m+1,0).getDate();const cells=[];for(let i=0;i<off;i++)cells.push(null);for(let d=1;d<=n;d++)cells.push(new Date(y,m,d));return cells;}
const day0=d=>d?new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime():null;
export function DatePicker({value,onChange,placeholder='Chọn ngày đi – về',disabled=false,style}){
const [open,setOpen]=useState(false);const [focus,setFocus]=useState(false);
const start=value&&value.start,end=value&&value.end;
const [month,setMonth]=useState(()=>{const b=start||new Date();return new Date(b.getFullYear(),b.getMonth(),1)});
const fmt=d=>`${d.getDate()}/${d.getMonth()+1}`;
const label=start?(end?`${fmt(start)} – ${fmt(end)}`:`${fmt(start)} – …`):'';
const pick=d=>{if(!onChange)return;if(!start||(start&&end)){onChange({start:d,end:null})}else if(day0(d)<day0(start)){onChange({start:d,end:start});setOpen(false)}else{onChange({start,end:d});setOpen(false)}};
const t=day0(new Date()),s0=day0(start),e0=day0(end);
return <div style={{position:'relative',display:'inline-block',minWidth:260,...style}}>
<button type="button" disabled={disabled} onClick={()=>setOpen(!open)} onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}
 style={{display:'flex',alignItems:'center',gap:12,width:'100%',height:56,padding:'0 16px',background:disabled?'var(--surface-disabled)':'var(--color-white)',border:`1px solid ${open||focus?'var(--border-focus)':'var(--border-default)'}`,borderRadius:'var(--radius-input)',boxShadow:open||focus?'0 0 0 1px var(--border-focus), var(--ring-focus)':'none',cursor:disabled?'default':'pointer',fontFamily:'var(--font-sans)',fontSize:16,color:label?'var(--text-tertiary)':'var(--text-secondary)',transition:'border-color var(--duration-fast) var(--ease-standard),box-shadow var(--duration-fast) var(--ease-standard)'}}>
<Icon name="calendar" size={20} color="var(--text-secondary)"/>
<span style={{flex:1,textAlign:'left'}}>{label||placeholder}</span>
<Icon name="chevron-down" size={16} color="var(--text-secondary)" style={{transform:open?'rotate(180deg)':'none',transition:'transform var(--duration-fast) var(--ease-standard)'}}/>
</button>
{open&&<>
<div onClick={()=>setOpen(false)} style={{position:'fixed',inset:0,zIndex:99}}></div>
<div style={{position:'absolute',top:'calc(100% + 8px)',left:0,zIndex:100,background:'var(--color-white)',border:'1px solid var(--border-default)',borderRadius:'var(--radius-md)',boxShadow:'var(--shadow-lifted)',padding:16,width:308,animation:'vivu-modal-in var(--duration-base) var(--ease-out)'}}>
<div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
<button type="button" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()-1,1))} style={navBtn}><Icon name="chevron-left" size={18}/></button>
<span style={{fontWeight:700,fontSize:15,fontFamily:'var(--font-sans)'}}>Tháng {month.getMonth()+1}, {month.getFullYear()}</span>
<button type="button" onClick={()=>setMonth(new Date(month.getFullYear(),month.getMonth()+1,1))} style={navBtn}><Icon name="chevron-right" size={18}/></button>
</div>
<div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2}}>
{WD.map(w=><div key={w} style={{textAlign:'center',fontSize:12,fontWeight:600,color:'var(--text-secondary)',padding:'4px 0',fontFamily:'var(--font-sans)'}}>{w}</div>)}
{monthDays(month.getFullYear(),month.getMonth()).map((d,i)=>{
if(!d)return <div key={i}></div>;
const dd=day0(d);const isS=dd===s0,isE=dd===e0,inR=s0&&e0&&dd>s0&&dd<e0;
return <button key={i} type="button" onClick={()=>pick(d)}
 style={{height:36,border:'none',borderRadius:isS||isE?'var(--radius-full)':inR?4:'var(--radius-full)',background:isS||isE?'var(--color-primary)':inR?'var(--color-primary-soft)':'transparent',color:isS||isE?'var(--text-on-primary)':inR?'var(--color-primary)':'var(--text-primary)',fontFamily:'var(--font-sans)',fontSize:14,fontWeight:isS||isE?700:400,cursor:'pointer',outline:dd===t&&!isS&&!isE?'1px solid var(--border-default)':'none',transition:'background var(--duration-fast) var(--ease-standard)'}}
 onMouseEnter={e=>{if(!isS&&!isE&&!inR)e.currentTarget.style.background='var(--surface-subtle)'}}
 onMouseLeave={e=>{if(!isS&&!isE&&!inR)e.currentTarget.style.background='transparent'}}>{d.getDate()}</button>;
})}
</div>
</div>
</>}
</div>;
}
const navBtn={width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center',border:'none',background:'transparent',borderRadius:'var(--radius-full)',cursor:'pointer',color:'var(--text-primary)'};
