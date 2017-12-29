(function ($, dfpEntry) {

  "use strict";

  Drupal.behaviors.dfpGoogleTagCmd = {
    attach: function (context, settings) {

      var dfpSlotDefinitions = settings.dfpSlotDefinitions || {};
      var dfpGoogleTagCmd = settings.dfpGoogleTagCmd || {};
      var asyncRendering = dfpGoogleTagCmd.asyncRendering || true;
      var singleRequest = dfpGoogleTagCmd.singleRequest || true;
      var collapseEmptyDivs = dfpGoogleTagCmd.collapseEmptyDivs || false;
      var disableInitialLoad = dfpGoogleTagCmd.disableInitialLoad || false;
      var setCentering = dfpGoogleTagCmd.setCentering || false;
      var globalTargets = dfpGoogleTagCmd.globalTargets || [];
      var viewportBreakpoints = dfpGoogleTagCmd.viewportBreakpoints || [];

      var dfpPrefix = 'dfp-ad-';

      var isVast = false;

      // We use googletag.cmd as it maintains a list of commands that will be
      // run as soon as GPT is ready. This is the correct way to make sure your
      // callback is run when GPT has loaded.
      googletag.cmd.push(defineSlots);

      /**
       * Define the ad slots that will be filled.
       */
      function defineSlots() {

        // Now that the window is fully loaded we bind to scroll.
        $(context).bind({
          'scroll': lazyLoadSlots
        });

        // googletag.cmd maintains a list of commands that will be run as soon
        // as GPT is ready. This is the correct way to make sure your callback
        // is run when GPT has loaded.
        // googletag.cmd.push(function() {

          for (var slot in dfpSlotDefinitions) {
            if (dfpSlotDefinitions.hasOwnProperty(slot)) {

              var localDefinition = dfpSlotDefinitions[slot];

              // The dfp_entry.
              if (localDefinition.outOfPage) {
                dfpEntry[slot] = googletag.defineOutOfPageSlot(localDefinition.adUnit, localDefinition.placeHolderId);
              }
              else {
                dfpEntry[slot] = googletag.defineSlot(localDefinition.adUnit, localDefinition.tagSize, localDefinition.placeHolderId);
              }

              // Size mapping just wants an array of arrays.
              var mapping = [];

              // If we are using breakpoints define our size mappings.
              if (localDefinition.breakpoints.length > 0) {

                for (var b = 0; b < localDefinition.breakpoints.length; b++) {
                  mapping.push([localDefinition.breakpoints[b].browser, localDefinition.breakpoints[b].ad]);
                }

                if (mapping.length > 0) {
                  // Add size mapping to the slot.
                  dfpEntry[slot].defineSizeMapping(mapping);
                }
              }

              // Add the click URL if we have one.
              if (localDefinition.clickURL.length !== 0) {
                dfpEntry[slot].setClickUrl(localDefinition.clickURL);
              }

              // Add googletag pubads.
              dfpEntry[slot].addService(googletag.pubads());

              if (localDefinition.adSenseAdTypes.length !== 0) {
                dfpEntry[slot].set('adsense_ad_types', localDefinition.adSenseAdTypes)
              }
              if (localDefinition.adSenseChannelIds.length !== 0) {
                dfpEntry[slot].set('adsense_channel_ids', localDefinition.adSenseChannelIds)
              }
              for (var c = 0; c < localDefinition.adSenseColors.length; c++) {
                dfpEntry[slot].set(localDefinition.adSenseColors[c]['key'], localDefinition.adSenseColors[c]['value']);
              }
              for (var t = 0; t < localDefinition.targets.length; t++) {
                dfpEntry[slot].setTargeting(localDefinition.targets[t]['target'], localDefinition.targets[t]['value']);
              }

              // If this is a VAST ad enable companion ads.
              if (localDefinition.enableVast) {
                dfpEntry[slot].addService(googletag.companionAds());
                isVast = true;
              }

              var ID = '#' + localDefinition.placeHolderId;
              var inView = $(ID, context).isInViewport();

              // We only want to add slots that are in the viewport or they
              // have been defined as "Out of page" slots.
              if (inView || localDefinition.outOfPage) {
                // Only add dpf entries to googletag that are in the viewport.
                googletag.slots[slot] = dfpEntry[slot];
              }

            }
          }

          if (isVast) {
            googletag.companionAds().setRefreshUnfilledSlots(true);
          }
          // Async / Sync loading of ads
          if (asyncRendering) {
            googletag.pubads().enableAsyncRendering();
          }
          else {
            googletag.pubads().enableSyncRendering();
          }

          // Trigger single request.
          if (singleRequest) {
            googletag.pubads().enableSingleRequest();
          }

          // Toggles visibility of empty ads.
          if (collapseEmptyDivs) {
            googletag.pubads().collapseEmptyDivs();
          }
          else {
            googletag.pubads().collapseEmptyDivs(true);
          }

          // Initial Loads.
          if (disableInitialLoad) {
            googletag.pubads().disableInitialLoad();
          }

          // Ad centering.
          if (setCentering) {
            googletag.pubads().setCentering(true);
          }

          // Set global targeting values for this page.
          for (var gt = 0; gt < globalTargets.length; gt++) {
            googletag.pubads().setTargeting(globalTargets[gt]['target'], globalTargets[gt]['value']);
          }

          // Set viewport breakpoint targeting.
          var windowWidth = document.documentElement.clientWidth;
          var vb = '';

          var sortedBreakpoints = [];
          for (var bp in viewportBreakpoints) {
            if (viewportBreakpoints.hasOwnProperty(bp)) {
              sortedBreakpoints.push([bp, viewportBreakpoints[bp]]);
            }
          }

          sortedBreakpoints.sort(function(a, b) {
            return a[1] - b[1];
          });

          sortedBreakpoints.forEach(function(item, index) {
            if (windowWidth > item[1]) {
              vb = item[0];
            }
          });

          // If there are no values entered then we will default to 'mobile'.
          if (!vb || 0 === vb.length) {
            vb = 'mobile';
          }
          // Set targeting for the viewport breakpoint.
          googletag.pubads().setTargeting('breakpoint', vb);

          googletag.enableServices();

          $.each(googletag.slots, function (index, value) {
            googletag.display(dfpPrefix + index);
            googletag.pubads().refresh([index]);
            console.log('DFP tag ' + index + ' rendered');
          })
        // });
      }

      /**
       * Used to load ad slots that were not initially in the viewport.
       */
      function lazyLoadSlots() {
        googletag.cmd.push(function () {

          if (allSlotsRendered()) {
            $(context).unbind('scroll');
          }
          else {
            $.each(dfpSlotDefinitions, function (index, value) {
              // Only act on ads that were not originally added to googletag.
              // These will be ad slots that were not in the viewport on initial
              // page load.
              if (!googletag.slots.hasOwnProperty(index)) {
                var ID = '#' + value.placeHolderId;
                var inView = $(ID, context).isInViewport();
                if (inView) {
                  // Add the slot to googletag so we know we have already
                  // rendered it.
                  googletag.slots[index] = dfpEntry[index];
                  googletag.display(value.placeHolderId);
                  googletag.pubads().refresh([index]);
                  console.log('DFP tag ' + index + ' rendered');
                }
              }
            });
          }
        });
      }

      /**
       * Determines if all of the slots have been added to googletag.
       *
       * @returns {boolean}
       */
      function allSlotsRendered() {
        var a = Object.getOwnPropertyNames(dfpEntry);
        var b = Object.getOwnPropertyNames(googletag.slots);

        if (a.length !== b.length) {
          return false;
        }

        return true;
      }

    }
  };
})(jQuery, dfpEntry);
