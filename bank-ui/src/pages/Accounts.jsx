import { useState, useEffect, useCallback } from 'react'
import { api } from '../context/AuthContext'

export default function Accounts() {
  const [accounts, setAccounts] = useState([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [page, setPage]         = useState(1)
  const [drawer, setDrawer]     = useState(null)
  const PER = 10

  const fetchAccounts = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ page, limit: PER })
      if (search) p.set('search', search)
      const r = await api.get(`/api/accounts?${p}`)
      setAccounts(r.data.accounts || [])
      setTotal(r.data.total || 0)
    } catch {} finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { fetchAccounts() }, [fetchAccounts])

  const freeze = async (e, id, isFrozen) => {
    e.stopPropagation()
    await api.patch(`/api/accounts/${id}/status`, { status: isFrozen ? 'active' : 'frozen' })
    fetchAccounts()
  }

  return (
    <div style={{maxWidth:1100}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <h1 style={{fontSize:18,fontWeight:600,color:'#111827',margin:0}}>Accounts</h1>
          <p style={{fontSize:13,color:'#9ca3af',margin:'4px 0 0'}}>{total} total</p>
        </div>
      </div>

      <div style={{background:'white',border:'1px solid #f3f4f6',borderRadius:12,padding:'12px 16px',marginBottom:12}}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search by name, email..."
          style={{width:'100%',padding:'8px 12px',fontSize:13,border:'1px solid #e5e7eb',borderRadius:8,outline:'none'}} />
      </div>

      <div style={{background:'white',border:'1px solid #f3f4f6',borderRadius:12,overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead>
            <tr style={{borderBottom:'1px solid #f3f4f6'}}>
              {['Account No.','Holder','Type','Balance','Status','Actions'].map(h => (
                <th key={h} style={{padding:'10px 16px',textAlign:'left',fontWeight:500,color:'#9ca3af'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{padding:20,textAlign:'center',color:'#9ca3af'}}>Loading...</td></tr>
            ) : accounts.map(acc => (
              <tr key={acc.id} onClick={() => setDrawer(acc)}
                style={{borderBottom:'1px solid #f9fafb',cursor:'pointer'}}
                onMouseEnter={e => e.currentTarget.style.background='#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.background='white'}>
                <td style={{padding:'10px 16px',fontFamily:'monospace',color:'#6b7280'}}>{acc.account_number}</td>
                <td style={{padding:'10px 16px'}}>
                  <div style={{fontWeight:500,color:'#111827'}}>{acc.holder_name}</div>
                  <div style={{fontSize:10,color:'#9ca3af'}}>{acc.email}</div>
                </td>
                <td style={{padding:'10px 16px',color:'#6b7280',textTransform:'capitalize'}}>{acc.account_type}</td>
                <td style={{padding:'10px 16px',fontFamily:'monospace',fontWeight:500,color:'#111827'}}>₹{Number(acc.balance).toLocaleString('en-IN')}</td>
                <td style={{padding:'10px 16px'}}>
                  <span style={{fontSize:10,padding:'2px 8px',borderRadius:10,background:acc.status==='active'?'#f0fdf4':'#eff6ff',color:acc.status==='active'?'#16a34a':'#3b82f6'}}>
                    {acc.status}
                  </span>
                </td>
                <td style={{padding:'10px 16px'}} onClick={e => e.stopPropagation()}>
                  <button onClick={e => freeze(e, acc.id, acc.status==='frozen')}
                    style={{fontSize:11,padding:'3px 10px',borderRadius:6,border:'1px solid #e5e7eb',background:'white',cursor:'pointer',color:'#6b7280'}}>
                    {acc.status==='frozen'?'Unfreeze':'Freeze'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{padding:'10px 16px',borderTop:'1px solid #f3f4f6',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontSize:12,color:'#9ca3af'}}>{((page-1)*PER)+1}–{Math.min(page*PER,total)} of {total}</span>
          <div style={{display:'flex',gap:4}}>
            <button disabled={page===1} onClick={() => setPage(p=>p-1)} style={pbtn}>←</button>
            <button disabled={page*PER>=total} onClick={() => setPage(p=>p+1)} style={pbtn}>→</button>
          </div>
        </div>
      </div>

      {drawer && (
        <div style={{position:'fixed',inset:0,zIndex:50,display:'flex'}}>
          <div style={{flex:1,background:'rgba(0,0,0,0.2)'}} onClick={() => setDrawer(null)} />
          <div style={{width:360,background:'white',boxShadow:'-4px 0 20px rgba(0,0,0,0.1)',display:'flex',flexDirection:'column'}}>
            <div style={{padding:'16px 20px',borderBottom:'1px solid #f3f4f6',display:'flex',justifyContent:'space-between'}}>
              <span style={{fontWeight:600,fontSize:14}}>Account Details</span>
              <button onClick={() => setDrawer(null)} style={{background:'none',border:'none',fontSize:20,cursor:'pointer',color:'#9ca3af'}}>×</button>
            </div>
            <div style={{padding:20,overflowY:'auto'}}>
              {[['Account No.',drawer.account_number],['Name',drawer.holder_name],['Email',drawer.email],['Type',drawer.account_type],['Balance',`₹${Number(drawer.balance).toLocaleString('en-IN')}`],['Status',drawer.status]].map(([k,v]) => (
                <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #f9fafb'}}>
                  <span style={{fontSize:12,color:'#9ca3af'}}>{k}</span>
                  <span style={{fontSize:12,fontWeight:500,color:'#111827'}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const pbtn = {fontSize:12,padding:'4px 10px',borderRadius:6,border:'1px solid #e5e7eb',background:'white',cursor:'pointer',color:'#6b7280'}
