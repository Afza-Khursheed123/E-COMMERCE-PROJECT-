import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Form from 'react-bootstrap/Form';
import { Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import colors from '../theme';
import api from "../api"; // Import your API instance

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const gradientStyle = {
    background: 'radial-gradient(circle, rgba(215,201,170,1) 50%, rgba(123,45,38,1) 85%, rgba(25,83,95,1) 100%)',
    width: '100%',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px 0',
  };

  const cardStyle = {
    backgroundColor: colors.text,
    padding: '40px',
    borderRadius: '16px',
    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
    width: '450px',
    marginTop: '20px',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // Check for admin credentials first
    if (email === "admin34@gmail.com" && password === "admin12345") {
      setMessage("Admin login successful!");
      
      // Create admin user object
      const adminUser = {
        _id: "admin_id",
        name: "Admin",
        role: "admin",
        email: "admin34@gmail.com"
      };
      
      // Store admin data in localStorage
      localStorage.setItem("user", JSON.stringify(adminUser));
      localStorage.setItem("isAdmin", "true");
      
      console.log("🔐 Admin login detected:", adminUser);
      
      // Redirect to admin page after short delay
      setTimeout(() => {
        navigate("/admin");
      }, 1000);
      
      setLoading(false);
      return;
    }

    // Regular user login
    try {
      const res = await api.post("/login", { email, password });
      
      if (res.data.success) {
        setMessage("Login successful!");
        
        // Store user data in localStorage
        const userData = res.data.user;
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("isAdmin", "false");
        
        console.log("💾 User data stored:", {
          id: userData._id || userData.id,
          name: userData.name,
          role: userData.role,
          email: userData.email
        });
        
        // Redirect after short delay
        setTimeout(() => {
          // Store token if available
          if (res.data.token) {
            localStorage.setItem("token", res.data.token);
          }
          
          // Redirect all regular users to home page
          navigate("/home");
        }, 1000);
        
      } else {
        setMessage(res.data.message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setMessage(err.response?.data?.message || "⚠️ Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={gradientStyle}>
        <Card style={cardStyle}>
          <Card.Body>
            <h3 style={{
              textAlign: 'center',
              color: colors.bg,
              fontWeight: '700',
              marginBottom: '25px',
            }}>
              Login to Thriftify
            </h3>

            <Form onSubmit={handleSubmit}>
              {/* Email */}
              <Form.Group className="mb-3" controlId="formGroupEmail">
                <Form.Label style={{ color: colors.bg, fontWeight: '600' }}>
                  Email
                </Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  style={{
                    border: `1px solid ${colors.bg}`,
                    borderRadius: '8px',
                    color: colors.bg,
                  }}
                />
              </Form.Group>

              {/* Password */}
              <Form.Group className="mb-4" controlId="formGroupPassword">
                <Form.Label style={{ color: colors.bg, fontWeight: '600' }}>
                  Password
                </Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  style={{
                    border: `1px solid ${colors.bg}`,
                    borderRadius: '8px',
                    color: colors.bg,
                  }}
                />
              </Form.Group>

              {/* Message Display */}
              {message && (
                <div style={{
                  textAlign: 'center',
                  marginBottom: '15px',
                  color: message.includes("successful") ? 'green' : 'red',
                  fontWeight: '500',
                }}>
                  {message}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: loading ? colors.bg : colors.accent,
                  border: 'none',
                  fontWeight: '600',
                  padding: '10px 25px',
                  borderRadius: '30px',
                  boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
                  transition: 'all 0.3s ease',
                  color: colors.text,
                  width: '100%',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = colors.bg)}
                onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = colors.accent)}
              >
                {loading ? "Logging in..." : "Login"}
              </Button>

              <p style={{
                marginTop: '15px',
                textAlign: 'center',
                color: colors.bg,
                fontWeight: '500',
              }}>
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  style={{
                    color: colors.accent,
                    textDecoration: 'none',
                    fontWeight: '600',
                    transition: 'color 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.color = colors.badge;
                    e.target.style.textDecoration = 'underline';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.color = colors.accent;
                    e.target.style.textDecoration = 'none';
                  }}
                >
                  Sign up here
                </Link>
              </p>
            </Form>

            
          </Card.Body>
        </Card>
      </div>
    </>
  );
};

export default Login;