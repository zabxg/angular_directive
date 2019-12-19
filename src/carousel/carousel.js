var directives = angular.module('directives');

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

        var transitionEndHandler = function (event) {
            $rootScope.$apply(function () {
                element.unbind(endEventName, transitionEndHandler);
                deferred.resolve(element);
            });
        };

        if (endEventName) {
            element.bind(endEventName, transitionEndHandler);
            var reflow = element[0].offsetWidth; //force reflow
        }

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
    "$scope", "$timeout", "$q", "$interval", "$transition",
    function ($scope, $timeout, $q, $interval, $transition) {
        var slides = $scope.slides = [];
        var self = this;
        var lastTransition, autoInterval;
        var activeSlide = null, activeSlideIndex;

        /** direction: "left" | "right" */
        self.setSelect = function (slide, direction) {
            var slideIndex = slides.indexOf(slide);
            if (slide === activeSlide || !activeSlide) {
                slide.active = true;
                activeSlide = slide;
                return;
            }
            if (!direction) {
                var curActiveIndex = self.getActiveIndex();
                direction = slideIndex > curActiveIndex ? 'left' : 'right';
            }

            if (lastTransition) {
                lastTransition.cancel();
                $timeout(goSlide);
            } else {
                goSlide();
            }

            function goSlide() {
                for (var i = 0; i < slides.length; i++) {
                    if (slides[i] !== activeSlide && slides[i] !== slide) {
                        angular.extend(slides[i], { animation: false, direction: false, active: false });
                    }
                }
                var revertDirection = direction === 'left' ? 'right' : 'left';
                var fromDirection = ['', direction],
                    toDirection   = [revertDirection, ''];

                angular.extend(activeSlide, { animation: true, direction: fromDirection[0], active: true });
                angular.extend(slide, { animation: true, direction: fromDirection[1], active: true });

                (function (preSlide, nextSlide) {
                    $scope.$$postDigest(function () {
                        lastTransition = $transition(nextSlide.$element, function () {
                            angular.extend(preSlide, { direction: toDirection[0] });
                            angular.extend(nextSlide, { direction: toDirection[1] });
                        });
                        lastTransition.then(function () {
                            transitionDone(preSlide, nextSlide);
                        }, function () {
                            transitionDone(preSlide, nextSlide);
                        });
                    });
                })(activeSlide, slide);
                activeSlide = slide;
                self.restart();
            }
            function transitionDone(preSlide, nextSlide) {
                angular.extend(preSlide, { animation: false, direction: "", active: false });
                angular.extend(nextSlide, { animation: false, direction: "", active: true });
                lastTransition = null;
            }
        };

        self.addSlide = function (slide, element) {
            slide.$element = element;
            slides.push(slide);
            if (slides.length === 1) {
                self.setSelect(slide);
                self.restart();
            }
        };
        self.removeSlide = function (slide) {
            for (var i = 0; i < slides.length; i++) {
                if (slides[i] === slide) {
                    slides.splice(i, 1);
                    break;
                }
            }
            if (slides.length > 1) {
                self.restart();
            }
        };

        self.getActiveIndex = function () {
            for (var i = 0; i < slides.length; i++) {
                if (slides[i].active) {
                    return i;
                }
            }
        };

        self.restart = function () {
            self.pause();
            if ($scope.carouselConfig.isPlay) {
                autoInterval = $timeout(function () {
                    $scope.next();
                }, $scope.carouselConfig.playInterval, this);
            }
        };
        self.pause = function () {
            if (autoInterval) {
                $timeout.cancel(autoInterval);
            }
        };

        $scope.pre = function () {
            var slideIndex = self.getActiveIndex();
            if (slideIndex === 0) {
                slideIndex = slides.length - 1;
            } else {
                slideIndex--;
            }
            if (!lastTransition) {
                self.setSelect(slides[slideIndex], 'left');
            }
        };
        $scope.next = function () {
            var slideIndex = self.getActiveIndex();
            if (slideIndex === slides.length - 1) {
                slideIndex = 0;
            } else {
                slideIndex++;
            }
            if (!lastTransition) {
                self.setSelect(slides[slideIndex], 'right');
            }
        };
        $scope.select = self.setSelect;
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
                viewSize: 1,
                slideSize: 1,

                layout: 'h', // 'v' 'h' 卡片布局
                
                indicator: true,
                onClickIndicator: null,

                isPlay: true,
                playMode: '', // 'one'一次 / 'loop'无缝循环 / 'back'回到第一 / 'cycle'往复循环
                playInterval: 1500,
                playAnimation: 'linear' // 'linear'
            };
            var checkConfig = function () {
                var carouselConfig = scope.carouselConfig;
                if (!angular.isNumber(carouselConfig.playInterval) || 
                    carouselConfig.playInterval !== carouselConfig.playInterval) {
                    delete carouselConfig.playInterval;
                }
            };
            checkConfig();
            scope.carouselConfig = angular.extend(config, scope.carouselConfig);

            scope.$on("$destroy", function () {
                carouselController.pause();
            });
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
        template: "<div class='gx-slide' ng-transclude" +
            "ng-class='{" +
                "\"active\":active," +
                "\"left\":direction===\"left\"," +
                "\"right\":direction===\"right\"," +
                "\"animation\":animation" +
            "}'" +
        "></div>",
        link: function (scope, ele, attrs, carouselCtrl) {
            carouselCtrl.addSlide(scope, ele);

            scope.$on("$destroy", function () {
                ele.unbind(transitionEndEventName, transitionEndHandler);
                carouselCtrl.removeSlide(scope);
            });
        }
    };
});