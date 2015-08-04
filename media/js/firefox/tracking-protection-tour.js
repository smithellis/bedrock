/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// create namespace
if (typeof Mozilla === 'undefined') {
    var Mozilla = {};
}

(function($) {
    'use strict';

    var TPTour = {};
    var _$strings = $('#strings');
    var _step1;
    var _step3;
    var $step2Panel = $('#info-panel');

    TPTour.step1 = function() {
        var buttons = [
            {
              label: _step1.stepText,
              style: 'text',
            },
            {
              callback: TPTour.step2,
              label: _step1.buttonText,
              style: 'primary',
            },
        ];

        Mozilla.UITour.getConfiguration('availableTargets', function(config) {
            if (config.targets && config.targets.indexOf('trackingProtection') !== -1) {
                Mozilla.UITour.showInfo('trackingProtection', _step1.titleText, _step1.panelText, undefined, buttons);
            }
        });
    };

    TPTour.step2 = function() {
        $step2Panel.removeClass('hidden');
        $('.ad').addClass('fade-out');
    };

    TPTour.step3 = function() {
        TPTour.hideStep2Panel();

        var buttons = [
            {
                label: _step3.stepText,
                style: 'text',
            },
            {
                callback: TPTour.doneTour,
                label: _step3.buttonText,
                style: 'primary',
            },
        ];

        Mozilla.UITour.showMenu('controlCenter', function() {
            Mozilla.UITour.showInfo('controlCenter-trackingUnblock', _step3.titleText, _step3.panelText, undefined, buttons);
        });
    };

    TPTour.hideStep2Panel = function() {
        $step2Panel.addClass('hidden');
    };

    /*
     * Strips HTML from string to make sure markup
     * does not get injected in any UITour door-hangers.
     * @param stringId (data attribute string)
     */
    TPTour.getText = function(stringId) {
        return $('<div/>').html(_$strings.data(stringId)).text();
    };

    TPTour.openPrivacyPrefs = function(e) {
        e.preventDefault();
        Mozilla.UITour.openPreferences('privacy');
    };

    TPTour.bindEvents = function() {
        $('.prefs-link').on('click', TPTour.openPrivacyPrefs);
        $('#info-panel footer > button').on('click', TPTour.step3);
        $('#info-panel header > button').on('click', TPTour.hideStep2Panel);
        $(document).on('visibilitychange', TPTour.handleVisibilityChange);
    };

    TPTour.handleVisibilityChange = function() {
        if (document.hidden) {
            TPTour.hidePanels();
        }
    };

    TPTour.getStrings = function() {
        _step1 = {
            titleText: TPTour.getText('panel1Title'),
            panelText: TPTour.getText('panel1Text'),
            stepText: TPTour.getText('panel1Step'),
            buttonText: TPTour.getText('panel1Button')
        };

        _step3 = {
            titleText: TPTour.getText('panel3Title'),
            panelText: TPTour.getText('panel3Text'),
            stepText: TPTour.getText('panel3Step'),
            buttonText: TPTour.getText('panel3Button')
        };
    };

    TPTour.hidePanels = function() {
        Mozilla.UITour.hideInfo();
        Mozilla.UITour.hideMenu('controlCenter');
    };

    TPTour.doneTour = function() {
        TPTour.hidePanels();
        // TODO tour ends, what now?
    };

    TPTour.init = function() {
        TPTour.getStrings();
        TPTour.bindEvents();

        // TODO can we poll for target to become available?
        setTimeout(function() {
            TPTour.step1();
        }, 500);
    };

    TPTour.init();

    window.Mozilla.TPTour = TPTour;

})(window.jQuery);
