const {chicagoBizEndpointURL, bingSearchAPIURL, bingSearchAPIURLTail, chicagoBizOwnerEndpoint, googlePlaceDetailsAPIUrl, googlePlaceIDAPIUrl, yelpMatchAPIUrl, yelpDetailsAPIUrl} = require('./constants');
const {project, sleep} = require('./helpers');
const {azureAPIKey, googleAPIKey, yelpAPIKey} = require('./config');
const fetch = require('node-fetch');
const {testData} = require('./constants');

const yelpSiteRegex = /"businessWebsite":(\{.*?\})/m;
const searchByKeyword = true;

// Find names of all businesses in chicago
let findBizData = async (bizType) => {
    console.log(bizType);
    let bizData;
    // Search business activity by keyword
    if(searchByKeyword) {
        bizData = await fetch(`${chicagoBizEndpointURL}`, {
            method: 'get',
        })
        .then(res => res.json())
        .catch(e => console.error(e));
        var re = new RegExp(bizType, "gmi");
        bizData = bizData.filter(bizData => re.test(bizData.business_activity));
        console.log(`Businesses found with keyword: ${bizData.length}`);
    }
    else {
        bizData = await fetch(`${chicagoBizEndpointURL}&business_activity=${encodeURI(bizType)}`, {
            method: 'get',
        })
        .then(res => res.json())
        .catch(e => console.error(e));
    }
  
    return bizData;
  }
  
  // Find business owner names
let findBizOwners = async (bizName) => {
    let bizData = await fetch(`${chicagoBizOwnerEndpoint}${bizName}`, {
        method: 'get',
    })
    .then(res => res.json())
    .catch(e => console.error(e));

    let adjustedOwnerData = {owners: []};
    try {
        if(bizData) {
            let [firstOwner, ...otherOwners] = bizData;
            console.log(`${JSON.stringify(firstOwner)} ${JSON.stringify(otherOwners)}`);
            adjustedOwnerData.firstOwnerName = `${(firstOwner.owner_first_name || firstOwner.owner_name)} - ${firstOwner.owner_last_name || ""}`;
            adjustedOwnerData.firstOwnerTitle = `${firstOwner.owner_title}`;
            if(otherOwners) {
                adjustedOwnerData.owners = otherOwners.map(ownerData => `${(ownerData.owner_first_name || firstOwner.owner_name)} ${ownerData.owner_last_name} - ${ownerData.owner_title}`);
            }
        }
        return adjustedOwnerData;
    }
    catch {
        return {owners: []};
    }

}

  // Find websites of all chicago businesses
  let findBizSitesWithBing = async (bizData) => {
  
    if(!bizData)  {
        return [];
    }

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
        if(bizSiteData?.webPages?.value?.[0]?.url) {
            console.log(`Found site from ${bizData[i].doing_business_as_name}! - ${bizSiteData.webPages.value[0].url}`);
            // add biz url to existing data payload for business
            bizData[i].website = bizSiteData.webPages.value[0].url;
            let match = bizData[i].website.toString().search(/wikipedia|opengov|chicagonow|yimg|twitter|vimeo|instagram|youtube|facebook|fonts|google|amazon|ebay|yahoo|yelp|\.(js|jpg|jpeg|jpe|jif|jfif|jfi|css|gif|png|jp2|j2k|jpf|jpx|jpm|mj2|svg|svgz|pdf|bmp|dib|amp)/g)
            if(match != -1) {
                console.log(`${bizData[i].website} lookin bad: `);
                console.log(JSON.stringify(bizData[i]));
                bizData.splice(i, 1);
                i--;
            }
        }
        else {
            bizData.splice(i, 1);
        }
    }
    
    return bizData;
  };

  // Find websites of all chicago businesses
  let findBizSitesWithGoogle = async (bizData) => {
  
    // Search each site individually  
    for (let i = 0; i < bizData.length; i++) { 
        let placeIDBlob = await fetch(`${googlePlaceIDAPIUrl}&input=${bizData[i].doing_business_as_name} ${bizData[i].address}&key=${googleAPIKey}`, {method: 'get'})
        .then(res => res.json())
        .catch(e => console.error(e));
        await sleep(1000);
        console.log(`Searching ${bizData[i].doing_business_as_name}`);
        let bizSiteData;
        try {
            let placeID = placeIDBlob.candidates[0].place_id;
            //console.log(`found: ${placeID}`);

            
            bizSiteData = await fetch(`${googlePlaceDetailsAPIUrl}&place_id=${placeID}&key=${googleAPIKey}`, {method: 'get'})
            .then(res => res.json())
            .catch(e => console.error(e)); //replace this whole blob with testData when testing to not waste money
                
            // Rate limit ourselves (may be unnecessary)
            // await sleep(20);
            
        }
        catch {
            console.log(`Place ID Not found for ${bizData[i].doing_business_as_name}: ${JSON.stringify(placeIDBlob)}`);
        }
        if(bizSiteData && bizSiteData.result && bizSiteData.result.website) {
            console.log(`Found site from ${bizData[i].doing_business_as_name}! - ${bizSiteData.result.website}`);
            bizData[i].website = bizSiteData.result.website;
        }
        else {
            bizData.splice(i, 1);
        }
    }
    
    return bizData;
  };

