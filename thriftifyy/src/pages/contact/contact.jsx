import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import InputGroup from 'react-bootstrap/InputGroup';
import { useState } from 'react';
import colors from '../../theme';

function Contact() {
  const [validated, setValidated] = useState(false);

  const handleSubmit = (event) => {
    const form = event.currentTarget;
    if (form.checkValidity() === false) {
      event.preventDefault();
      event.stopPropagation();
    }
    setValidated(true);
  };

  return (
    <div style={{ padding: '3%' }}>
      <h1
        style={{
          color: colors.badge,
          marginBottom: '3%',
          textAlign: 'center',
          fontWeight: '700',
        }}
      >
        Contact Us
      </h1>

      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <Row className="mb-3">
          <Form.Group as={Col} md="4" controlId="validationCustom01">
            <Form.Label style={{ color: colors.bg }}>First name</Form.Label>
            <Form.Control required type="text" placeholder="First name" />
            <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
          </Form.Group>

          <Form.Group as={Col} md="4" controlId="validationCustom02">
            <Form.Label style={{ color: colors.bg }}>Last name</Form.Label>
            <Form.Control required type="text" placeholder="Last name" />
            <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
          </Form.Group>

          <Form.Group as={Col} md="4" controlId="validationCustomUsername">
            <Form.Label style={{ color: colors.bg }}>Username</Form.Label>
            <InputGroup hasValidation>
              <InputGroup.Text id="inputGroupPrepend">@</InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Username"
                aria-describedby="inputGroupPrepend"
                required
              />
              <Form.Control.Feedback type="invalid">
                Please choose a username.
              </Form.Control.Feedback>
            </InputGroup>
          </Form.Group>
        </Row>

        <Row className="mb-3">
          <Form.Group as={Col} md="4" controlId="validationCustom03">
            <Form.Label style={{ color: colors.bg }}>City</Form.Label>
            <Form.Control type="text" placeholder="City" required />
            <Form.Control.Feedback type="invalid">
              Please provide a valid city.
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group as={Col} md="4" controlId="validationCustom04">
            <Form.Label style={{ color: colors.bg }}>State</Form.Label>
            <Form.Control type="text" placeholder="State" required />
            <Form.Control.Feedback type="invalid">
              Please provide a valid state.
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group as={Col} md="4" controlId="validationCustom05">
            <Form.Label style={{ color: colors.bg }}>Contact Number</Form.Label>
            <Form.Control type="number" placeholder="Contact Number" required />
            <Form.Control.Feedback type="invalid">
              Please provide a valid contact number.
            </Form.Control.Feedback>
          </Form.Group>
        </Row>

        <Row className="mb-4">
          <Form.Group as={Col} md="12" controlId="validationCustom06">
            <Form.Label style={{ color: colors.bg }}>Message</Form.Label>
            <Form.Control
              required
              as="textarea"
              rows={3}
              placeholder="Type your message here"
            />
          </Form.Group>
        </Row>

        {/* Centered themed button */}
        <div style={{ textAlign: 'center' }}>
          <Button
            type="submit"
            style={{
              backgroundColor: colors.accent,
              border: 'none',
              color: colors.text,
              padding: '10px 35px',
              borderRadius: '30px',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = colors.bg)}
            onMouseLeave={(e) => (e.target.style.backgroundColor = colors.accent)}
          >
            Submit Form
          </Button>
        </div>
      </Form>
    </div>
  );
}

export default Contact;
