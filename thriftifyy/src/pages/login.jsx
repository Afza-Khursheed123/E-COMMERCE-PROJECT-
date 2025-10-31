import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar/navbar.jsx";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage("✅ Login successful!");

        // ✅ Redirect based on role
        setTimeout(() => {
          const role = data.user.role.toLowerCase();
          if (role === "admin") navigate("/adminhomepage");
          else if (role === "seller") navigate("/sellerhomepage");
          else navigate("/buyerhomepage");
        }, 1200);
      } else {
        setMessage("❌ Invalid credentials");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("⚠️ Server error. Please try again.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-sm mx-auto mt-8">
        <form onSubmit={handleSubmit}>
          <label className="block mb-2 text-sm font-medium text-gray-900">
            Email
          </label>
          <input
            type="email"
            className="border border-gray-300 p-2 w-full rounded mb-4"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="block mb-2 text-sm font-medium text-gray-900">
            Password
          </label>
          <input
            type="password"
            className="border border-gray-300 p-2 w-full rounded mb-4"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700"
          >
            Login
          </button>
        </form>

        {message && <p className="mt-4 text-center">{message}</p>}
      </div>
    </>
  );
};

export default Login;
