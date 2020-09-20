// endpoint for the chicago business data
let chicagoBizEndpointURL = `https://data.cityofchicago.org/resource/uupf-x98q.json?$limit=800000`;

// endpoint for the chicago business owner names & titles
const chicagoBizOwnerEndpoint = "https://data.cityofchicago.org/resource/ezma-pppn.json?$limit=800000&doing_business_as_name=";

// bing search api url
const bingSearchAPIURL = "https://api.cognitive.microsoft.com/bing/v7.0/search?q="

// options/query params for ing search (format is bingSearchAPIURL + BIZ_NAME + bingSearchAPIURLTail)
const bingSearchAPIURLTail = " -site:yelp.com -site:facebook.com -site:beautylaunchpad.com -site:es.wikipedia.org -site:groupon.com -site:yellowpages.com -site:mapquest.com&count=3&responseFilter=Webpages";

// find google ID from real world address
const googlePlaceIDAPIUrl = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json?&inputtype=textquery";

// from google ID to website and name
const googlePlaceDetailsAPIUrl = "https://maps.googleapis.com/maps/api/place/details/json?fields=name,formatted_phone_number,international_phone_number,opening_hours,website";

// find yelp ID from real world address (need several fields)
const yelpMatchAPIUrl = "https://api.yelp.com/v3/businesses/matches?city=Chicago&state=IL&country=US";

// from google ID to website and name
const yelpDetailsAPIUrl = "https://api.yelp.com/v3/businesses";

// what data we want for each biz owner
const ownerDesiredFields = {
    owner_first_name: '',
    owner_last_name: '',
    owner_title: ''
};

// Different APIs we can use
const SOURCES = {
    YELP: 'yelp',
    GOOGLE: 'google',
    BING: 'bing'
}

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
    testData,
    ownerDesiredFields,
    chicagoBizOwnerEndpoint,
    googlePlaceIDAPIUrl,
    googlePlaceDetailsAPIUrl,
    yelpDetailsAPIUrl,
    yelpMatchAPIUrl,
    SOURCES
};