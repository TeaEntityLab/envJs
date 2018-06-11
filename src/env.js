var enableLog = window.location.href.indexOf('enable-log') != -1;
function logMessage(...args) {
  if (enableLog) {
    console.log(args);
  }
}

var envObj = {},
	userAgent = navigator.userAgent;
envObj.msie = userAgent.match(/MSIE\/([\d.]+)/) ? true : false;
envObj.webkit = userAgent.match(/WebKit\/([\d.]+)/) ? true : false;
envObj.opera = (userAgent.match(/Opera Mobi/) || userAgent.match(/Opera.([\d.]+)/)) ? true : false;
envObj.android = userAgent.match(/(Android)\s+([\d.]+)/) || userAgent.match(/Silk-Accelerated/) || userAgent.match(/Android/) ? true : false;
envObj.ipad = userAgent.match(/(iPad).*OS\s([\d_]+)/) ? true : false;
envObj.iphone = !envObj.ipad && userAgent.match(/(iPhone\sOS)\s([\d_]+)/) ? true : false;
envObj.webos = userAgent.match(/(webOS|hpwOS)[\s\/]([\d.]+)/) ? true : false;
envObj.touchpad = envObj.webos && userAgent.match(/TouchPad/) ? true : false;
envObj.ios = envObj.ipad || envObj.iphone;
envObj.blackberry = userAgent.match(/BlackBerry/) || userAgent.match(/PlayBook/) ? true : false;
envObj.fennec = userAgent.match(/fennec/i) ? true : false;
envObj.desktop = !(envObj.ios || envObj.android || envObj.blackberry || envObj.opera || envObj.fennec);
envObj.facebookInAppBrowser = (userAgent.indexOf("FBAN") > -1) || (userAgent.indexOf("FBAV") > -1);
envObj.lineInAppBrowser = (userAgent.indexOf("Line") > -1);
envObj.inAppBrowser = envObj.facebookInAppBrowser || envObj.lineInAppBrowser;
if (navigator.platform.substr(0,2) === 'iP'){
  //iOS (iPhone, iPod or iPad)
  var lte9 = /constructor/i.test(window.HTMLElement);
  var nav = window.navigator, ua = nav.userAgent, idb = !!window.indexedDB;
  if (ua.indexOf('Safari') !== -1 && ua.indexOf('Version') !== -1 && !nav.standalone){
    //Safari (WKWebView/Nitro since 6+)
    envObj.safari = true;
  } else if ((!idb && lte9) || !window.statusbar.visible) {
    //UIWebView
    envObj.uiWebview = true;
  } else if ((window.webkit && window.webkit.messageHandlers) || !lte9 || idb){
    //WKWebView
    envObj.wkWebview = true;
  }
}

class EnvUtilsDef {
  constructor() {

  }

  setupCopyToClipboard(args) {
		var version = document.querySelector("meta[name='version']").getAttribute("content");
    this.addScript({
      type: 'text/javascript',
      async: true,
      class: 'Clipboard',
      src: "https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/1.6.0/clipboard.min.js?v=" + version
    }).then(function() {
			var clipboard = new Clipboard(args.copyObj, {
				target: args.target,
				text: args.text,
				action: args.action || "copy"
			});
			clipboard.on("success", function(e) {
				logMessage("success", e);
			});
			clipboard.on("error", function(e) {
				logMessage("error", e);
			});
		});
	}
  bindCopyOn(selector) {
    var self = this;
    var data = self.getPageData();

		self.setupCopyToClipboard({
			copyObj: selector,
			text: function(trigger) {
				var title = (trigger.getAttribute("data-title") && trigger.getAttribute("data-title").trim()) || data.og_title || "",
					url = (trigger.getAttribute("data-url") && trigger.getAttribute("data-url").trim()) || data.og_url || data.pageUrl;
				return (title + ' ' + url);
			}
		});
	}

  stopCopy() {
		if (envObj.desktop) {
			document.body.oncopy = function(e) {
				if (window.clipboardData) {
					window.clipboardData.clearData();
				}
				return false;
			};
			document.body.onselectstart = function(e) {
				return false;
			};
			document.oncontextmenu = function() {
				return false;
			};
		}
	}

