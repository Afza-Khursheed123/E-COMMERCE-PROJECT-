import Accordion from 'react-bootstrap/Accordion';
import 'bootstrap/dist/css/bootstrap.min.css';
import './faqs.css';
import colors from '../../theme';

function Faqs() {
    return (
        <div style={{ padding: '2%' }}>
            <h2 className="mb-5 text-center" style={{ color: colors.badge, fontWeight: '700' }}>
                Frequently Asked Questions
            </h2>

            <Accordion alwaysOpen>
                <Accordion.Item eventKey="0">
                    <Accordion.Header>
                        What makes Thriftify different from other resale platforms?
                    </Accordion.Header>
                    <Accordion.Body>
                        Thriftify is built around bartering and swapping, not just selling. 
                        It also features AI-based price suggestions, map-based local discovery,
                        eco-impact tracking, and a secure payment system with a small commission fee.
                    </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="1">
                    <Accordion.Header>Is it free to use Thriftify?</Accordion.Header>
                    <Accordion.Body>
                        Yes! Creating an account and listing items is completely free. 
                        A small 5% commission is only charged to sellers after a successful sale. 
                        Swaps and barters are free of charge.
                    </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="2">
                    <Accordion.Header>How are payments handled?</Accordion.Header>
                    <Accordion.Body>
                        Payments are made securely through Thriftify. Buyers pay sellers directly, 
                        while sellers send a 5% commission to the platform via their in-app wallet.
                    </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="3">
                    <Accordion.Header>How do I communicate with other users?</Accordion.Header>
                    <Accordion.Body>
                        Thriftify integrates WhatsApp chat for smooth and private communication 
                        between buyers and sellers. You can negotiate details and confirm 
                        transactions directly from your mobile device.
                    </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="4">
                    <Accordion.Header>How does Thriftify promote sustainability?</Accordion.Header>
                    <Accordion.Body>
                        By encouraging swapping and reuse, Thriftify reduces waste and promotes 
                        eco-friendly consumption. The platform also displays sustainability metrics 
                        that show the positive environmental impact of your activities.
                    </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="5">
                    <Accordion.Header>How are user ratings handled?</Accordion.Header>
                    <Accordion.Body>
                        After each successful transaction, buyers can leave ratings and reviews 
                        for sellers (and vice versa). This builds trust and transparency within 
                        the Thriftify community.
                    </Accordion.Body>
                </Accordion.Item>
            </Accordion>
        </div>
    );
}

export default Faqs;
