import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar/navbar.jsx";

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user", // default role
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await fetch("http://localhost:3000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setMessage("    Signup successful!");
        setTimeout(() => {
          if (data.role === "admin") navigate("/adminhomepage");
          else if (data.role === "seller") navigate("/sellerhomepage");
          else if (data.role === "buyer") navigate("/sellerhomepage");
          else navigate("/login"); // default redirect
        }, 1500);
      } else {
        setMessage("    " + (data.message || "Signup failed"));
      }
    } catch (err) {
      console.error(err);
      setMessage("⚠️ Server error. Please try again.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-sm mx-auto mt-8">
        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <label className="block mb-2 text-sm font-medium text-gray-900">Full Name</label>
          <input
            id="name"
            type="text"
            className="border border-gray-300 p-2 w-full rounded mb-4"
            value={formData.name}
            onChange={handleChange}
            required
          />

          {/* Email */}
          <label className="block mb-2 text-sm font-medium text-gray-900">Email</label>
          <input
            id="email"
            type="email"
            className="border border-gray-300 p-2 w-full rounded mb-4"
            value={formData.email}
            onChange={handleChange}
            required
          />

          {/* Password */}
          <label className="block mb-2 text-sm font-medium text-gray-900">Password (min 8 chars)</label>
          <input
            id="password"
            type="password"
            className="border border-gray-300 p-2 w-full rounded mb-4"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={8}
          />

          {/* Role */}
          <label className="block mb-2 text-sm font-medium text-gray-900">Select Role</label>
          <select
            id="role"
            className="border border-gray-300 p-2 w-full rounded mb-4"
            value={formData.role}
            onChange={handleChange}
          >
            <option value="user">User</option>
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
            <option value="admin">Admin</option>
          </select>

          <button
            type="submit"
            className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700"
          >
            Sign Up
          </button>
        </form>

        {message && <p className="mt-4 text-center">{message}</p>}
      </div>
    </>
  );
};

export default Signup;
