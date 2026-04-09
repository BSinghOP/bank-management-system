import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { sendOtp, verifyOtp } = useAuth();
  const [step, setStep]       = useState("creds");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp]         = useState(["","","","","",""]);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCount] = useState(0);
  const refs = useRef([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError(""); setLoading(true);
    try {
      await sendOtp(email, password);
      setStep("otp");
      setCount(600);
      setTimeout(() => refs.current[0]?.focus(), 80);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Invalid credentials");
    } finally { setLoading(false); }
  };

  const handleOtp = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp]; next[i] = val.slice(-1); setOtp(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
    if (next.every(d => d)) submitOtp(next.join(""));
  };

  const submitOtp = async (code) => {
    setError(""); setLoading(true);
    try {
      await verifyOtp(code);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Invalid or expired OTP");
      setOtp(["","","","","",""]); 
      setTimeout(() => refs.current[0]?.focus(), 50);
    } finally { setLoading(false); }
  };

  const fmt = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

  return (
    <div className="min-h-screen bg-gray-50 flex" style={{fontFamily:"'DM Sans',sans-serif"}}>

      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between p-10 flex-shrink-0"
        style={{width:320, background:"#0f4c81"}}>
        <div className="flex items-center gap-2.5">
          <div style={{width:32,height:32,background:"rgba(255,255,255,0.2)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="6" width="12" height="8" rx="1.5" fill="white" fillOpacity="0.9"/>
              <path d="M5 6V4.5C5 3.12 6.34 2 8 2s3 1.12 3 2.5V6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="8" cy="10" r="1.2" fill="#0f4c81"/>
            </svg>
          </div>
          <div>
            <div style={{color:"white",fontWeight:600,fontSize:14}}>BSingh's Vault</div>
            <div style={{color:"rgba(255,255,255,0.5)",fontSize:9,fontFamily:"monospace",letterSpacing:"0.1em"}}>BANK MANAGEMENT</div>
          </div>
        </div>

        <div>
          {[
            ["OTP via Email",        "10-min expiry, hashed storage"],
            ["JWT Authentication",   "Signed tokens, 1-day session"],
            ["Rate Limited",         "10 login attempts / 15 min"],
            ["Bcrypt Passwords",     "Cost factor 12"],
            ["Transfer Security",    "DB transactions, rollback safe"],
          ].map(([label, sub]) => (
            <div key={label} style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:14}}>
              <div style={{width:16,height:16,borderRadius:"50%",background:"rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1.5 4l1.5 1.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <div style={{color:"white",fontSize:12,fontWeight:500}}>{label}</div>
                <div style={{color:"rgba(255,255,255,0.45)",fontSize:11}}>{sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{color:"rgba(255,255,255,0.25)",fontSize:10,fontFamily:"monospace"}}>
          dbms.bsingh.codes · TLS 1.3
        </div>
      </div>

      {/* Right panel */}
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:32}}>
        <div style={{width:"100%",maxWidth:360}}>

          {step === "creds" ? (
            <>
              <div style={{marginBottom:32}}>
                <h1 style={{fontSize:24,fontWeight:600,color:"#111827",margin:"0 0 6px"}}>Sign in</h1>
                <p style={{fontSize:14,color:"#6b7280",margin:0}}>Access your bank management portal.</p>
              </div>

              <form onSubmit={handleLogin} style={{display:"flex",flexDirection:"column",gap:16}}>
                <Label text="Email address">
                  <input type="email" value={email} onChange={e=>setEmail(e.target.value)}
                    required autoFocus style={inp} placeholder="you@example.com" />
                </Label>
                <Label text="Password">
                  <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
                    required style={inp} placeholder="••••••••" />
                </Label>
                {error && <ErrBox msg={error} />}
                <button type="submit" disabled={loading} style={btnStyle(loading)}>
                  {loading ? <Spin /> : "Continue →"}
                </button>
              </form>
            </>
          ) : (
            <>
              <button onClick={()=>{setStep("creds");setError("");}}
                style={{background:"none",border:"none",color:"#9ca3af",fontSize:12,cursor:"pointer",marginBottom:32,padding:0}}>
                ← Back
              </button>

              <div style={{marginBottom:32}}>
                <div style={{width:44,height:44,background:"#eff6ff",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="11" width="18" height="11" rx="2" stroke="#0f4c81" strokeWidth="1.5"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#0f4c81" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="12" cy="16" r="1.5" fill="#0f4c81"/>
                  </svg>
                </div>
                <h1 style={{fontSize:22,fontWeight:600,color:"#111827",margin:"0 0 6px"}}>Check your email</h1>
                <p style={{fontSize:14,color:"#6b7280",margin:0}}>
                  We sent a 6-digit code to <strong style={{color:"#374151"}}>{email}</strong>
                </p>
              </div>

              <div style={{display:"flex",gap:8,marginBottom:20}}>
                {otp.map((d,i) => (
                  <input key={i} ref={el=>refs.current[i]=el}
                    type="text" inputMode="numeric" maxLength={1} value={d}
                    onChange={e=>handleOtp(i,e.target.value)}
                    onKeyDown={e=>e.key==="Backspace"&&!otp[i]&&i>0&&refs.current[i-1]?.focus()}
                    style={{flex:1,aspectRatio:"1",textAlign:"center",fontSize:20,fontWeight:700,fontFamily:"monospace",border:"1px solid #e5e7eb",borderRadius:10,outline:"none",background:"white",color:"#111827"}}
                  />
                ))}
              </div>

              {error && <ErrBox msg={error} />}

              <div style={{textAlign:"center",fontSize:12,color:"#9ca3af",marginTop:16}}>
                {countdown > 0
                  ? <>Expires in <span style={{fontFamily:"monospace",color:"#374151"}}>{fmt(countdown)}</span></>
                  : <button onClick={handleLogin} style={{background:"none",border:"none",color:"#0f4c81",cursor:"pointer",fontSize:12}}>Resend code</button>
                }
              </div>

              {loading && (
                <div style={{display:"flex",justifyContent:"center",marginTop:16}}>
                  <Spin color="#0f4c81" />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const inp = {width:"100%",padding:"10px 12px",fontSize:14,border:"1px solid #e5e7eb",borderRadius:8,background:"white",outline:"none",boxSizing:"border-box",color:"#111827"};
const btnStyle = (dis) => ({width:"100%",background:dis?"#93c5fd":"#0f4c81",color:"white",fontSize:14,fontWeight:500,padding:"10px",borderRadius:8,border:"none",cursor:dis?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8});
const Label = ({text,children}) => <div><label style={{display:"block",fontSize:12,fontWeight:500,color:"#374151",marginBottom:6}}>{text}</label>{children}</div>;
const ErrBox = ({msg}) => <div style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:"#dc2626",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:"8px 12px"}}><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>{msg}</div>;
const Spin = ({color="#fff"}) => <span style={{width:16,height:16,border:`2px solid ${color}40`,borderTop:`2px solid ${color}`,borderRadius:"50%",display:"inline-block",animation:"spin 0.7s linear infinite"}} />;
