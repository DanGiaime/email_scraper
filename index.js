const puppeteer = require("puppeteer");
const fs = require('fs');
let csvToJson = require('convert-csv-to-json');
const ObjectsToCsv = require('objects-to-csv');
 

const searchedUrls = {};
const currentPageNestedUrls = [];

const maxDepth = 2;
let numParsed = 0;
const maxNestedLinks = 10;

const maxEmailsPerSite = 10;


let domainRegex = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img;
const fileName = "Big Data Test";
let inputPath = './testy-test.csv';

// Sourced from - https://emailregex.com/, 5322 RFC, Javascript version
const emailRegex = /(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g;

// Main function, needed for async
let wrapper = async () => {

  // Full blobs with websites
  let bizDataBlobs = await csvToJson.fieldDelimiter(';').getJsonFromCsv(inputPath);
  bizDataBlobs = bizDataBlobs.slice(200, 400); // - used for testing subsets
  console.log(bizDataBlobs);

  // Pull out just websites
  let justSites = bizDataBlobs.map(blob => blob.website);

  // Find emails
  run(justSites).then((foundEmailBlobsDict) => {
    console.log(foundEmailBlobsDict);

    //COMBINE BLOBS
    for(const bizDataBlob of bizDataBlobs) {
      let website = bizDataBlob.website;
      let emailsSet = foundEmailBlobsDict[website];
      if(emailsSet) {
        console.log(`found email ${emailsSet.size}`);
        bizDataBlob.firstEmail = emailsSet.values().next().value;
        emailsSet.delete(bizDataBlob.firstEmail);
        bizDataBlob.emails = emailsSet.size > 0 ? Array.from(emailsSet) : undefined;
      }
    }

    return fileWrite(bizDataBlobs.filter(blob => blob.firstEmail));
  }).catch((err) => console.error(err));
};

let fileWrite = async (bizSitesArr) => {
  const csv = new ObjectsToCsv(bizSitesArr);

  // Save to file:
  await csv.toDisk(`./${fileName}.csv`);

  console.log("POG POG FILE SAVED POG POG");
};

const promiseTimeout = function(ms, promise){

  // Create a promise that rejects in <ms> milliseconds
  let timeout = new Promise((resolve, reject) => {
    let id = setTimeout(() => {
      clearTimeout(id);
      reject('Timed out in '+ ms + 'ms.')
    }, ms)
  })

  // Returns a race between our timeout and the passed in promise
  return Promise.race([
    promise,
    timeout
  ])
}

let addToDictionaryArray = (dict, key, val) => {
  if(dict[key]) {
    dict[key].add(val);
  }
  else {
    dict[key] = new Set([val]);
  }
}

let isWebsiteProbablySMB = (site) => {
  return site.length < 50;
}

// Run scraper
const run = async (urls) => {
  const websitesToFoundEmails = {};

  const browser = await puppeteer.launch();

  const page = await browser.newPage();
  let currDomain;
  let numEmailsFoundOnSite = 0;
  let currMainWebsite;

  while (urls.length || currentPageNestedUrls.length) {
    // We shift the nested urls because we need to look at them in the order
    // they were added, so that the depth goes in order. Otherwise, we might
    // cache the page as viewed at the max depth, but we were really supposed to
    // look at it in an earlier depth too, and find nested links.
    const next = currentPageNestedUrls.shift() || urls.shift();
    console.log(`Parsed ${next}: Total parsed so far: ${++numParsed}`);

    // Assume `next` is a string
    let nextUrl = next;

    // Set the default current depth
    let currentDepth = 1;

    // If `next` is an array, the first element will be the url, and the second
    // will be the depth at which the url was found originally.
    if (Array.isArray(next)) {
      nextUrl = next[0];

      // current depth is the depth where url was found + 1
      currentDepth = next[1] + 1;
    }
    else {
      // NOT a nested website, so restart our email count (new site)
      currMainWebsite = nextUrl;
      numEmailsFoundOnSite = 0;
      if(!isWebsiteProbablySMB(nextUrl)) {
        console.log(`${nextUrl} is probably not an SMB`)
        continue;
      }
    }

    if(numEmailsFoundOnSite >= maxEmailsPerSite) {
      currentPageNestedUrls.length = 0;
      continue;
    }

    // Optimization to help with searching pages twice
    if (searchedUrls[nextUrl]) {
      // we have already searched this page, don't do it again
      continue;
    }

    try {

      // Pull out domain from current URL
      let currDomain = nextUrl.match(domainRegex);

      // Cache the url so we don't search it again in the future
      searchedUrls[nextUrl] = true;

      // Navigate to the page and accept DOMContentLoaded instead of a load
      // event.

      await page.goto(nextUrl, {
        waitUntil: "domcontentloaded",
        timeout: 10000
      });

      // Get all the links on the page
      const links = await page.$$("a");
      //console.log(`Nested links found: ${links.length}`);

      for (var i = 0; i < links.length; i++) {
        if(numEmailsFoundOnSite >= maxEmailsPerSite) {
          currentPageNestedUrls.length = 0;
          continue;
        }

        let href = await promiseTimeout(5000, links[i].getProperty("href"));
        href = await href.jsonValue();

        if (/mailto/gi.test(href)) {
          // The link is a mailto: link, so save it as an email found, and DO NOT add to nested links

          if(emailRegex.test(href)) {
            addToDictionaryArray(websitesToFoundEmails, currMainWebsite, href.match(emailRegex)[0]);
            numEmailsFoundOnSite++;
          }
          console.log(websitesToFoundEmails);
          currentPageNestedUrls.length = 0;

          // We don't want to count the link as a searchable page, so skip rest of iteration

          continue;
        }

        if(i > maxNestedLinks) continue;

        // Check if we should search the found page for more links
        if (currentDepth < maxDepth && href.includes(currDomain)) {
          // We are not at the max depth, add it to the list to be searched
          currentPageNestedUrls.push([href, currentDepth]);
        }
      }

      // Get the whole page text
      const body = await page.evaluate(() => document.body.innerText);

      // Find any emails on the page
      // MatchAll to get multiple emails in body
      // for..of to go through iterator
      for(const emailBlob of body.matchAll(emailRegex)) {
        
        // Leave if we've found enough emails
        if(numEmailsFoundOnSite >= maxEmailsPerSite) {
          currentPageNestedUrls.length = 0;
          continue;
        }

        // Push the email to the emails array
        
        // Empty array of nested pages
        currentPageNestedUrls.length = 0;

        // index 0 is the full match, the rest of the array is pieces we don't want
        console.log(`EMAIL MATCH FOUND: ${emailBlob[0]}`);
        addToDictionaryArray(websitesToFoundEmails, currMainWebsite, emailBlob[0]);

        numEmailsFoundOnSite++;
      };
    } catch (err) {
      // Spit out the error, but continue
      console.log(`The following error occurred while searching ${nextUrl}:`);
      console.error(err);
    }
  }

  await browser.close();
  return websitesToFoundEmails;
};

wrapper();