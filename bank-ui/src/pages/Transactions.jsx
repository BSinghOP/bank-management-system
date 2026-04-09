import { useState, useEffect, useCallback } from 'react'
import { api } from '../context/AuthContext'

export default function Transactions() {
  const [txs, setTxs]         = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [page, setPage]       = useState(1)
  const [exporting, setExp]   = useState(false)
  const PER = 15

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ page, limit: PER })
      if (search) p.set('search', search)
      const r = await api.get(`/api/transactions?${p}`)
      setTxs(r.data.transactions || [])
      setTotal(r.data.total || 0)
    } catch {} finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { fetch() }, [fetch])

  const exportCsv = async () => {
    setExp(true)
    try {
      const r = await api.get('/api/transactions/export', { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([r.data]))
      const a = document.createElement('a')
      a.href = url; a.download = `transactions_${Date.now()}.csv`; a.click()
      URL.revokeObjectURL(url)
    } catch {} finally { setExp(false) }
  }

  const flag = async (id) => {
    await api.patch(`/api/transactions/${id}/flag`)
    fetch()
  }

  const STATUS_COLOR = { completed:'#16a34a', pending:'#d97706', failed:'#ef4444', flagged:'#ef4444' }
  const STATUS_BG    = { completed:'#f0fdf4', pending:'#fffbeb', failed:'#fef2f2', flagged:'#fef2f2' }

  return (
    <div style={{maxWidth:1100}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <h1 style={{fontSize:18,fontWeight:600,color:'#111827',margin:0}}>Transactions</h1>
          <p style={{fontSize:13,color:'#9ca3af',margin:'4px 0 0'}}>{total} records</p>
        </div>
        <button onClick={exportCsv} disabled={exporting}
          style={{fontSize:12,padding:'7px 14px',borderRadius:8,border:'1px solid #e5e7eb',background:'white',cursor:'pointer',color:'#374151'}}>
          {exporting ? '...' : '↓ Export CSV'}
        </button>
      </div>

      <div style={{background:'white',border:'1px solid #f3f4f6',borderRadius:12,padding:'12px 16px',marginBottom:12}}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search transactions..."
          style={{width:'100%',padding:'8px 12px',fontSize:13,border:'1px solid #e5e7eb',borderRadius:8,outline:'none'}} />
      </div>

      <div style={{background:'white',border:'1px solid #f3f4f6',borderRadius:12,overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead>
            <tr style={{borderBottom:'1px solid #f3f4f6'}}>
              {['ID','Description','Account','Type','Amount','Status','Date',''].map(h => (
                <th key={h} style={{padding:'10px 16px',textAlign:'left',fontWeight:500,color:'#9ca3af'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{padding:20,textAlign:'center',color:'#9ca3af'}}>Loading...</td></tr>
            ) : !txs.length ? (
              <tr><td colSpan={8} style={{padding:20,textAlign:'center',color:'#9ca3af'}}>No transactions found</td></tr>
            ) : txs.map(tx => (
              <tr key={tx.id} style={{borderBottom:'1px solid #f9fafb'}}>
                <td style={{padding:'10px 16px',fontFamily:'monospace',color:'#9ca3af'}}>#{tx.id}</td>
                <td style={{padding:'10px 16px',color:'#111827',maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{tx.description}</td>
                <td style={{padding:'10px 16px',fontFamily:'monospace',color:'#6b7280'}}>{tx.account_number}</td>
                <td style={{padding:'10px 16px'}}>
                  <span style={{fontSize:10,padding:'2px 8px',borderRadius:10,background:tx.type==='credit'?'#f0fdf4':'#fff7ed',color:tx.type==='credit'?'#16a34a':'#ea580c'}}>
                    {tx.type}
                  </span>
                </td>
                <td style={{padding:'10px 16px',fontFamily:'monospace',fontWeight:600,color:tx.type==='credit'?'#16a34a':'#ef4444'}}>
                  {tx.type==='credit'?'+':'−'}₹{Number(tx.amount).toLocaleString('en-IN')}
                </td>
                <td style={{padding:'10px 16px'}}>
                  <span style={{fontSize:10,padding:'2px 8px',borderRadius:10,background:STATUS_BG[tx.status]||'#f9fafb',color:STATUS_COLOR[tx.status]||'#6b7280'}}>
                    {tx.status}
                  </span>
                </td>
                <td style={{padding:'10px 16px',color:'#9ca3af'}}>{new Date(tx.created_at).toLocaleDateString('en-IN')}</td>
                <td style={{padding:'10px 16px'}}>
                  {tx.status !== 'flagged' && (
                    <button onClick={() => flag(tx.id)} style={{fontSize:11,color:'#ef4444',background:'none',border:'none',cursor:'pointer'}}>Flag</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{padding:'10px 16px',borderTop:'1px solid #f3f4f6',display:'flex',justifyContent:'space-between'}}>
          <span style={{fontSize:12,color:'#9ca3af'}}>{((page-1)*PER)+1}–{Math.min(page*PER,total)} of {total}</span>
          <div style={{display:'flex',gap:4}}>
            <button disabled={page===1} onClick={() => setPage(p=>p-1)} style={pbtn}>←</button>
            <button disabled={page*PER>=total} onClick={() => setPage(p=>p+1)} style={pbtn}>→</button>
          </div>
        </div>
      </div>
    </div>
  )
}
const pbtn = {fontSize:12,padding:'4px 10px',borderRadius:6,border:'1px solid #e5e7eb',background:'white',cursor:'pointer',color:'#6b7280'}
