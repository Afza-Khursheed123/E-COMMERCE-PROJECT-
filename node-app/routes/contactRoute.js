import express from "express";

export default function contactRoute(db) {
  const router = express.Router();

  // Submit contact form
  router.post("/submit", async (req, res) => {
    try {
      const { firstName, lastName, username, city, state, contactNumber, message } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !username || !city || !state || !contactNumber || !message) {
        return res.status(400).json({ 
          success: false, 
          message: "All fields are required" 
        });
      }

      const contacts = db.collection("Contacts");

      // Create contact document
      const contactData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim(),
        city: city.trim(),
        state: state.trim(),
        contactNumber: contactNumber.toString().trim(),
        message: message.trim(),
        submittedAt: new Date()
      };

      // Insert into MongoDB
      const result = await contacts.insertOne(contactData);

      res.status(201).json({
        success: true,
        message: "Contact form submitted successfully!",
        data: {
          id: result.insertedId
        }
      });

    } catch (error) {
      console.error("Error submitting contact form:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error"
      });
    }
  });

  return router;
}