import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../context/AuthContext'

const MONTHS = ['Oct','Nov','Dec','Jan','Feb','Mar']

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats]     = useState(null)
  const [txs, setTxs]         = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/dashboard/stats'),
      api.get('/api/transactions?limit=5')
    ])
      .then(([s, t]) => { setStats(s.data); setTxs(t.data.transactions || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const vols   = stats?.monthlyVolume ?? Array(6).fill(0)
  const maxVol = Math.max(...vols, 1)

  const cards = [
    { label:'Total Balance',   val: stats ? `₹${Number(stats.totalBalance).toLocaleString('en-IN')}` : '—', primary:true },
    { label:'Active Accounts', val: stats?.activeAccounts ?? '—' },
    { label:'Total Users',     val: stats?.totalUsers ?? '—' },
    { label:'Total Txns',      val: stats?.totalTxns ?? '—' },
  ]

  return (
    <div style={{maxWidth:1100}}>
      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:20,fontWeight:600,color:'#111827',margin:0}}>
          Good {hour()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{fontSize:13,color:'#9ca3af',margin:'4px 0 0'}}>Here's your bank at a glance.</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        {cards.map(({ label, val, primary }) => (
          <div key={label} style={{borderRadius:12,padding:'16px 20px',background:primary?'#0f4c81':'white',border:primary?'none':'1px solid #f3f4f6',boxShadow:primary?'0 4px 14px rgba(15,76,129,0.25)':'none'}}>
            <div style={{fontSize:11,fontWeight:500,marginBottom:10,color:primary?'rgba(255,255,255,0.6)':'#9ca3af',textTransform:'uppercase',letterSpacing:'0.05em'}}>{label}</div>
            <div style={{fontSize:22,fontWeight:700,fontFamily:'monospace',color:primary?'white':'#111827',letterSpacing:'-0.02em'}}>
              {loading ? <span style={{opacity:0.3}}>...</span> : val}
            </div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr',gap:16}}>
        <div style={{background:'white',border:'1px solid #f3f4f6',borderRadius:12,overflow:'hidden'}}>
          <div style={{padding:'14px 20px',borderBottom:'1px solid #f3f4f6',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:13,fontWeight:600,color:'#111827'}}>Recent Transactions</span>
            <Link to="/transactions" style={{fontSize:12,color:'#3b82f6',textDecoration:'none'}}>View all →</Link>
          </div>
          {loading ? (
            <div style={{padding:24,textAlign:'center',color:'#9ca3af',fontSize:13}}>Loading...</div>
          ) : !txs.length ? (
            <div style={{padding:24,textAlign:'center',color:'#9ca3af',fontSize:13}}>No transactions yet</div>
          ) : txs.map(tx => (
            <div key={tx.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 20px',borderBottom:'1px solid #f9fafb'}}>
              <div style={{width:34,height:34,borderRadius:9,background:tx.type==='credit'?'#f0fdf4':'#fff7ed',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,flexShrink:0,color:tx.type==='credit'?'#16a34a':'#ea580c'}}>
                {tx.type==='credit'?'↓':'↑'}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:500,color:'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{tx.description}</div>
                <div style={{fontSize:10,color:'#9ca3af',marginTop:2}}>{new Date(tx.created_at).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})}</div>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <div style={{fontSize:12,fontWeight:700,fontFamily:'monospace',color:tx.type==='credit'?'#16a34a':'#ef4444'}}>
                  {tx.type==='credit'?'+':'−'}₹{Number(tx.amount).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div style={{background:'white',border:'1px solid #f3f4f6',borderRadius:12,padding:20}}>
            <div style={{fontSize:13,fontWeight:600,color:'#111827',marginBottom:16}}>Monthly Volume (₹L)</div>
            <div style={{display:'flex',alignItems:'flex-end',gap:6,height:80}}>
              {vols.map((v, i) => (
                <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                  <div style={{width:'100%',borderRadius:'3px 3px 0 0',background:i===vols.length-1?'#0f4c81':'#bfdbfe',height:`${Math.max(4,(v/maxVol)*68)}px`}} />
                  <span style={{fontSize:9,color:'#9ca3af',fontFamily:'monospace'}}>{MONTHS[i]}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{background:'white',border:'1px solid #f3f4f6',borderRadius:12,padding:20}}>
            <div style={{fontSize:13,fontWeight:600,color:'#111827',marginBottom:12}}>Quick Actions</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {[{label:'Accounts',path:'/accounts'},{label:'Transactions',path:'/transactions'},{label:'Add User',path:'/admin/add-user'},{label:'SQL Explorer',path:'/admin/sql'}].map(({label,path}) => (
                <Link key={path} to={path} style={{display:'block',padding:'10px 12px',borderRadius:8,background:'#f9fafb',border:'1px solid #f3f4f6',textDecoration:'none',fontSize:12,fontWeight:500,color:'#374151',textAlign:'center'}}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
const hour = () => { const h = new Date().getHours(); return h<12?'morning':h<17?'afternoon':'evening' }
