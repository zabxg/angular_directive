var directives = angular.module('directives.carouselExt', []);


/**
 * $transition service provides a consistent interface to trigger CSS 3 transitions and to be informed when they complete.
 * @param  {DOMElement} element  The DOMElement that will be animated.
 * @param  {string|object|function} trigger  The thing that will cause the transition to start:
 *   - As a string, it represents the css class to be added to the element.
 *   - As an object, it represents a hash of style attributes to be applied to the element.
 *   - As a function, it represents a function to be called that will cause the transition to occur.
 * @return {Promise}  A promise that is resolved when the transition finishes.
 */
directives.factory('$transition', ['$q', '$timeout', '$rootScope', function ($q, $timeout, $rootScope) {

    var $transition = function (element, trigger, options) {
        options = options || {};
        var deferred = $q.defer();
        var endEventName = $transition[options.animation ? 'animationEndEventName' : 'transitionEndEventName'];

        var bindEndEvent = function (element, eventName) {
            var transitionEndHandler = function (event) {
                $rootScope.$apply(function () {
                    element.unbind(eventName, transitionEndHandler);
                    deferred.resolve(element);
                });
            };
            if (eventName) {
                element.bind(eventName, transitionEndHandler);
            }
        };
        bindEndEvent(element, endEventName);

        // Wrap in a timeout to allow the browser time to update the DOM before the transition is to occur
        $timeout(function () {
            if (angular.isString(trigger)) {
                element.addClass(trigger);
            } else if (angular.isFunction(trigger)) {
                trigger(element);
            } else if (angular.isObject(trigger)) {
                element.css(trigger);
            }
            //If browser does not support transitions, instantly resolve
            if (!endEventName) {
                deferred.resolve(element);
            }
        });

        // Add our custom cancel function to the promise that is returned
        // We can call this if we are about to run a new transition, which we know will prevent this transition from ending,
        // i.e. it will therefore never raise a transitionEnd event for that transition
        deferred.promise.cancel = function () {
            if (endEventName) {
                element.unbind(endEventName, transitionEndHandler);
            }
            deferred.reject('Transition cancelled');
        };

        return deferred.promise;
    };

    // Work out the name of the transitionEnd event
    var transElement = document.createElement('trans');
    var transitionEndEventNames = {
        'WebkitTransition': 'webkitTransitionEnd',
        'MozTransition': 'transitionend',
        'OTransition': 'oTransitionEnd',
        'transition': 'transitionend'
    };
    var animationEndEventNames = {
        'WebkitTransition': 'webkitAnimationEnd',
        'MozTransition': 'animationend',
        'OTransition': 'oAnimationEnd',
        'transition': 'animationend'
    };

    function findEndEventName(endEventNames) {
        for (var name in endEventNames) {
            if (transElement.style[name] !== undefined) {
                return endEventNames[name];
            }
        }
    }
    $transition.transitionEndEventName = findEndEventName(transitionEndEventNames);
    $transition.animationEndEventName = findEndEventName(animationEndEventNames);
    return $transition;
}]);


/**
 *                                                                         pre
 *  ┌--------- item left  active animation ←----- item active animation ←-----------┐
 *  |    next                                                                       |
 *  ↓ ┌------→ item right active animation -----→ item active animation ------→ item active
 * item  pre                                          ↑                             |
 *  ↑ └------→ item left  active animation -----------┘                             |
 *  |                                                                      next     |
 *  └--------- item right active animation ←----- item active animation ←-----------┘
 */
