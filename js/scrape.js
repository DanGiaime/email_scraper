const {maxDepth, emailRegex, maxEmailsPerSite, maxNestedLinks} = require("./config");
const {promiseTimeout, addToDictionaryArray} = require("./helpers");

// Globals
let searchedUrls = {};

let siteSearchTask = async (page, data) => {
    if (searchedUrls !== undefined && searchedUrls[data.nextUrl]) {
      // we have already searched this page, don't do it again
      return;
    }
    
    if (searchedUrls === undefined) {
        searchedUrls = {};
    }

    searchedUrls[data.nextUrl] = true;
    console.log(`Attempting to search: ${data.nextUrl} at depth ${data.currentDepth}`)
    await page.goto(data.nextUrl, {
      waitUntil: "domcontentloaded"
    });        
    await checkForEmails(page, data);
    await searchForNestedUrls(page, data);
};

let searchForNestedUrls = async (page, searchScope) => {

    let {currentDepth, numEmailsFoundOnSite, websitesToFoundEmails, currMainWebsite, currDomain} = searchScope;
    let currentPageNestedUrls = [];
  
    if(currentDepth > maxDepth) {
      return;
    }
    
    // Get all the links on the page
    const links = await page.$$("a");
  
    for (var i = 0; i < links.length; i++) {
      if(numEmailsFoundOnSite >= maxEmailsPerSite) {
        break;
      }
  
      let href = await promiseTimeout(10000, links[i].getProperty("href"));
      href = await href.jsonValue();
  
      if (/mailto/gi.test(href)) {
        // The link is a mailto: link, so save it as an email found, and DO NOT add to nested links

        if(emailRegex.test(href)) {
            websitesToFoundEmails = addToDictionaryArray(websitesToFoundEmails || {}, currMainWebsite, href.match(emailRegex)[0].toLowerCase());
          numEmailsFoundOnSite++;
        }
        console.log(websitesToFoundEmails);
        // We don't want to count the link as a searchable page, so skip rest of iteration
  
        continue;
      }
  
      if(i > maxNestedLinks) continue;
  
      // Check if we should search the found page for more links
      if (currentDepth < maxDepth && href.includes(currDomain)) {
        // We are not at the max depth, add it to the list to be searched
        currentPageNestedUrls.push(href);
      }
    }
  
    for(nestedUrl of currentPageNestedUrls) {
      let data = {
        ...searchScope,
        currentDepth: currentDepth + 1,
        nextUrl: nestedUrl,
        next: nestedUrl,
        url: nestedUrl
      };
      await siteSearchTask(page, data);
    }
  };
  
let checkForEmails = async (page, searchScope) => {
    let {numEmailsFoundOnSite, currMainWebsite, websitesToFoundEmails} = searchScope;
    // Get the whole page text
    const body = await page.evaluate(() => document.body.innerText);

    // Find any emails on the page
    // MatchAll to get multiple emails in body
    // for..of to go through iterator
    for(const emailBlob of body.matchAll(emailRegex)) {        
        // Leave if we've found enough emails
        if(numEmailsFoundOnSite >= maxEmailsPerSite) {
        break;
        }

        // index 0 is the full match, the rest of the array is pieces we don't want
        websitesToFoundEmails = addToDictionaryArray(websitesToFoundEmails, currMainWebsite, emailBlob[0]);

        numEmailsFoundOnSite++;
    };
};

module.exports = {
    checkForEmails: checkForEmails,
    searchForNestedUrls: searchForNestedUrls,
    siteSearchTask: siteSearchTask
};