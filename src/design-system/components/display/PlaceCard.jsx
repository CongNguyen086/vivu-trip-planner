import React,{useState} from 'react';
import {Icon} from '../core/Icon.jsx';
import {Tag} from './Tag.jsx';
const SHIMMER={background:'linear-gradient(90deg,var(--gray-100) 25%,var(--gray-50) 50%,var(--gray-100) 75%)',backgroundSize:'200% 100%',animation:'vivu-shimmer var(--duration-shimmer) linear infinite'};
export function PlaceCard({image,name,description,tags=[],rating,meta,onClick,style}){
const [hover,setHover]=useState(false);const [loaded,setLoaded]=useState(false);const [focus,setFocus]=useState(false);
const clickable=!!onClick;
return <div role={clickable?'button':undefined} tabIndex={clickable?0:undefined} onClick={onClick}
 onKeyDown={e=>{if(clickable&&(e.key==='Enter'||e.key===' ')){e.preventDefault();onClick()}}}
 onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
 onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}
 style={{background:'var(--surface-card)',border:'1px solid var(--border-default)',borderRadius:'var(--radius-card)',overflow:'hidden',boxShadow:focus?'var(--ring-focus), var(--shadow-raised)':hover&&clickable?'var(--shadow-lifted)':'var(--shadow-raised)',transform:hover&&clickable?'translateY(-2px)':'none',transition:'transform var(--duration-base) var(--ease-standard),box-shadow var(--duration-base) var(--ease-standard)',cursor:clickable?'pointer':'default',outline:'none',display:'flex',flexDirection:'column',height:'100%',boxSizing:'border-box',...style}}>
<div style={{position:'relative',aspectRatio:'4/3',flexShrink:0,background:'var(--surface-muted)',overflow:'hidden',borderRadius:'calc(var(--radius-card) - 1px) calc(var(--radius-card) - 1px) 0 0'}}>
{image&&!loaded&&<div style={{...SHIMMER,position:'absolute',inset:0}}></div>}
{image?<img src={image} alt={name} onLoad={()=>setLoaded(true)} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',opacity:loaded?1:0,transition:'opacity var(--duration-base) var(--ease-standard)'}}/>:
<div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--gray-500)'}}><Icon name="camera" size={28}/></div>}
<div style={{position:'absolute',inset:0,background:'var(--overlay-image-gradient)',pointerEvents:'none'}}></div>
{tags.length>0&&<div style={{position:'absolute',left:12,bottom:12,display:'flex',gap:6,flexWrap:'wrap',maxWidth:'calc(100% - 24px)'}}>
{tags.map(t=><Tag key={t} variant="onImage">{t}</Tag>)}
</div>}
{rating!=null&&<span style={{position:'absolute',top:12,right:12,display:'inline-flex',alignItems:'center',gap:4,height:26,padding:'0 10px',borderRadius:'var(--radius-pill)',background:'rgba(255,255,255,0.92)',fontFamily:'var(--font-sans)',fontSize:13,fontWeight:700,color:'var(--gray-900)'}}>
<Icon name="star" size={14} color="var(--color-warning)" fill="var(--color-warning)" strokeWidth={1}/>{rating}
</span>}
</div>
<div style={{padding:16,display:'flex',flexDirection:'column',flex:1,minWidth:0}}>
<h4 style={{margin:0,fontFamily:'var(--font-sans)',fontSize:16,fontWeight:700,lineHeight:1.3,color:'var(--text-primary)'}}>{name}</h4>
{description&&<p style={{margin:'4px 0 0',fontFamily:'var(--font-sans)',fontSize:14,lineHeight:1.5,color:'var(--text-secondary)',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{description}</p>}
{meta&&<div style={{marginTop:'auto',paddingTop:12,display:'flex',alignItems:'center',gap:6,fontFamily:'var(--font-sans)',fontSize:14,color:'var(--text-secondary)'}}>
<Icon name="map-pin" size={16}/><span>{meta}</span>
</div>}
</div>
</div>;
}
