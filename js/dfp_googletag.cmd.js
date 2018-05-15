(function ($, Drupal, dfpSlots) {

  "use strict";

  Drupal.behaviors.dfpGoogleTagCmd = {
    attach: function (context, settings) {
      // The dfpTags setting is defined in _dfp_js_slot_definition().
      // These are the tags built by our module. These tags are used to
      // build slots.
      var tags = settings.dfpTags || [];

      // The dfpGoogleTagCmd setting is defined in _dfp_js_global_settings().
      var dfpGoogleTagCmd = settings.dfpGoogleTagCmd || {};
      var asyncRendering = dfpGoogleTagCmd.asyncRendering || true;
      var singleRequest = dfpGoogleTagCmd.singleRequest || true;
      var collapseEmptyDivs = dfpGoogleTagCmd.collapseEmptyDivs || false;
      var disableInitialLoad = dfpGoogleTagCmd.disableInitialLoad || false;
      var setCentering = dfpGoogleTagCmd.setCentering || false;
      var globalTargets = dfpGoogleTagCmd.globalTargets || [];
      var viewportBreakpoints = dfpGoogleTagCmd.viewportBreakpoints || [];

      // Create an event so others can bind.
      var dpfSlotsSetEvent;
      try {
        dpfSlotsSetEvent = new Event('dfpSlotsSet', {
          bubbles: false,
          cancelable: false
        });
      }
      catch (e) {
        // For IE.
        dpfSlotsSetEvent = context.createEvent("Event");
        dpfSlotsSetEvent.initEvent("dfpSlotsSet", false, false);
      }

      // Add our methods to Drupal settings.
      var dfp = {

        // This is prepended to the machine-name of the tag and used as the id
        // of the div that will eventually hold the ad.
        idPrefix: 'dfp-ad-',

        /**
         * Define page level settings.
         */
        pageLevelSettings: function () {
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

          if (setCentering) {
            // Get a reference to the pubads service and center the ads.
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

          sortedBreakpoints.sort(function (a, b) {
            return a[1] - b[1];
          });

          sortedBreakpoints.forEach(function (item, index) {
            if (windowWidth > item[1]) {
              vb = item[0];
            }
          });

          // If there are no values entered then we will default to 'mobile'.
          if (!vb || 0 === vb.length) {
            vb = 'mobile';
          }

          // Get a reference to the pubads service and set targeting for the
          // viewport breakpoint.
          googletag.pubads().setTargeting('breakpoint', vb);
        },

        /**
         * Define slots.
         *
         * @param tags
         *   An object that contains all tags that will be added to the page.
         */
        defineSlots: function (tags) {
          var isVast = false;
          for (var slot in tags) {
            if (tags.hasOwnProperty(slot)) {

              var localDefinition = tags[slot];

              // The dfp_entry.
              if (localDefinition.out_of_page) {
                dfpSlots[slot] = googletag.defineOutOfPageSlot(localDefinition.adunit, localDefinition.placeholder_id);
              }
              else {
                dfpSlots[slot] = googletag.defineSlot(localDefinition.adunit, localDefinition.size, localDefinition.placeholder_id);
              }

              // Only act on a slot if it was filled. Continuing when the slots
              // are null can cause JS errors. This happens when a modal is
              // opened, for example.
              if (dfpSlots[slot]) {

                // Size mapping just wants an array of arrays.
                var mapping = [];

                // If we are using breakpoints define our size mappings.
                if (localDefinition.breakpoints.length > 0) {

                  for (var b = 0; b < localDefinition.breakpoints.length; b++) {
                    mapping.push([localDefinition.breakpoints[b].browser, localDefinition.breakpoints[b].ad]);
                  }

                  if (mapping.length > 0) {
                    // Add size mapping to the slot.
                    dfpSlots[slot].defineSizeMapping(mapping);
                  }
                }

                // Add the click URL if we have one.
                if (localDefinition.click_url && localDefinition.click_url.length !== 0) {
                  dfpSlots[slot].setClickUrl(localDefinition.click_url);
                }

                // Add googletag pubads.
                dfpSlots[slot].addService(googletag.pubads());

                if (localDefinition.adsense_ad_types.length !== 0) {
                  dfpSlots[slot].set('adsense_ad_types', localDefinition.adsense_ad_types)
                }
                if (localDefinition.adsense_channel_ids.length !== 0) {
                  dfpSlots[slot].set('adsense_channel_ids', localDefinition.adsense_channel_ids)
                }
                for (var c = 0; c < localDefinition.adsense_colors.length; c++) {
                  dfpSlots[slot].set(localDefinition.adsense_colors[c]['key'], localDefinition.adsense_colors[c]['value']);
                }
                for (var t = 0; t < localDefinition.targeting.length; t++) {
                  dfpSlots[slot].setTargeting(localDefinition.targeting[t]['target'], localDefinition.targeting[t]['value']);
                }

                // If this is a VAST ad enable companion ads.
                if (localDefinition.companion) {
                  // Add the companions ad service.
                  dfpSlots[slot].addService(googletag.companionAds());
                  isVast = true;
                }
              }
            }
          }

          // If any of the ad slots are defined as companion (vast) ads then
          // we want to ensure the companion ads are set to refresh until the
          // are filled.
          if (isVast) {
            googletag.companionAds().setRefreshUnfilledSlots(true);
          }

          // This is returned so we can confirm that the slots aren't null.
          return dfpSlots;
        },

        enableServices: function () {
          // Enables all GPT services that have been defined for ad slots on
          // the page.
          googletag.enableServices();
        },

        /**
         * Display slots.
         */
        displaySlots: function () {
          if (dfp.allSlotsRendered()) {
            // Once all ads have been loaded or if Drupal.settings.dfpLazyLoad
            // hasn't been defined as a setting via another module this will
            // be called to stop subsequent calls during scroll.
            $(context).unbind('scroll');
          }
          else if (!dfp.dfpSlotsEmpty(dfpSlots)) {
            // Iterate over the dfp tags. These are all the tags that have
            // either been added to googletag.slots or will eventually be added
            // when they are ready to be rendered.
            $.each(Drupal.settings.dfpTags, function (index, value) {
              // Only act on ads that were not originally added to googletag.
              // These will be ad slots that were not in the viewport on initial
              // page load.
              if (!googletag.slots.hasOwnProperty(index)) {
                var ID = '#' + value.placeholder_id;
                var inView = $(ID, context).isInViewport();
                // @todo: Figure out a better way to handle ignoring lazy
                // loading ads. Render the ad if it's visible in the viewport.
                // A custom module can set the 'dfpLazyLoad' setting to "true"
                // to force lazy loading ads that aren't in the viewport on
                // page load. We always load ads that are defined as "out of
                // page".
                if (inView || !Drupal.settings.dfpLazyLoad || Drupal.settings.dfpTags[index].out_of_page) {
                  // Add the slot to googletag so we know we have already
                  // rendered it.
                  googletag.slots[index] = dfpSlots[index];
                  googletag.display(value.placeholder_id);
                  console.log('DFP tag ' + index + ' rendered');
                }
              }
            });
          }
        },

        /**
         * Called to bind to scroll.
         */
        scroll: function () {
          // Now that the window is fully loaded we bind to scroll.
          $(context).bind({
            'scroll': dfp.displaySlots
          });
        },

        /**
         * Used to determine if the page has been scrolled past the last ad.
         *
         * If all the ads have been rendered then we want to remove the scroll
         * listener.
         *
         * @returns {boolean}
         */
        allSlotsRendered: function () {
          var a = Object.getOwnPropertyNames(dfpSlots);
          var b = Object.getOwnPropertyNames(googletag.slots);
          return a.length === b.length;
        },

        /**
         * Used to determine if the slots resulted in a null value.
         *
         * When googletag.defineSlot() and googletag.defineOutOfPageSlot() are
         * called, they can result in a null value. If one slot is null it
         * seems the others are null as well. This needs to be looked into to
         * confirm why this is the case and might be able to be resolved a
         * different way.
         *
         * @todo Determine why we get a null result when a modal is triggered.
         *
         * @param slots
         *   The slots object.
         *
         * @returns {boolean}
         */
        dfpSlotsEmpty: function (slots) {
          return Object.keys(slots).every(function (x) {
            return slots[x] === null;
          });
        }
      };

      // Store dfp in Drupal settings.
      Drupal.settings.dfp = dfp;

      // We use googletag.cmd as it maintains a list of commands that will be
      // run as soon as GPT is ready. This is the correct way to make sure your
      // callback is run when GPT has loaded.
      googletag.cmd.push(function () {
        // Avoid race conditions by making sure to respect the usual timing
        // of GPT. Example valid partial orderings include:
        //
        // *Define-Enable-Display*
        // Define page-level settings
        // Define slots
        // enableServices()
        // Display slots
        //
        // *Enable-Define-Display*
        // Define page-level settings
        // enableServices()
        // Define slots
        // Display slots

        // Define page-level settings.
        dfp.pageLevelSettings();

        // Define slots.
        var slots = dfp.defineSlots(tags);

        // Check that the slots are actually filled.
        var slotsEmpty = dfp.dfpSlotsEmpty(slots);

        // Continue only if the slots aren't null.
        if (!slotsEmpty) {
          $.event.trigger('dfpSlotsSet');

          // Enable services.
          dfp.enableServices();

          // Display slots.
          dfp.displaySlots();

          // Bind to the scroll actions to render ads not in the viewport.
          dfp.scroll();
        }
      });

    }
  };

})(jQuery, Drupal, dfpSlots);
