
angular.module('angularPayments').provider('angularPaymentsConfig', function () {

    var settings = {stripe: {provider: "stripe",
                             provider_js: "https://js.stripe.com/v2/",
                             submit: function (arg, cb) {
                                 return window.Stripe.createToken(arg, cb);
                             },
                             set_public_key: function (key) {
                                 try {
                                     window.Stripe.setPublishableKey(key);
                                     return true;
                                 } catch (e) {}
                             }},
                    paymill: {provider: "paymill",
                              provider_js: "https://bridge.paymill.com/",
                              submit: function (arg, cb) {
                                  window.paymill.createToken(arg, cb);
                              },
                              set_public_key: function (key) {
                                  window.PAYMILL_PUBLIC_KEY=key;
                              }}}

    this.configure = function (provider, public_key) {
        this.config = settings[provider];

        if (!this.config) {
            throw new Error('Unsupported payment provider "'+provider+'"');
        }

        var self = this;

        var script_loaded = function () {
            self.config.set_public_key(public_key);
        }

        // insert script tag
        var s = document.createElement('script');
        s.onreadystatechange = function () {
            if (this.readyState == 'complete') {
                script_loaded();
            }
        }
        s.onload = script_loaded;
        s.src = this.config.provider_js;
        document.body.appendChild(s);
    };

    this.$get = function () {
        return this.config;
    };
});
