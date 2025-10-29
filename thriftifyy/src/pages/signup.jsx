import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar/navbar.jsx";

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
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
        setMessage("✅ Signup successful!");
        setTimeout(() => navigate("/"), 1500); // redirect after 1.5 sec
      } else {
        setMessage("❌ " + (data.message || "Signup failed"));
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
          <label className="block mb-2 text-sm font-medium text-gray-900">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            className="border border-gray-300 p-2 w-full rounded mb-4"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <label className="block mb-2 text-sm font-medium text-gray-900">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="border border-gray-300 p-2 w-full rounded mb-4"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label className="block mb-2 text-sm font-medium text-gray-900">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="border border-gray-300 p-2 w-full rounded mb-4"
            value={formData.password}
            onChange={handleChange}
            required
          />

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
