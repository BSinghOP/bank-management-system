import { useState, useEffect } from 'react'
import { api, useAuth } from '../context/AuthContext'

export default function Loans() {
  const { user } = useAuth()
  const [loans, setLoans]     = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ account_id:'', amount:'', tenure_months:'12', type:'personal' })
  const [submitting, setSub]  = useState(false)

  useEffect(() => { fetchLoans() }, [])

  const fetchLoans = async () => {
    setLoading(true)
    try { const r = await api.get('/api/loans'); setLoans(r.data.loans || []) }
    catch {} finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setSub(true)
    try { await api.post('/api/loans', form); setShowForm(false); fetchLoans() }
    catch {} finally { setSub(false) }
  }

  const action = async (id, act) => {
    await api.patch(`/api/loans/${id}/${act}`); fetchLoans()
  }

  const emi = form.amount && form.tenure_months
    ? Math.round((Number(form.amount) * (1 + 0.12 * Number(form.tenure_months) / 12)) / Number(form.tenure_months))
    : null

  const STATUS_COLOR = { pending:'#d97706', approved:'#16a34a', rejected:'#ef4444', active:'#3b82f6', closed:'#6b7280' }
  const STATUS_BG    = { pending:'#fffbeb', approved:'#f0fdf4', rejected:'#fef2f2', active:'#eff6ff', closed:'#f9fafb' }

  return (
    <div style={{maxWidth:1100}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h1 style={{fontSize:18,fontWeight:600,color:'#111827',margin:0}}>Loans</h1>
        <button onClick={() => setShowForm(s=>!s)}
          style={{fontSize:12,padding:'7px 14px',borderRadius:8,background:'#0f4c81',color:'white',border:'none',cursor:'pointer'}}>
          {showForm ? '× Cancel' : '+ New Application'}
        </button>
      </div>

      {showForm && (
        <div style={{background:'white',border:'1px solid #f3f4f6',borderRadius:12,padding:20,marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:600,marginBottom:16}}>New Loan Application</div>
          <form onSubmit={handleSubmit} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            {[['Account ID','account_id','text','e.g. 1'],['Amount (₹)','amount','number','500000'],['Tenure (months)','tenure_months','number','12']].map(([label,key,type,ph]) => (
              <div key={key}>
                <label style={{display:'block',fontSize:12,color:'#374151',marginBottom:4}}>{label}</label>
                <input type={type} value={form[key]} onChange={e => setForm(f=>({...f,[key]:e.target.value}))} required placeholder={ph}
                  style={{width:'100%',padding:'8px 12px',fontSize:13,border:'1px solid #e5e7eb',borderRadius:8,outline:'none',boxSizing:'border-box'}} />
              </div>
            ))}
            <div>
              <label style={{display:'block',fontSize:12,color:'#374151',marginBottom:4}}>Type</label>
              <select value={form.type} onChange={e => setForm(f=>({...f,type:e.target.value}))}
                style={{width:'100%',padding:'8px 12px',fontSize:13,border:'1px solid #e5e7eb',borderRadius:8,outline:'none'}}>
                {['personal','home','auto','education','business'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {emi && (
              <div style={{gridColumn:'1/-1',background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:8,padding:'10px 14px',fontSize:12,color:'#1d4ed8'}}>
                Estimated EMI @ 12% p.a.: <strong style={{fontFamily:'monospace'}}>₹{emi.toLocaleString('en-IN')}/month</strong>
              </div>
            )}
            <div style={{gridColumn:'1/-1',display:'flex',justifyContent:'flex-end',gap:8}}>
              <button type="button" onClick={() => setShowForm(false)}
                style={{fontSize:12,padding:'7px 14px',borderRadius:8,border:'1px solid #e5e7eb',background:'white',cursor:'pointer'}}>Cancel</button>
              <button type="submit" disabled={submitting}
                style={{fontSize:12,padding:'7px 14px',borderRadius:8,background:'#0f4c81',color:'white',border:'none',cursor:'pointer',opacity:submitting?0.6:1}}>
                {submitting ? '...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{background:'white',border:'1px solid #f3f4f6',borderRadius:12,overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead>
            <tr style={{borderBottom:'1px solid #f3f4f6'}}>
              {['ID','Applicant','Type','Amount','Tenure','EMI','Status','Actions'].map(h => (
                <th key={h} style={{padding:'10px 16px',textAlign:'left',fontWeight:500,color:'#9ca3af'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{padding:20,textAlign:'center',color:'#9ca3af'}}>Loading...</td></tr>
            ) : !loans.length ? (
              <tr><td colSpan={8} style={{padding:20,textAlign:'center',color:'#9ca3af'}}>No loan applications yet</td></tr>
            ) : loans.map(loan => (
              <tr key={loan.id} style={{borderBottom:'1px solid #f9fafb'}}>
                <td style={{padding:'10px 16px',fontFamily:'monospace',color:'#9ca3af'}}>#{loan.id}</td>
                <td style={{padding:'10px 16px',fontWeight:500,color:'#111827'}}>{loan.holder_name}</td>
                <td style={{padding:'10px 16px',color:'#6b7280',textTransform:'capitalize'}}>{loan.type}</td>
                <td style={{padding:'10px 16px',fontFamily:'monospace',fontWeight:600,color:'#111827'}}>₹{Number(loan.amount).toLocaleString('en-IN')}</td>
                <td style={{padding:'10px 16px',color:'#6b7280'}}>{loan.tenure_months}m</td>
                <td style={{padding:'10px 16px',fontFamily:'monospace',color:'#6b7280'}}>₹{Number(loan.emi).toLocaleString('en-IN')}</td>
                <td style={{padding:'10px 16px'}}>
                  <span style={{fontSize:10,padding:'2px 8px',borderRadius:10,background:STATUS_BG[loan.status]||'#f9fafb',color:STATUS_COLOR[loan.status]||'#6b7280'}}>
                    {loan.status}
                  </span>
                </td>
                <td style={{padding:'10px 16px'}}>
                  {loan.status === 'pending' && user?.role === 'admin' && (
                    <div style={{display:'flex',gap:4}}>
                      <button onClick={() => action(loan.id,'approve')} style={{fontSize:11,padding:'3px 8px',borderRadius:6,background:'#f0fdf4',color:'#16a34a',border:'1px solid #bbf7d0',cursor:'pointer'}}>Approve</button>
                      <button onClick={() => action(loan.id,'reject')} style={{fontSize:11,padding:'3px 8px',borderRadius:6,background:'#fef2f2',color:'#ef4444',border:'1px solid #fecaca',cursor:'pointer'}}>Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
