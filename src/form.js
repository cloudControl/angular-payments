angular.module('angularPayments')

.directive('paymentForm', ['$window', '$parse', 'Common', 'angularPaymentsConfig', function($window, $parse, Common, config) {

  // directive intercepts form-submission, obtains Stripe's cardToken using stripe.js
  // and then passes that to callback provided in paymentForm, attribute.

  // data that is sent to stripe is filtered from scope, looking for valid values to
  // send and converting camelCase to snake_case, e.g expMonth -> exp_month


  // filter valid stripe-values from scope and convert them from camelCase to snake_case
    var _getDataToSend = function(data){

    var possibleKeys = ['number', 'expMonth', 'expYear',
                    'cvc', 'name','addressLine1',
                    'addressLine2', 'addressCity',
                    'addressState', 'addressZip',
                    'addressCountry']

    var camelToSnake = function(str){
      return str.replace(/([A-Z])/g, function(m){
        return "_"+m.toLowerCase();
      });
    }

    var ret = {};

    for(i in possibleKeys){
        if(possibleKeys.hasOwnProperty(i)){
            ret[camelToSnake(possibleKeys[i])] = angular.copy(data[possibleKeys[i]]);
        }
    }

    ret['number'] = (ret['number'] || '').replace(/ /g,'');

    return ret;
  }

  return {
    restrict: 'A',
    link: function(scope, elem, attr) {

      var form = angular.element(elem);

      form.bind('submit', function() {

        var bindings = scope.payment;

        expMonthUsed = bindings.expMonth ? true : false;
        expYearUsed = bindings.expYear ? true : false;

        if(!(expMonthUsed && expYearUsed)){
          exp = Common.parseExpiry(bindings.expiry)
          bindings.expMonth = exp.month
          bindings.expYear = exp.year
        }

        var button = form.find('button');
        button.prop('disabled', true);

        if (form.hasClass('ng-valid') ||
            attr.hasOwnProperty("paymentValidateServerSide")) {

          config.submit(_getDataToSend(bindings), function() {

            var result = config.normalize_return(arguments);

            scope.$apply(function() {
              scope[attr.paymentForm](result);
            });
            button.prop('disabled', false);
          });

        } else {
          scope.$apply(function() {
            scope[attr.paymentForm].apply(scope, [400, {error: 'Invalid form submitted.'}]);
          });
          button.prop('disabled', false);
        }

        scope.expMonth = null;
        scope.expYear  = null;

      });
    }
  }
}]);
