import { useState } from 'react'
import { api } from '../context/AuthContext'
import { useAuth } from '../context/AuthContext'

export default function ChangePassword() {
  const { user } = useAuth()
  const [form, setForm]       = useState({ currentPassword:'', newPassword:'', confirmPassword:'' })
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState(null)

  const set = (k,v) => setForm(f => ({...f,[k]:v}))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setResult(null)

    if (form.newPassword !== form.confirmPassword)
      return setResult({ success:false, error:"New passwords don't match" })
    if (form.newPassword.length < 6)
      return setResult({ success:false, error:"Password must be at least 6 characters" })

    setLoading(true)
    try {
      await api.post('/change-password', {
        currentPassword: form.currentPassword,
        newPassword:     form.newPassword,
      })
      setResult({ success:true })
      setForm({ currentPassword:'', newPassword:'', confirmPassword:'' })
    } catch(err) {
      setResult({ success:false, error: err.response?.data?.error || 'Failed to change password' })
    } finally { setLoading(false) }
  }

  const inp = { width:'100%', padding:'10px 12px', fontSize:13, border:'1px solid #e5e7eb', borderRadius:8, outline:'none', boxSizing:'border-box', fontFamily:'inherit' }
  const lbl = { display:'block', fontSize:12, fontWeight:500, color:'#374151', marginBottom:5 }

  return (
    <div style={{maxWidth:480}}>
      <div style={{marginBottom:20}}>
        <h1 style={{fontSize:18,fontWeight:600,color:'#111827',margin:0}}>Change Password</h1>
        <p style={{fontSize:13,color:'#9ca3af',margin:'4px 0 0'}}>Update your account password.</p>
      </div>

      <div style={{background:'white',border:'1px solid #e5e7eb',borderRadius:12,padding:24}}>
        {/* User info */}
        <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',background:'#f9fafb',borderRadius:8,marginBottom:20}}>
          <div style={{width:40,height:40,borderRadius:10,background:'linear-gradient(135deg,#3b82f6,#6366f1)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:16,fontWeight:700,flexShrink:0}}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{fontSize:13,fontWeight:500,color:'#111827'}}>{user?.name}</div>
            <div style={{fontSize:11,color:'#9ca3af'}}>{user?.email}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:14}}>
          <div>
            <label style={lbl}>Current Password</label>
            <input type="password" value={form.currentPassword}
              onChange={e => set('currentPassword', e.target.value)}
              required placeholder="Enter current password" style={inp} />
          </div>
          <div>
            <label style={lbl}>New Password</label>
            <input type="password" value={form.newPassword}
              onChange={e => set('newPassword', e.target.value)}
              required minLength={6} placeholder="Min 6 characters" style={inp} />
          </div>
          <div>
            <label style={lbl}>Confirm New Password</label>
            <input type="password" value={form.confirmPassword}
              onChange={e => set('confirmPassword', e.target.value)}
              required placeholder="Repeat new password" style={inp} />
            {form.confirmPassword && form.newPassword !== form.confirmPassword && (
              <div style={{fontSize:11,color:'#ef4444',marginTop:4}}>Passwords don't match</div>
            )}
          </div>

          {/* Password strength indicator */}
          {form.newPassword && (
            <div>
              <div style={{fontSize:11,color:'#6b7280',marginBottom:4}}>Password strength</div>
              <div style={{height:4,background:'#f3f4f6',borderRadius:4,overflow:'hidden'}}>
                <div style={{
                  height:'100%',borderRadius:4,transition:'all 0.3s',
                  width: form.newPassword.length < 6 ? '20%' : form.newPassword.length < 8 ? '50%' : form.newPassword.length < 10 ? '75%' : '100%',
                  background: form.newPassword.length < 6 ? '#ef4444' : form.newPassword.length < 8 ? '#f97316' : form.newPassword.length < 10 ? '#eab308' : '#16a34a',
                }} />
              </div>
              <div style={{fontSize:10,color:'#9ca3af',marginTop:2}}>
                {form.newPassword.length < 6 ? 'Too short' : form.newPassword.length < 8 ? 'Weak' : form.newPassword.length < 10 ? 'Good' : 'Strong'}
              </div>
            </div>
          )}

          {result && (
            <div style={{
              padding:'12px 14px', borderRadius:8, fontSize:13,
              background: result.success ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${result.success ? '#bbf7d0' : '#fecaca'}`,
              color: result.success ? '#15803d' : '#dc2626'
            }}>
              {result.success ? '✅ Password changed successfully!' : `❌ ${result.error}`}
            </div>
          )}

          <button type="submit" disabled={loading || form.newPassword !== form.confirmPassword}
            style={{padding:'10px',borderRadius:9,background:loading?'#93c5fd':'#2563eb',color:'white',border:'none',cursor:'pointer',fontSize:13,fontWeight:600,display:'flex',alignItems:'center',justifyContent:'center',gap:8,opacity:(form.newPassword&&form.newPassword!==form.confirmPassword)?0.5:1}}>
            {loading
              ? <><span style={{width:14,height:14,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',borderRadius:'50%',animation:'spin 0.7s linear infinite',display:'inline-block'}} /> Changing...</>
              : '🔒 Change Password'
            }
          </button>
        </form>
      </div>

      {/* Security tips */}
      <div style={{background:'#0f1b2d',border:'none',borderRadius:12,padding:20,marginTop:16}}>
        <div style={{fontSize:12,fontWeight:600,color:'#60a5fa',marginBottom:10}}>🛡️ Password Security Tips</div>
        {[
          'Use at least 8 characters with numbers and symbols',
          'Never reuse passwords across different sites',
          'Your password is hashed with bcrypt — never stored in plain text',
          'After changing, all active sessions remain valid',
        ].map((tip,i) => (
          <div key={i} style={{fontSize:11,color:'rgba(255,255,255,0.5)',marginBottom:5,paddingLeft:12,borderLeft:'2px solid #3b82f6'}}>
            {tip}
          </div>
        ))}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
