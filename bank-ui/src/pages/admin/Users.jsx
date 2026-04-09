import { useState, useEffect } from 'react'
import { api } from '../../context/AuthContext'

export default function AdminUsers() {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('all')
  const [search, setSearch]   = useState('')

  useEffect(() => { fetchUsers() }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const r = await api.get('/api/admin/users')
      setUsers(r.data.users || [])
    } catch {}
    finally { setLoading(false) }
  }

  const changeRole = async (id, newRole) => {
    // Optimistic update first
    setUsers(prev => prev.map(u => u.id === id ? {...u, role: newRole} : u))
    try {
      await api.patch(`/api/admin/users/${id}/role`, { role: newRole })
    } catch(err) {
      alert(err.response?.data?.error || 'Failed to change role')
      fetchUsers() // revert on error
    }
  }

  const toggleStatus = async (id, currentActive) => {
    // Optimistic update
    setUsers(prev => prev.map(u => u.id === id ? {...u, active: !currentActive} : u))
    try {
      await api.patch(`/api/admin/users/${id}/status`, { active: !currentActive })
    } catch(err) {
      alert(err.response?.data?.error || 'Failed to update status')
      fetchUsers()
    }
  }

  const patchKyc = async (id, kyc_status) => {
    try {
      await api.patch(`/api/admin/users/${id}/kyc`, { kyc_status })
      fetchUsers()
    } catch(err) {
      alert(err.response?.data?.error || 'Failed to update KYC')
    }
  }

  const filtered   = users.filter(u => !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
  const kycPending = users.filter(u => u.kyc_status === 'pending')
  const displayed  = tab === 'kyc' ? kycPending : filtered

  return (
    <div style={{maxWidth:1100}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <h1 style={{fontSize:18,fontWeight:600,color:'#111827',margin:0}}>User Management</h1>
          <p style={{fontSize:13,color:'#9ca3af',margin:'4px 0 0'}}>{users.length} users · {kycPending.length} pending KYC</p>
        </div>
        <div style={{display:'flex',gap:4,background:'#f3f4f6',borderRadius:8,padding:3}}>
          {[['all','All Users'],['kyc',`KYC (${kycPending.length})`]].map(([k,label]) => (
            <button key={k} onClick={() => setTab(k)}
              style={{fontSize:12,padding:'5px 12px',borderRadius:6,border:'none',cursor:'pointer',
                background:tab===k?'white':'transparent',color:tab===k?'#111827':'#6b7280',fontWeight:tab===k?500:400}}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'all' && (
        <div style={{background:'white',border:'1px solid #f3f4f6',borderRadius:12,padding:'12px 16px',marginBottom:12}}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..."
            style={{padding:'8px 12px',fontSize:13,border:'1px solid #e5e7eb',borderRadius:8,outline:'none',width:260}} />
        </div>
      )}

      {tab === 'all' ? (
        <div style={{background:'white',border:'1px solid #f3f4f6',borderRadius:12,overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{borderBottom:'1px solid #f3f4f6'}}>
                {['User','Role','KYC','Accounts','Last Login','Status','Actions'].map(h => (
                  <th key={h} style={{padding:'10px 16px',textAlign:'left',fontWeight:500,color:'#9ca3af'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{padding:20,textAlign:'center',color:'#9ca3af'}}>Loading...</td></tr>
              ) : displayed.map(u => (
                <tr key={u.id} style={{borderBottom:'1px solid #f9fafb'}}>
                  <td style={{padding:'10px 16px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:28,height:28,borderRadius:'50%',background:'#eff6ff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#3b82f6',flexShrink:0}}>
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{fontWeight:500,color:'#111827'}}>{u.name}</div>
                        <div style={{fontSize:10,color:'#9ca3af'}}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{padding:'10px 16px'}}>
                    <select
                      key={u.id + '-' + u.role}
                      defaultValue={u.role}
                      onChange={e => changeRole(u.id, e.target.value)}
                      style={{fontSize:11,border:'1px solid #e5e7eb',borderRadius:6,padding:'3px 8px',outline:'none',background:'white',cursor:'pointer'}}>
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td style={{padding:'10px 16px'}}>
                    <span style={{fontSize:10,padding:'2px 8px',borderRadius:10,background:'#f0fdf4',color:'#16a34a'}}>
                      {u.kyc_status || 'verified'}
                    </span>
                  </td>
                  <td style={{padding:'10px 16px',color:'#6b7280'}}>{u.account_count || 1}</td>
                  <td style={{padding:'10px 16px',color:'#9ca3af'}}>{u.last_login ? new Date(u.last_login).toLocaleDateString('en-IN') : 'Never'}</td>
                  <td style={{padding:'10px 16px'}}>
                    <span style={{fontSize:10,padding:'2px 8px',borderRadius:10,
                      background: u.active !== false ? '#f0fdf4' : '#fef2f2',
                      color:      u.active !== false ? '#16a34a' : '#ef4444'}}>
                      {u.active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{padding:'10px 16px'}}>
                    <button onClick={() => toggleStatus(u.id, u.active !== false)}
                      style={{fontSize:11,padding:'3px 10px',borderRadius:6,border:'1px solid #e5e7eb',background:'white',cursor:'pointer',
                        color: u.active !== false ? '#ef4444' : '#16a34a'}}>
                      {u.active !== false ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {!kycPending.length ? (
            <div style={{background:'white',border:'1px solid #f3f4f6',borderRadius:12,padding:40,textAlign:'center',color:'#9ca3af'}}>
              All KYC reviewed ✓
            </div>
          ) : kycPending.map(u => (
            <div key={u.id} style={{background:'white',border:'1px solid #fde68a',borderRadius:12,padding:16,display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:40,height:40,borderRadius:10,background:'#fffbeb',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:'#d97706'}}>
                {u.name?.[0]?.toUpperCase()}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:500,color:'#111827'}}>{u.name}</div>
                <div style={{fontSize:12,color:'#9ca3af'}}>{u.email}</div>
              </div>
              <div style={{display:'flex',gap:6}}>
                <button onClick={() => patchKyc(u.id,'verified')}
                  style={{fontSize:12,padding:'5px 12px',borderRadius:8,background:'#f0fdf4',color:'#16a34a',border:'1px solid #bbf7d0',cursor:'pointer'}}>Approve</button>
                <button onClick={() => patchKyc(u.id,'rejected')}
                  style={{fontSize:12,padding:'5px 12px',borderRadius:8,background:'#fef2f2',color:'#ef4444',border:'1px solid #fecaca',cursor:'pointer'}}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
