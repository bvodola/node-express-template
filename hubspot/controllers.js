const axios = require("axios");
const env = require("../env");
const querystring = require("querystring");

const getNewTokens = async (refresh_token) => {
  try {
    const formData = querystring.stringify({
      grant_type: "refresh_token",
      client_id: env.HUBSPOT_CLIENT_ID,
      client_secret: env.HUBSPOT_CLIENT_SECRET,
      redirect_uri: env.BACKEND_URL + env.HUBSPOT_REDIRECT_URI,
      refresh_token,
    });

    const tokenRes = await axios.post(
      `${env.HUBSPOT_API_URL}/oauth/v1/token`,
      formData
    );

    return tokenRes.data;
  } catch (err) {
    console.log(err.response.data);
    return err.response.data;
  }
};

/**
 * Creates axios/hubspot api instance with baseURL and token already configured
 * @param {string} token hubspot OAuth2 token
 */
const hubspotApi = (token) =>
  axios.create({
    baseURL: "https://api.hubapi.com",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

/**
 * Query the contacts model from the hubspot api
 * @param {String} query the search query
 */
const queryContacts = async (query = "", hubspotToken) => {
  try {
    const req = hubspotApi(hubspotToken);
    const res = await req.get(`/contacts/v1/search/query?q=${query}`);
    return res.data;
  } catch (err) {
    console.log("hubspot/controllers -> queryContacts()", err);
  }
};

/**
 * Get the HubSpot deals IDs associated with a contact
 * @param {String} contactId the HubSpot contact id
 */
const getDealIdsFromContact = async (contactId, hubspotToken) => {
  try {
    const req = hubspotApi(hubspotToken);
    const res = await req.get(
      `/crm-associations/v1/associations/${contactId}/HUBSPOT_DEFINED/4`
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
const getDeal = async (dealId, hubspotToken) => {
  try {
    const req = hubspotApi(hubspotToken);
    const res = await req.get(`/deals/v1/deal/${dealId}`);
    return res.data;
  } catch (err) {
    console.log("hubspot/controllers -> getDeal()", err);
  }
};

/**
 * Get the HubSpot deals objects associated with a contact
 * @param {String} contactId the HubSpot contact id
 */
const getDealsFromContact = async (contactId, hubspotToken) => {
  try {
    // Get all the Deal IDs
    const dealIds = (await getDealIdsFromContact(contactId, hubspotToken))
      .results;

    // Get all the deal pipelines
    const pipelines = (await getAllPipelines(hubspotToken)).results;

    // Set the deals array
    let deals = [];

    for (let dealId of dealIds) {
      // Get deal detailed info
      let deal = await getDeal(dealId, hubspotToken);

      // Get deal pipeline detailed info
      deal.pipeline = pipelines.find(
        (p) => p.pipelineId === deal.properties.pipeline.value
      );

      // Get deal stage detailed info
      deal.stage = deal.pipeline.stages.find(
        (s) => s.stageId === deal.properties.dealstage.value
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
const getAllPipelines = async (hubspotToken) => {
  try {
    const req = hubspotApi(hubspotToken);
    const res = await req.get(`/crm-pipelines/v1/pipelines/deals`);
    return res.data;
  } catch (err) {
    console.log("hubspot/controllers -> getDeal()", err);
  }
};

module.exports = { getNewTokens, queryContacts, getDealsFromContact };
