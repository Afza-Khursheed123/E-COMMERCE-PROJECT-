import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import colors from '../../theme';

function Working() {
  const steps = [
    { title: "Select Your Item", text: "Browse through the categories and pick the item you love." },
    { title: "Bid the Price", text: "Set your price and place your bid for the item." },
    { title: "Get Confirmation", text: "Receive confirmation once your bid is accepted." },
    { title: "Make Payment", text: "Complete the payment securely through our system." },
    { title: "Receive Your Item", text: "Get your thrifted treasure delivered to your doorstep!" },
  ];

  return (
    <Container className="py-5 text-center">
      <h2 className="mb-5" style={{ color: colors.badge, fontWeight: '700' }}>
        How It Works
      </h2>

      <Row xs={1} sm={2} md={3} lg={5} className="g-4 justify-content-center">
        {steps.map((step, index) => (
          <Col key={index} className="d-flex justify-content-center">
            <Card
              style={{
                width: '14rem',
                border: 'none',
                backgroundColor: colors.text,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                borderRadius: '15px',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              }}
              className="p-3"
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
            >
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: colors.accent,
                  color: colors.text,
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 15px',
                }}
              >
                {index + 1}
              </div>

              <Card.Title style={{ color: colors.bg, fontWeight: '600' }}>
                {step.title}
              </Card.Title>
              <Card.Text style={{ color: '#333', fontSize: '0.9rem' }}>
                {step.text}
              </Card.Text>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}

export default Working;