	bindShare(selector) {
		var self = this;

    [].forEach.call(document.querySelectorAll(selector), function (item) {

      var el = item,
        type = el.getAttribute("data-type");

      el.addEventListener('click', function () {
        var data = self.getPageData();

        var doShareFunction = function() {
          return self.shareToWeb({
            type: el.getAttribute("data-type"),
            ga_click: el.getAttribute("data-ga-click"),
            url: (el.getAttribute("data-url") && el.getAttribute("data-url").trim()) || data.og_url || data.pageUrl,
            title: (el.getAttribute("data-title") && el.getAttribute("data-title").trim()) || data.og_title || "",
            description: data.og_description || "",
            image: data.og_image || "",
          });
        };

        if (type != 'copy') {
          doShareFunction();
        }
      });

    });
	}
	shareToWeb(args) {
    var self = this;

    var waitingForResultEl = document.querySelector("meta[name='waitingForResult']");

    logMessage("Share Args",args)

		var type = args.type,
			ga_click = args.ga_click,
			url = args.url,
			title = args.title,
			description = args.description,
			image = args.image,
			waitingForResult = waitingForResultEl && waitingForResultEl.getAttribute("content") == "true",
			encodedUrl = encodeURIComponent(url),
			encodedTitle = encodeURIComponent(title),
			encodedDescription = encodeURIComponent(description),
			encodedImage = encodeURIComponent(image),
			encodedAppId = encodeURIComponent("1735307520119524"),
			shareLink = "";

		var theGAData = {
			eventCategory: 'Outbound Link',
			eventAction: ga_click,
			eventLabel: url,
		};

		switch (type) {
			case "facebook":
				shareLink = ("https://www.facebook.com/sharer/sharer.php?u=" + encodedUrl + "&title=" + encodedTitle + "&picture=" + encodedImage + "&description=" + encodedDescription);
				break;
			case "messenger":
				if (envObj.desktop) {
					var FBUIMessengerShareFunction = function() {
						FB.ui({
							method: 'send',
							link: url,
							title: encodedTitle,
							picture: encodedImage,
							description: encodedDescription,
						});
					};

					if (waitingForResult) {
						var self = this;
						self.doWaitingForResult(FBUIMessengerShareFunction);
						return ;
					}
					else {
						FBUIMessengerShareFunction();
					}

					return;
				} else {
					if (envObj.android) {
						if (envObj.inAppBrowser) {
							shareLink = ("fb-messenger://share?link=" + encodedUrl + '&app_id=' + encodedAppId);
						}
						else {
							shareLink = "intent://share/#Intent;scheme=fb-messenger;package=com.facebook.orca;S.android.intent.extra.TEXT=" + encodedUrl + ";end";
						}
					}
					else {
						shareLink = ("fb-messenger-share://?type=FBShareableTypeURL&link=" + encodedUrl);
					}
				}
				// shareLink = ("fb-messenger://share?link=" + encodedUrl + "&title=" + encodedTitle + "&picture=" + encodedImage + "&description=" + encodedDescription);
				break;
			case "google":
				shareLink = "https://plus.google.com/share?url=" + encodedUrl;
				break;
			case "pinterest":
				shareLink = "http://pinterest.com/pin/create/button/?url=" + encodedUrl;
				break;
			case "linkedIn":
				shareLink = "http://www.linkedin.com/cws/share?url=" + encodedUrl + "&original_referer=" + encodedUrl + "&isFramed=false&ts=" + (new Date).getTime();
				break;
			case "twitter":
				shareLink = "https://twitter.com/intent/tweet?text=" + encodedTitle + "&url=" + encodedUrl;
				break;
			case "line":
				if ((! envObj.inAppBrowser)) {
					if (envObj.android) {
						shareLink = "intent://msg/text/" + encodedUrl + "#Intent;scheme=line;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=jp.naver.line.android;end;";
					}
					else {
						shareLink = "line://msg/text/" + encodedUrl;
					}
				}
				else {
					shareLink = "http://line.me/R/msg/text/?" + encodedTitle + "%0D%0A" + encodedUrl;
				}
				// shareLink = "https://timeline.line.me/social-plugin/share?url=" + encodedUrl;
				break;
			case "wechat":
				shareLink = "http://apps.example8.com/app/wechat?url=" + encodedUrl;
				break;
		}

		if (waitingForResult) {
			this.popupCenter(window.location.href + "&callback=" + encodeURIComponent(shareLink), 685, 500);
			return;
		}

		this.popupCenter(shareLink, 685, 500);
		return shareLink;
	}
	popupCenter(e, t, n, i) {
		var r = screen.width / 2 - t / 2,
			s = screen.height / 2 - n / 2;
		return window.open(e, i, "menubar=no,toolbar=no,status=no,width=" + t + ",height=" + n + ",toolbar=no,left=" + r + ",top=" + s);
	}
	doWaitingForResult(callback) {
		var generateShareUrl = document.querySelector("meta[name='generateShareUrl']").getAttribute("content"),
		checkShareUrl = document.querySelector("meta[name='checkShareUrl']").getAttribute("content");

		var actionDone = false;
		var pictureExisting = false;
		this.addScript({
      type: 'text/javascript',
      async: true,
      class: 'LoadingOverlay',
      src: "https://cdn.jsdelivr.net/jquery.loadingoverlay/latest/loadingoverlay.min.js",
    }).then(function() {

			$.LoadingOverlay("show");

			$.get(generateShareUrl, function(data) {
				$.LoadingOverlay("hide");

				pictureExisting = data === "true";
				if (! actionDone) {
					actionDone = true;
					callback();
				}
			})
			.always(function() {
				if (pictureExisting) {
					return;
				}

				var startTime = Date.now();

				var checkShareStatusFunction = function(){

					// Check has the picture been generated for share usages.
					$.get(checkShareUrl, function(data) {

						// consolelogMessage(data);
						var resultExists = data === "true";
						// If the picture is generated or retry too many times
						if (resultExists || Date.now() - startTime > 2 * 1000) {
							$.LoadingOverlay("hide");
							callback();
						} else {
							setTimeout(checkShareStatusFunction, 500);
						}
					});
				};

				setTimeout(checkShareStatusFunction, 500);
			});

		});
	}
  tryInitFBSDK() {
    if (! window.FB) {
      return new Promise(function(resolve, reject) {
        if (! window.fbAsyncInit) {
          window.fbAsyncInit = function() {
            FB.init({
              appId            : 'yourappid',
              autoLogAppEvents : true,
              xfbml            : true,
              version          : 'v3.0'
            });
            resolve(true);
          };
        }

        (function(d, s, id){
           var js, fjs = d.getElementsByTagName(s)[0];
           if (d.getElementById(id)) {return;}
           js = d.createElement(s); js.id = id;
           js.src = "https://connect.facebook.net/en_US/sdk.js";
           fjs.parentNode.insertBefore(js, fjs);
         }(document, 'script', 'facebook-jssdk'));

         setTimeout(function () {
           reject('too long');
         }, 5000)
      });
    }
    else {
      return new Promise(function(resolve, reject) {
        resolve(true)
      });
    }
  }

