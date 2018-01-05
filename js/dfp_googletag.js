// Create our googletag object.
var googletag = window.googletag || {};

// Ensure this is defined.
googletag.cmd = googletag.cmd || [];

// Global storage for slots that will be rendered.
googletag.slots = googletag.slots || {};

// Global storage for slots that are waiting to be rendered.
var dfpSlots = dfpSlots || {};

(function() {
  var gads = document.createElement("script");
  gads.async = true;
  gads.type = "text/javascript";
  var useSSL = "https:" === document.location.protocol;
  gads.src = (useSSL ? "https:" : "http:") + "//www.googletagservices.com/tag/js/gpt.js";
  var node =document.getElementsByTagName("script")[0];
  node.parentNode.insertBefore(gads, node);
})();
