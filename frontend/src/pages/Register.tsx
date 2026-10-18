
import { useState, type FormEvent } from "react";

type RegisterProps = {
  onRegistered: () => void;
  onShowLogin: () => void;
};

function Register({ onRegistered, onShowLogin }: RegisterProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Registration failed.");
      }

      onRegistered();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1 className="brand">
          DevFlow<span>.</span>
        </h1>

        <h2>Create your account</h2>
        <p>Start organizing your software projects.</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="register-username">Username</label>
          <input
            id="register-username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            autoComplete="username"
            placeholder="Choose a username"
          />

          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
          />

          <label htmlFor="register-password">Password</label>
          <div className="password-field">
            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((previous) => !previous)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button className="primary-button" disabled={loading} type="submit">
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-switch">
          Already registered?{" "}
          <button
            type="button"
            className="text-button"
            onClick={onShowLogin}
          >
            Log In
          </button>
        </p>
      </section>
    </main>
  );
}

export default Register;
