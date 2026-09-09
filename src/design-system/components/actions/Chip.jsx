import React,{useState} from 'react';
import {Icon} from '../core/Icon.jsx';
export function Chip({selected=false,onClick,children,icon,disabled=false,showCheck=true,style}){
const [hover,setHover]=useState(false);const [focus,setFocus]=useState(false);const [active,setActive]=useState(false);
const bg=disabled?'var(--surface-subtle)':selected?'var(--color-primary-soft)':active?'var(--surface-muted)':hover?'var(--surface-subtle)':'var(--color-white)';
return <button type="button" disabled={disabled} onClick={onClick}
 onMouseEnter={()=>setHover(true)} onMouseLeave={()=>{setHover(false);setActive(false)}}
 onMouseDown={()=>setActive(true)} onMouseUp={()=>setActive(false)}
 onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}
 aria-pressed={selected}
 style={{display:'inline-flex',alignItems:'center',gap:6,height:36,padding:'0 14px',borderRadius:'var(--radius-pill)',border:`1px solid ${selected?'var(--color-primary)':focus?'var(--border-focus)':'var(--border-default)'}`,background:bg,color:disabled?'var(--text-secondary)':selected?'var(--color-primary)':'var(--text-primary)',fontFamily:'var(--font-sans)',fontSize:14,fontWeight:600,lineHeight:1,cursor:disabled?'default':'pointer',transition:'all var(--duration-fast) var(--ease-standard)',outline:'none',boxShadow:focus?'var(--ring-focus)':'none',whiteSpace:'nowrap',userSelect:'none',...style}}>
{selected&&showCheck?<Icon name="check" size={16}/>:icon}
{children}
</button>;
}
