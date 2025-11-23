import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import InputGroup from 'react-bootstrap/InputGroup';
import { useState } from 'react';
import axios from 'axios';
import colors from '../../theme';

function Contact() {
  const [validated, setValidated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    city: '',
    state: '',
    contactNumber: '',
    message: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    
    if (form.checkValidity() === false) {
      event.stopPropagation();
      setValidated(true);
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await axios.post('http://localhost:3000/contact/submit', formData);
      
      if (response.data.success) {
        setSubmitStatus({
          type: 'success',
          message: 'Thank you! Your message has been sent successfully.'
        });
        
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          username: '',
          city: '',
          state: '',
          contactNumber: '',
          message: ''
        });
        setValidated(false);
      }
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: 'Sorry, there was an error sending your message. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }

    setValidated(true);
  };

  return (
    <div style={{ padding: '3%', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: colors.badge, marginBottom: '3%', textAlign: 'center', fontWeight: '700' }}>
        Contact Us
      </h1>

      {submitStatus && (
        <div className={`alert ${submitStatus.type === 'success' ? 'alert-success' : 'alert-danger'}`}
          style={{ borderRadius: '10px', marginBottom: '2rem', textAlign: 'center', fontWeight: '500' }}>
          {submitStatus.message}
        </div>
      )}

      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <Row className="mb-3">
          <Form.Group as={Col} md="4" controlId="validationCustom01">
            <Form.Label style={{ color: colors.bg, fontWeight: '600' }}>First name</Form.Label>
            <Form.Control 
              required 
              type="text" 
              placeholder="First name" 
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
            />
            <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
          </Form.Group>

          <Form.Group as={Col} md="4" controlId="validationCustom02">
            <Form.Label style={{ color: colors.bg, fontWeight: '600' }}>Last name</Form.Label>
            <Form.Control 
              required 
              type="text" 
              placeholder="Last name" 
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
            />
            <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
          </Form.Group>

          <Form.Group as={Col} md="4" controlId="validationCustomUsername">
            <Form.Label style={{ color: colors.bg, fontWeight: '600' }}>Username</Form.Label>
            <InputGroup hasValidation>
              <InputGroup.Text id="inputGroupPrepend">@</InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Username"
                aria-describedby="inputGroupPrepend"
                required
                name="username"
                value={formData.username}
                onChange={handleInputChange}
              />
              <Form.Control.Feedback type="invalid">Please choose a username.</Form.Control.Feedback>
            </InputGroup>
          </Form.Group>
        </Row>

        <Row className="mb-3">
          <Form.Group as={Col} md="4" controlId="validationCustom03">
            <Form.Label style={{ color: colors.bg, fontWeight: '600' }}>City</Form.Label>
            <Form.Control 
              type="text" 
              placeholder="City" 
              required 
              name="city"
              value={formData.city}
              onChange={handleInputChange}
            />
          </Form.Group>

          <Form.Group as={Col} md="4" controlId="validationCustom04">
            <Form.Label style={{ color: colors.bg, fontWeight: '600' }}>State</Form.Label>
            <Form.Control 
              type="text" 
              placeholder="State" 
              required 
              name="state"
              value={formData.state}
              onChange={handleInputChange}
            />
          </Form.Group>

          <Form.Group as={Col} md="4" controlId="validationCustom05">
            <Form.Label style={{ color: colors.bg, fontWeight: '600' }}>Contact Number</Form.Label>
            <Form.Control 
              type="tel" 
              placeholder="Contact Number" 
              required 
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleInputChange}
            />
          </Form.Group>
        </Row>

        <Row className="mb-4">
          <Form.Group as={Col} md="12" controlId="validationCustom06">
            <Form.Label style={{ color: colors.bg, fontWeight: '600' }}>Message</Form.Label>
            <Form.Control
              required
              as="textarea"
              rows={5}
              placeholder="Type your message here..."
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              style={{ resize: 'vertical' }}
            />
          </Form.Group>
        </Row>

        <div style={{ textAlign: 'center' }}>
          <Button
            type="submit"
            disabled={isSubmitting}
            style={{
              backgroundColor: isSubmitting ? '#6c757d' : colors.accent,
              border: 'none',
              color: colors.text,
              padding: '12px 40px',
              borderRadius: '30px',
              fontWeight: '600',
              fontSize: '1.1rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              transition: 'all 0.3s ease',
              minWidth: '160px'
            }}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Sending...
              </>
            ) : (
              'Submit Form'
            )}
          </Button>
        </div>
      </Form>
    </div>
  );
}

export default Contact;