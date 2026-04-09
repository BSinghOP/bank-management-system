export default function Frozen({ message, onBack }) {
  return (
    <div style={{minHeight:'100vh',background:'#0f1b2d',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{textAlign:'center',padding:40,maxWidth:440}}>
        <div style={{fontSize:64,marginBottom:16}}>🔒</div>
        <h1 style={{color:'white',fontSize:22,fontWeight:700,margin:'0 0 12px'}}>Account Restricted</h1>
        <p style={{color:'rgba(255,255,255,0.6)',fontSize:15,lineHeight:1.6,margin:'0 0 28px'}}>
          {message || 'Your account has been frozen. Please contact the bank for assistance.'}
        </p>
        <div style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:12,padding:'16px 20px',marginBottom:28,textAlign:'left'}}>
          <div style={{fontSize:12,color:'rgba(255,255,255,0.4)',marginBottom:8}}>Contact Bank</div>
          <div style={{fontSize:13,color:'rgba(255,255,255,0.8)'}}>📧 admin@dbms.bsingh.codes</div>
          <div style={{fontSize:13,color:'rgba(255,255,255,0.8)',marginTop:4}}>🌐 dbms.bsingh.codes</div>
        </div>
        <button onClick={onBack}
          style={{padding:'10px 28px',borderRadius:9,background:'#3b82f6',color:'white',border:'none',cursor:'pointer',fontSize:14,fontWeight:600}}>
          Back to Login
        </button>
      </div>
    </div>
  )
}
