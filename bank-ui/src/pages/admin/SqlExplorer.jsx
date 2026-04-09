import { useState } from 'react'
import { api } from '../../context/AuthContext'

const PRESETS = [
  {
    label: 'All Users with Balance',
    category: 'SELECT',
    sql: `SELECT id, name, email, balance, role, created_at
FROM users
ORDER BY balance DESC;`
  },
  {
    label: 'Total Balance per Role',
    category: 'GROUP BY',
    sql: `SELECT role,
       COUNT(*) AS total_users,
       SUM(balance) AS total_balance,
       AVG(balance) AS avg_balance
FROM users
GROUP BY role;`
  },
  {
    label: 'Transaction History with Names',
    category: 'JOIN',
    sql: `SELECT t.id,
       s.name AS sender,
       r.name AS receiver,
       t.amount,
       t.created_at
FROM transactions t
JOIN users s ON t.sender_id   = s.id
JOIN users r ON t.receiver_id = r.id
ORDER BY t.id DESC
LIMIT 10;`
  },
  {
    label: 'Users who sent money',
    category: 'JOIN',
    sql: `SELECT u.name, u.email,
       COUNT(t.id)    AS transfers_made,
       SUM(t.amount)  AS total_sent
FROM users u
LEFT JOIN transactions t ON t.sender_id = u.id
GROUP BY u.id
ORDER BY total_sent DESC;`
  },
  {
    label: 'Active Loans Summary',
    category: 'SELECT',
    sql: `SELECT l.id, u.name AS applicant,
       l.type, l.amount, l.tenure_months,
       l.emi, l.status, l.created_at
FROM loans l
JOIN users u ON l.user_id = u.id
ORDER BY l.created_at DESC;`
  },
  {
    label: 'Fixed Deposits with Maturity',
    category: 'SELECT',
    sql: `SELECT f.id, u.name AS holder,
       f.principal, f.interest_rate,
       f.maturity_amount, f.maturity_date,
       DATEDIFF(f.maturity_date, CURDATE()) AS days_remaining,
       f.status
FROM fixed_deposits f
JOIN users u ON f.user_id = u.id
ORDER BY f.maturity_date ASC;`
  },
  {
    label: 'Richest Customers',
    category: 'ORDER BY',
    sql: `SELECT name, email, balance, role
FROM users
WHERE role = 'user'
ORDER BY balance DESC
LIMIT 5;`
  },
  {
    label: 'Bank Summary Stats',
    category: 'AGGREGATE',
    sql: `SELECT
  (SELECT COUNT(*) FROM users)              AS total_users,
  (SELECT SUM(balance) FROM users)          AS total_deposits,
  (SELECT COUNT(*) FROM transactions)       AS total_transactions,
  (SELECT COALESCE(SUM(amount),0) FROM transactions) AS total_transferred,
  (SELECT COUNT(*) FROM loans)              AS total_loans,
  (SELECT COUNT(*) FROM fixed_deposits)     AS total_fds;`
  },
]

const CATEGORY_COLORS = {
  'SELECT':    { bg:'#eff6ff', color:'#3b82f6' },
  'JOIN':      { bg:'#f0fdf4', color:'#16a34a' },
  'GROUP BY':  { bg:'#fdf4ff', color:'#a855f7' },
  'ORDER BY':  { bg:'#fff7ed', color:'#f97316' },
  'AGGREGATE': { bg:'#fef2f2', color:'#ef4444' },
}

