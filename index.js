const puppeteer = require("puppeteer");
const fs = require('fs');
var parse = require('csv-parse');

const foundEmails = [];

const searchedUrls = {};
const currentPageNestedUrls = [];

const maxDepth = 2;
let numParsed = 0;
const maxNestedLinks = 10;

let domainRegex = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img;
let bizType = "Hair Salons";
let inputPath = './test.csv';

// Main function, needed for async
let wrapper = async () => {
    fs.readFile(inputPath, function (err, fileData) {
        return parse(fileData, {columns: false, trim: true}, async function(err, rows) {
            if(err) console.error(err);
            run(rows.flat().slice(0, 1)).then(() => {
              console.log(foundEmails);
              return fileWrite(
                [...new Set(foundEmails.map(
                  emailBlob => emailBlob[1]
                ))]);
            }).catch((err) => console.error(err));
        })
    })
};

let fileWrite = (csvData) => {
  let bizSitesFormatted = csvData.join("\n");
  let fileName = bizType; 

  fs.writeFile(`${fileName}.csv`, bizSitesFormatted, (err) => {
    if (err) throw err;
    console.log('The file has been saved! POG');
  });
};

// Run scraper
const run = async (urls) => {
  const browser = await puppeteer.launch();

  const page = await browser.newPage();
  let currDomain;

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
      console.log(`Nested links found: ${links.length}`);

      for (var i = 0; i < links.length; i++) {
        // Get the value of the href property from the link
        console.log("Start iter");
        let href = await links[i].getProperty("href");
        console.log("Found property");
        href = await href.jsonValue();

        console.log("Found json value");

        if (/mailto/gi.test(href)) {
          // The link is a mailto: link, so save it as an email found
          foundEmails.push([nextUrl, href.replace(/mailto:/gi, "")]);
          currentPageNestedUrls.length = 0;
          console.log("Found href");

          // We don't want to count the link as a searchable page
          continue;
        }

        console.log("Might skip because of nested links");
        if(i > maxNestedLinks) continue;
        console.log("Did not skip");

        // Check if we should search the found page for more links
        if (currentDepth < maxDepth && href.includes(currDomain)) {
          // We are not at the max depth, add it to the list to be searched
          console.log("Nested pages found!");
          currentPageNestedUrls.push([href, currentDepth]);
        }
      }

      // Get the whole page text
      const body = await page.evaluate(() => document.body.innerText);

      // Find any emails on the page
      (body.match(/\S+@\S+/g) || []).forEach((email) => {
        // Push the email to the emails array
        console.log("Email found!");
        currentPageNestedUrls.length = 0;
        foundEmails.push([nextUrl, email.replace(/^\.|\.$/, "")]);
      });
    } catch (err) {
      // Spit out the error, but continue
      console.log(`The following error occurred while searching ${nextUrl}:`);
      console.error(err);
    }
  }

  await browser.close();
};

wrapper();