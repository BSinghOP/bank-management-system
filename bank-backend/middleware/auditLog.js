const db = require('../db')

const auditLog = (req, res, next) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress

  res.on('finish', () => {
    try {
      const event = deriveEvent(req, res.statusCode)
      if (!event) return

      const body = { ...req.body }
      delete body.password; delete body.otp; delete body.token

      const details = buildDetails(req, res.statusCode, body)

      db.query(
        `INSERT INTO audit_logs (user_id,user_name,user_email,event,ip_address,details,status_code,created_at)
         VALUES (?,?,?,?,?,?,?,NOW())`,
        [
          req.user?.id    || null,
          req.user?.name  || null,
          req.user?.email || body.email || null,
          event, ip, details, res.statusCode
        ],
        () => {}
      )
    } catch {}
  })
  next()
}

function deriveEvent(req, status) {
  const p   = req.path
  const ok  = status < 400
  const m   = req.method

  // Auth
  if (p === '/login'      || p === '/api/auth/login')    return ok ? 'login_success'    : 'login_failed'
  if (p === '/send-otp'   || p.includes('/send-otp'))    return ok ? 'otp_sent'         : 'otp_send_failed'
  if (p === '/verify-otp' || p.includes('/verify-otp'))  return ok ? 'login_otp_verified' : 'otp_failed'

  // Account actions
  if (p === '/transfer' || p.includes('/transfer'))
    return ok ? 'transfer_success' : 'transfer_failed'

  if (p.includes('/accounts') && p.includes('/status'))
    return ok ? 'account_status_changed' : 'account_status_failed'

  // Transactions
  if (p.includes('/transactions') && p.includes('/flag'))
    return ok ? 'transaction_flagged' : 'transaction_flag_failed'

  // Loans
  if (p.includes('/loans') && m === 'POST' && !p.includes('/approve') && !p.includes('/reject'))
    return ok ? 'loan_applied' : 'loan_apply_failed'
  if (p.includes('/loans') && p.includes('/approve')) return ok ? 'loan_approved' : 'loan_approve_failed'
  if (p.includes('/loans') && p.includes('/reject'))  return ok ? 'loan_rejected' : 'loan_reject_failed'

  // Fixed deposits
  if (p.includes('/fixed-deposits') && m === 'POST')   return ok ? 'fd_created'  : 'fd_create_failed'
  if (p.includes('/fixed-deposits') && p.includes('/close')) return ok ? 'fd_closed' : 'fd_close_failed'

  // Admin actions
  if (p.includes('/admin/users/create'))                return ok ? 'user_created'  : 'user_create_failed'
  if (p.includes('/admin/users') && p.includes('/role')) return ok ? 'role_changed' : 'role_change_failed'
  if (p.includes('/admin/users') && p.includes('/kyc'))  return ok ? 'kyc_updated'  : 'kyc_update_failed'
  if (p.includes('/admin/users') && p.includes('/status')) return ok ? 'user_deactivated' : 'user_deactivate_failed'

  // Password change
  if (p.includes('/change-password')) return ok ? 'password_changed' : 'password_change_failed'

  // SQL Explorer
  if (p.includes('/admin/sql')) return ok ? 'sql_query_run' : 'sql_query_failed'

  return null
}

function buildDetails(req, status, body) {
  const p = req.path
  try {
    // Build human-readable details for audit log
    if (p === '/login' || p.includes('/login')) {
      return JSON.stringify({ email: body.email, success: status < 400 })
    }
    if (p === '/transfer' || p.includes('/transfer')) {
      return JSON.stringify({ to: body.receiverEmail, amount: body.amount, success: status < 400 })
    }
    if (p.includes('/accounts') && p.includes('/status')) {
      return JSON.stringify({ account_id: req.params?.id, new_status: body.status })
    }
    if (p.includes('/loans') && p.includes('/approve')) {
      return JSON.stringify({ loan_id: req.params?.id, action: 'approved' })
    }
    if (p.includes('/loans') && p.includes('/reject')) {
      return JSON.stringify({ loan_id: req.params?.id, action: 'rejected' })
    }
    if (p.includes('/loans') && req.method === 'POST') {
      return JSON.stringify({ amount: body.amount, tenure: body.tenure_months, type: body.type })
    }
    if (p.includes('/admin/users/create')) {
      return JSON.stringify({ name: body.name, email: body.email, role: body.role })
    }
    if (p.includes('/admin/users') && p.includes('/role')) {
      return JSON.stringify({ user_id: req.params?.id, new_role: body.role })
    }
    if (p.includes('/admin/sql')) {
      const sql = (body.sql || '').slice(0, 100)
      return JSON.stringify({ query_preview: sql })
    }
    return JSON.stringify({ path: p, method: req.method })
  } catch {
    return null
  }
}

module.exports = { auditLog }
