const {chicagoBizEndpointURL, bingSearchAPIURL, bingSearchAPIURLTail} = require('./constants');
const {azureAPIKey} = require('./config');
const fetch = require('node-fetch');
const {testData} = require('./constants');

// Find names of all businesses in chicago
let findBizData = async (bizType) => {
    let bizData = await fetch(`${chicagoBizEndpointURL}&business_activity=${encodeURI(bizType)}`, {
          method: 'get',
      })
      .then(res => res.json())
      .catch(e => console.error(e));
  
    return bizData;
  }
  
  // Find websites of all chicago businesses
  let findBizSites = async (bizData) => {
  
    // Search each site individually  
    for (let i = 0; i < bizData.length; i++) { 
        let bizSiteData = await fetch(bingSearchAPIURL + bizData[i].doing_business_as_name + bingSearchAPIURLTail, {
            method: 'get',
            headers: {
                "Ocp-Apim-Subscription-Key": azureAPIKey
            }
        })
        .then(res => res.json())
        .catch(e => console.error(e)); //replace this whole blob with testData when testing to not waste money
            
        // Rate limit ourselves (may be unnecessary)
        // await sleep(20);
        console.log(`Found site from ${bizData[i].doing_business_as_name}! - ${bizSiteData.webPages.value[0].url}`);

        // add biz url to existing data payload for business
        bizData[i].website = bizSiteData.webPages.value[0].url;
        let match = bizData[i].website.toString().search(/wikipedia|opengov|chicagonow|yimg|twitter|vimeo|instagram|youtube|facebook|fonts|google|amazon|ebay|yahoo|yelp|\.(js|jpg|jpeg|jpe|jif|jfif|jfi|css|gif|png|jp2|j2k|jpf|jpx|jpm|mj2|svg|svgz|pdf|bmp|dib|amp)/g)
        if(match != -1) {
            console.log(`${bizData[i].website} lookin bad`)
            bizData.splice(i, 1);
            i--;
        }
    }
    
    return bizData;
  };

module.exports = {
    findBizSites,
    findBizData
};