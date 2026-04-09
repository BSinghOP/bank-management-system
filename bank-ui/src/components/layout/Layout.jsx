import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  { label:'Dashboard',      path:'/dashboard',      icon:'⊞' },
  
  { label:'Transactions',   path:'/transactions',   icon:'⇄' },
  { label:'Transfer',       path:'/transfer',       icon:'→' },
  { label:'Loans',          path:'/loans',          icon:'◈' },
  { label:'Fixed Deposits', path:'/fixed-deposits', icon:'⊛' },
  { label:'Change Password', path:'/change-password', icon:'🔑' },
]
const ADMIN_NAV = [
  { label:'Accounts',     path:'/accounts',       icon:'◎' },
  { label:'Users',        path:'/admin/users',    icon:'⊙' },
  { label:'Add User',     path:'/admin/add-user', icon:'⊕' },
  { label:'Audit Log',    path:'/admin/audit',    icon:'⊠' },
  { label:'SQL Explorer', path:'/admin/sql',      icon:'⌗' },
  { label:'Reports',      path:'/admin/reports',  icon:'⊟' },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  const location = useLocation()
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  const bg      = dark ? '#0a0f1a' : '#f4f6f9'
  const mainBg  = dark ? '#111827' : 'white'
  const border  = dark ? 'rgba(255,255,255,0.06)' : '#e9ecef'
  const textPri = dark ? '#f9fafb' : '#111827'
  const textSec = dark ? '#9ca3af' : '#6b7280'

  const navStyle = (isActive) => ({
    display:'flex',alignItems:'center',gap:10,
    padding:collapsed?'10px 0':'9px 12px',
    borderRadius:8,marginBottom:2,textDecoration:'none',
    justifyContent:collapsed?'center':'flex-start',
    background:isActive?'rgba(59,130,246,0.18)':'transparent',
    color:isActive?'#60a5fa':'rgba(255,255,255,0.5)',
    fontWeight:isActive?600:400,fontSize:13,
    borderLeft:isActive&&!collapsed?'2px solid #3b82f6':'2px solid transparent',
  })

  return (
    <div style={{display:'flex',height:'100vh',background:bg,fontFamily:"'DM Sans',-apple-system,sans-serif"}}>
      <aside style={{width:collapsed?60:230,flexShrink:0,background:'#0f1b2d',display:'flex',flexDirection:'column',transition:'width 0.2s',overflow:'hidden'}}>
        <div style={{padding:collapsed?'16px 0':'16px 18px',display:'flex',alignItems:'center',gap:10,borderBottom:'1px solid rgba(255,255,255,0.07)',justifyContent:collapsed?'center':'flex-start'}}>
          <div style={{width:36,height:36,background:'linear-gradient(135deg,#2563eb,#1d4ed8)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:18}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 9L12 2L21 9V20C21 20.55 20.55 21 20 21H4C3.45 21 3 20.55 3 20V9Z" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="1.5"/>
              <path d="M9 21V12H15V21" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          {!collapsed && <div>
            <div style={{color:'white',fontWeight:700,fontSize:14}}>BSingh's Vault</div>
            <div style={{color:'rgba(255,255,255,0.3)',fontSize:9,letterSpacing:'0.1em',textTransform:'uppercase'}}>Bank Management</div>
          </div>}
        </div>

        <nav style={{flex:1,padding:'10px 8px',overflowY:'auto'}}>
          {!collapsed && <div style={{color:'rgba(255,255,255,0.25)',fontSize:9,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',padding:'6px 10px 6px'}}>Menu</div>}
          {NAV.map(({label,path,icon}) => (
            <NavLink key={path} to={path} style={({isActive}) => navStyle(isActive)}>
              <span style={{fontSize:15,flexShrink:0,width:20,textAlign:'center'}}>{icon}</span>
              {!collapsed && label}
            </NavLink>
          ))}
          {isAdmin && <>
            {!collapsed && <div style={{color:'rgba(255,255,255,0.25)',fontSize:9,fontWeight:600,letterSpacing:'0.1em',textTransform:'uppercase',padding:'14px 10px 6px'}}>Admin</div>}
            {ADMIN_NAV.map(({label,path,icon}) => (
              <NavLink key={path} to={path} style={({isActive}) => navStyle(isActive)}>
                <span style={{fontSize:15,flexShrink:0,width:20,textAlign:'center'}}>{icon}</span>
                {!collapsed && label}
              </NavLink>
            ))}
          </>}
        </nav>

        <div style={{padding:collapsed?'12px 0':'12px 14px',borderTop:'1px solid rgba(255,255,255,0.07)',display:'flex',alignItems:'center',gap:10,justifyContent:collapsed?'center':'flex-start'}}>
          <div style={{width:32,height:32,borderRadius:8,background:'linear-gradient(135deg,#3b82f6,#6366f1)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:13,fontWeight:700,flexShrink:0}}>
            {user?.name?.[0]?.toUpperCase()||'B'}
          </div>
          {!collapsed && <>
            <div style={{flex:1,minWidth:0}}>
              <div style={{color:'white',fontSize:12,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.name||user?.email}</div>
              <div style={{color:'rgba(255,255,255,0.35)',fontSize:10,textTransform:'capitalize'}}>{user?.role}</div>
            </div>
            <button onClick={logout} title="Logout" style={{background:'rgba(255,255,255,0.05)',border:'none',cursor:'pointer',color:'rgba(255,255,255,0.4)',fontSize:14,padding:'4px 6px',borderRadius:6}}>⏻</button>
          </>}
        </div>
      </aside>

      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <header style={{background:mainBg,borderBottom:`1px solid ${border}`,padding:'0 24px',height:54,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <button onClick={() => setCollapsed(c=>!c)} style={{background:'none',border:'none',cursor:'pointer',color:textSec,fontSize:18,padding:'4px',lineHeight:1}}>☰</button>
            <div style={{fontSize:13,color:textSec,display:'flex',alignItems:'center',gap:6}}>
              {location.pathname.split('/').filter(Boolean).map((p,i,arr) => (
                <span key={i} style={{display:'flex',alignItems:'center',gap:6}}>
                  {i>0 && <span style={{color:border}}>/</span>}
                  <span style={{color:i===arr.length-1?textPri:textSec,fontWeight:i===arr.length-1?500:400,textTransform:'capitalize'}}>{p.replace(/-/g,' ')}</span>
                </span>
              ))}
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <button onClick={() => setDark(d=>!d)}
              style={{background:dark?'rgba(255,255,255,0.08)':'#f3f4f6',border:`1px solid ${border}`,borderRadius:8,padding:'5px 10px',cursor:'pointer',fontSize:14,color:textSec}}>
              {dark ? '☀️' : '🌙'}
            </button>
            <span style={{fontSize:12,color:textSec,background:dark?'rgba(255,255,255,0.05)':'#f9fafb',border:`1px solid ${border}`,borderRadius:8,padding:'5px 10px'}}>
              {new Date().toLocaleDateString('en-IN',{dateStyle:'medium'})}
            </span>
            <div style={{width:32,height:32,borderRadius:8,background:'linear-gradient(135deg,#3b82f6,#6366f1)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:13,fontWeight:700}}>
              {user?.name?.[0]?.toUpperCase()||'B'}
            </div>
          </div>
        </header>
        <main style={{flex:1,overflowY:'auto',padding:24,background:bg}}>
          {children}
        </main>
      </div>
    </div>
  )
}
