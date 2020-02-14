const axios = require("axios");
const env = require("../env");

/**
 * Query the contacts model from the hubspot api
 * @param {String} query the search query
 */
const queryContacts = async (query = "") => {
  try {
    const res = await axios.get(
      `https://api.hubapi.com/contacts/v1/search/query?hapikey=${env.HUBSPOT_API_KEY}&q=${query}`
    );
    return res.data;
  } catch (err) {
    console.log("hubspot/controllers -> queryContacts()", err);
  }
};

/**
 * Get the HubSpot deals IDs associated with a contact
 * @param {String} contactId the HubSpot contact id
 */
const getDealIdsFromContact = async contactId => {
  try {
    const res = await axios.get(
      `https://api.hubapi.com/crm-associations/v1/associations/${contactId}/HUBSPOT_DEFINED/4?hapikey=${env.HUBSPOT_API_KEY}`
    );
    return res.data;
  } catch (err) {
    console.log("hubspot/controllers -> getDealIdsFromContact()", err);
  }
};

/**
 * Get a HubSpot deal by it's ID
 * @param {String} dealId the HubSpot contact id
 */
const getDeal = async dealId => {
  try {
    const res = await axios.get(
      `https://api.hubapi.com/deals/v1/deal/${dealId}?hapikey=${env.HUBSPOT_API_KEY}`
    );
    return res.data;
  } catch (err) {
    console.log("hubspot/controllers -> getDeal()", err);
  }
};

/**
 * Get the HubSpot deals objects associated with a contact
 * @param {String} contactId the HubSpot contact id
 */
const getDealsFromContact = async contactId => {
  try {
    // Get all the Deal IDs
    const dealIds = (await getDealIdsFromContact(contactId)).results;

    // Get all the deal pipelines
    const pipelines = (await getAllPipelines()).results;

    // Set the deals array
    let deals = [];

    for (let dealId of dealIds) {
      // Get deal detailed info
      let deal = await getDeal(dealId);

      // Get deal pipeline detailed info
      deal.pipeline = pipelines.find(
        p => p.pipelineId === deal.properties.pipeline.value
      );

      // Get deal stage detailed info
      deal.stage = deal.pipeline.stages.find(
        s => s.stageId === deal.properties.dealstage.value
      );

      deals.push(deal); // Push deal to deals array
    }

    return deals;
  } catch (err) {
    console.log("hubspot/controllers -> getDealsFromContact()", err);
  }
};

/**
 * Get Hubspot deals pipeliens
 */
const getAllPipelines = async () => {
  try {
    const res = await axios.get(
      `https://api.hubapi.com/crm-pipelines/v1/pipelines/deals?hapikey=${env.HUBSPOT_API_KEY}`
    );
    return res.data;
  } catch (err) {
    console.log("hubspot/controllers -> getDeal()", err);
  }
};

module.exports = { queryContacts, getDealsFromContact };
