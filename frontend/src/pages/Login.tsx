
import { useState, type FormEvent } from "react";
import {
  API_BASE_URL,
  getApiErrorMessage,
  getApiRequestErrorMessage,
} from "../api";

type LoginProps = {
  onLogin: (token: string) => void;
  onShowRegister: () => void;
  notice?: string;
};

function Login({ onLogin, onShowRegister, notice }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.set("username", username.trim());
      formData.set("password", password);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, "Login failed."));
      }

      const data: unknown = await response.json();
      if (typeof data !== "object" || data === null || !("access_token" in data)) {
        throw new Error("The server did not return an access token.");
      }

      const accessToken = data.access_token;
      if (typeof accessToken !== "string" || !accessToken) {
        throw new Error("The server did not return an access token.");
      }

      onLogin(accessToken);
    } catch (err) {
      setError(getApiRequestErrorMessage(err, "Login failed."));
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
        <h2>Welcome back</h2>
        <p>Log in to manage your development projects.</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            autoComplete="username"
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
          />

          {notice && (
            <p className="auth-error" role="alert">
              {notice}
            </p>
          )}

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button className="primary-button" disabled={loading} type="submit">
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account?{" "}
          <button
            type="button"
            className="text-button"
            onClick={onShowRegister}
          >
            Register
          </button>
        </p>
      </section>
    </main>
  );
}

export default Login;
