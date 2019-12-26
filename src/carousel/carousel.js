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

    directives.controller("carouselController", [
        "$scope", "$timeout", "$interval", "$transition", "$compile",
        function ($scope, $timeout, $interval, $transition, $compile) {
            var self = this;
            var slides = $scope.slides = [];
            var lastTransition, autoInterval, viewSize = 1;
            var cloneNodeAtFront = 0, cloneNodeAtEnd = 0;
            var activeSlide = null;

            /**
             * 设为选中元素
             * @param {Scope} slide 设为选中的元素
             * @param {undefined|"left"|"right"|"top"|"bottom"} direction 不传时不触发无限滚动，
             * 此时最后一位到第一位向左方向滑动。
             * @returns
             */
            self.setSelect = function (slide, direction) {
                var curActiveIndex = self.getActiveIndex();
                var slideIndex = slides.indexOf(slide);
                var positionAttrName = $scope.carouselConfig.layout === 'v' ? 'top' : 'left';

                // 仅有一个元素 或 当前页面不可滚动
                if (slide === activeSlide || !activeSlide || 
                    (slides.length <= viewSize)) {
                    self.setSelectSlide(slide);
                    $scope.layoutSize[positionAttrName] = "0%";
                    return;
                }

                var slideSize = slides.length;
                var beforeLayoutClassLength = $scope.layoutClass.length;
                var beforePosition, middlePosition, afterPosition;
                var moveUnit = 100 / viewSize;
                self.updateCloneNode();
                self.updateCarouselSize(slides.length + cloneNodeAtEnd + cloneNodeAtFront, viewSize);
                beforePosition = self.adjustPosition();

                $scope.$$postDigest(function () {
                    // 确保上一次操作完成
                    if (lastTransition) {
                        lastTransition.cancel();
                        $timeout(goNext);
                    } else {
                        goNext();
                    }
                });

                function goNext() {
                    self.setSelectSlide(slide);

                    afterPosition = beforePosition + (moveUnit * (curActiveIndex - slideIndex)) + "%";
                    middlePosition = afterPosition;
                    if (direction) { // 传入`direction`表示开启某一方向的无限滚动
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
                        lastTransition = $transition($scope.$transcludeElement, function () {
                            $scope.layoutSize[positionAttrName] = middlePosition;
                        });
                        lastTransition.then(transitionDone, transitionDone);
                    }
                    self.restart();

                    function transitionDone() {
                        $scope.layoutClass.length = beforeLayoutClassLength;
                        $scope.layoutSize[positionAttrName] = afterPosition;
                        lastTransition = null;
                    }
                }
            };
            
            self.getActiveIndex = function () {
                for (var i = 0; i < slides.length; i++) {
                    if (slides[i].active) {
                        return i;
                    }
                }
            };
            self.setSelectSlide = function (slide, index) {
                for (var i = 0; i < slides.length; i++) {
                    if (slides[i] === slide || index === i) {
                        slides[i].active = true;
                        activeSlide = slides[i];
                        index = i;
                    } else {
                        slides[i].active = false;
                    }
                }
                if (!slide && !(angular.isNumber(index) && index >= 0)) {
                    activeSlide = null;
                    index = -1;
                }
                return index;
            };
            self.updateCloneNode = function (cloneNodeNeedSize) {
                cloneNodeNeedSize = cloneNodeNeedSize === 0 ? cloneNodeNeedSize : (cloneNodeNeedSize || viewSize);
                while (cloneNodeAtFront < cloneNodeNeedSize) {
                    self.appendSlideDOM(0, -cloneNodeAtFront - 1);
                    cloneNodeAtFront++;
                }
                while (cloneNodeAtFront > cloneNodeNeedSize) {
                    self.removeSlideDOM(0);
                    cloneNodeAtFront--;
                }
                while (cloneNodeAtEnd < cloneNodeNeedSize) {
                    self.appendSlideDOM(-1, cloneNodeAtEnd);
                    cloneNodeAtEnd++;
                }
                while (cloneNodeAtEnd > cloneNodeNeedSize) {
                    self.removeSlideDOM(-1);
                    cloneNodeAtEnd--;
                }
            };
            self.adjustPosition = function () {
                var curActiveIndex = self.getActiveIndex();
                var positionAttrName = $scope.carouselConfig.layout === 'v' ? 'top' : 'left';
                var beforePosition = -(curActiveIndex + cloneNodeAtFront) * 100 / viewSize;
                $scope.layoutSize[positionAttrName] = beforePosition + "%";
                return beforePosition;
            };
            /**
             * 更新父元素及子元素的大小
             * @param {Number} slideNum 所有子元素的数量（包括副本）
             * @param {Number} viewNum 单窗口可视子元素的数量
             * @returns
             */
            self.updateCarouselSize = function (slideNum, viewNum) {
                var positionAttrName = $scope.carouselConfig.layout === "v" ? "height" : "width";
                var slideSize = 100 / slideNum + "%";
                var slideDOMs = $scope.$transcludeElement.children();
                slideDOMs.css(positionAttrName, slideSize);
                $scope.layoutSize[positionAttrName] = 100 * slideNum / viewNum + "%";
                return slideSize;
            };
            /**
             * 添加已有滑动元素的副本 （编译后）
             * @param {Number} archorIndex 插入的位置，支持-1，计算时要考虑克隆节点
             * @param {Number} copyIndex 需要复制的元素，支持负值，为需要拷贝的slide的对应索引
             */
            self.appendSlideDOM = function (archorIndex, copyIndex) {
                copyIndex = copyIndex + (copyIndex >= 0 ? 0 : slides.length);
                
                // compile again
                var slideCopyElement = slides[copyIndex].$element.clone();
                slideCopyElement[0].removeAttribute("gx-slide");
                slideCopyElement[0].removeAttribute("ng-repeat");
                slideCopyElement[0].removeAttribute("ng-transclude");
                if (slideCopyElement.children() && slideCopyElement.children()[0]) {
                    slideCopyElement.children()[0].removeAttribute("ng-transclude");
                }
                $compile(slideCopyElement)(slides[copyIndex].$parent);
                
                if (archorIndex === 0) {
                    $scope.$transcludeElement.prepend(slideCopyElement);
                } else if (archorIndex === -1) {
                    $scope.$transcludeElement.append(slideCopyElement);
                } else {
                    var archorElement = $scope.$transcludeElement.children().eq(archorIndex);
                    archorElement.after(slideCopyElement);
                }
            };
            /**
             * 移除节点
             * @param {Number} index 需要删除的元素位置，支持负值，计算时要考虑克隆节点
             */
            self.removeSlideDOM = function (index) {
                var slideDOMs = $scope.$transcludeElement.children();
                var slideIndex = index + (index >= 0 ? 0 : slideDOMs.length);
                var lastSlideDOM = slideDOMs[slideIndex];
                if (lastSlideDOM) {
                    lastSlideDOM.remove();
                }
            };

            /**
             * 添加轮播元素，会同时更新因为无限滚动而添加的节点副本
             * @param {Scope} slide 
             * @param {DOMElement} element 
             */
            self.addSlide = function (slide, element) {
                slide.$element = element;
                slides.push(slide);

                if (cloneNodeAtFront > 0) {
                    // handle existant cloned node
                    self.removeSlideDOM(0);
                    self.appendSlideDOM(Math.max(0, viewSize - 2), -1);
                } else {
                    self.updateCloneNode(0);
                }
                self.updateCarouselSize(slides.length + cloneNodeAtEnd + cloneNodeAtFront, viewSize);
                
                if (slides.length === 1) {
                    self.setSelect(slide);
                    self.restart();
                }
            };
            /**
             * 移除轮播元素，会同时更新因为无限滚动而添加的节点副本
             * @param {Scope} slide
             */
            self.removeSlide = function (slide) {
                var slideSize = slides.length;
                var slideIndex;
                var curActiveIndex;
                for (var i = 0; i < slideSize; i++) {
                    if (slide.active) {
                        curActiveIndex = i;
                    }
                    if (slides[i] === slide) {
                        slideIndex = i;
                        slides.splice(i, 1);
                        slideSize--;
                        break;
                    }
                }

                if (slideSize <= viewSize) {
                    // no enough slide
                    self.setSelectSlide(null, 0);
                    self.updateCloneNode(0);
                    self.updateCarouselSize(slideSize, viewSize);
                } else {
                    if (cloneNodeAtFront > 0) {
                        // has appended clone node, should update the node
                        self.removeSlideDOM(viewSize - 1);
                        self.appendSlideDOM(0, -viewSize);
                    } else if (slideIndex > curActiveIndex) {
                        // hasn't appended clone node, but the removed node is being viewed
                        self.updateCloneNode();
                        self.updateCarouselSize(slideSize, viewSize);
                        self.adjustPosition();
                    }

                    if (slideIndex === curActiveIndex && slides[0]) {
                        self.setSelectSlide(null, 0);
                    }
                }

                self.adjustPosition();
                self.restart();
            };
            self.updateViewSize = function (newViewSize) {
                if (newViewSize === viewSize) { return; }
                var slideSize = slides.length;
                var oldViewSize = viewSize;
                viewSize = newViewSize;
                
                if (slideSize < viewSize) {
                    // no enough slide
                    self.updateCloneNode(0);
                    if (slides.length) {
                        self.setSelectSlide(slides[0]);
                    } else {
                        self.setSelectSlide();
                    }
                } else {
                    if (!cloneNodeAtFront && !cloneNodeAtEnd) {
                        // no cloned node before
                        if (newViewSize > oldViewSize) {
                            self.updateCloneNode();
                        }
                    } else {
                        self.updateCloneNode();
                    }
                }
                self.updateCarouselSize(slideSize + cloneNodeAtFront + cloneNodeAtEnd, viewSize);
                self.adjustPosition();
            };

            self.restart = function () {
                self.pause();
                if ($scope.carouselConfig.isPlay) {
                    autoInterval = $interval(function () {
                        $scope.next();
                    }, $scope.carouselConfig.playInterval, this);
                }
            };
            self.pause = function () {
                if (autoInterval) {
                    $interval.cancel(autoInterval);
                }
            };

            $scope.pre = function () {
                if (slides.length <= viewSize) {
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
                if (slides.length <= viewSize) {
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
            link: {
                pre: function (scope, ele, attrs, carouselController, transcludeFn) {

                /**
                 * @property {Number} viewSize 每个视图可见的元素数量
                 * @property {"v"|"h"} layout 布局，"v"为竖直布局; "h"为水平布局
                 * @property {Boolean} indicator 是否显示指示器
                 * @property {Boolean} control 是否显示控制器
                 * @property {Boolean} isPlay 是否自动轮播
                 * @property {Number} playInterval 自动轮播的间隔
                 * @property {"none"|"linear"} playAnimation 轮播时的动画效果
                 */
                var config = {
                    viewSize: 1,
                    layout: 'h', // 'v' 'h' 卡片布局
                    indicator: true,
                    control: true,
                    isPlay: false,
                    playInterval: 1500,
                    playAnimation: 'none' // 'linear' 'none'
                };

                scope.checkConfig = function () {
                    var carouselConfig = this.carouselConfig || {};
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
                scope.extend = function () {
                    this.carouselConfig = angular.extend(config, this.carouselConfig);

                    this.layoutSize = {
                        top:  '0%',
                        left: '0%'
                    };

                    if (this.carouselConfig.layout === 'v') {
                        this.layoutClass = ['column'];
                    } else {
                        this.layoutClass = ['row'];
                    }

                    var transcludeElement;
                    transcludeElement = ele.children().eq(0).children().eq(0).children().eq(0);
                    if (transcludeElement.hasClass("gx-carousel-wrapper")) {
                        this.$transcludeElement = transcludeElement;
                    } else {
                        this.$transcludeElement = ele;
                    }
                };
                scope.$watch("carouselConfig.viewSize", function (newVal, oldVal) {
                    if (!angular.isNumber(newVal) || newVal === 0 || newVal !== newVal) {
                        scope.carouselConfig.viewSize = 1;
                    }
                    carouselController.updateViewSize(newVal);
                });

                scope.checkConfig();
                scope.extend();

                scope.$on("$destroy", function () {
                    carouselController.pause();
                });
            }
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
            // replace: true,
            template: "<div class='gx-slide' ng-transclude></div>",
            link: function (scope, ele, attrs, carouselCtrl, transclude) {
                carouselCtrl.addSlide(scope, ele);

                scope.$on("$destroy", function () {
                    carouselCtrl.removeSlide(scope);
                });
            }
        };
    }]);