// Find websites of all chicago businesses
let findbizSitesWithYelp = async (bizData) => {

    // Search each site individually  
    for (let i = 0; i < bizData.length; i++) { 

        // Search yelp matches to find exact business
        let yelpBlob = await fetch(encodeURI(`${yelpMatchAPIUrl}&name=${bizData[i].doing_business_as_name.replace(/[^\w\s]/g, '').substr(0,64)}&address1=${bizData[i].address.replace(/[^\w\s]/g, '')}`), 
        {
            method: 'get',
            headers: {
                'Authorization': 'Bearer ' + yelpAPIKey
            }
        })
        .then(res => res.json())
        .catch(e => console.error(e));
        //await sleep(100); // TODO: Delete?
        console.log(`Searching ${bizData[i].doing_business_as_name} - ${JSON.stringify(yelpBlob)}
        
        `);
        let bizSite;
        try {
            let yelpID = yelpBlob?.businesses?.[0]?.id;
            if(!yelpID) {
                console.log(`NO MATCHES FOR - ${bizData[i].doing_business_as_name}`);
                yelpSite = undefined;
            }
            else {
                //console.log(`found: ${placeID}`);

                // Search yelp ID to get yelp site

                bizSiteData = await fetch(`${yelpDetailsAPIUrl}/${yelpID}`, 
                {
                    method: 'get',
                    headers: {
                        'Authorization': 'Bearer ' + yelpAPIKey, 
                    }
                })
                .then(res => res.json())
                .catch(e => console.error(e)); //replace this whole blob with testData when testing to not waste money
                    
                // Rate limit ourselves (may be unnecessary)
                // await sleep(20);

                let yelpUrl = bizSiteData?.url;
                let yelpWebsite;
                if(!yelpUrl) {
                    bizSite = undefined;
                }
                else {

                    console.log(yelpUrl);

                    yelpWebsite = await fetch(`${yelpUrl}`, {method: 'get'})
                    .then(res => res.text())
                    .then(html => {
                        //console.log("HTML:" + JSON.stringify(html));
                        // Find the JSON blob from the html
                        let bizSiteJSONBlob = html.match(yelpSiteRegex);

                        // If we didn't find it, bail
                        if(!bizSiteJSONBlob) {
                            bizSite = undefined;
                        }
                        else {
                            // Get the CAPTURE GROUP (not full match)
                            let justJSONBlob = bizSiteJSONBlob[1];

                            // Convert captured group string to json
                            let bizSiteObj = JSON.parse(justJSONBlob);

                            // Grab link out of blob!
                            let bizSite = bizSiteObj['linkText'];
                            if(bizSite) {
                                console.log("Yelp found a site!")
                            }
                            return bizSite;
                        }
                    })
                    .catch(e => console.error(e)); //replace this whole blob with testData when testing to not waste money
                }
                if(yelpWebsite && !yelpWebsite.includes('http')) {
                    yelpWebsite = 'http://' + yelpWebsite;
                }
                bizSite = yelpWebsite;
            }
        }
        catch (e) {
            console.log(`Error searching ${bizData[i].doing_business_as_name}: ${JSON.stringify(yelpBlob)}`);
            console.error(e);
        }
        if(bizSite) {
            console.log(`Found site from ${bizData[i].doing_business_as_name}! - ${bizSite}`);
            bizData[i].website = bizSite;
        }
        else {
            bizData.splice(i, 1);
        }
    }
    
    return bizData;
};


module.exports = {
    findBizSitesWithBing,
    findBizSitesWithGoogle,
    findBizData,
    findBizOwners,
    findbizSitesWithYelp
};