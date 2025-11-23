import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Form from 'react-bootstrap/Form';
import { Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import colors from '../theme';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user", // default role
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setMessage("Signup successful!");
        setTimeout(() => {
          if (data.role === "admin") navigate("/admin");
        
          else navigate("/login"); // default redirect
        }, 1500);
      } else {
        setMessage("" + (data.message || "Signup failed"));
      }
    } catch (err) {
      console.error(err);
      setMessage("⚠️ Server error. Please try again.");
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
              Sign Up to Thriftify
            </h3>

            <Form onSubmit={handleSubmit}>
              {/* Full Name */}
              <Form.Group className="mb-3" controlId="name">
                <Form.Label style={{ color: colors.bg, fontWeight: '600' }}>
                  Full Name
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={{
                    border: `1px solid ${colors.bg}`,
                    borderRadius: '8px',
                    color: colors.bg,
                  }}
                />
              </Form.Group>

              {/* Email */}
              <Form.Group className="mb-3" controlId="email">
                <Form.Label style={{ color: colors.bg, fontWeight: '600' }}>
                  Email
                </Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={{
                    border: `1px solid ${colors.bg}`,
                    borderRadius: '8px',
                    color: colors.bg,
                  }}
                />
              </Form.Group>

              {/* Password */}
              <Form.Group className="mb-3" controlId="password">
                <Form.Label style={{ color: colors.bg, fontWeight: '600' }}>
                  Password (min 8 characters)
                </Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  style={{
                    border: `1px solid ${colors.bg}`,
                    borderRadius: '8px',
                    color: colors.bg,
                  }}
                />
              </Form.Group>

              {/* Role Selection */}
              <Form.Group className="mb-4" controlId="role">
                <Form.Label style={{ color: colors.bg, fontWeight: '600' }}>
                  Select Role
                </Form.Label>
                <Form.Select
                  value={formData.role}
                  onChange={handleChange}
                  style={{
                    border: `1px solid ${colors.bg}`,
                    borderRadius: '8px',
                    color: colors.bg,
                  }}
                >
                  <option value="user">User</option>
                 
                </Form.Select>
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
                {loading ? "Signing Up..." : "Sign Up"}
              </Button>

              <p style={{
                marginTop: '15px',
                textAlign: 'center',
                color: colors.bg,
                fontWeight: '500',
              }}>
                Already have an account?{' '}
                <Link
                  to="/login"
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
                  Login here
                </Link>
              </p>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </>
  );
};

export default Signup;