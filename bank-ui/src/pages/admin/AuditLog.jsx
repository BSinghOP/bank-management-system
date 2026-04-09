import { useState, useEffect, useCallback } from 'react'
import { api } from '../../context/AuthContext'

const EVENT_COLOR = {
  login_success:'#16a34a', login_failed:'#ef4444', otp_success:'#3b82f6',
  otp_failed:'#f97316', logout:'#6b7280', account_frozen:'#d97706',
  transaction_flagged:'#ef4444', kyc_approved:'#16a34a', role_changed:'#8b5cf6',
  password_changed:'#d97706', loan_applied:'#3b82f6', loan_approved:'#16a34a', loan_rejected:'#ef4444',
}
const EVENT_BG = {
  login_success:'#f0fdf4', login_failed:'#fef2f2', otp_success:'#eff6ff',
  otp_failed:'#fff7ed', logout:'#f9fafb', account_frozen:'#fffbeb',
  transaction_flagged:'#fef2f2', kyc_approved:'#f0fdf4', role_changed:'#f5f3ff',
  password_changed:'#fffbeb', loan_applied:'#eff6ff', loan_approved:'#f0fdf4', loan_rejected:'#fef2f2',
}

export default function AuditLog() {
  const [logs, setLogs]       = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [event, setEvent]     = useState('all')
  const [page, setPage]       = useState(1)
  const PER = 20

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ page, limit: PER })
      if (event !== 'all') p.set('event', event)
      const r = await api.get(`/api/admin/audit?${p}`)
      setLogs(r.data.logs || [])
      setTotal(r.data.total || 0)
    } catch {} finally { setLoading(false) }
  }, [page, event])

  useEffect(() => { fetch() }, [fetch])

  const FILTERS = ['all','login_failed','otp_failed','transaction_flagged','account_frozen','role_changed']

  return (
    <div style={{maxWidth:1100}}>
      <div style={{marginBottom:16}}>
        <h1 style={{fontSize:18,fontWeight:600,color:'#111827',margin:0}}>Audit Log</h1>
        <p style={{fontSize:13,color:'#9ca3af',margin:'4px 0 0'}}>{total} events recorded</p>
      </div>

      <div style={{background:'white',border:'1px solid #f3f4f6',borderRadius:12,padding:'12px 16px',marginBottom:12,display:'flex',flexWrap:'wrap',gap:6}}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => { setEvent(f); setPage(1) }}
            style={{fontSize:12,padding:'5px 12px',borderRadius:8,border:'none',cursor:'pointer',
              background:event===f?'#0f4c81':'#f3f4f6',color:event===f?'white':'#6b7280'}}>
            {f.replace(/_/g,' ')}
          </button>
        ))}
      </div>

      <div style={{background:'white',border:'1px solid #f3f4f6',borderRadius:12,overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead>
            <tr style={{borderBottom:'1px solid #f3f4f6'}}>
              {['Event','User','IP','Details','Time'].map(h => (
                <th key={h} style={{padding:'10px 16px',textAlign:'left',fontWeight:500,color:'#9ca3af'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{padding:20,textAlign:'center',color:'#9ca3af'}}>Loading...</td></tr>
            ) : !logs.length ? (
              <tr><td colSpan={5} style={{padding:20,textAlign:'center',color:'#9ca3af'}}>No events found</td></tr>
            ) : logs.map((log, i) => (
              <tr key={i} style={{borderBottom:'1px solid #f9fafb'}}>
                <td style={{padding:'10px 16px'}}>
                  <span style={{fontSize:10,padding:'2px 8px',borderRadius:10,background:EVENT_BG[log.event]||'#f9fafb',color:EVENT_COLOR[log.event]||'#6b7280'}}>
                    {log.event?.replace(/_/g,' ')}
                  </span>
                </td>
                <td style={{padding:'10px 16px'}}>
                  <div style={{fontWeight:500,color:'#111827'}}>{log.user_name || 'System'}</div>
                  <div style={{fontSize:10,color:'#9ca3af'}}>{log.user_email}</div>
                </td>
                <td style={{padding:'10px 16px',fontFamily:'monospace',color:'#6b7280'}}>{log.ip_address || '—'}</td>
                <td style={{padding:'10px 16px',color:'#6b7280',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{log.details || '—'}</td>
                <td style={{padding:'10px 16px',color:'#9ca3af'}}>
                  <div>{new Date(log.created_at).toLocaleDateString('en-IN')}</div>
                  <div style={{fontSize:10,fontFamily:'monospace'}}>{new Date(log.created_at).toLocaleTimeString('en-IN',{hour12:false})}</div>
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
