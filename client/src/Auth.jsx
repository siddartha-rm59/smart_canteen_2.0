import { useState } from "react";
const API_BASE_URL = import.meta.env.VITE_API_URL;
function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");

 const [name, setName] = useState("");
const [phone, setPhone] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const endpoint =
        mode === "login"
          ? `${API_BASE_URL}/api/auth/login`
          : `${API_BASE_URL}/api/auth/signup`;

      const body =
        mode === "login"
          ? {
              email,
              password,
            }
          : {
              name,
              phone,
              email,
              password,
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Something went wrong"
        );
      }

      if (mode === "signup") {
        setMessage(
          "Account created successfully. Please login."
        );

        setMode("login");
        setName("");
        setPhone("");
        setPassword("");
      } else {
        localStorage.setItem(
          "foodCourtUser",
          JSON.stringify(data.user)
        );

        onLogin(data.user);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">

      <div className="auth-card">

        <div className="auth-brand">
          <div className="auth-logo">
            KU
          </div>

          <h1>Kishkinda University</h1>
          <h2>Food Court</h2>

          <p>
            Freshly prepared favourites,
            made for your day.
          </p>
        </div>

        <div className="auth-heading">

          <h3>
            {mode === "login"
              ? "Welcome"
              : "Create your account"}
          </h3>

          <p>
            {mode === "login"
              ? "Login to order from the Food Court."
              : "Sign up to start ordering your favourite food."}
          </p>

        </div>

        <form onSubmit={handleSubmit}>

          {mode === "signup" && (
            <div className="auth-field">

              <label>
                Name
              </label>

              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                required
              />

            </div>
          )}


          {mode === "signup" && (
  <div className="auth-field">

    <label>
      Phone Number
    </label>

    <input
      type="tel"
      placeholder="Enter your phone number"
      value={phone}
      onChange={(event) =>
        setPhone(event.target.value)
      }
      required
      maxLength={10}
      pattern="[0-9]{10}"
    />

  </div>
)}

          <div className="auth-field">

            <label>
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              required
            />

          </div>

          <div className="auth-field">

            <label>
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
              minLength={6}
            />

          </div>

          {error && (
            <div className="auth-message error">
              {error}
            </div>
          )}

          {message && (
            <div className="auth-message success">
              {message}
            </div>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Login"
              : "Create Account"}
          </button>

        </form>

        <div className="auth-switch">

          {mode === "login" ? (
            <>
              <span>
                Don't have an account?
              </span>

              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError("");
                  setMessage("");
                }}
              >
                Sign Up
              </button>
            </>
          ) : (
            <>
              <span>
                Already have an account?
              </span>

              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                  setMessage("");
                }}
              >
                Login
              </button>
            </>
          )}

        </div>

      </div>

    </div>
  );
}

export default Auth;