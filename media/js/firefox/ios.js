/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// create namespace
if (typeof window.Mozilla === 'undefined') {
    window.Mozilla = {};
}

;(function($, Mozilla) {
    'use strict';

    // initialize fx family nav
    Mozilla.FxFamilyNav.init({ primaryId: 'ios', subId: 'overview' });

    // init send-to-device form
    var form = new Mozilla.SendToDevice();
    form.init();

    var $widget = $('#send-to-modal-container');

    $('.send-to').on('click', function(e) {
        e.preventDefault();
        Mozilla.Modal.createModal(this, $widget);
    });

    $('.sync-button').on('click', function(e) {
        e.preventDefault();
        Mozilla.UITour.showFirefoxAccounts();
    });

})(window.jQuery, window.Mozilla);
