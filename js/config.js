const maxDepth = 2;
const maxNestedLinks = 10;
const maxEmailsPerSite = 10;
const fileName = "Big Data Test";
const inputPath = 'testy-test.csv';
const dataFileFolderName = './data-files';

// What fields you want in the final data from the chicago biz api
// field names MUST match API field names - https://dev.socrata.com/foundry/data.cityofchicago.org/uupf-x98q
// (scroll to fields, about half way down page)
const desiredFields = {
    legal_name: "",
    doing_business_as_name: "",
    zip_code: "",
    website: ""
};

// Type of business to search (consult business_acitivity in chicago data api)
// What is the _exact_ business type you want to search for? Must be a business type provided by api
const bizType = "Hair Services";

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
    bizType,
    desiredFields,
    fileName
};