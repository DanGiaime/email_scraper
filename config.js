const maxDepth = 2;
const maxNestedLinks = 10;
const maxEmailsPerSite = 10;
const fileName = "Big Data Test";
const inputPath = 'testy-test.csv';
const domainRegex = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img;
const dataFileFolderName = './data-files';

// Sourced from - https://emailregex.com/, 5322 RFC, Javascript version
const emailRegex = /(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g;

module.exports = {
    maxDepth: maxDepth,
    maxNestedLinks: maxNestedLinks,
    maxEmailsPerSite: maxEmailsPerSite,
    fileName: fileName,
    inputPath: inputPath,
    domainRegex: domainRegex,
    emailRegex: emailRegex,
    dataFileFolderName: dataFileFolderName
};