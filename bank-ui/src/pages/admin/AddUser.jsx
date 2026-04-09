import { useState } from 'react'
import { api } from '../../context/AuthContext'

export default function AddUser() {
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'user', balance:'1000' })
  const [submitting, setSub] = useState(false)
  const [result, setResult] = useState(null) // { success, user, query, error }
  const [history, setHistory] = useState([])

  const set = (k,v) => setForm(f => ({...f,[k]:v}))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSub(true)
    setResult(null)
    try {
      const r = await api.post('/api/admin/users/create', form)
      const res = { success:true, ...r.data }
      setResult(res)
      setHistory(h => [res, ...h].slice(0,10))
      setForm(f => ({...f, name:'', email:'', password:''}))
    } catch(err) {
      setResult({ success:false, error: err.response?.data?.error || 'Failed to create user' })
    } finally { setSub(false) }
  }

  const card = { background:'white', border:'1px solid #e5e7eb', borderRadius:12, padding:24, marginBottom:16 }
  const inp  = { width:'100%', padding:'9px 12px', fontSize:13, border:'1px solid #e5e7eb', borderRadius:8, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }
  const lbl  = { display:'block', fontSize:12, fontWeight:500, color:'#374151', marginBottom:5 }

  return (
    <div style={{maxWidth:900}}>
      <div style={{marginBottom:20}}>
        <h1 style={{fontSize:18,fontWeight:600,color:'#111827',margin:0}}>Add New User</h1>
        <p style={{fontSize:13,color:'#9ca3af',margin:'4px 0 0'}}>Create a bank account for a new customer. The SQL query will be shown after creation.</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,alignItems:'start'}}>

        {/* Form */}
        <div style={card}>
          <div style={{fontSize:14,fontWeight:600,color:'#111827',marginBottom:20}}>User Details</div>
          <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:14}}>
            <div>
              <label style={lbl}>Full Name</label>
              <input value={form.name} onChange={e=>set('name',e.target.value)} required
                placeholder="e.g. Rahul Sharma" style={inp} />
            </div>
            <div>
              <label style={lbl}>Email Address</label>
              <input type="email" value={form.email} onChange={e=>set('email',e.target.value)} required
                placeholder="rahul@example.com" style={inp} />
            </div>
            <div>
              <label style={lbl}>Password</label>
              <input type="password" value={form.password} onChange={e=>set('password',e.target.value)} required
                minLength={6} placeholder="Min 6 characters" style={inp} />
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div>
                <label style={lbl}>Role</label>
                <select value={form.role} onChange={e=>set('role',e.target.value)} style={{...inp}}>
                  <option value="user">Customer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Starting Balance (₹)</label>
                <input type="number" value={form.balance} onChange={e=>set('balance',e.target.value)}
                  min="0" style={inp} />
              </div>
            </div>

            {/* Live SQL preview */}
            <div>
              <label style={lbl}>SQL Preview</label>
              <div style={{background:'#0f1b2d',borderRadius:8,padding:'12px 14px',fontFamily:'monospace',fontSize:11,color:'#93c5fd',lineHeight:1.7,whiteSpace:'pre-wrap',wordBreak:'break-all'}}>
{`INSERT INTO users (name, email, password, balance, role)
VALUES (
  '${form.name || '<name>'}',
  '${form.email || '<email>'}',
  bcrypt('${form.password ? '•'.repeat(form.password.length) : '<password>'}, 12),
  ${form.balance || 0},
  '${form.role}'
);`}
              </div>
            </div>

            <button type="submit" disabled={submitting}
              style={{padding:'10px',borderRadius:9,background:submitting?'#93c5fd':'#2563eb',color:'white',border:'none',cursor:submitting?'not-allowed':'pointer',fontSize:13,fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
              {submitting ? <>
                <span style={{width:14,height:14,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin 0.7s linear infinite',display:'inline-block'}} />
                Creating...
              </> : '+ Create User'}
            </button>
          </form>
        </div>

        {/* Result + history */}
        <div>
          {/* Result */}
          {result && (
            <div style={{...card, borderColor:result.success?'#bbf7d0':'#fecaca',background:result.success?'#f0fdf4':'#fef2f2',marginBottom:16}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:result.success?14:0}}>
                <span style={{fontSize:18}}>{result.success?'✅':'❌'}</span>
                <span style={{fontWeight:600,fontSize:14,color:result.success?'#15803d':'#dc2626'}}>
                  {result.success ? `User created successfully!` : result.error}
                </span>
              </div>
              {result.success && <>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}>
                  {[['ID',`#${result.id}`],['Name',result.name],['Email',result.email],['Role',result.role],['Balance',`₹${Number(result.balance).toLocaleString('en-IN')}`]].map(([k,v])=>(
                    <div key={k} style={{background:'white',borderRadius:7,padding:'8px 12px',border:'1px solid #bbf7d0'}}>
                      <div style={{fontSize:10,color:'#6b7280',marginBottom:2}}>{k}</div>
                      <div style={{fontSize:13,fontWeight:500,color:'#111827'}}>{v}</div>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{fontSize:11,fontWeight:600,color:'#15803d',marginBottom:6}}>📋 Actual SQL Executed:</div>
                  <div style={{background:'#0f1b2d',borderRadius:8,padding:'12px 14px',fontFamily:'monospace',fontSize:11,color:'#86efac',lineHeight:1.8,whiteSpace:'pre-wrap',wordBreak:'break-all'}}>
                    {result.query}
                  </div>
                </div>
              </>}
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div style={card}>
              <div style={{fontSize:13,fontWeight:600,color:'#111827',marginBottom:12}}>Recently Created Users</div>
              {history.map((h,i) => h.success && (
                <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid #f9fafb'}}>
                  <div style={{width:30,height:30,borderRadius:7,background:'#eff6ff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:'#3b82f6',flexShrink:0}}>
                    {h.name?.[0]?.toUpperCase()}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:500,color:'#111827'}}>{h.name}</div>
                    <div style={{fontSize:10,color:'#9ca3af'}}>{h.email}</div>
                  </div>
                  <span style={{fontSize:10,padding:'2px 8px',borderRadius:8,background:'#f0fdf4',color:'#16a34a'}}>ID #{h.id}</span>
                </div>
              ))}
            </div>
          )}

          {/* How it works box */}
          <div style={{...card,background:'#0f1b2d',border:'none'}}>
            <div style={{fontSize:12,fontWeight:600,color:'#60a5fa',marginBottom:10}}>⚙️ How this works — DBMS Project</div>
            <div style={{fontSize:11,color:'rgba(255,255,255,0.6)',lineHeight:1.8}}>
              <div>1. React form sends data to <span style={{color:'#93c5fd',fontFamily:'monospace'}}>POST /api/admin/users/create</span> via Axios</div>
              <div>2. Node.js hashes password using <span style={{color:'#93c5fd',fontFamily:'monospace'}}>bcrypt (cost=12)</span> — never stored as plain text</div>
              <div>3. Parameterized <span style={{color:'#93c5fd',fontFamily:'monospace'}}>INSERT INTO users</span> query runs via mysql2 driver</div>
              <div>4. MySQL executes the query, stores record, returns auto-increment ID</div>
              <div>5. Server returns the sanitized query shown above for demonstration</div>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
