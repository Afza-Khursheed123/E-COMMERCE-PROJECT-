import { Container, Row, Col } from 'react-bootstrap';
import Logo from '../../../assets/logo.png';
import colors from '../../theme';

function Footer() {
    const year = new Date().getFullYear();


    return (
        <footer
            style={{
                backgroundColor: colors.bg,
                color: colors.text,
                paddingTop: '40px',
                paddingBottom: '10px',
                textAlign: 'center',
            }}
        >
            <Container>
                <Row>
                    <Col md={4} className="text-start">
                        <img src={Logo} alt="" style={{ height: '3rem', marginBottom:'10px' }} />
                        <p style={{ fontSize: '14px', color: colors.text }}>
                            Thriftify is a next-generation customer-to-customer (C2C) marketplace that redefines the way people buy, sell, and swap pre-loved items. Designed for sustainability and simplicity, Thriftify makes it easy to trade what you have for what you need through a seamless bartering and selling experience.
                        </p>
                    </Col>


                    <Col md={4}>
                        <h6>Quick Links</h6>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            <li><a href="#index" style={{ color: colors.text, textDecoration: 'none' }}
                                onMouseOver={(e) => {
                                    e.target.style.color = "#D7C9AA";
                                    e.target.style.textDecoration = 'underline';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.color = colors.text;
                                    e.target.style.textDecoration = 'none';
                                }}>Home</a></li>
                            <li><a href="/about" style={{ color: colors.text, textDecoration: 'none' }}
                                onMouseOver={(e) => {
                                    e.target.style.color = "#D7C9AA";
                                    e.target.style.textDecoration = 'underline';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.color = colors.text;
                                    e.target.style.textDecoration = 'none';
                                }}>About</a></li>
                            <li><a href="/categories" style={{ color: colors.text, textDecoration: 'none' }}
                                onMouseOver={(e) => {
                                    e.target.style.color = "#D7C9AA";
                                    e.target.style.textDecoration = 'underline';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.color = colors.text;
                                    e.target.style.textDecoration = 'none';
                                }}>Categories</a></li>
                            <li><a href="/profile" style={{ color: colors.text, textDecoration: 'none' }}
                                onMouseOver={(e) => {
                                    e.target.style.color = "#D7C9AA";
                                    e.target.style.textDecoration = 'underline';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.color = colors.text;
                                    e.target.style.textDecoration = 'none';
                                }}>Profile</a></li>
                            <li><a href="/contact" style={{ color: colors.text, textDecoration: 'none', }}
                                onMouseOver={(e) => {
                                    e.target.style.color = "#D7C9AA";
                                    e.target.style.textDecoration = 'underline';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.color = colors.text;
                                    e.target.style.textDecoration = 'none';
                                }}>Contact</a></li>
                        </ul>
                    </Col>

                    <Col md={4}>
                        <h6>Contact</h6>
                        <p style={{ color: colors.text, fontSize: '14px' }}>
                            <i className="fa-solid fa-location-dot"></i>&nbsp;Karachi, Pakistan<br />
                            <i className="fa-solid fa-phone"></i>&nbsp;+92 333 2262281<br />
                            <i className="fa-solid fa-envelope"></i>&nbsp;contact@thriftify.com
                        </p>
                    </Col>
                </Row>

                <hr style={{ borderColor: colors.highlight, margin: '30px 0' }} />

                <p style={{ fontSize: '13px', color: colors.text }}>
                    © {year} Rudaina Labs. All rights reserved.</p>
            </Container>
        </footer>
    );
}

export default Footer;