  getPageData() {

    var og_url_meta = document.querySelector("meta[property='og:url']"),
    og_title_meta = document.querySelector("meta[property='og:title']"),
    og_description_meta = document.querySelector("meta[property='og:description']"),
    og_image_meta = document.querySelector("meta[property='og:image']"),
    pageUrlArr = window.location.href.split('?');

    var data = {
  		og_url: og_url_meta ? og_url_meta.getAttribute('content') : void 0,
  		og_title: og_title_meta ? og_title_meta.getAttribute('content') : void 0,
  		og_description: og_description_meta ? og_description_meta.getAttribute('content') : void 0,
  		og_image: og_image_meta ? og_image_meta.getAttribute('content') : void 0,
  		pageUrl: pageUrlArr[0],
    };
    logMessage("Data",data)

    return data;
  }

  addScript(attribute, text) {
    return new Promise(function(resolve, reject) {

        var script = document.createElement('script');
        for (var attr in attribute) {
            var value = attribute[attr];
            if (value) {
              script.setAttribute(attr, value);
            }
        }
        script.innerHTML = text;

        script.onload = resolve;
        script.onerror = reject;

        document.body.appendChild(script);
    });
  }
  addCss(attribute, text) {
    return new Promise(function(resolve, reject) {

        var node = document.createElement('link');
        node.setAttribute('rel', 'stylesheet');
        node.setAttribute('type', 'text/css');
        for (var attr in attribute) {
            var value = attribute[attr];
            if (value) {
              node.setAttribute(attr, value);
            }
        }
        node.innerHTML = text;

        node.onload = resolve;
        node.onerror = reject;

        document.body.appendChild(node);
    });
  }
  getParameterByName(name, url) {
    if (!url) {url = window.location.href};
    name = name.replace(/[\[\]]/g, "\\$&");

    if (URLSearchParams) {
      // logMessage('with URLSearchParams');
      var params = new URLSearchParams(window.location.search);
      return params.has(name) ? params.get(name) : null;
    }

    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) {return null};
    if (!results[2]) {return ''};
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }
}
var EnvUtils = new EnvUtilsDef();
