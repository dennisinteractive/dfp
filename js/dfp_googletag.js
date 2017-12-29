// Create our googletag object.
var googletag = googletag || {};

// Create our cmd array.
googletag.cmd = googletag.cmd || [];

// Add a place to store the slot name variable
googletag.slots = googletag.slots || {};

// Used to store slot entries.
var dfpEntry = dfpEntry || {};

(function() {
  var gads = document.createElement("script");
  gads.async = true;
  gads.type = "text/javascript";
  var useSSL = "https:" === document.location.protocol;
  gads.src = (useSSL ? "https:" : "http:") + "//www.googletagservices.com/tag/js/gpt.js";
  var node =document.getElementsByTagName("script")[0];
  node.parentNode.insertBefore(gads, node);
})();
