const express = require("express");
const router = express.Router();
const { queryContacts, getDealsFromContact } = require("./controllers");

router.get("/contacts/query", async (req, res) => {
  try {
    // Get the query parameter
    const query = req.query.q || null;

    const data = await queryContacts(query);

    // Send data
    res.send(data);
  } catch (err) {
    console.error("hubspot/routes -> /contact/query", err);
    res.send(err).status(500);
  }
});

router.get("/contacts/:contactId/deals", async (req, res) => {
  try {
    // Get the contactId parameter
    const contactId = req.params.contactId || null;
    console.log("contactId", contactId);

    const deals = await getDealsFromContact(contactId);

    // Send data
    res.send(deals);
  } catch (err) {
    console.error("hubspot/routes -> /contact/query", err);
    res.send(err).status(500);
  }
});

module.exports = router;
