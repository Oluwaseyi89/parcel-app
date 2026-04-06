export default function UnauthorizedPage({ onSignOut }) {
  return (
    <div className="login-screen">
      <div className="login-card">
        <p className="login-kicker">permission required</p>
        <h2>Access Denied</h2>
        <p>Your account does not have admin panel permissions.</p>
        <button type="button" className="primary-btn" onClick={onSignOut}>
          Return To Login
        </button>
      </div>
    </div>
  )
}
