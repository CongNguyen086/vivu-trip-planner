import React from 'react';
const V={
neutral:{bg:'var(--surface-subtle)',color:'var(--text-primary)',border:'transparent'},
primary:{bg:'var(--color-primary-soft)',color:'var(--color-primary)',border:'transparent'},
onImage:{bg:'rgba(255,255,255,0.92)',color:'var(--gray-900)',border:'transparent'},
success:{bg:'var(--color-success-bg)',color:'var(--color-success)',border:'var(--color-success)'},
warning:{bg:'var(--color-warning-bg)',color:'var(--color-warning)',border:'var(--color-warning)'},
error:{bg:'var(--color-error-bg)',color:'var(--color-error)',border:'var(--color-error)'},
info:{bg:'var(--color-info-bg)',color:'var(--color-info)',border:'var(--color-info)'},
};
export function Tag({children,variant='neutral',icon,style}){
const v=V[variant]||V.neutral;
return <span style={{display:'inline-flex',alignItems:'center',gap:4,height:24,padding:'0 12px',borderRadius:'var(--radius-pill)',background:v.bg,color:v.color,border:`1px solid ${v.border}`,fontFamily:'var(--font-sans)',fontSize:12,fontWeight:600,lineHeight:1,whiteSpace:'nowrap',...style}}>
{icon}{children}
</span>;
}
