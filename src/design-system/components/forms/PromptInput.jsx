import React,{useState} from 'react';
import {Icon} from '../core/Icon.jsx';
export function PromptInput({value,onChange,onSubmit,placeholder='Bạn muốn đi đâu? Ví dụ: 3 ngày ở Đà Nẵng, thích biển và cà phê…',loading=false,disabled=false,error=false,autoFocus=false,style}){
const [focus,setFocus]=useState(false);const [btnHover,setBtnHover]=useState(false);
const borderColor=error?'var(--color-error)':focus?'var(--border-focus)':'var(--border-default)';
const ring=error?'var(--ring-error)':focus?'0 0 0 1px var(--border-focus), var(--ring-focus)':'none';
const submit=()=>{if(!disabled&&!loading&&onSubmit)onSubmit(value)};
return <div style={{display:'flex',alignItems:'center',gap:8,height:56,background:disabled?'var(--surface-disabled)':'var(--color-white)',border:`1px solid ${borderColor}`,borderRadius:'var(--radius-input)',padding:'0 8px 0 16px',boxShadow:ring,transition:'border-color var(--duration-fast) var(--ease-standard),box-shadow var(--duration-fast) var(--ease-standard)',...style}}>
<Icon name="sparkles" size={20} color="var(--color-primary)" style={{flexShrink:0}}/>
<input value={value} disabled={disabled} autoFocus={autoFocus} placeholder={placeholder}
 onChange={e=>onChange&&onChange(e.target.value)}
 onKeyDown={e=>{if(e.key==='Enter')submit()}}
 onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}
 style={{flex:1,minWidth:0,border:'none',outline:'none',background:'transparent',fontFamily:'var(--font-sans)',fontSize:16,color:'var(--text-tertiary)',height:'100%'}}/>
<button type="button" aria-label="Gợi ý địa điểm" disabled={disabled||loading} onClick={submit}
 onMouseEnter={()=>setBtnHover(true)} onMouseLeave={()=>setBtnHover(false)}
 style={{width:40,height:40,borderRadius:'var(--radius-full)',border:'none',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',cursor:disabled||loading?'default':'pointer',background:disabled?'var(--surface-muted)':btnHover?'var(--color-primary-hover)':'var(--color-primary)',color:'var(--text-on-primary)',transition:'background var(--duration-fast) var(--ease-standard)'}}>
{loading?<span style={{width:16,height:16,border:'2px solid currentColor',borderTopColor:'transparent',borderRadius:'50%',animation:'vivu-spin 700ms linear infinite'}}/>:<Icon name="arrow-right" size={18}/>}
</button>
</div>;
}
