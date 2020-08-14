// GOAL: Get 10,000 emails of hair salons in chicago

// Alternate path to success
// 1. Get list of business names (+ other data) from Chicago Data API - findBizData()
// 2. Query Bing Search API (through azure) to get websites - findBizSites(bizNames)
// 3. Scrape websites and linked pages with email_scraper - run(bizDataBlobs)
// 4. Send emails through some tool (TBD~)

const puppeteer = require("puppeteer"); // too scared to delete tbh
const { Cluster } = require('puppeteer-cluster');
const fs = require('fs');
const ObjectsToCsv = require('objects-to-csv');
const {findBizSites, findBizData} = require('./apis');
const {project } = require('./helpers');
const {desiredFields} = require('./config');
const { bizTypes, batchSize } = require('./config');
let {siteSearchTask, searchForNestedUrls, checkForEmails} = require("./scrape");
const {fileName, inputPath, domainRegex, emailRegex} = require("./config");
const {isWebsiteProbablySMB} = require("./helpers");


/*
Me
|
|
|
------
doin  |
the   |
thing |
-------
|
|
Thinking about how proud of me ppl would be
*/

// Main function, needed for async
let main = async (bizType) => {  

  // old file read code if needed
  // let bizDataBlobs = await csvToJson.fieldDelimiter(';').getJsonFromCsv(`${dataFileFolderName}\/${inputPath}`);
  
  // Full blobs with websites
  let bizData = await findBizData(bizType);
  let bizDataPlusSites = await findBizSites(batchSize>0 ? bizData.slice(0, Math.min(batchSize, bizData.length)) : bizData);
  bizDataBlobs = bizDataPlusSites.map(bizDataBlob => project(bizDataBlob, desiredFields));

  // Pull out just websites
  let justSites = bizDataBlobs.map(blob => blob.website);

  // Find emails
  await run(justSites).then((foundEmailBlobsDict) => {
    //COMBINE BLOBS
    for(const bizDataBlob of bizDataBlobs) {
      let website = bizDataBlob.website;
      let emailsSet = foundEmailBlobsDict[website];
      if(emailsSet) {
        bizDataBlob.firstEmail = emailsSet.values().next().value;
        emailsSet.delete(bizDataBlob.firstEmail);
        bizDataBlob.emails = emailsSet.size > 0 ? Array.from(emailsSet) : undefined;
      }
    }

    return fileWrite(bizDataBlobs.filter(blob => blob.firstEmail), bizType);
  }).catch((err) => console.error(err));
};

let fileWrite = async (bizSitesArr, bizType) => {
  const csv = new ObjectsToCsv(bizSitesArr);

  // Save to file:
  await csv.toDisk(`./${fileName}-${bizType}.csv`);

  console.log("POG POG POG POG POG POG POG POG POG POG POG POG POG POG POG POG POG POG POG POG POG POG POG POG POG POG FILE SAVED POG POG POG POG POG POG POG POG POG POG POG POG POG POG POG POG POG POG POG POG");
};

// Run scraper
const run = async (urls) => {
  let websitesToFoundEmails = {};

  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 5,
    timeout: 60000,
    retryLimit: 3,
    skipDuplicateUrls: true
  });
  cluster.on('taskerror', (err, data) => {
    console.log(`Error crawling ${data.nextUrl}: ${err}`);
  });
  await cluster.task(({page, data}) => siteSearchTask(page, data)).catch(e => console.error(e));

  let numEmailsFoundOnSite = 0;
  let currMainWebsite;
  let mainSitesVisited = 0;

  while (urls.length > 0) {
    // We shift the nested urls because we need to look at them in the order
    // they were added, so that the depth goes in order. Otherwise, we might
    // cache the page as viewed at the max depth, but we were really supposed to
    // look at it in an earlier depth too, and find nested links.
    const next = urls.shift();
    console.log(++mainSitesVisited);

    // Assume `next` is a string
    let nextUrl = next;

    // Set the default current depth
    let currentDepth = 1;

    // NOT a nested website, so restart our email count (new site)
    currMainWebsite = nextUrl;
    numEmailsFoundOnSite = 0;
    if(!isWebsiteProbablySMB(nextUrl)) {
      console.log(`${nextUrl} skipped as it is probably not an SMB`)
      continue;
    }

    // Optimization to help with searching pages twice

    try {

      // Pull out domain from current URL
      let currDomain = nextUrl.match(domainRegex);

      // Navigate to the page and accept DOMContentLoaded instead of a load event
      cluster.queue({
        numEmailsFoundOnSite: numEmailsFoundOnSite, 
        currMainWebsite: currMainWebsite, 
        currDomain: currDomain,
        websitesToFoundEmails: websitesToFoundEmails,
        next: next, 
        nextUrl: nextUrl,
        url: nextUrl,
        currentDepth: currentDepth
      });

    } catch (err) {
      // Spit out the error, but continue
      console.log(`The following error occurred while searching ${nextUrl}:`);
      console.error(err);
    }
  }

  await cluster.idle();
  console.log("\n\n\n\nGONNA CLOSE THE CLUSTER NOW WATCH OUT EVERYBODY\n\n\n\n");
  console.log("We're about to try to save:");
  console.log(websitesToFoundEmails);
  await cluster.close();
  return websitesToFoundEmails;
};
let wrapper = async () => {
  for(let bizType of bizTypes) {
    await main(bizType);
  }
}

wrapper();