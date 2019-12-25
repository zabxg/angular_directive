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
        var self = this;
        var slides = $scope.slides = [];
        var lastTransition, autoInterval;
        var hasLastSlide = false;
        var cloneNodeAtFront = 0, cloneNodeAtEnd = 0;
        var activeSlide = null;

        /** direction: "left" | "right" */
        self.setSelect = function (slide, direction) {
            var curActiveIndex = self.getActiveIndex();
            var slideIndex = slides.indexOf(slide);
            var positionAttrName = $scope.carouselConfig.layout === 'v' ? 'top' : 'left';

            if (slide === activeSlide || !activeSlide) {
                slide.active = true;
                activeSlide = slide;
                $scope.layoutSize[positionAttrName] = "0%";
                return;
            }

            var beforeLayoutClassLength = $scope.layoutClass.length;
            var beforePosition, middlePosition, afterPosition;
            var viewSize = $scope.carouselConfig.viewSize;
            var slideSize = slides.length;
            var moveUnit;

            beforePosition = parseFloat($scope.layoutSize[positionAttrName]);
            if (!cloneNodeAtFront) {
                for (var i = 0; i < viewSize; i++) {
                    $scope.$transcludeElement.prepend(slides[slideSize - i - 1].$element.clone());
                    cloneNodeAtFront++;
                }
            }
            if (!cloneNodeAtEnd) {
                for (var i = 0; i < viewSize; i++) {
                    $scope.$transcludeElement.append(slides[i].$element.clone());
                    cloneNodeAtEnd++;
                }
            }
            self.updateLayout(slides.length + cloneNodeAtEnd + cloneNodeAtFront, $scope.carouselConfig.viewSize);
            moveUnit = 100 / viewSize;
            beforePosition = -(curActiveIndex + viewSize) * moveUnit;
            $scope.layoutSize[positionAttrName] = beforePosition + "%";

            $scope.$$postDigest(function () {
                if (lastTransition) {
                    lastTransition.cancel();
                    $timeout(goNext);
                } else {
                    goNext();
                }
            });

            function goNext() {
                slide.active = true;
                activeSlide.active = false;

                afterPosition = beforePosition + (moveUnit * (slideIndex > curActiveIndex ? -1 : 1)) + "%";
                middlePosition = afterPosition;
                if (direction) {
                    if (slideIndex === 0 && curActiveIndex === slideSize - 1) {
                        middlePosition = beforePosition - moveUnit + "%";
                        afterPosition = -viewSize * moveUnit + "%";
                    }
                    if (curActiveIndex === 0 && slideIndex === slideSize - 1) {
                        middlePosition = beforePosition + moveUnit + "%";
                        afterPosition = -(slideSize + viewSize - 1) * moveUnit + "%";
                    }
                }

                if ($scope.carouselConfig.playAnimation === 'none') {
                    transitionDone();
                } else {
                    $scope.layoutClass.push("animation");
                    
                    (function (el) {
                        $scope.$$postDigest(function () {
                            lastTransition = $transition(el, function () {
                                $scope.layoutSize[positionAttrName] = middlePosition;
                            });
                            lastTransition.then(transitionDone, transitionDone);
                        });
                    })($scope.$transcludeElement);
                }
                activeSlide = slide;
                self.restart();

                function transitionDone() {
                    $scope.layoutClass.length = beforeLayoutClassLength; // remove animation
                    $scope.layoutSize[positionAttrName] = afterPosition;
                    lastTransition = null;
                }
            }
        };

        self.addSlide = function (slide, element) {
            slide.$element = element;
            slides.push(slide);

            if (slides.length === 1) {
                self.setSelect(slide);
                self.restart();
            }
            self.updateLayout(slides.length, $scope.carouselConfig.viewSize);
        };
        self.removeSlide = function (slide) {
            for (var i = 0; i < slides.length; i++) {
                if (slides[i] === slide) {
                    if (slide.active) {
                        activeSlide = null;
                    }
                    slides.splice(i, 1);
                    break;
                }
            }
            if (slides.length === 0) {
                // 移除之前克隆的DOM节点
                self.removeSlideDOM(0);
            } else {
                if (hasLastSlide) {
                    self.removeSlideDOM(-1);
                    hasLastSlide = false;
                }
                if (!activeSlide) {
                    self.setSelect(slides[0]);
                }
            }
            if (slides.length > 1) {
                self.restart();
            }
        };
        self.removeSlideDOM = function (index) {
            var slideDOMs = $scope.$transcludeElement.children();
            var slideIndex = index + (index >= 0 ? 0 : slideDOMs.length);
            var lastSlideDOM = slideDOMs[slideIndex];
            if (lastSlideDOM) {
                lastSlideDOM.remove();
            }
        };
        self.updateLayout = function (slideNum, viewNum) {
            var positionAttrName = $scope.carouselConfig.layout === "v" ? "height" : "width";
            var slideSize = 100 / slideNum + "%";
            var slideDOMs = $scope.$transcludeElement.children();
            slideDOMs.css(positionAttrName, slideSize);
            $scope.layoutSize[positionAttrName] = 100 * slideNum / viewNum + "%";
            return slideSize;
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
            if (slides.length <= $scope.carouselConfig.viewSize) {
                return;
            }

            var slideIndex = self.getActiveIndex();
            if (slideIndex === 0) {
                slideIndex = slides.length - 1;
            } else {
                slideIndex--;
            }
            if (!lastTransition && slides[slideIndex]) {
                self.setSelect(slides[slideIndex], 
                    $scope.carouselConfig.layout === 'v' ? 'top' : 'left');
            }
        };
        $scope.next = function () {
            if (slides.length <= $scope.carouselConfig.viewSize) {
                return;
            }

            var slideIndex = self.getActiveIndex();
            if (slideIndex === slides.length - 1) {
                slideIndex = 0;
            } else {
                slideIndex++;
            }
            if (!lastTransition && slides[slideIndex]) {
                self.setSelect(slides[slideIndex], 
                    $scope.carouselConfig.layout === 'v' ? 'bottom' : 'right');
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
        templateUrl: 'src/carousel/carousel.html',
        link: function (scope, ele, attrs, carouselController, transcludeFn) {

            var config = {
                viewSize: 1,
                layout: 'h', // 'v' 'h' 卡片布局
                indicator: true,
                isPlay: false,
                playInterval: 1500,
                playAnimation: 'none' // 'linear' 'none'
            };
            var checkConfig = function () {
                var carouselConfig = scope.carouselConfig || {};
                if (!angular.isNumber(carouselConfig.playInterval) || 
                    carouselConfig.playInterval !== carouselConfig.playInterval) {
                    delete carouselConfig.playInterval;
                }
                if (!angular.isNumber(carouselConfig.viewSize) || 
                    carouselConfig.viewSize === 0 ||
                    carouselConfig.viewSize !== carouselConfig.viewSize) {
                    delete carouselConfig.viewSize;
                }
                if (!angular.isString(carouselConfig.layout) ||
                    carouselConfig.layout !== 'v' || carouselConfig.layout !== 'h') {
                    delete carouselConfig.playInterval;
                }
            };
            checkConfig();
            scope.carouselConfig = angular.extend(config, scope.carouselConfig);

            scope.layoutSize = {
                top:  '0%',
                left: '0%'
            };
            if (scope.carouselConfig.layout === 'v') {
                scope.layoutClass = ['column'];
            } else {
                scope.layoutClass = ['row'];
            }
            scope.$transcludeElement = (function () {
                var transcludeElement;
                transcludeElement = ele.children().eq(0).children().eq(0).children().eq(0);
                if (transcludeElement.hasClass("gx-carousel-wrapper")) {
                    return transcludeElement;
                }
                return ele;
            })();

            scope.$on("$destroy", function () {
                carouselController.pause();
            });
        }
    };
});
directives.directive("gxSlide", ['$compile', function ($compile) {
    return {
        require: '^gxCarousel',
        restrict: 'A',
        transclude: true,
        scope: {
            active: '=?'
        },
        replace: true,
        template: "<div class='gx-slide' ng-transclude></div>",
        link: function (scope, ele, attrs, carouselCtrl, transclude) {
            carouselCtrl.addSlide(scope, ele);

            scope.$on("$destroy", function () {
                carouselCtrl.removeSlide(scope);
            });
        }
    };
}]);