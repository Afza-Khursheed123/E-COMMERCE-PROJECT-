import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Form from 'react-bootstrap/Form';
import { Button, Card, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import colors from '../theme';
import api from "../api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuspendedAlert, setShowSuspendedAlert] = useState(false);
  const [suspendedUserData, setSuspendedUserData] = useState(null);
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

  const suspendedAlertStyle = {
    backgroundColor: '#FFF3CD',
    border: '2px solid #FFEAA7',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px',
    textAlign: 'center',
    animation: 'fadeIn 0.5s ease-in'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setShowSuspendedAlert(false);
    setSuspendedUserData(null);

    // Check for admin credentials first
    if (email === "admin34@gmail.com" && password === "admin12345") {
      setMessage("Admin login successful!");
      
      const adminUser = {
        _id: "admin_id",
        name: "Admin",
        role: "admin",
        email: "admin34@gmail.com"
      };
      
      localStorage.setItem("user", JSON.stringify(adminUser));
      localStorage.setItem("isAdmin", "true");
      
      console.log("🔐 Admin login detected:", adminUser);
      
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
        const userData = res.data.user;
        
        // This check is redundant now since backend handles suspension
        // But keeping it for extra safety
        if (userData.status === "Suspended") {
          setSuspendedUserData(userData);
          setShowSuspendedAlert(true);
          setMessage("");
          setLoading(false);
          return;
        }
        
        setMessage("Login successful!");
        
        // Store user data in localStorage
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("isAdmin", "false");
        
        console.log("💾 User data stored:", {
          id: userData._id || userData.id,
          name: userData.name,
          role: userData.role,
          email: userData.email,
          status: userData.status
        });
        
        // Redirect after short delay
        setTimeout(() => {
          if (res.data.token) {
            localStorage.setItem("token", res.data.token);
          }
          navigate("/home");
        }, 1000);
        
      } else {
        setMessage(res.data.message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      console.log("Error response:", err.response?.data);
      
      // FIXED: Check for suspended account in error response
      if (err.response?.status === 403 && 
          (err.response?.data?.message?.includes("suspended") || 
           err.response?.data?.user?.status === "Suspended")) {
        
        console.log("🚫 Suspended user detected:", err.response.data.user);
        setSuspendedUserData(err.response.data.user);
        setShowSuspendedAlert(true);
        setMessage("");
        
      } else {
        setMessage(err.response?.data?.message || "⚠️ Server error. Please try again.");
      }
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

            {/* Suspended User Alert */}
            {showSuspendedAlert && (
              <div style={suspendedAlertStyle}>
                <div style={{
                  fontSize: '48px',
                  color: '#856404',
                  marginBottom: '15px'
                }}>
                  ⚠️
                </div>
                <h4 style={{
                  color: '#856404',
                  fontWeight: '600',
                  marginBottom: '15px'
                }}>
                  Account Under Review
                </h4>
                <p style={{
                  color: '#856404',
                  marginBottom: '10px',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  Dear <strong>{suspendedUserData?.name || 'User'}</strong>,
                </p>
                <p style={{
                  color: '#856404',
                  marginBottom: '15px',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  Your account is currently being monitored by our administration team due to 
                  detection of unusual activities. This is a security measure to protect 
                  our community and ensure a safe shopping experience for everyone.
                </p>
                <div style={{
                  backgroundColor: '#FFF8E1',
                  border: '1px solid #FFE082',
                  borderRadius: '8px',
                  padding: '12px',
                  margin: '15px 0'
                }}>
                  <p style={{
                    color: '#856404',
                    fontSize: '12px',
                    margin: 0,
                    fontStyle: 'italic'
                  }}>
                    💡 <strong>What to do next:</strong> Please contact our support team 
                    if you believe this is a mistake or for more information.
                  </p>
                </div>
                
              </div>
            )}

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
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setShowSuspendedAlert(false);
                  }}
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
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setShowSuspendedAlert(false);
                  }}
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

      {/* Add some CSS for fade-in animation */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </>
  );
};

export default Login;