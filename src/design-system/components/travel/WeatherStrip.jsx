import React from 'react';
import {Icon} from '../core/Icon.jsx';
const ICON_COLOR={sun:'var(--color-warning)','cloud-sun':'var(--color-warning)',cloud:'var(--gray-500)','cloud-rain':'var(--color-info)','cloud-drizzle':'var(--color-info)','cloud-lightning':'var(--color-warning)',moon:'var(--color-secondary)',wind:'var(--gray-500)'};
export function WeatherStrip({days=[],selected,onSelect,style}){
return <div style={{display:'flex',gap:8,overflowX:'auto',padding:2,...style}}>
{days.map((d,i)=>{
const sel=selected===i;const Tag=onSelect?'button':'div';
return <Tag key={i} type={onSelect?'button':undefined} onClick={onSelect?()=>onSelect(i):undefined}
 style={{minWidth:76,padding:'12px 8px',borderRadius:12,border:`1px solid ${sel?'var(--color-primary)':'var(--border-default)'}`,background:sel?'var(--color-primary-soft)':'var(--color-white)',display:'flex',flexDirection:'column',alignItems:'center',gap:6,cursor:onSelect?'pointer':'default',fontFamily:'var(--font-sans)',transition:'all var(--duration-fast) var(--ease-standard)',flexShrink:0}}>
<span style={{fontSize:12,fontWeight:600,color:sel?'var(--color-primary)':'var(--text-secondary)',whiteSpace:'nowrap'}}>{d.label}</span>
<Icon name={d.icon||'sun'} size={24} color={ICON_COLOR[d.icon]||'var(--gray-500)'}/>
<span style={{fontSize:15,fontWeight:700,color:'var(--text-primary)',lineHeight:1}}>{d.high}°<span style={{fontSize:13,fontWeight:400,color:'var(--text-secondary)'}}> {d.low}°</span></span>
{d.rain!=null&&<span style={{display:'inline-flex',alignItems:'center',gap:3,fontSize:12,color:'var(--color-info)'}}><Icon name="droplets" size={12}/>{d.rain}%</span>}
</Tag>;
})}
</div>;
}
