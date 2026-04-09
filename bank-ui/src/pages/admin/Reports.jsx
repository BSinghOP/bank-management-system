import { useState, useEffect } from 'react'
import { api } from '../../context/AuthContext'

export default function Reports() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/admin/reports/summary')
      .then(r => setData(r.data))
      .finally(() => setLoading(false))
  }, [])

  const fmt = (v) => {
    const n = Number(v)
    if (n >= 1e7) return `₹${(n/1e7).toFixed(1)}Cr`
    if (n >= 1e5) return `₹${(n/1e5).toFixed(1)}L`
    return n.toLocaleString('en-IN')
  }

  const cards = data ? [
    { label:'Total Users',      val: data.total_users,     color:'#3b82f6', bg:'#eff6ff' },
    { label:'Active Accounts',  val: data.active_accounts, color:'#16a34a', bg:'#f0fdf4' },
    { label:'Total Deposits',   val: fmt(data.total_deposits), color:'#7c3aed', bg:'#f5f3ff' },
    { label:'Loans Disbursed',  val: fmt(data.total_loans),    color:'#d97706', bg:'#fffbeb' },
    { label:'Active FDs',       val: fmt(data.total_fds),      color:'#db2777', bg:'#fdf2f8' },
    { label:"Today's Txns",     val: data.txs_today,       color:'#0891b2', bg:'#ecfeff' },
  ] : []

  return (
    <div style={{maxWidth:900}}>
      <div style={{marginBottom:20}}>
        <h1 style={{fontSize:18,fontWeight:600,color:'#111827',margin:0}}>Reports</h1>
        <p style={{fontSize:13,color:'#9ca3af',margin:'4px 0 0'}}>Live bank-wide summary</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
        {loading ? Array(6).fill(0).map((_,i) => (
          <div key={i} style={{background:'white',border:'1px solid #f3f4f6',borderRadius:12,padding:20}}>
            <div style={{height:12,background:'#f3f4f6',borderRadius:6,marginBottom:8,width:80}} />
            <div style={{height:24,background:'#f3f4f6',borderRadius:6,width:100}} />
          </div>
        )) : cards.map(({ label, val, color, bg }) => (
          <div key={label} style={{background:bg,border:`1px solid ${color}20`,borderRadius:12,padding:20}}>
            <div style={{fontSize:12,fontWeight:500,color,marginBottom:8,opacity:0.8}}>{label}</div>
            <div style={{fontSize:24,fontWeight:600,fontFamily:'monospace',color}}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{background:'white',border:'1px solid #f3f4f6',borderRadius:12,padding:20}}>
        <div style={{fontSize:14,fontWeight:600,color:'#111827',marginBottom:8}}>Note</div>
        <p style={{fontSize:13,color:'#6b7280',lineHeight:1.6,margin:0}}>
          For detailed transaction reports, use the <a href="/transactions" style={{color:'#3b82f6'}}>Transactions</a> page and export to CSV.
        </p>
      </div>
    </div>
  )
}
