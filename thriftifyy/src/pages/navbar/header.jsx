import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Logo from '../../../assets/logo.png';
import Drawer from './addToCart';
import FavoritesDrawer from './Favorites';
import OrdersDrawer from './orders';
import colors from '../../theme';
import { Link } from 'react-router-dom';
import NotificationDrawer from './notifications';
function Header() {
  return (
    <Navbar
      expand="lg"
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
      }}
      className="custom-navbar" // Use class instead of inline styles
    >
      <Container fluid>
        <Navbar.Brand as={Link} to="/home" className="navbar-brand-custom">
          <img src={Logo} alt="Logo" className="navbar-logo" />
      
        </Navbar.Brand>

        <Navbar.Toggle 
          aria-controls="basic-navbar-nav" 
          className="navbar-toggler-custom"
        />

        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link
              as={Link}
              to="/home"
              className="nav-link-custom"
            >
              Home
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/about"
              className="nav-link-custom"
            >
              About
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/category"
              className="nav-link-custom"
            >
              Categories
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/dashboard"
              className="nav-link-custom"
            >
              Profile
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/contact"
              className="nav-link-custom"
            >
              Contact
            </Nav.Link>
            
          </Nav>

          <Nav className="ms-auto d-flex align-items-center gap-3">
            <Link 
              to="/signup"
              className="nav-link-custom user-icon"
            >
              <i className="fa-solid fa-user"></i>
              
            </Link>
            <OrdersDrawer />
               <FavoritesDrawer />
<NotificationDrawer />
            <Drawer />
          </Nav>
        
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Header;