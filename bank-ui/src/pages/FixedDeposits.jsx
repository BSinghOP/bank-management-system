import { useState, useEffect } from 'react'
import { api } from '../context/AuthContext'
import { useAuth } from '../context/AuthContext'

export default function FixedDeposits() {
  const { user } = useAuth()
  const [fds, setFds]         = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ account_id:'', principal:'', tenure_months:'12', interest_rate:'6.5' })
  const [submitting, setSub]  = useState(false)

  useEffect(() => { fetchFDs() }, [])

  const fetchFDs = async () => {
    setLoading(true)
    try { const r = await api.get('/api/fixed-deposits'); setFds(r.data.fds || []) }
    catch {} finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setSub(true)
    try { await api.post('/api/fixed-deposits', form); setShowForm(false); fetchFDs() }
    catch {} finally { setSub(false) }
  }

  const closeFD = async (id) => {
    await api.patch(`/api/fixed-deposits/${id}/close`); fetchFDs()
  }

  const maturity = form.principal && form.tenure_months && form.interest_rate
    ? Math.round(Number(form.principal) * (1 + Number(form.interest_rate) / 100 * Number(form.tenure_months) / 12))
    : null

  return (
    <div style={{maxWidth:1100}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h1 style={{fontSize:18,fontWeight:600,color:'#111827',margin:0}}>Fixed Deposits</h1>
        <button onClick={() => setShowForm(s=>!s)}
          style={{fontSize:12,padding:'7px 14px',borderRadius:8,background:'#0f4c81',color:'white',border:'none',cursor:'pointer'}}>
          {showForm ? '× Cancel' : '+ Book FD'}
        </button>
      </div>

      {showForm && (
        <div style={{background:'white',border:'1px solid #f3f4f6',borderRadius:12,padding:20,marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:600,marginBottom:16}}>Book Fixed Deposit</div>
          <form onSubmit={handleSubmit} style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            {[['Account ID','account_id','text','e.g. 1'],['Principal (₹)','principal','number','100000'],['Tenure (months)','tenure_months','number','12'],['Interest Rate (%)','interest_rate','number','6.5']].map(([label,key,type,ph]) => (
              <div key={key}>
                <label style={{display:'block',fontSize:12,color:'#374151',marginBottom:4}}>{label}</label>
                <input type={type} value={form[key]} onChange={e => setForm(f=>({...f,[key]:e.target.value}))} required placeholder={ph} step={key==='interest_rate'?'0.1':'1'}
                  style={{width:'100%',padding:'8px 12px',fontSize:13,border:'1px solid #e5e7eb',borderRadius:8,outline:'none',boxSizing:'border-box'}} />
              </div>
            ))}
            {maturity && (
              <div style={{gridColumn:'1/-1',background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:8,padding:'10px 14px',fontSize:12,color:'#15803d'}}>
                Maturity Amount: <strong style={{fontFamily:'monospace'}}>₹{maturity.toLocaleString('en-IN')}</strong>
                <span style={{color:'#86efac',marginLeft:8}}>(+₹{(maturity-Number(form.principal)).toLocaleString('en-IN')} interest)</span>
              </div>
            )}
            <div style={{gridColumn:'1/-1',display:'flex',justifyContent:'flex-end',gap:8}}>
              <button type="button" onClick={() => setShowForm(false)}
                style={{fontSize:12,padding:'7px 14px',borderRadius:8,border:'1px solid #e5e7eb',background:'white',cursor:'pointer'}}>Cancel</button>
              <button type="submit" disabled={submitting}
                style={{fontSize:12,padding:'7px 14px',borderRadius:8,background:'#0f4c81',color:'white',border:'none',cursor:'pointer',opacity:submitting?0.6:1}}>
                {submitting ? '...' : 'Book FD'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{padding:40,textAlign:'center',color:'#9ca3af'}}>Loading...</div>
      ) : !fds.length ? (
        <div style={{background:'white',border:'1px solid #f3f4f6',borderRadius:12,padding:40,textAlign:'center',color:'#9ca3af'}}>No fixed deposits yet</div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {fds.map(fd => {
            const matDate = new Date(fd.maturity_date)
            const daysLeft = Math.ceil((matDate - new Date()) / 86400000)
            const matured = daysLeft <= 0
            const progress = Math.max(0, Math.min(100, 100 - (Math.max(daysLeft,0) / (fd.tenure_months*30)) * 100))
            return (
              <div key={fd.id} style={{background:'white',border:`1px solid ${matured?'#bbf7d0':daysLeft<=30?'#fde68a':'#f3f4f6'}`,borderRadius:12,padding:16}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                  <div>
                    <div style={{fontSize:10,fontFamily:'monospace',color:'#9ca3af'}}>FD #{fd.id}</div>
                    <div style={{fontSize:14,fontWeight:600,color:'#111827',marginTop:2}}>{fd.holder_name}</div>
                  </div>
                  <span style={{fontSize:10,padding:'2px 8px',borderRadius:10,background:matured?'#f0fdf4':daysLeft<=30?'#fffbeb':'#eff6ff',color:matured?'#16a34a':daysLeft<=30?'#d97706':'#3b82f6'}}>
                    {matured?'Matured':daysLeft<=30?`${daysLeft}d left`:'Active'}
                  </span>
                </div>
                {[['Principal',`₹${Number(fd.principal).toLocaleString('en-IN')}`],['Rate',`${fd.interest_rate}% p.a.`],['Maturity',`₹${Number(fd.maturity_amount).toLocaleString('en-IN')}`],['Date',matDate.toLocaleDateString('en-IN')]].map(([k,v]) => (
                  <div key={k} style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                    <span style={{fontSize:11,color:'#9ca3af'}}>{k}</span>
                    <span style={{fontSize:11,fontWeight:500,color:k==='Maturity'?'#16a34a':'#111827'}}>{v}</span>
                  </div>
                ))}
                <div style={{height:4,background:'#f3f4f6',borderRadius:4,overflow:'hidden',margin:'8px 0'}}>
                  <div style={{height:'100%',width:`${progress}%`,background:matured?'#22c55e':daysLeft<=30?'#f59e0b':'#0f4c81',borderRadius:4}} />
                </div>
                {matured && fd.status !== 'closed' && user?.role === 'admin' && (
                  <button onClick={() => closeFD(fd.id)}
                    style={{width:'100%',fontSize:12,padding:'6px',borderRadius:8,background:'#f0fdf4',color:'#16a34a',border:'1px solid #bbf7d0',cursor:'pointer',marginTop:4}}>
                    Process Maturity
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
