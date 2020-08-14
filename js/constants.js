const { bizType } = require('./config');

// endpoint for the chicago business data
const chicagoBizEndpointURL = `https://data.cityofchicago.org/resource/uupf-x98q.json?business_activity=${encodeURI(bizType)}&$limit=2000`;

// bing search api url
const bingSearchAPIURL = "https://api.cognitive.microsoft.com/bing/v7.0/search?q="

// options/query params for ing search (format is bingSearchAPIURL + BIZ_NAME + bingSearchAPIURLTail)
const bingSearchAPIURLTail = " -site:yelp.com -site:facebook.com -site:beautylaunchpad.com -site:es.wikipedia.org -site:groupon.com -site:yellowpages.com -site:mapquest.com&count=3&responseFilter=Webpages";

// Probably won't need this, but might as well keep it around.
const testData = {
    doing_business_as_name: "spaghetti, inc",
    webPages: {
        value: [
            {
                url: "http://marimarshesalons.com/"
            }
        ]
    }
}

module.exports = {
    bingSearchAPIURLTail,
    bingSearchAPIURL,
    chicagoBizEndpointURL,
    testData
};