directives.controller("carouselController", [
    "$scope", "$timeout", "$q", "$transition",
    function ($scope, $timeout, $q, $transition) {
        var slides = $scope.slides = [];
        var self = this;

        /** direction: "left" | "right" */
        self.setSelect = function (slide, direction) {
            var curActiveIndex = self.getActiveIndex();
            var curActiveSlide = slides[curActiveIndex];
            if (slide === curActiveSlide) {
                return;
            }
            if (!direction) {
                direction = direction || "right";
            }
            var fromDirection = [], toDirection = [];
            if (direction === 'left') {
                fromDirection[0] = '';
                toDirection[0] = 'right';
                fromDirection[1] = 'left';
                toDirection[1] = '';
            } else if (direction === 'right') {
                fromDirection[0] = '';
                toDirection[0] = 'left';
                fromDirection[1] = 'right';
                toDirection[1] = '';
            }
            angular.extend(curActiveSlide, {
                animation: true,
                direction: fromDirection[0],
                active: true
            });
            angular.extend(slide, {
                animation: true,
                direction: fromDirection[1],
                active: true
            });

            var slideTransition = $transition(slide.$element, function () {
                angular.extend(curActiveSlide, {
                    direction: toDirection[0]
                });
                angular.extend(slide, {
                    direction: toDirection[1]
                });
            });
            slideTransition.then(function () {
                angular.extend(curActiveSlide, {
                    animation: false,
                    direction: "",
                    active: false
                });
                angular.extend(slide, {
                    animation: false,
                    direction: "",
                    active: true
                });
            });
        };

        self.setViewSlide = function (slide) {
            for (var i = 0; i < slides.length; i++) {
                if (slides[i] === slide) {
                    slide.active = true;
                } else {
                    slide.active = false;
                }
            }
        };

        self.addSlide = function (slide, element) {
            slide.$element = element;
            slides.push(slide);
            if (slides.length === 1) {
                self.setViewSlide(slide);
            }
        };
        self.removeSlide = function (slide) {
            for (var i = 0; i < slides.length; i++) {
                if (slides[i] === slide) {
                    slides.splice(i, 1);
                    break;
                }
            }
        };
        self.clearSlide = function () {
            for (var i = 0; i < slides.length; i++) {
                slides[i].$destroy();
            }
            slides = [];
        };

        self.getActiveIndex = function () {
            for (var i = 0; i < slides.length; i++) {
                if (slides[i].active) {
                    return i;
                }
            }
        };

        $scope.pre = function () {
            var slideIndex = self.getActiveIndex();
            if (slideIndex === 0) {
                slideIndex = slides.length - 1;
            } else {
                slideIndex--;
            }
            self.setSelect(slides[slideIndex], 'left');
        };
        $scope.next = function () {
            var slideIndex = self.getActiveIndex();
            if (slideIndex === slides.length - 1) {
                slideIndex = 0;
            } else {
                slideIndex++;
            }
            self.setSelect(slides[slideIndex], 'right');
        };
    }
]);
directives.directive("gxCarousel", function () {
    return {
        restrict: 'A',
        transclude: true,
        scope: {
            carouselConfig: '=gxCarousel'
        },
        controller: 'carouselController',
        controllerAs: 'carouselCtrl',
        templateUrl: './carousel/carousel.html',
        link: function (scope, ele, attrs, carouselController) {

            var config = {
                viewCount: 1,
                isAutoPlay: 'r',
                indicator: 'lr'
            };
            scope.carouselConfig = angular.extend(config, scope.carouselConfig);

            scope.indicator = [];
        }
    };
});
directives.directive("gxSlide", function () {
    return {
        require: '^gxCarousel',
        restrict: 'A',
        transclude: true,
        scope: {
            active: '=?',
            direction: '=?',
            animation: '=?'
        },
        replace: true,
        template: "<div class='gx-slide' ng-transclude\
            ng-class='{\
                \"active\":active,\
                \"left\":direction===\"left\",\
                \"right\":direction===\"right\",\
                \"animation\":animation\
            }'\
            ></div>",
        link: function (scope, ele, attrs, carouselCtrl) {
            carouselCtrl.addSlide(scope, ele);

            scope.$on("$destroy", function () {
                carouselCtrl.removeSlide(scope);
            });
        }
    }
});