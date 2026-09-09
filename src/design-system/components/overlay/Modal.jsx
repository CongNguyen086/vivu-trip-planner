import React,{useState,useEffect} from 'react';
import {Icon} from '../core/Icon.jsx';
export function Modal({open,onClose,title,children,footer,width=640,imageTop=false}){
const [isMobile,setIsMobile]=useState(false);const [xHover,setXHover]=useState(false);
useEffect(()=>{const mq=window.matchMedia('(max-width:639px)');const f=()=>setIsMobile(mq.matches);f();mq.addEventListener('change',f);return()=>mq.removeEventListener('change',f)},[]);
useEffect(()=>{if(!open)return;const k=e=>{if(e.key==='Escape'&&onClose)onClose()};window.addEventListener('keydown',k);const prev=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{window.removeEventListener('keydown',k);document.body.style.overflow=prev}},[open,onClose]);
if(!open)return null;
const closeBtn=<button type="button" aria-label="Đóng" onClick={onClose}
 onMouseEnter={()=>setXHover(true)} onMouseLeave={()=>setXHover(false)}
 style={{width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center',border:'none',borderRadius:'var(--radius-full)',cursor:'pointer',flexShrink:0,background:imageTop?'rgba(255,255,255,0.92)':xHover?'var(--surface-subtle)':'transparent',boxShadow:imageTop?'var(--shadow-raised)':'none',color:'var(--text-primary)',transition:'background var(--duration-fast) var(--ease-standard)',...(imageTop?{position:'absolute',top:12,right:12,zIndex:2}:{})}}>
<Icon name="x" size={20}/>
</button>;
return <div onClick={e=>{if(e.target===e.currentTarget&&onClose)onClose()}}
 style={{position:'fixed',inset:0,zIndex:1000,background:'var(--overlay-scrim)',display:'flex',alignItems:isMobile?'flex-end':'center',justifyContent:'center',padding:isMobile?0:24,animation:'vivu-fade-in var(--duration-base) var(--ease-out)'}}>
<div role="dialog" aria-modal="true" aria-label={typeof title==='string'?title:undefined}
 style={{position:'relative',background:'var(--surface-card)',borderRadius:isMobile?'var(--radius-sheet)':'var(--radius-md)',boxShadow:'var(--shadow-floating)',width:'100%',maxWidth:isMobile?'100%':width,maxHeight:isMobile?'92vh':'85vh',display:'flex',flexDirection:'column',overflow:'hidden',animation:isMobile?'vivu-sheet-in var(--duration-sheet) var(--ease-out)':'vivu-modal-in var(--duration-modal) var(--ease-out)'}}>
{isMobile&&<div style={{width:36,height:4,borderRadius:'var(--radius-pill)',background:'var(--gray-200)',margin:'8px auto 0',flexShrink:0}}></div>}
{imageTop&&closeBtn}
{title&&!imageTop&&<div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,padding:'16px 20px',borderBottom:'1px solid var(--border-divider)',flexShrink:0}}>
<h4 style={{margin:0,fontFamily:'var(--font-sans)',fontSize:18,fontWeight:700,color:'var(--text-primary)'}}>{title}</h4>
{closeBtn}
</div>}
<div style={{overflowY:'auto',flex:1,minHeight:0}}>{children}</div>
{footer&&<div style={{display:'flex',justifyContent:'flex-end',gap:8,padding:'12px 20px',borderTop:'1px solid var(--border-divider)',flexShrink:0}}>{footer}</div>}
</div>
</div>;
}
