import colors from "../../theme";

function About() {
    return (
        <div style={{ padding: '4% 8%', color: colors.bg, lineHeight: '1.8' }}>
            <h1 style={{ color: colors.badge, textAlign: 'center', marginBottom: '1%', fontWeight: '700' }}>
                About Thriftify
            </h1>
            <h3 style={{ textAlign: 'center', color: colors.accent, marginBottom: '3%' }}>
                Reimagining Secondhand — One Swap at a Time
            </h3>

            <p>
                Welcome to <strong>Thriftify</strong>, a smart and sustainable marketplace built for people who believe in
                value, community, and conscious living. Thriftify is a customer-to-customer (C2C) platform that enables users to
                buy, sell, and swap pre-loved items effortlessly. Whether you’re cleaning out your closet, hunting for hidden
                gems, or trading what you no longer need for something new, Thriftify helps you do it all — safely, locally, and
                sustainably.
            </p>

            <h2 style={{ color: colors.badge || colors.badge, marginTop: '4%' }}>Our Mission</h2>
            <p>
                At Thriftify, our mission is to create a practical, privacy-friendly, and scalable platform that promotes
                sustainability and community-driven commerce. We aim to make secondhand trading not only convenient but also
                rewarding — both for users and for the planet.
            </p>

            <ul>
                <li>Reducing waste by giving items a second life.</li>
                <li>Encouraging smart consumption through swapping and bartering.</li>
                <li>Supporting local economies via hyperlocal connections.</li>
                <li>Building trust with transparent, user-first design.</li>
            </ul>

            <h2 style={{ color: colors.badge || colors.badge, marginTop: '4%' }}>What Makes Thriftify Different</h2>

            <ol>
                <li>
                    <strong>Barter-First Marketplace:</strong> Unlike conventional C2C platforms, Thriftify revolves around
                    bartering and swapping. Users can list an item they own and specify what they’re looking for in exchange —
                    creating a modern, digital twist on traditional trade.
                </li>
                <li>
                    <strong>Hyperlocal Experience:</strong> Our interactive map discovery helps users find items available nearby,
                    making it easy to arrange self-pickups, save on delivery, and connect with their local community.
                </li>
                <li>
                    <strong>AI-Powered Pricing:</strong> Unsure how much your item is worth? Thriftify’s AI pricing engine
                    provides local market-based price suggestions, ensuring fairness and efficiency in every deal.
                </li>
                <li>
                    <strong>Secure & Simple Payments:</strong> When buying items, payments are made securely to sellers. A small
                    5% commission is automatically sent to the platform’s wallet to support operations — ensuring transparency and
                    reliability.
                </li>
                <li>
                    <strong>Sustainability Metrics:</strong> Every action you take on Thriftify contributes to a greener world.
                    Our eco-impact tracker shows the positive environmental effect of reusing and swapping, while rewarding users
                    for eco-friendly behavior.
                </li>
            </ol>

            <h2 style={{ color: colors.badge || colors.badge, marginTop: '4%' }}> Key Features</h2>
            <ul>
                <li>
                    <strong>Buying & Selling:</strong> Purchase or post items easily with secure payments and instant
                    confirmations.
                </li>
                <li>
                    <strong>Swapping System:</strong> Exchange goods directly with other users — no money needed!
                </li>
                <li>
                    <strong>Bidding & Offers:</strong> Place or accept bids on items to find the best deal.
                </li>
                <li>
                    <strong>WhatsApp Chat Integration:</strong> Negotiate directly through WhatsApp for convenience and privacy.
                </li>
                <li>
                    <strong>Ratings & Reviews:</strong> Build trust with community-driven feedback.
                </li>
                <li>
                    <strong>Complaints & Dispute Resolution:</strong> Admins monitor and resolve reports to maintain a safe
                    environment.
                </li>
                <li>
                    <strong>Pickup & Delivery:</strong> Choose between self-pickup or courier delivery with tracking integration.
                </li>
            </ul>

            <h2 style={{ color: colors.badge || colors.badge, marginTop: '4%' }}> Our Vision</h2>
            <p>
                We envision Thriftify as more than just a marketplace — it’s a movement towards mindful consumption. By bridging
                the gap between affordability, accessibility, and sustainability, we hope to inspire people to shop smarter,
                waste less, and connect more.
            </p>

            <p style={{ marginTop: '2%', color: colors.accent, fontWeight: '600', textAlign: 'center' }}>
                Together, we can transform how the world trades — one thrift, one swap, one story at a time.
            </p>
        </div>
    );
}

export default About;
