/**
 * Created by Chris on 5/13/2016.
 */
voteApp.directive('pboModal', function () {
    return {
        restrict: 'E',
        templateUrl: 'modal.html',
        replace: true,
        scope: {
            title: '@',
            id: '@'
        },
        transclude: true
    };
});