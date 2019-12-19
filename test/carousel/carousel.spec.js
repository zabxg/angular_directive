describe("Testing Carousel", function () {

    var $compile, $rootScope, $httpBackend;
    var myTemplate, myScope;

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
        myTemplate = angular.element('<div gx-carousel="carouselConfig" id="carousel_container">' +
            '<div gx-slide="slideConfig" ng-repeat="item in carouselData">' +
                '<div class="test-item">' +
                    '<div class="img-wrap small">{{item}}</div>' +
                '</div>' +
            '</div>' +
        '</div>');
    });
    // beforeEach(function () {
    //     $httpBackend.when('GET', 'common/directives/tree_select.html').respond(treeSelectHtml);
    // });

    it("run when pass empty config", function () {
        console.log(myTemplate.html());
        myScope.carouselConfig = {};
        myScope.slideConfig = [];
        var element = $compile(myTemplate)(myScope);
        console.log(element.html());
        expect(element.find("#carousel_container").length).toBe(1);
    });
    
    // it("should set the first element active", function () {
    //     var element = $compile(myTemplate)($rootScope);
    //     expect(element.find("#carousel_container").length).toBe(1);
    // });

});