import { useState, useEffect } from 'react'
import { api } from '../context/AuthContext'
import { useAuth } from '../context/AuthContext'

export default function Transfer() {
  const { user } = useAuth()
  const [balance, setBalance]   = useState(null)
  const [form, setForm]         = useState({ receiverEmail:'', amount:'' })
  const [submitting, setSub]    = useState(false)
  const [result, setResult]     = useState(null)
  const [history, setHistory]   = useState([])

  useEffect(() => {
    api.get('/balance').then(r => setBalance(r.data.balance)).catch(() => {})
  }, [result]) // refresh balance after transfer

  const set = (k,v) => setForm(f => ({...f,[k]:v}))

  const handleSubmit = async (e) => {
    e.preventDefault(); setSub(true); setResult(null)
    try {
      const r = await api.post('/transfer', form)
      const res = { success:true, ...r.data, ...form, time: new Date().toLocaleTimeString('en-IN') }
      setResult(res)
      setHistory(h => [res,...h].slice(0,5))
      setForm({ receiverEmail:'', amount:'' })
    } catch(err) {
      setResult({ success:false, error: err.response?.data?.error || err.response?.data || 'Transfer failed' })
    } finally { setSub(false) }
  }

  const card = { background:'white', border:'1px solid #e5e7eb', borderRadius:12, padding:24 }
  const inp  = { width:'100%', padding:'10px 12px', fontSize:13, border:'1px solid #e5e7eb', borderRadius:8, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }
  const lbl  = { display:'block', fontSize:12, fontWeight:500, color:'#374151', marginBottom:5 }

  return (
    <div style={{maxWidth:900}}>
      <div style={{marginBottom:20}}>
        <h1 style={{fontSize:18,fontWeight:600,color:'#111827',margin:0}}>Transfer Money</h1>
        <p style={{fontSize:13,color:'#9ca3af',margin:'4px 0 0'}}>Send money to another account instantly.</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,alignItems:'start'}}>
        <div style={card}>
          <div style={{fontSize:14,fontWeight:600,color:'#111827',marginBottom:20}}>New Transfer</div>
          <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:16}}>
            <div>
              <label style={lbl}>Your Balance</label>
              <div style={{padding:'10px 12px',background:'#f9fafb',border:'1px solid #e5e7eb',borderRadius:8,fontSize:20,fontWeight:700,color:'#0f4c81',fontFamily:'monospace'}}>
                {balance === null ? '...' : `₹${Number(balance).toLocaleString('en-IN')}`}
              </div>
            </div>
            <div>
              <label style={lbl}>Receiver's Email</label>
              <input type="email" value={form.receiverEmail} onChange={e=>set('receiverEmail',e.target.value)}
                required placeholder="receiver@example.com" style={inp} />
            </div>
            <div>
              <label style={lbl}>Amount (₹)</label>
              <input type="number" value={form.amount} onChange={e=>set('amount',e.target.value)}
                required min="1" max={balance||999999} placeholder="Enter amount" style={inp} />
            </div>

            {form.amount && form.receiverEmail && (
              <div style={{background:'#eff6ff',border:'1px solid #bfdbfe',borderRadius:8,padding:'12px 14px'}}>
                <div style={{fontSize:11,fontWeight:600,color:'#1d4ed8',marginBottom:6}}>📋 SQL Transaction (ACID):</div>
                <div style={{fontFamily:'monospace',fontSize:10,color:'#1e40af',lineHeight:1.8,whiteSpace:'pre-wrap'}}>
{`BEGIN;
  UPDATE users SET balance = balance - ${form.amount}
    WHERE id = ${user?.id};
  
  UPDATE users SET balance = balance + ${form.amount}
    WHERE email = '${form.receiverEmail}';
  
  INSERT INTO transactions
    (sender_id, receiver_id, amount)
  VALUES (${user?.id}, receiver_id, ${form.amount});
COMMIT;`}
                </div>
              </div>
            )}

            {result && !result.success && (
              <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,padding:'12px',color:'#dc2626',fontSize:13}}>
                ❌ {typeof result.error === 'string' ? result.error : 'Transfer failed'}
              </div>
            )}

            <button type="submit" disabled={submitting}
              style={{padding:'11px',borderRadius:9,background:submitting?'#93c5fd':'#2563eb',color:'white',border:'none',cursor:submitting?'not-allowed':'pointer',fontSize:13,fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
              {submitting
                ? <><span style={{width:14,height:14,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin 0.7s linear infinite',display:'inline-block'}} /> Processing...</>
                : '→ Send Money'}
            </button>
          </form>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {result?.success && (
            <div style={{...card,background:'#f0fdf4',border:'1px solid #bbf7d0',padding:20}}>
              <div style={{fontSize:15,fontWeight:600,color:'#15803d',marginBottom:12}}>✅ Transfer Successful!</div>
              {[['To',result.receiverEmail],['Amount',`₹${Number(result.amount).toLocaleString('en-IN')}`],['Time',result.time],['Status','Completed']].map(([k,v]) => (
                <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid #dcfce7'}}>
                  <span style={{fontSize:12,color:'#6b7280'}}>{k}</span>
                  <span style={{fontSize:12,fontWeight:500,color:'#111827'}}>{v}</span>
                </div>
              ))}
            </div>
          )}

          {history.length > 0 && (
            <div style={card}>
              <div style={{fontSize:13,fontWeight:600,color:'#111827',marginBottom:12}}>Recent Transfers</div>
              {history.map((h,i) => h.success && (
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid #f9fafb'}}>
                  <div style={{width:32,height:32,borderRadius:8,background:'#fff7ed',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>↑</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:500,color:'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{h.receiverEmail}</div>
                    <div style={{fontSize:10,color:'#9ca3af'}}>{h.time}</div>
                  </div>
                  <span style={{fontSize:12,fontWeight:700,fontFamily:'monospace',color:'#ef4444'}}>−₹{Number(h.amount).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{...card,background:'#0f1b2d',border:'none',padding:20}}>
            <div style={{fontSize:12,fontWeight:600,color:'#60a5fa',marginBottom:10}}>🔒 ACID Properties</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.6)',lineHeight:1.8}}>
              <div><span style={{color:'#fbbf24'}}>Atomicity</span> — Both debit and credit happen together or not at all</div>
              <div><span style={{color:'#fbbf24'}}>Consistency</span> — Balance never goes negative</div>
              <div><span style={{color:'#fbbf24'}}>Isolation</span> — Concurrent transfers don't interfere</div>
              <div><span style={{color:'#fbbf24'}}>Durability</span> — Committed transaction is permanent</div>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
