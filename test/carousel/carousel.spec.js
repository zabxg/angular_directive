describe("Testing Carousel", function () {

    var $compile, $rootScope, $httpBackend;
    var myTemplate, myScope;
    var findIndicator = function (compiledElement) {
        return compiledElement.find(".gx-carousel-container .gx-carousel-indicator .indicator-icon");
    };
    var findControl = function (compiledElement) {
        return compiledElement.find(".gx-carousel-container .gx-carousel-control");
    };
    var findInner = function (compiledElement) {
        return compiledElement.find(".gx-carousel-container .gx-carousel-main .gx-carousel-wrapper");
    };
    var expectSlideActive = function (index) {
        for (var i = 0; i < myScope.carouselData.length; i++) {
            if (i === index) {
                expect(myScope.carouselData[i].active).toBe(true);
            } else {
                expect(myScope.carouselData[i].active).toBe(false);
            }
        }
    };
    var controlBtnClick = function (element, type) {
        var indicator = findControl(element);
        var btn = indicator.filter("." + type);
        btn.click();
    };

    beforeEach(angular.mock.module('directives'));
    beforeEach(inject(
        ['$compile', '$rootScope', '$httpBackend',
        function ($c, $r, $h) {
            $compile = $c;
            $rootScope = $r;
            $httpBackend = $h;
        }]
    ));
    
    beforeEach(function () {
        myScope = $rootScope.$new();
        myScope.carouselConfig = {playAnimation: 'none'};
        myScope.slideConfig  = {};
        myScope.carouselData = [];
        myTemplate = $('<div gx-carousel="carouselConfig" class="carousel-container">' +
            '<div gx-slide="slideConfig" ng-repeat="item in carouselData" active="item.active">' +
                '<div class="test-item">' +
                    '<div class="img-wrap small">{{item.text}}</div>' +
                '</div>' +
            '</div>' +
        '</div>');
    });
    beforeEach(function () {
        $httpBackend.when('GET', 'src/carousel/carousel.html').respond(`<div class="gx-carousel-container">

            <ol class="gx-carousel-indicator">
                <li ng-repeat="item in slides track by $index"
                    ng-class="{'active':item.active}"
                    ng-click="select(item)" class="indicator-icon">
                    <span class="indicator-inner"></span>
                </li>
            </ol>
        
            <a href role="button" class="gx-carousel-control left"
                ng-if="carouselConfig.layout==='h'" ng-click="pre()">
                <i class="fa fa-angle-left control-icon" aria-hidden="true"></i>
            </a>
            <a href role="button" class="gx-carousel-control right"
                ng-if="carouselConfig.layout==='h'" ng-click="next()">
                <i class="fa fa-angle-right control-icon" aria-hidden="true"></i>
            </a>
        
            <a href role="button" class="gx-carousel-control top" 
                ng-if="carouselConfig.layout==='v'" ng-click="pre()">
                <i class="fa fa-angle-up control-icon" aria-hidden="true"></i>
            </a>
            <a href role="button" class="gx-carousel-control bottom"
                ng-if="carouselConfig.layout==='v'" ng-click="next()">
                <i class="fa fa-angle-down control-icon" aria-hidden="true"></i>
            </a>
        
            <div class="gx-carousel-main">
                <div class="gx-carousel-wrapper" ng-transclude></div>
            </div>
        </div>`);
    });

    describe("basis", function () {
        it("still compile when pass empty config", function () {
            myScope.carouselConfig = {};
            myScope.slideConfig  = {};
            myScope.carouselData = [];
            var element = $compile(myTemplate)(myScope);
            $httpBackend.flush();
            expect(element.hasClass("carousel-container")).toBe(true);
        });

        it("should set the first slide element active", function () {
            myScope.carouselData = [{text: "one"}];

            $compile(myTemplate)(myScope);
            $httpBackend.flush();

            expect(myScope.carouselData[0].active).toBe(true);

            myScope.carouselData.push({two: "two"});
            myScope.$apply();
            expect(myScope.carouselData[0].active).toBe(true);
        });

        describe("indicator button", function () {
            it("should compile the indicators", function () {
                myScope.carouselData = [{text: "one"}];

                var element = $compile(myTemplate)(myScope);
                $httpBackend.flush();

                var indicator = findIndicator(element);
                expect(indicator.length).toBe(1);

                myScope.carouselData.push({text: "two"});
                myScope.$apply();
                indicator = findIndicator(element);
                expect(indicator.length).toBe(2);
            });

            it("jump to corresponding page after clicking indicator button", function () {
                myScope.carouselData = [{text: "one"}];

                var element = $compile(myTemplate)(myScope);
                $httpBackend.flush();

                findIndicator(element).eq(0).click();
                expectSlideActive(0);

                myScope.carouselData.push({text: "two"});
                myScope.carouselData.push({text: "three"});
                myScope.$apply();
                findIndicator(element).eq(1).click();
                expectSlideActive(1);
                findIndicator(element).eq(0).click();
                expectSlideActive(0);
                findIndicator(element).eq(2).click();
                expectSlideActive(2);
            });
        });

        describe("control button", function () {
            it("should only exist left and right button when layout is set empty or 'h'", function () {
                var element = $compile(myTemplate)(myScope);
                $httpBackend.flush();
                
                var indicator = findControl(element);
                expect(indicator.is(".left")).toBe(true);
                expect(indicator.is(".right")).toBe(true);
                expect(indicator.is(".top")).toBe(false);
                expect(indicator.is(".bottom")).toBe(false);
                
                myScope.carouselConfig.layout = 'h';
                myScope.$apply();
                var indicator = findControl(element);
                expect(indicator.is(".left")).toBe(true);
                expect(indicator.is(".right")).toBe(true);
                expect(indicator.is(".top")).toBe(false);
                expect(indicator.is(".bottom")).toBe(false);
            });
            it("should only exist top and bottom button when layout is set 'v'", function () {
                myScope.carouselConfig.layout = 'v';
                var element = $compile(myTemplate)(myScope);
                $httpBackend.flush();
                
                var indicator = findControl(element);
                expect(indicator.is(".left")).toBe(false);
                expect(indicator.is(".right")).toBe(false);
                expect(indicator.is(".top")).toBe(true);
                expect(indicator.is(".bottom")).toBe(true);
            });
            it("jump to next page after clicking right button", function () {
                myScope.carouselData = [{text: "one"}];
                var element = $compile(myTemplate)(myScope);
                $httpBackend.flush();
                
                controlBtnClick(element, "right");
                expectSlideActive(0);

                myScope.carouselData.push({text: "two"});
                myScope.$apply();
                controlBtnClick(element, "right");
                expectSlideActive(1);
            });
            it("jump to previous page after clicking left button", function () {
                myScope.carouselData = [{text: "one"}];
                var element = $compile(myTemplate)(myScope);
                $httpBackend.flush();
                
                controlBtnClick(element, "left");
                expectSlideActive(0);

                myScope.carouselData.unshift({text: "two"});
                myScope.$apply();
                controlBtnClick(element, "left");
                expectSlideActive(0);
            });
            it("jump to next page after clicking bottom button", function () {
                myScope.carouselConfig.layout = 'v';
                myScope.carouselData = [{text: "one"}];
                var element = $compile(myTemplate)(myScope);
                $httpBackend.flush();
                
                controlBtnClick(element, "bottom");
                expectSlideActive(0);

                myScope.carouselData.push({text: "two"});
                myScope.$apply();
                controlBtnClick(element, "bottom");
                expectSlideActive(1);
            });
            it("jump to previous page after clicking top button", function () {
                myScope.carouselConfig.layout = 'v';
                myScope.carouselData = [{text: "one"}];
                var element = $compile(myTemplate)(myScope);
                $httpBackend.flush();
                
                controlBtnClick(element, "top");
                expectSlideActive(0);

                myScope.carouselData.unshift({text: "two"});
                myScope.$apply();
                controlBtnClick(element, "top");
                expectSlideActive(0);
            });
        });
    });

    describe("transition", function () {
        
    });

    // describe("interval");

});