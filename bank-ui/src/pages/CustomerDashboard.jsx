import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../context/AuthContext'

export default function CustomerDashboard() {
  const { user } = useAuth()
  const [balance, setBalance] = useState(null)
  const [txs, setTxs]         = useState([])
  const [loans, setLoans]     = useState([])
  const [fds, setFds]         = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/balance'),
      api.get('/api/transactions?limit=5'),
      api.get('/api/loans'),
      api.get('/api/fixed-deposits'),
    ]).then(([b, t, l, f]) => {
      setBalance(b.data.balance)
      setTxs(t.data.transactions || [])
      setLoans(l.data.loans || [])
      setFds(f.data.fds || [])
    }).finally(() => setLoading(false))
  }, [])

  const card = { background:'white', border:'1px solid #e5e7eb', borderRadius:12 }

  return (
    <div style={{maxWidth:900}}>
      <div style={{background:'linear-gradient(135deg,#1d4ed8,#0f4c81)',borderRadius:16,padding:'24px 28px',marginBottom:20,color:'white'}}>
        <div style={{fontSize:13,opacity:0.7,marginBottom:4}}>Welcome back</div>
        <div style={{fontSize:22,fontWeight:700,marginBottom:12}}>{user?.name}</div>
        <div style={{display:'flex',alignItems:'baseline',gap:8}}>
          <span style={{fontSize:13,opacity:0.7}}>Account Balance</span>
          <span style={{fontSize:32,fontWeight:800,fontFamily:'monospace',letterSpacing:'-0.02em'}}>
            {loading ? '...' : `₹${Number(balance||0).toLocaleString('en-IN')}`}
          </span>
        </div>
        <div style={{marginTop:16,fontSize:11,opacity:0.5,fontFamily:'monospace'}}>
          Account No: VE{String(user?.id||0).padStart(8,'0')} · Savings Account
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:20}}>
        {[
          { label:'Transfer',       path:'/transfer',       icon:'→', color:'#3b82f6', bg:'#eff6ff' },
          { label:'Loans',          path:'/loans',           icon:'◈', color:'#8b5cf6', bg:'#f5f3ff' },
          { label:'Fixed Deposits', path:'/fixed-deposits', icon:'⊛', color:'#16a34a', bg:'#f0fdf4' },
          { label:'History',        path:'/transactions',   icon:'⇄', color:'#f97316', bg:'#fff7ed' },
        ].map(({label,path,icon,color,bg}) => (
          <Link key={path} to={path} style={{textDecoration:'none'}}>
            <div style={{background:'white',border:'1px solid #e5e7eb',borderRadius:12,padding:'16px 12px',textAlign:'center'}}>
              <div style={{width:40,height:40,borderRadius:10,background:bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,margin:'0 auto 8px',color}}>{icon}</div>
              <div style={{fontSize:12,fontWeight:500,color:'#374151'}}>{label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr',gap:16}}>
        <div style={card}>
          <div style={{padding:'14px 18px',borderBottom:'1px solid #e5e7eb',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:13,fontWeight:600,color:'#111827'}}>Recent Transactions</span>
            <Link to="/transactions" style={{fontSize:12,color:'#3b82f6',textDecoration:'none'}}>View all</Link>
          </div>
          {loading ? (
            <div style={{padding:20,color:'#9ca3af',fontSize:13,textAlign:'center'}}>Loading...</div>
          ) : !txs.length ? (
            <div style={{padding:20,color:'#9ca3af',fontSize:13,textAlign:'center'}}>No transactions yet</div>
          ) : txs.map(tx => (
            <div key={tx.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 18px',borderBottom:'1px solid #f9fafb'}}>
              <div style={{width:34,height:34,borderRadius:9,background:tx.type==='credit'?'#f0fdf4':'#fff7ed',display:'flex',alignItems:'center',justifyContent:'center',color:tx.type==='credit'?'#16a34a':'#f97316',fontSize:14,flexShrink:0}}>
                {tx.type==='credit'?'↓':'↑'}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:500,color:'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{tx.description}</div>
                <div style={{fontSize:10,color:'#9ca3af'}}>{new Date(tx.created_at).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})}</div>
              </div>
              <div style={{fontSize:13,fontWeight:700,fontFamily:'monospace',color:tx.type==='credit'?'#16a34a':'#ef4444',flexShrink:0}}>
                {tx.type==='credit'?'+':'−'}₹{Number(tx.amount).toLocaleString('en-IN')}
              </div>
            </div>
          ))}
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          <div style={card}>
            <div style={{padding:'12px 16px',borderBottom:'1px solid #e5e7eb',fontSize:13,fontWeight:600,color:'#111827'}}>My Loans ({loans.length})</div>
            {!loans.length ? (
              <div style={{padding:16,fontSize:12,color:'#9ca3af',textAlign:'center'}}>No loans yet</div>
            ) : loans.slice(0,3).map(l => (
              <div key={l.id} style={{padding:'10px 16px',borderBottom:'1px solid #f9fafb',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontSize:12,fontWeight:500,color:'#111827',textTransform:'capitalize'}}>{l.type} loan</div>
                  <div style={{fontSize:10,color:'#9ca3af'}}>EMI: ₹{Number(l.emi).toLocaleString('en-IN')}/mo</div>
                </div>
                <span style={{fontSize:10,padding:'2px 8px',borderRadius:8,background:l.status==='approved'?'#f0fdf4':'#fffbeb',color:l.status==='approved'?'#16a34a':'#d97706'}}>{l.status}</span>
              </div>
            ))}
          </div>
          <div style={card}>
            <div style={{padding:'12px 16px',borderBottom:'1px solid #e5e7eb',fontSize:13,fontWeight:600,color:'#111827'}}>Fixed Deposits ({fds.length})</div>
            {!fds.length ? (
              <div style={{padding:16,fontSize:12,color:'#9ca3af',textAlign:'center'}}>No FDs yet</div>
            ) : fds.slice(0,3).map(f => (
              <div key={f.id} style={{padding:'10px 16px',borderBottom:'1px solid #f9fafb',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontSize:12,fontWeight:500,color:'#111827'}}>₹{Number(f.principal).toLocaleString('en-IN')}</div>
                  <div style={{fontSize:10,color:'#9ca3af'}}>{f.interest_rate}% · {new Date(f.maturity_date).toLocaleDateString('en-IN')}</div>
                </div>
                <div style={{fontSize:12,fontWeight:600,color:'#16a34a',fontFamily:'monospace'}}>₹{Number(f.maturity_amount).toLocaleString('en-IN')}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
