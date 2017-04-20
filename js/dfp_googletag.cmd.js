(function (dfp_entry) {

  Drupal.behaviors.dfpGoogleTagCmd = {
    attach: function (context, settings) {

      var dfpSlotDefinitions = Drupal.settings.dfpSlotDefinitions || {};
      var dfpGoogleTagCmd = Drupal.settings.dfpGoogleTagCmd || {};
      var asyncRendering = dfpGoogleTagCmd.asyncRendering || true;
      var singleRequest = dfpGoogleTagCmd.singleRequest || true;
      var collapseEmptyDivs = dfpGoogleTagCmd.collapseEmptyDivs || false;
      var disableInitialLoad = dfpGoogleTagCmd.disableInitialLoad || false;
      var setCentering = dfpGoogleTagCmd.setCentering || false;
      var globalTargets = dfpGoogleTagCmd.globalTargets || [];
      var viewportBreakpoints = dfpGoogleTagCmd.viewportBreakpoints || [];

      var isVast = false;

      // This ensures that gpt api is ready.
      googletag.cmd.push(function() {

        for (var slot in dfpSlotDefinitions) {
          if (dfpSlotDefinitions.hasOwnProperty(slot)) {

            this.localDefinition = dfpSlotDefinitions[slot];

            var name = this.localDefinition.machineName;

            // The dfp_entry.
            if (this.localDefinition.outOfPage) {
              dfp_entry[name] = googletag.defineOutOfPageSlot(this.localDefinition.adUnit, this.localDefinition.placeHolderId);
            }
            else {
              dfp_entry[name] = googletag.defineSlot(this.localDefinition.adUnit, this.localDefinition.tagSize, this.localDefinition.placeHolderId);
            }

            // Size mapping just wants an array of arrays.
            this.mapping = [];

            // If we are using breakpoints define our size mappings.
            if (this.localDefinition.breakpoints.length > 0) {

              for (var b = 0; b < this.localDefinition.breakpoints.length; b++) {
                this.mapping.push([this.localDefinition.breakpoints[b].browser, this.localDefinition.breakpoints[b].ad]);
              }

              if (this.mapping.length > 0) {
                // Add size mapping to the slot.
                dfp_entry[name].defineSizeMapping(this.mapping);
              }
            }

            // Add the click URL if we have one.
            if (this.localDefinition.clickURL.length !== 0) {
              dfp_entry[name].setClickUrl(this.localDefinition.clickURL);
            }

            // Add googletag pubads.
            dfp_entry[name].addService(googletag.pubads());

            if (this.localDefinition.adSenseAdTypes.length !== 0) {
              dfp_entry[name].set('adsense_ad_types', this.localDefinition.adSenseAdTypes)
            }
            if (this.localDefinition.adSenseChannelIds.length !== 0) {
              dfp_entry[name].set('adsense_channel_ids', this.localDefinition.adSenseChannelIds)
            }
            for (var c = 0; c < this.localDefinition.adSenseColors.length; c++) {
              dfp_entry[name].set(this.localDefinition.adSenseColors[c]['key'], this.localDefinition.adSenseColors[c]['value']);
            }
            for (var t = 0; t < this.localDefinition.targets.length; t++) {
              dfp_entry[name].setTargeting(this.localDefinition.targets[t]['target'], this.localDefinition.targets[t]['value']);
            }

            // If this is a VAST ad enable companion ads.
            if (this.localDefinition.enableVast) {
              dfp_entry[name].addService(googletag.companionAds());
              isVast = true;
            }

            googletag.slots[name] = dfp_entry[name];
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
          var yep = windowWidth > item[1];
          if (yep) {
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

      });

    }
  };
})(dfp_entry);
