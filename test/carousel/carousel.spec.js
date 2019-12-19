describe("Testing Carousel", function () {

    var $compile, $rootScope;

    beforeEach(angular.mock.module('directives'));

    beforeEach(inject(
        ['$compile', '$rootScope', function ($c, $r) {
            $compile = $c;
            $rootScope = $r;
        }]
    ));

    it("should set the first element active", function () {
        var element = $compile('<div>Welcome</div>')($rootScope);
        expect(element.html()).toMatch(/Welcome/i);
    });

});