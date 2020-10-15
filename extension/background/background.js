/**
 * @desc URL monitor extension, background functionality
 * Monitors all URLs from open tabs using webRequest chrome API. 
 * A list of excepted URLs NOT to be monitored is kept in the ExceptionFilter.  
 * For demo, on first installation time, adds 2 URL exceptions (one simple and one regular expression). 
 * It also tracks backend server up/down status and registers/deregisters webRequest listener accordingly.
 * 
 * @author Mihai Fantana
 **/

/**
 * Declare objects to be accessed from popup file
 */
var ExceptionFilter = new Filter();
var Backend = {
    monitorUrl: "http://localhost:1234/monitor",
    keepAliveUrl: "http://localhost:1234/ping",
    alive: false
};

/**
 * @desc Simple ajax helpers.
 * Implementation to avoid usage of jquery just for this functionality.
 * Parameters inspired by $.ajax.
 * Uses only json data.
 */
let ajax = function (ajaxObject) {
    with(new(this.XMLHttpRequest || ActiveXObject)("Microsoft.XMLHTTP"))
        onreadystatechange = function () {
            readyState ^ 4 || (ajaxObject.complete && ajaxObject.complete(this))
        },
        timeout = ajaxObject.timeout || 0,
        ontimeout = function() {
            ajaxObject.onTimeout && ajaxObject.onTimeout(this)
        },
        open(ajaxObject.method || 'get', ajaxObject.url),
        setRequestHeader("Content-Type", "application/json"),
        send(ajaxObject.data)
}

let post = function(url, data) { ajax({ method: 'post', url: url, data: data, timeout: 100}) }   

/**
 * @desc Start the keep alive status monitoring 
 */
keepAlive();

/**
 * @desc First run detection mechanism to add demo rules
 */
chrome.storage.local.get(["installed"], function(data) {
    if (data.installed) { return; }

    onFirstRun();
});

/**
 * @desc Add demo rules
 */
function onFirstRun() {
    ExceptionFilter.addException("https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png");
    ExceptionFilter.addException("r:https://adservice.google.com/.*");

    chrome.storage.local.set({
        installed: true
    });
};

/**
 * @desc Keep alive status monitoring every 1s 
 **/
function keepAlive() {
    ajax({
        method: 'get',
        url: Backend.keepAliveUrl,
        timeout: 100,
        onTimeout: function(){
            setAlive(false);
        },
        complete: function(xhr) {
            setAlive(xhr.status === 200);
        }
    });

    setTimeout(keepAlive, 1000);
}

/**
  * @desc Keep alive status change callback.
  * Everytime a status change is detected, web request listener is registered/deregistered accordingly.
  * A "keepAliveChanged" message is sent to popup page to allow acknowledge in UI 
  **/
function setAlive(isAlive) {
    if (isAlive === Backend.alive) { return; }
    
    Backend.alive = isAlive;
    if (isAlive) {
        chrome.webRequest.onBeforeRequest.addListener(urlListener, {
            urls: ["<all_urls>"]
        });
    } else {
        chrome.webRequest.onBeforeRequest.removeListener(urlListener);
    }

    chrome.runtime.sendMessage({
        msg: "keepAliveChanged", 
        alive: isAlive
    });
}

/**
  * @desc Web request listener setup.
  * Monitors all URLs and filters out excepted URLs or URLs sent by extensions, i.e. initiator is http or https.
  * Because it cannot use declarativeWebRequest.IgnoreRules chrome API, since it is not available for stable channels,
  * we have to manually check each URL against every excepted URL
  **/
function urlListener(details) {
    //filter out chrome-extension originator
    if (Backend.alive == false || details.initiator == null  || details.initiator.startsWith("http") == false) {
        return;
    }

    if (!ExceptionFilter || ExceptionFilter.isException(details.url)){
        return;
    }
    
    post(Backend.monitorUrl, JSON.stringify({
        url: details.url
    }));
}