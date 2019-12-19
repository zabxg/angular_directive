var directives = angular.module('directives');
var getPos = function (element) {
    var eleOffset = $(element).offset();
    eleOffset.height = $(element).height();
    return eleOffset;
};

// 找路径: 最后的节点满足 obj[key] === value 的条件
var findPathInTreeLeaf = function (tree, path, key, value, entityField, childrenField) {
    if (!tree) { return false; }

    if (tree[entityField][key] === value) {
        path.unshift(tree);
        return true;
    }

    if (tree[childrenField]) {
        var correctNode = false;
        for (var i = 0; i < tree[childrenField].length; i++) {
            correctNode = findPathInTreeLeaf(tree[childrenField][i], 
                path, key, value, entityField, childrenField);
            if (correctNode) {
                path.unshift(tree);
                return true;
            }
        }
    }
    return false;
};

directives.directive("regionSelect", function ($timeout, $document, $http, $rootScope, $compile) {
    return {
        restrict: "E",
        scope: {
            regionConfig: '='
        },
        template: '<p class="tree-select-path"' +
                'ng-mouseover="regionCtrl.toggleTree(true)"' +
                'ng-mouseout="regionCtrl.toggleTree(false)">' +
                '<span class="tree-select-node" ng-show="regionCtrl.regionPath.length===0">_</span>' +
                '<span ng-repeat="leaf in regionCtrl.regionPath track by $index"' +
                    'ng-class="{\'next\':!$first}"' +
                    'class="tree-select-node" ng-click="regionCtrl.selectPath($index)"' +
                    '>{{leaf.originEntity.regionName}}</span>' +
            '</p>',
        compile: function (ele, attrs) {
            var valueField = 'regionCode';

            var initScope = function (scope) {
                scope.treeConfig = {
                    tree: null,
                    isShow: false,
                    entityField: 'originEntity',
                    valueField: valueField,
                    textField: 'regionName',
                    childrenField: 'children'
                };
                var pos = getPos(ele);
                scope.treeStyle = {
                    left: pos.left + "px",
                    top: pos.top + pos.height + "px"
                };
            };

            var compileTree = function () {
                var template = "<tree-select tree-config='treeConfig'"+
                    "tree='treeConfig.tree' class='tree-select' ng-style='treeStyle'></tree-select>";
                var scope = $rootScope.$new();
                initScope(scope);
                var dom = $(template);
                var linkFn = $compile(dom);
                $(document.body).append(linkFn(scope));

                return {
                    scope: scope,
                    linkFn: linkFn,
                    destroy: function () {
                        dom.remove();
                        scope.$destroy();
                    }
                };
            };

            var compileRes = compileTree(treeScope);
            var treeScope   = compileRes.scope;
            var treeLinkFn  = compileRes.linkFn;
            var treeDestroy = compileRes.destroy;

            return function link(regionScope, $element, $attrs) {
                
                regionScope.regionCtrl = {
                    tree: null,
                    regionPath: [],
                    regionSelected: null,

                    init: function () {
                        var self = this;

                        treeScope.treeConfig.afterSelect = function (region) {
                            if (region) {
                                self.selectRegion(region.originEntity[valueField]);
                            }
                        };

                        self.getRegion().then(function (regionTree) {
                            // select first one
                            var firstRegion = regionTree.children[0];
                            self.regionPath = [firstRegion];
                            self.regionSelected = firstRegion;
                            
                            // refresh tree data
                            self.tree = regionTree;
                            treeScope.treeConfig.tree = regionTree;
                            treeLinkFn(treeScope);
                        });
                    },

                    getRegion: function () {
                        // var deferred = $.Deferred();
                        // Models.Province.one("config/region/tree", scope.regionConfig.userMagicId).get("").then(function (ret) {
                        //     deferred.resolve(ret.data || []);
                        // }, function () {
                        //     deferred.resolve([]);
                        // });
                        // return deferred.promise();
                        return $http.get('tree_select/region.json').then(function(ret) {
                            var tree = ret.data.data;
                            var firstLevel = parseInt(tree[0].originEntity.level);
                            return {
                                children: tree,
                                originEntity: {
                                    level: (firstLevel - 1)
                                }
                            };
                        });
                    },

                    toggleTree: function (isShow) {
                        treeScope.treeConfig.isShow = isShow;
                    },

                    /**
                     * 设置选中区域
                     * @param {String} regionValue 区域的字段值
                     */
                    selectRegion: function (regionValue) {
                        var path = [];
                        findPathInTreeLeaf(this.tree.children[0], path, valueField, regionValue,
                            "originEntity", "children");
                        this.regionPath = path;
                        this.regionSelected = path[path.length - 1];

                        regionScope.regionConfig.regionChanged(this.regionSelected);
                    },
                    /**
                     * 设置区域为其父级
                     * @param {Number} index 传-1为上一级，-2为上两级
                     */
                    selectPath: function (index) {
                        if (index < 0) {
                            index += this.regionPath.length;
                        }
                        index = Math.max(1, index + 1);
                        this.regionPath = this.regionPath.slice(0, index);
                        this.regionSelected = this.regionPath[index];

                        regionScope.regionConfig.regionChanged(this.regionSelected);
                    }
                };

                // 暴露给外部的方法: setRegion | getRegion | setRegionParent
                regionScope.regionConfig.setRegion = function (regionCode) {
                    regionScope.regionCtrl.selectRegion(regionCode);
                };
                regionScope.regionConfig.getRegion = function () {
                    return regionScope.regionCtrl.regionSelected.originEntity;
                };
                regionScope.regionConfig.setRegionParent = function (index) {
                    regionScope.regionCtrl.selectPath(index);
                };
                
                regionScope.$on("$destroy", function () {
                    treeDestroy();
                    unbind();
                });

                regionScope.regionCtrl.init();
            };
        }
    };
});