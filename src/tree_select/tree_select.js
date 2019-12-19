var main = angular.module('directives');
// DFS 对每一个节点调用reset方法
var resetTree = function (tree, resetFn, entityField, childrenField) {
    if (!tree) {
        return;
    }

    if (tree[childrenField]) {
        for (var i = 0; i < tree[childrenField].length; i++) {
            resetFn(tree[childrenField][i][entityField]);
            resetTree(tree[childrenField][i], resetFn, entityField, childrenField);
        }
        resetFn(tree[entityField]);
    }
};
// DFS 对每一个满足条件的节点调用reset方法
var resetPathInTreeLeaf = function (tree, key, value, resetFn, entityField, childrenField) {
    if (!tree) {
        return false;
    }

    if (tree[entityField][key] === value) {
        return true;
    }
    if (tree[childrenField]) {
        var correctNode = false;
        for (var i = 0; i < tree[childrenField].length; i++) {
            correctNode = resetPathInTreeLeaf(tree[childrenField][i],
                key, value, resetFn, entityField, childrenField);
            if (correctNode) {
                resetFn(tree[childrenField][i][entityField]);
                resetFn(tree[entityField]);
                return true;
            }
        }
    }
    return false;
};

main.directive("treeSelect", function ($compile, $timeout) {
    return {
        restrict: "E",
        scope: {
            tree: '=',
            treeConfig: '='
            // oneCombineMode: '@',
        },
        templateUrl: "./src/tree_select/tree_select.html",
        link: function (scope, ele, attrs) {
            var treeConfig = {
                isShow: true,
                entityField: '',
                valueField: '',
                textField: '',
                childrenField: '',
                afterSelect: function () {
                    return true;
                }
            };
            scope.treeConfig = angular.extend(treeConfig, scope.treeConfig);

            var unbind = scope.$watch("treeConfig.isShow", function (newVal) {
                var tree = scope.tree;
                if (tree) {
                    if (newVal) {
                        scope.showTreeNode(null, null, tree);
                    } else {
                        scope.hideTreeNode(null, null, tree);
                    }
                }
            });

            var lastParentNode = null;
            var invokeLater = null;
            scope.showTreeNode = function (event, parentNode, node) {
                var entityField = scope.treeConfig.entityField,
                    valueField  = scope.treeConfig.valueField;
                
                if (event) {
                    event.stopPropagation();
                }
                if (invokeLater) {
                    $timeout.cancel(invokeLater);
                }

                if (lastParentNode && node && lastParentNode !== node &&
                    lastParentNode[entityField].level === node[entityField].level) {
                    lastParentNode[entityField].open = false;
                }
                lastParentNode = null;

                if (parentNode) {
                    parentNode[entityField].open = true;
                }
                if (node) {
                    node[entityField].open = true;
                    resetPathInTreeLeaf(scope.tree, valueField, node[entityField][valueField],
                        function (nodeData) {
                            nodeData.open = true;
                        }, entityField, scope.treeConfig.childrenField);
                }
            };
            scope.hideTreeNode = function (event, parentNode, node) {
                if (event) {
                    event.stopPropagation();
                }
                
                lastParentNode = parentNode;
                if (node) {
                    node[scope.treeConfig.entityField].open = false;
                }

                if (invokeLater) {
                    $timeout.cancel(invokeLater);
                }
                invokeLater = $timeout(function () {
                    resetTree(scope.tree, function (nodeData) {
                        nodeData.open = false;
                    }, scope.treeConfig.entityField, scope.treeConfig.childrenField);
                }, 300);
            };
            scope.selectNode = function (node) {
                if (scope.treeConfig.afterSelect) {
                    scope.treeConfig.afterSelect(node);
                }
            };

            scope.$on("$destroy", function () {
                unbind();
            });
        }
    };
});