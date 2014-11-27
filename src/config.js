
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
                             },
                             normalize_return: function (args) {
                                 var response = args[1];
                                 if (response.error) {
                                     if (response.error.param == "exp_month") {
                                         return {error: {data: {expiry: "Invalid expiry date"}}};
                                     } else if (response.error.param == "number") {
                                         return {error: {data: {number: "Invalid card number"}}};
                                     } else if (response.error.param == "cvc") {
                                         return {error: {data: {cvc:    "Invalid CVC value"}}};
                                     }
                                 } else {
                                     return response;
                                 }
                             }},
                    paymill: {provider: "paymill",
                              provider_js: "https://bridge.paymill.com/",
                              submit: function (arg, cb) {
                                  window.paymill.createToken(arg, cb);
                              },
                              set_public_key: function (key) {
                                  window.PAYMILL_PUBLIC_KEY=key;
                              },
                              normalize_return: function (args) {
                                  var error = args[0];
                                  var response = args[1];

                                  if (error) {
                                      if (error.apierror == "field_invalid_card_number") {
                                          return {error: {data: {number: "Invalid card number"}}};
                                      } else if (error.apierror == "field_invalid_card_exp") {
                                          return {error: {data: {expiry: "Invalid expiry date"}}};
                                      } else if (error.apierror == "field_invalid_card_cvc") {
                                          return {error: {data: {cvc:    "Invalid CVC value"}}};
                                      } else {
                                          return {error: {data: {unknown: error.message}}};
                                      }
                                  } else {
                                      return {id: response.token};
                                  }
                              }}};

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
