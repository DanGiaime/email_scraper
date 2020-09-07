const ObjectsToCsv = require('objects-to-csv');
const {fileName} = require('./config');

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
  
const addToDictionaryArray = (dict, key, val) => {
    if(dict != undefined && dict[key]) {
        dict[key].add(val);
    }
    else if (dict != undefined) {
        dict[key] = new Set([val]);
    }
    else {
        dict = {key: new Set([val])};
    }
    return dict;
}
  
const isWebsiteProbablySMB = (site) => {
    return site != undefined && site.length < 50;
}

// Write out biz websites to single-column csv (correct format for phantombuster)
let fileWrite = async (bizSitesArr) => {
    const csv = new ObjectsToCsv(bizSitesArr);
  
    // Save to file:
    await csv.toDisk(`./${fileName}.csv`);
};

// literally just a sleep method to stop from going too fast - https://i.kym-cdn.com/entries/icons/original/000/006/360/gottago.jpg
let sleep = async (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// gets rid of all fields from obj except those in projection
function project(obj, projection) {
  let projectedObj = {}
  for(let key in projection) {
      projectedObj[key] = obj[key];
  }
  return projectedObj;
}

module.exports = {
    fileWrite,
    sleep,
    project,
    promiseTimeout,
    addToDictionaryArray,
    isWebsiteProbablySMB
  };