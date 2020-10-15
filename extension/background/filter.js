/**
 * @desc Simple exception URLs list manager implementation.
 * It allows adding 2 types of URLs: simple (PLAIN) and regular expression (REGEX)
 * Each URL entry is of type {
 *     url: the url text,
 *     type: PLAIN/REGEX,
 *     id: unique id to identify an entry
 * }
 * It uses the local storage "exceptions" key to persist data.  
 * 
 * @author Mihai Fantana
 **/

function Filter() {
    this.init();
};

let ExceptionTypes = {
    PLAIN: 0,
    REGEX: 1
}

/**
 * @desc Filter list initialization.
 * Loads list from local storage
 */
Filter.prototype.init = function() {
    this.exceptions = [];

    chrome.storage.local.get(['exceptions'], function(data) {
        this.exceptions = (data && data.exceptions && JSON.parse(data.exceptions)) || [];
    }.bind(this));
}

/**
 * @desc Returns a copy of all exceptions rules
 */
Filter.prototype.getAllExceptions = function() {
    return JSON.parse(JSON.stringify(this.exceptions));
}

/**
 * @desc Add an exception rule.
 * It sets up a unique id as the id of the last element in the list + 1
 * @returns unique id of the added rule 
 */
Filter.prototype.addException = function(url) {
    if (!url) { return; }

    let uniqueId = (this.exceptions.length > 0 && this.exceptions[this.exceptions.length - 1].id + 1) || 0;

    let type = url.startsWith("r:") ? ExceptionTypes.REGEX : ExceptionTypes.PLAIN;

    this.exceptions.push({
        id: uniqueId,
        type: type,
        url: url
    });

    chrome.storage.local.set({
        exceptions: JSON.stringify(this.exceptions)
    });

    return uniqueId;
}

/**
 * @desc Update an exception rule.
 */
Filter.prototype.updateException = function(id, url) {
    if ((!id && id !== 0) || !url) { return; }
    
    let exception = this.exceptions.find(item => item.id === id);
    if (!exception) { return; }

    let type = url.startsWith("r:") ? ExceptionTypes.REGEX : ExceptionTypes.PLAIN;
    exception.url = url;
    exception.type = type;

    chrome.storage.local.set({
        exceptions: JSON.stringify(this.exceptions)
    });
}

/**
 * @desc Delete an exception rule by id
 * @param id = unique id of the exception rule
 */
Filter.prototype.removeExceptionById = function(id) {
    this.exceptions = this.exceptions.filter(item => item.id !== id);

    chrome.storage.local.set({
        exceptions: JSON.stringify(this.exceptions)
    });
}

/**
 * @desc Checks if a url string is a match for one of the exception rules
 * @param url to be checked
 * @returns true/false
 */
Filter.prototype.isException = function(url) {
    return this.exceptions.length > 0 && !!this.exceptions.find(item =>
        item.type === ExceptionTypes.PLAIN ? 
            item.url === url :
            new RegExp(item.url.slice(2)).test(url)
    ) 
}
