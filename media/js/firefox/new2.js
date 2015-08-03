/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

;(function($, Modernizr, dataLayer, site) {
    'use strict';

    var $html = $(document.documentElement);
    var $window = $(window);
    var $document = $(document);
    var isIELT9 = (site.platform === 'windows' && /MSIE\s[1-8]\./.test(navigator.userAgent));
    var pathParts = window.location.pathname.split('/');
    var queryStr = window.location.search ? window.location.search + '&' : '?';
    var params = new window._SearchParams();
    var referrer = pathParts[pathParts.length - 2];
    var locale = pathParts[1];
    var virtualUrl = ('/' + locale + '/products/download.html' +
                       queryStr + 'referrer=' + referrer);
    var state; // track page state
    var noScene2; // track possibility of showing scene 2

    var $downloadInteraction = $('#download-interaction'); // wrapper for download ready/started
    var $downloadReady = $('#download-ready'); // content displayed before download starts
    var $downloadStarted = $('#download-started'); // content displayed after download starts
    var $directDownloadLink = $('#direct-download-link');

    var uiTourSendEvent = function(action, data) {
        var event = new CustomEvent('mozUITour', {
            bubbles: true,
            detail: {
                action: action,
                data: data || {}
            }
        });

        document.dispatchEvent(event);
    };

    var uiTourGetConfiguration = function(configName, callback) {
        uiTourSendEvent('getConfiguration', {
            configuration: configName,
            callbackID: function() {
                var id = Math.random().toString(36).replace(/[^a-z]+/g, '');

                function listener(event) {
                    if (typeof event.detail === 'object' && event.detail.callbackID === id) {
                        document.removeEventListener('mozUITourResponse', listener);
                        callback(event.detail.data);
                    }
                }

                document.addEventListener('mozUITourResponse', listener);

                return id;
            }.call()
        });
    };

    if (window.isFirefox()) {
        // data-latest-firefox includes point release information
        var latestFirefoxVersionFull = $html.attr('data-latest-firefox');

        // get latest full version (no point release info) for initial check
        var latestFirefoxVersion = parseInt(latestFirefoxVersionFull.split('.')[0], 10);

        if (window.isFirefoxUpToDate(latestFirefoxVersion + '')) {
            if (window.location.hash !== '#download-fx' && params.get('scene') !== 2) {
                // the firefox-latest class prevents the download from triggering
                // and scene 2 from showing, which we want if the user lands on
                // /firefox/new/ but if the user visits /firefox/new/?scene=2#download-fx
                // (from a download button) then we want them to see the same scene 2
                // as non-firefox users and initiate a download
                $html.addClass('firefox-latest');

                // if user is on release channel and has latest version, offer refresh button
                uiTourGetConfiguration('appinfo', function(config) {
                    if (config.defaultUpdateChannel === 'release' && config.version === latestFirefoxVersionFull) {
                        $html.addClass('show-refresh');

                        // DOM may not be ready yet, so bind filtered click handler to document
                        $document.on('click', '#refresh-firefox', function() {
                            uiTourSendEvent('resetFirefox');
                        });
                    }
                });
            }
        } else {
            $html.addClass('firefox-old');
        }
    }

    // Add GA custom tracking and external link tracking
    state = 'Desktop, not Firefox';

    if (site.platform === 'android') {
        if ($html.hasClass('firefox-latest')) {
            state = 'Android, Firefox up-to-date';
        } else if ($html.hasClass('firefox-old')) {
            state = 'Android, Firefox not up-to-date';
        } else {
            state = 'Android, not Firefox';
        }
    } else if (site.platform === 'ios') {
        state = 'iOS, Firefox not supported';
    } else if (site.platform === 'fxos') {
        state = 'FxOS';
    } else {
        if ($html.hasClass('firefox-latest')) {
            state = 'Desktop, Firefox up-to-date';
        } else if ($html.hasClass('firefox-old')) {
            state = 'Desktop, Firefox not up-to-date';
        }
    }

    //GA Custom Dimension in Pageview
    window.dataLayer.push({
        event: 'set-state',
        state: state
    });

    // conditions in which scene2 should not be shown, even when the
    // #download-fx hash is set
    noScene2 = (
        site.platform === 'other' ||    // no download available
        site.platform === 'ios' ||      // unsupported platform
        site.platform === 'fxos' ||  // no download available
        site.platform === 'android'  // download goes to Play Store
    );

    $document.ready(function() {
        var $thankYou = $('.thankyou');
        var hashChange = ('onhashchange' in window);

        // if desktop with download available, re-locate dl button links
        if (!noScene2 && $('.download-button-wrapper:visible').length > 0) {
            var $downloadButtonLinks = $('.download-button-wrapper .download-other-desktop').detach();
            $downloadButtonLinks.css('display', 'block').insertBefore('#firefox-screenshot');
        }

        if (site.platform === 'android') {
            $('#download-button-android .download-subtitle').html(
                $('.android.download-button-wrapper').data('upgradeSubtitle'));

            $downloadStarted.removeClass('invisible');
            $downloadReady.removeClass('invisible');

            // On Android, skip all the scene transitions. We're just linking
            // to the Play Store.
            return;
        }

        function showScene(scene) {
            if (scene === 2) {
                $downloadReady.addClass('hidden');
                $downloadStarted.removeClass('hidden');

                $thankYou.focus();
            } else {
                $downloadStarted.addClass('hidden');
                $downloadReady.removeClass('hidden');
            }

            $downloadInteraction.data('scene', scene);
        }

        // Pull download link from the download button and add to the
        // 'click here' link.
        // TODO: Remove and generate link in bedrock.
        $directDownloadLink.attr(
            'href', $('.download-list li:visible .download-link').attr('href')
        );

        $downloadInteraction.on('click', '#direct-download-link, .download-link', function(e) {
            e.preventDefault();

            var url = $(e.currentTarget).attr('href');

            // An iframe can not be used here to trigger the download because
            // it will be blocked by Chrome if the download link redirects
            // to a HTTP URI and we are on HTTPS.
            function trackAndRedirect(url, virtualUrl) {
                // Delay to initiate download is required to allow animation
                // to finish loading in IE. If delay is removed, the DOM will
                // unload before the animation completes and the page will
                // stop in a half-animated state.
                window.setTimeout(function() {
                        window.dataLayer.push({
                            event: 'virtual-pageview',
                            virtualUrl: virtualUrl
                        });

                        window.location.href = url;
                    }, 500);
            }

            // we must use a popup to trigger download for IE6/7/8 as the
            // delay sending the page view tracking in track_and_redirect()
            // triggers the IE security blocker. Sigh.
            function trackAndPopup(url, virtualUrl) {
                // popup must go before tracking to prevent timeouts that
                // cause the security blocker.
                window.open(url, 'download_window', 'toolbar=0,location=no,directories=0,status=0,scrollbars=0,resizeable=0,width=1,height=1,top=0,left=0');

                window.dataLayer.push({
                    event: 'virtual-pageview',
                    virtualUrl: virtualUrl
                });
            }

            if (isIELT9) {
                // We do a popup for IE < 9 users when they click the download button
                // on scene1. If they are going straight to scene2 on page load, we
                // still need to use the regular trackAndRedirect() function because
                // the popup will be blocked and then the download will also be blocked
                // in the popup.
                if (window.location.hash === '#download-fx' || params.get('scene') === 2) {
                    trackAndRedirect(url, virtualUrl);
                } else {
                    trackAndPopup(url, virtualUrl);
                }
            } else {
                trackAndRedirect(url, virtualUrl);
            }

            if ($downloadInteraction.data('scene') !== 2) {
                if (hashChange) {
                    window.location.hash = '#download-fx';
                } else {
                    showScene(2);
                }
            }
        });

        if (hashChange && !noScene2) {
            $window.on('hashchange', function() {
                if (window.location.hash === '#download-fx') {
                    showScene(2);
                }
                if (window.location.hash === '') {
                    showScene(1);
                }
            });
        }

        $window.on('load', function() {
            // initiate download/scene2 if coming directly to #download-fx and/or ?scene=2
            // some older browsers will not preserve the #download-fx when they are redirected
            // so we use a url parameter, but we don't want to use a url param when the user
            // clicks the download button on /firefox/new/ because that can trigger an unecessary page load
            if (window.location.hash === '#download-fx' || params.get('scene') === 2) {
                if (noScene2) {
                    // if using an unsupported platform just try to drop the URL hash
                    if (window.history && window.history.replaceState) {
                        var uri = window.location.href.split('#')[0];
                        window.history.replaceState({}, '', uri);
                    }
                } else {
                    showScene(2);
                    // For IE < 11 we supress the auto-download since this
                    // will soon be triggered using a popup on bedrock prior
                    // to landing on /firefox/download/#download-fx. This
                    // check reflects the current logic on bedrock and the old
                    // PHP download pages (which also only check for `MSIE`).
                    // Once all buttons point to this page on all locales,
                    // we can switch this check to IE < 9.
                    if (navigator.appVersion.indexOf('MSIE') !== -1) {
                        return;
                    }

                    $directDownloadLink.trigger('click');
                }
            }

            $downloadStarted.removeClass('invisible');
            $downloadReady.removeClass('invisible');
        });
    });

})(window.jQuery, window.Modernizr, window.dataLayer = window.dataLayer || [], window.site);
