import { useState } from "react";

function Auth() {
  const API_BASE = "http://localhost:5000"; // backend base URL
  const [output, setOutput] = useState("");

  // --- Register ---
  const handleRegister = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setOutput(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(err);
    }
  };

  // --- Login ---
  const handleLogin = async (e) => {
    e.preventDefault();
    const body = {
      username: e.target.username.value,
      email: e.target.email.value,
      password: e.target.password.value,
    };

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include", // important for cookies
      });
      const data = await res.json();
      setOutput(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <input name="username" placeholder="Username" required />
        <input name="email" placeholder="Email" required />
        <input name="fullName" placeholder="Full Name" required />
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
        />
        <input name="avatar" type="file" />
        <button type="submit">Register</button>
      </form>

      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input name="username" placeholder="Username (optional)" />
        <input name="email" placeholder="Email (optional)" />
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
        />
        <button type="submit">Login</button>
      </form>

      <h3>Response:</h3>
      <pre>{output}</pre>
    </div>
  );
}

export default Auth;
