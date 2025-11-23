import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Hero from "../../../assets/hero.jpg";
import colors from '../../theme';
import { Link } from "react-router-dom";


function HeroSection() {
  return (
    <Card className="text-white border-0" style={{ position: 'relative' }}>
      <Card.Img
        src={Hero}
        alt="Card image"
        style={{
          height: '70vh',
          width: '100%',
          objectFit: 'cover',
        }}
        onError={(e) => {
          e.target.src = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop';
        }}
      />
      <Card.ImgOverlay
        className="d-flex flex-column justify-content-center align-items-start"
        style={{
          paddingLeft: '5%',
          color: colors.text,
        }}
      >
        <h1
          style={{
            fontSize: '3rem',
            fontWeight: '700',
            color: colors.text,
            textShadow: '2px 2px 10px rgba(0,0,0,0.6)',
          }}
        >
          Give Items a Second Chance
        </h1>

        <h4 style={{ marginBottom: '20px' }}>
          Turn thrift into a lifestyle — Thriftify your world.
        </h4>

        <Button
          as={Link}
          to="/categories"
          style={{
            backgroundColor: colors.accent,
            border: 'none',
            fontWeight: '600',
            padding: '10px 25px',
            borderRadius: '30px',
            boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
            transition: 'all 0.3s ease',
            color: colors.text,
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = colors.bg}
          onMouseLeave={(e) => e.target.style.backgroundColor = colors.accent}
        >
          Explore Now
        </Button>
      </Card.ImgOverlay>
    </Card>
  );
}

export default HeroSection;