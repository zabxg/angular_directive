angular.module('directives').directive('helloWorld', function () {
    return {
        restrict: 'EA',
        scope: {
            name: '@',
            say: '&'
        },
        replace: true,
        template: '<button type="button" ng-bind="name" ng-init="say()"></button>'
    }
});