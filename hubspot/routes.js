const express = require("express");
const router = express.Router();
const { queryContacts, getDealsFromContact } = require("./controllers");

router.get("/contacts/query", async (req, res) => {
  try {
    // Get the query parameter
    const query = req.query.q || null;

    // Get the hubspotToken
    const { hubspotToken } = res.locals;

    const data = await queryContacts(query, hubspotToken);

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

    // Get the hubspotToken
    const { hubspotToken } = res.locals;

    const deals = await getDealsFromContact(contactId, hubspotToken);

    // Send data
    res.send(deals);
  } catch (err) {
    console.error("hubspot/routes -> /contact/query", err);
    res.send(err).status(500);
  }
});

module.exports = router;
