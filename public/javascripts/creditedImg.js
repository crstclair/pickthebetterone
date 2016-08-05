/**
 * Created by Chris on 6/8/2016.
 */
voteApp.directive('pboCreditedImg', function () {
    return {
        restrict: 'E',
        templateUrl: 'creditedImg.html',
        replace: true,
        scope: {
            name: '@',
            bucket: '@',
            filename: '@',
            creditName: '@',
            creditHref: '@',
            statsLink: '@',
            click: '&onClick'
        },
        link: function(scope, e, attrs) {
            scope.isClickable = function() {
                return angular.isDefined(attrs.onClick);
            }
        }
    };
});