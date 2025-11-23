import { useState } from 'react';
import colors from '../../theme';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Form from 'react-bootstrap/Form';
import ListGroup from 'react-bootstrap/ListGroup';
import User from '../../../assets/User.jpg';
import './profile.css'

function Profile() {
    const [user, setUser] = useState({
        name: "John Doe",
        email: "johndoe@gmail.com",
        phone: "0312-1234567",
        address: "Karachi, Pakistan"
    });

    const [isEditing, setIsEditing] = useState(false);

    const handleChange = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };

    const handleSave = () => {
        setIsEditing(false);
        alert("Profile updated successfully!");
    };

    const boughtOrders = [
        { id: 1, item: "Vintage Jacket", price: 2500 },
        { id: 2, item: "Handbag", price: 1800 },
    ];

    const soldOrders = [
        { id: 1, item: "Sneakers", price: 3000 },
        { id: 2, item: "Hoodie", price: 1500 },
    ];

    const uploadedItems = [
        { id: 1, item: "Laptop Bag" },
        { id: 2, item: "Accessories Set" },
        { id: 3, item: "Books Bundle" },
    ];

    return (
        <div style={{ padding: '3%' }}>
            <h1
                style={{
                    color: colors.badge,
                    marginBottom: '3%',
                    textAlign: 'center',
                    fontWeight: '700'
                }}
            >
                Profile
            </h1>

            <Row>
                <Col md={8}>
                    <Tabs defaultActiveKey="userinfo" className="mb-3 custom-tabs" fill>
                        <Tab eventKey="userinfo" title="User Info">
                            <Card style={{ padding: 25, border: 'none', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
                                <h4 style={{ color: colors.accent }}>Your Information</h4>

                                <Form style={{ marginTop: 20 }}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Name</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="name"
                                            value={user.name}
                                            disabled={!isEditing}
                                            onChange={handleChange}
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Email</Form.Label>
                                        <Form.Control
                                            type="email"
                                            name="email"
                                            value={user.email}
                                            disabled={!isEditing}
                                            onChange={handleChange}
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Phone</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="phone"
                                            value={user.phone}
                                            disabled={!isEditing}
                                            onChange={handleChange}
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-3">
                                        <Form.Label>Address</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="address"
                                            value={user.address}
                                            disabled={!isEditing}
                                            onChange={handleChange}
                                        />
                                    </Form.Group>

                                    {!isEditing ? (
                                        <Button
                                            onClick={() => setIsEditing(true)}
                                            href="/categories"
                                            style={{
                                                backgroundColor: colors.accent,
                                                border: 'none',
                                                fontWeight: '600',
                                                padding: '10px 25px',
                                                borderRadius: '06px',
                                                boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
                                                transition: 'all 0.3s ease',
                                                color: colors.text,
                                            }}
                                            onMouseEnter={(e) => e.target.style.backgroundColor = colors.bg}
                                            onMouseLeave={(e) => e.target.style.backgroundColor = colors.accent}
                                        >
                                            Edit
                                        </Button>
                                    ) : (
                                        <Button
                                            style={{ backgroundColor: colors.bg, border: 'none' }}
                                            onClick={handleSave}
                                        >
                                            Save Changes
                                        </Button>
                                    )}
                                </Form>
                            </Card>
                        </Tab>

                        <Tab eventKey="bought" title="Orders Bought">
                            <ListGroup>
                                {boughtOrders.map(order => (
                                    <ListGroup.Item key={order.id}>
                                        {order.item} — <strong>Rs. {order.price}</strong>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </Tab>

                        <Tab eventKey="sold" title="Orders Sold">
                            <ListGroup>
                                {soldOrders.map(order => (
                                    <ListGroup.Item key={order.id}>
                                        {order.item} — <strong>Rs. {order.price}</strong>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </Tab>

                        <Tab eventKey="uploads" title="Uploaded Items">
                            <ListGroup>
                                {uploadedItems.map(item => (
                                    <ListGroup.Item key={item.id}>
                                        {item.item}
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </Tab>
                    </Tabs>
                </Col>

                <Col md={4}>
                    <Card
                        style={{
                            width: '100%',
                            boxShadow: '0 0 15px rgba(0,0,0,0.1)',
                            paddingTop: 20,
                            paddingBottom: 20
                        }}>
                        <Card.Body style={{ textAlign: 'center' }}>
                            <img
                                src={User}
                                alt=""
                                style={{ width: 70, height: 70, borderRadius: '50%', marginBottom: 10 }}
                            />
                            <Card.Title style={{ color: colors.accent, fontSize: 20 }}>
                                {user.name}
                            </Card.Title>
                        </Card.Body>

                        <Card.Body style={{ textAlign: 'left' }}>
                            <Card.Text style={{ lineHeight: 2 }}>
                                📦 <strong>Orders Bought:</strong> {boughtOrders.length} <br />
                                💼 <strong>Orders Sold:</strong> {soldOrders.length} <br />
                                🗂 <strong>Uploaded Items:</strong> {uploadedItems.length}
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}

export default Profile;