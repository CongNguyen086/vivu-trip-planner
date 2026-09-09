import React,{useState} from 'react';
import {Icon} from '../core/Icon.jsx';
const SIZES={sm:{height:36,padding:'0 16px',fontSize:14},md:{height:44,padding:'0 20px',fontSize:15},lg:{height:52,padding:'0 28px',fontSize:16}};
const RADIUS='var(--radius-btn)';
export function Button({variant='primary',size='md',children,iconLeft,iconRight,loading=false,disabled=false,onClick,fullWidth=false,style,type='button'}){
const [hover,setHover]=useState(false);const [active,setActive]=useState(false);const [focus,setFocus]=useState(false);
const s=SIZES[size]||SIZES.md;const off=disabled||loading;
let base={display:'inline-flex',alignItems:'center',justifyContent:'center',gap:8,fontFamily:'var(--font-sans)',fontSize:s.fontSize,fontWeight:600,lineHeight:1.5,height:s.height,padding:s.padding,borderRadius:RADIUS,border:'1px solid transparent',cursor:off?'default':'pointer',transition:'background var(--duration-fast) var(--ease-standard),color var(--duration-fast) var(--ease-standard),border-color var(--duration-fast) var(--ease-standard),box-shadow var(--duration-fast) var(--ease-standard)',width:fullWidth?'100%':undefined,whiteSpace:'nowrap',userSelect:'none',outline:'none',boxShadow:focus?'var(--ring-focus)':'none'};
if(variant==='primary'){
  base.background=off?'var(--surface-disabled)':active?'var(--color-primary-active)':hover?'var(--color-primary-hover)':'var(--color-primary)';
  base.color=off?'var(--text-secondary)':'var(--text-on-primary)';
  base.borderColor=off?'var(--surface-disabled)':'transparent';
  if(focus)base.boxShadow='var(--ring-primary)';
}else if(variant==='secondary'){
  base.background=off?'var(--surface-subtle)':active?'var(--surface-muted)':hover?'var(--surface-subtle)':'transparent';
  base.color=off?'var(--text-secondary)':'var(--text-primary)';
  base.borderColor=focus?'var(--border-focus)':'var(--border-default)';
  base.fontWeight=700;
}else if(variant==='ghost'){
  base.background='transparent';
  base.color=off?'var(--text-secondary)':active?'var(--color-primary-hover)':hover?'var(--color-primary)':'var(--text-primary)';
  base.textDecoration=hover&&!off?'underline':'none';base.padding='0 12px';
}else if(variant==='inverse'){
  base.background='transparent';base.color=hover?'var(--gray-50)':'var(--text-inverse)';base.fontWeight=700;base.padding='0 12px';
}
if(off)base.boxShadow='none';
return <button type={type} disabled={off} style={{...base,...style}} onClick={off?undefined:onClick}
 onMouseEnter={()=>setHover(true)} onMouseLeave={()=>{setHover(false);setActive(false)}}
 onMouseDown={()=>setActive(true)} onMouseUp={()=>setActive(false)}
 onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}>
{loading&&<span style={{width:16,height:16,border:'2px solid currentColor',borderTopColor:'transparent',borderRadius:'50%',animation:'vivu-spin 700ms linear infinite',flexShrink:0}}/>}
{!loading&&iconLeft}{children}{!loading&&iconRight}
</button>;
}