export default function SqlExplorer() {
  const [sql, setSql]           = useState(PRESETS[0].sql)
  const [results, setResults]   = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [activePreset, setPreset] = useState(0)
  const [execTime, setExecTime] = useState(null)

  const runQuery = async () => {
    setLoading(true); setError(null); setResults(null)
    const start = Date.now()
    try {
      const r = await api.post('/api/admin/sql', { sql })
      setResults(r.data.rows)
      setExecTime(Date.now() - start)
    } catch(err) {
      setError(err.response?.data?.error || 'Query failed')
    } finally { setLoading(false) }
  }

  const selectPreset = (i) => {
    setPreset(i); setSql(PRESETS[i].sql); setResults(null); setError(null)
  }

  return (
    <div style={{maxWidth:1200}}>
      <div style={{marginBottom:20}}>
        <h1 style={{fontSize:18,fontWeight:600,color:'#111827',margin:0}}>SQL Explorer</h1>
        <p style={{fontSize:13,color:'#9ca3af',margin:'4px 0 0'}}>Run queries against your live database. Perfect for demonstrating SQL concepts.</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'220px 1fr',gap:16,alignItems:'start'}}>

        {/* Preset list */}
        <div style={{background:'white',border:'1px solid #e5e7eb',borderRadius:12,overflow:'hidden'}}>
          <div style={{padding:'12px 14px',borderBottom:'1px solid #e5e7eb',fontSize:12,fontWeight:600,color:'#374151'}}>
            Preset Queries
          </div>
          {PRESETS.map((p,i) => {
            const c = CATEGORY_COLORS[p.category] || { bg:'#f9fafb', color:'#6b7280' }
            return (
              <div key={i} onClick={() => selectPreset(i)}
                style={{padding:'10px 14px',cursor:'pointer',borderBottom:'1px solid #f9fafb',
                  background:activePreset===i?'#eff6ff':'white',
                  borderLeft:activePreset===i?'3px solid #3b82f6':'3px solid transparent'}}>
                <div style={{fontSize:12,fontWeight:activePreset===i?600:400,color:activePreset===i?'#1d4ed8':'#374151',marginBottom:4}}>{p.label}</div>
                <span style={{fontSize:10,padding:'1px 6px',borderRadius:6,background:c.bg,color:c.color,fontWeight:500}}>{p.category}</span>
              </div>
            )
          })}
        </div>

        {/* Query editor + results */}
        <div style={{display:'flex',flexDirection:'column',gap:12}}>

          {/* SQL Editor */}
          <div style={{background:'#0f1b2d',borderRadius:12,overflow:'hidden'}}>
            <div style={{padding:'10px 16px',borderBottom:'1px solid rgba(255,255,255,0.07)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:12,color:'rgba(255,255,255,0.5)',fontFamily:'monospace'}}>SQL Query</span>
              <button onClick={runQuery} disabled={loading}
                style={{padding:'6px 16px',borderRadius:7,background:'#3b82f6',color:'white',border:'none',cursor:loading?'not-allowed':'pointer',fontSize:12,fontWeight:600,opacity:loading?0.6:1,display:'flex',alignItems:'center',gap:6}}>
                {loading ? <>
                  <span style={{width:10,height:10,border:'1.5px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin 0.7s linear infinite',display:'inline-block'}} />
                  Running...
                </> : '▶ Run Query'}
              </button>
            </div>
            <textarea value={sql} onChange={e => setSql(e.target.value)} rows={8}
              style={{width:'100%',padding:'16px',background:'transparent',border:'none',outline:'none',
                fontFamily:'monospace',fontSize:12,color:'#93c5fd',lineHeight:1.8,resize:'vertical',boxSizing:'border-box'}} />
          </div>

          {/* Error */}
          {error && (
            <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,padding:'12px 14px',color:'#dc2626',fontSize:13,fontFamily:'monospace'}}>
              ❌ {error}
            </div>
          )}

          {/* Results */}
          {results && (
            <div style={{background:'white',border:'1px solid #e5e7eb',borderRadius:12,overflow:'hidden'}}>
              <div style={{padding:'10px 16px',borderBottom:'1px solid #e5e7eb',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:12,fontWeight:600,color:'#374151'}}>
                  {results.length} row{results.length!==1?'s':''} returned
                </span>
                <span style={{fontSize:11,color:'#9ca3af'}}>Executed in {execTime}ms</span>
              </div>
              {results.length === 0 ? (
                <div style={{padding:20,textAlign:'center',color:'#9ca3af',fontSize:13}}>No results</div>
              ) : (
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                    <thead>
                      <tr style={{background:'#f9fafb'}}>
                        {Object.keys(results[0]).map(col => (
                          <th key={col} style={{padding:'8px 14px',textAlign:'left',fontWeight:600,color:'#374151',borderBottom:'1px solid #e5e7eb',whiteSpace:'nowrap'}}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((row, i) => (
                        <tr key={i} style={{borderBottom:'1px solid #f9fafb',background:i%2===0?'white':'#fafafa'}}>
                          {Object.values(row).map((val, j) => (
                            <td key={j} style={{padding:'8px 14px',color:'#374151',fontFamily:typeof val==='number'?'monospace':'inherit',whiteSpace:'nowrap'}}>
                              {val === null ? <span style={{color:'#d1d5db',fontStyle:'italic'}}>NULL</span> : String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
