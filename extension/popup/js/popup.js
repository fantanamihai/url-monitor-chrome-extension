/**
 * @desc URL monitor extension, popup UI functionality
 * 
 * @author Mihai Fantana
 **/

/**
 * @desc On page load, setup:
 *  - quick overview presentation
 *  - window title
 *  - main UI handlers
 *  - keep alive UI handler 
 */
$(function(){
    setupIntro();
    setupTitle();
    setupHandlers();
    setupUiFilters();
    setupBackendKeepAlive();
})

/**
 * @desc Sets up quick overview scenarios uing introJS
 * It uses local storage "intro" key to persist quick overview was already seen.
 */
function setupIntro() {  
    chrome.storage.local.get(['intro'], function(data) {
        if (data.intro) { return; }
        
        const steps = [
        {
            element: '.window-title-container',
            intro: "Url Monitor demo quick overview"
        }, {
            element: '.add-exception',
            intro: "To add a new Url exception please click on this button"
        },
        {
            element: '.exception-container',
            intro: "This is where the URL exceptions list is shown"
        },
        {
            element: '.exception:first-child',
            intro: "Url format can be a simple plain value..."
        },
        {
            element: '.exception:nth-child(2)',
            intro: "... or a regular expression value (using <font color='white' style='background-color:red; padding:0 5px;'>r:</font> prefix)"
        },
        {
            element: '.exception:last-child',
            intro: "Empty values are not accepted"
        },
        {
            element: '.exception:last-child .btn-accept',
            intro: "Add URL by pressing accept button"
        },
        {
            element: '.exception:last-child',
            intro: "Editing an URL is done in 2 steps."
        },
        {
            element: '.exception:last-child .btn-edit',
            intro: " First press edit button..."
        },
        {
            element: '.exception:last-child .btn-accept',
            intro: "... then modify the value end press accept"
        },
        {
            element: '.exception:last-child .btn-delete',
            intro: "Delete URL by pressing delete button"
        },
        {
            element: '.window-status-bar',
            intro: "Backend receiver alive status can be seen here"
        }];

        const intro = introJs();
        intro.setOptions({
            steps: steps,
            showStepNumbers: false,
            showProgress: true,
            showBullets: false,
            exitOnOverlayClick: false,
            hideNext: true
        });
        intro.onbeforechange(function (stepId) {
            //re-evaluate element 
            this._introItems[this._currentStep].element = document.querySelector(this._options.steps[this._currentStep].element);

            if (this._currentStep === 2) {
                $(".add-exception").click();
            } else
            if (this._currentStep === 6) {
                $(".exception:last-child input:invalid").val("http://example.com");
            } else
            if (this._currentStep === 7) {
                $(".exception:last-child .btn-accept").click();
            } else
            if (this._currentStep === 9) {
                $(".exception:last-child .btn-edit").click();
            } else
            if (this._currentStep === 10) {
                $(".exception:last-child .btn-accept").click();
            } else
            if (this._currentStep === 11) {
                $(".exception:last-child .btn-delete").click();
            }
        });
        
        intro.oncomplete(function() {
            chrome.storage.local.set({
                intro: true
            });
        })
      
        intro.onexit(function() {
            chrome.storage.local.set({
                intro: true
            });
        });

        intro.start();
    });
}

/**
 * @desc Adds to window title the extension version taken from manifest
 */
function setupTitle(){
    let manifestData = chrome.runtime.getManifest();
    let version =  manifestData && `v${manifestData.version}`;
    $(".window-title-version").text(version);
}

/**
 * @desc Adds UI exception URL list line.
 * Based on parameter value, the line is set up as new or click-to-edit.
 * A UI line is created by cloning the hidden ".template" element.
 * ".template" class is replaced with ".exception" class.
 * The line is set up in edit mode by adding ".edit" class. 
 * @param data - Filter data  
 */
function addUiException(data) {
    let $exception = $(".template")
            .clone()
            .toggleClass("template exception")
            .toggleClass("edit", !data)
            .show();
    
    if (data) {
        $exception.attr("data-id", data.id);
        $exception.find(".input-url")
            .prop("readonly", true)
            .val(data.url);
    }

    $(".exception-container").append($exception);
}

/**
 * @desc Set up UI handlers for:
 *  - input validation
 *  - accept, edit, delete functionality
 * Exception URL list is accessed through "chrome.extension.getBackgroundPage()" API
 */
function setupHandlers() {
    $(".add-exception").click(function(){
        addUiException();
    });

    $(".exception-container").on("blur", ".exception input", function(){
        this.checkValidity();
    });

    $(".exception-container").on("click", ".exception .btn-accept", function() {
        let $el = $(this).parents(".exception");
        let $input = $el.find(".input-url");

        if ($input.is(":invalid")) {
            return;
        }

        let id = $el.data("id");
        let url = $input.val();
        if (id == 0 || id){
            chrome.extension.getBackgroundPage().ExceptionFilter.updateException(id, url);
        } else {
            id = chrome.extension.getBackgroundPage().ExceptionFilter.addException(url);
            $el.attr("data-id", id);
        }

        $el.removeClass("edit");
        $input.prop("readonly", true);
    });

    $(".exception-container").on("click", ".exception .btn-edit", function() {
        let $el = $(this).parents(".exception");
        let $input = $el.find(".input-url");

        $el.addClass("edit");
        $input.prop("readonly", false);
    });

    $(".exception-container").on("click", ".exception .btn-delete", function(){
        let $el = $(this).parents(".exception");

        let id = $el.data("id");
        if (id == 0 || id) {
            chrome.extension.getBackgroundPage().ExceptionFilter.removeExceptionById(id);
        }

        $el.remove();   
    })
}

/**
 * @desc Render all persisted exception rules
 */
function setupUiFilters() {
    var exceptions = chrome.extension.getBackgroundPage().ExceptionFilter.getAllExceptions();
    for (let i = 0; i < exceptions.length; i++) {
        addUiException(exceptions[i]);
    }
} 

/**
 * @desc Keep alive UI handler setup
 * It shows the backend url domain in the window status bar. 
 * It adds a listener for "keepAliveChanged" background message
 */
function setupBackendKeepAlive() {
    let backend = chrome.extension.getBackgroundPage().Backend;
    let backendUrl = backend.keepAliveUrl;
    
    //extract url origin
    const url = document.createElement('a');
    url.setAttribute('href', backendUrl);
    
    $(".backend-url").text(`Backend host ${url.origin}`);
    $(".backend-status").toggleClass("alive", backend.alive);

    chrome.runtime.onMessage.addListener(
        function(request, sender, sendResponse) {
            if (request.msg === "keepAliveChanged") {
                $(".backend-status").toggleClass("alive", request.alive);
            }
        }
    );
}
