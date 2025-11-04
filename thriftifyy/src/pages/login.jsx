import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar/navbar.jsx";
import api from "../api"; // Import your API instance

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await api.post("/login", { email, password });
      
      if (res.data.success) {
        setMessage("    Login successful!");
        
        //     Store user data in localStorage
        const userData = res.data.user;
        localStorage.setItem("user", JSON.stringify(userData));
        
        console.log("💾 User data stored:", {
          id: userData._id || userData.id,
          name: userData.name,
          role: userData.role,
          email: userData.email
        });
        
        //     Redirect after short delay
        setTimeout(() => {
          const role = userData.role?.toLowerCase();
          
          // Store token if available
          if (res.data.token) {
            localStorage.setItem("token", res.data.token);
          }
          
          // Redirect based on role
          switch(role) {
            case "admin":
              navigate("/adminhomepage");
              break;
            case "seller":
              navigate("/sellerhomepage");
              break;
            case "buyer":
              navigate("/sellerhomepage");
              break;
            default:
              navigate("/dashboard"); // Fallback to dashboard
          }
        }, 1000);
        
      } else {
        setMessage(res.data.message || "    Login failed");
      }
    } catch (err) {
      console.error("    Login error:", err);
      setMessage(err.response?.data?.message || "⚠️ Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-sm mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-900">
              Email
            </label>
            <input
              type="email"
              className="border border-gray-300 p-2 w-full rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-900">
              Password
            </label>
            <input
              type="password"
              className="border border-gray-300 p-2 w-full rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded font-medium ${
              loading 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-blue-600 hover:bg-blue-700"
            } text-white transition`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        {message && (
          <p className={`mt-4 text-center ${
            message.includes("   ") ? "text-green-600" : "text-red-600"
          }`}>
            {message}
          </p>
        )}

        {/* Debug info - remove in production */}
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
          <p>Debug: Check localStorage in DevTools</p>
          <button 
            onClick={() => console.log("Current user:", localStorage.getItem('user'))}
            className="text-blue-600 underline mt-1"
          >
            Log localStorage user
          </button>
        </div>
      </div>
    </>
  );
};

export default Login;