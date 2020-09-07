require('dotenv').config();

const maxDepth = process.env.maxDepth;
const maxNestedLinks = process.env.maxNestedLinks;
const maxEmailsPerSite = process.env.maxEmailsPerSite;
const fileName = process.env.fileName;
const inputPath = process.env.inputPath; // delete this
const dataFileFolderName = process.env.dataFileFolderName;
const azureAPIKey = process.env.azureAPIKey;
const googleAPIKey = process.env.googleAPIKey;
const yelpAPIKey = process.env.yelpAPIKey;
const batchSize = process.env.batchSize; // How many sites of each type to search for, 0 = as many as possible

// What fields you want in the final data from the chicago biz api
// field names MUST match API field names - https://dev.socrata.com/foundry/data.cityofchicago.org/uupf-x98q
// (scroll to fields, about half way down page)
const desiredFields = JSON.parse(process.env.desiredFields);

// Type of business to search (consult business_acitivity in chicago data api)
// What is the _exact_ business type you want to search for? Must be a business type provided by api
let bizTypes = JSON.parse(process.env.bizTypes);

// Sourced from - https://emailregex.com/, 5322 RFC, Javascript version
const emailRegex = /(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g;

// pulls out domain from email
const domainRegex = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img;

module.exports = {
    maxDepth,
    maxNestedLinks,
    maxEmailsPerSite,
    fileName,
    inputPath,
    domainRegex,
    emailRegex,
    dataFileFolderName,
    bizTypes,
    desiredFields,
    fileName,
    azureAPIKey,
    batchSize,
    googleAPIKey,
    yelpAPIKey
};