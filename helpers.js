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
    return site.length < 50;
}

module.exports = {
    promiseTimeout: promiseTimeout,
    addToDictionaryArray: addToDictionaryArray,
    isWebsiteProbablySMB: isWebsiteProbablySMB
  };