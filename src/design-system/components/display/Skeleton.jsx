import React from 'react';
const SHIMMER={background:'linear-gradient(90deg,var(--gray-100) 25%,var(--gray-50) 50%,var(--gray-100) 75%)',backgroundSize:'200% 100%',animation:'vivu-shimmer var(--duration-shimmer) linear infinite'};
export function Skeleton({variant='rect',width='100%',height,style}){
const base={rect:{borderRadius:'var(--radius-input)',height:height||80},text:{borderRadius:'var(--radius-pill)',height:height||12},circle:{borderRadius:'var(--radius-full)',height:height||40,width:width==='100%'?40:width}}[variant]||{};
return <div aria-hidden="true" style={{...SHIMMER,width,...base,...(height?{height}:{}),...style}}></div>;
}
export function SkeletonCard({style}){
return <div aria-hidden="true" style={{background:'var(--surface-card)',border:'1px solid var(--border-default)',borderRadius:'var(--radius-card)',overflow:'hidden',boxShadow:'var(--shadow-raised)',...style}}>
<div style={{...SHIMMER,aspectRatio:'4/3'}}></div>
<div style={{padding:16,display:'flex',flexDirection:'column',gap:10}}>
<Skeleton variant="text" width="65%" height={16}/>
<Skeleton variant="text" width="100%"/>
<Skeleton variant="text" width="85%"/>
<div style={{display:'flex',gap:6,marginTop:4}}>
<Skeleton variant="text" width={56} height={24} style={{borderRadius:'var(--radius-pill)'}}/>
<Skeleton variant="text" width={72} height={24} style={{borderRadius:'var(--radius-pill)'}}/>
</div>
</div>
</div>;
}
