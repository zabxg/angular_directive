var main = angular.module('directives');

// 找路径: 每个路径的上的节点均满足 obj[key] === value 的条件
var findPathInTree = function (tree, key, value, resetFn, path, entityField, childrenField) {
    if (!tree || !tree.length) {
        return path;
    }

    var leaf = null;
    for (var i = 0; i < tree.length; i++) {
        leaf = tree[i][entityField];
        if (leaf[key] === value) {
            resetFn(leaf);
            path.push(tree[i]);
            return findPathInTree(tree[i][childrenField], key, value,
                resetFn, path, entityField, childrenField);
        }
    }
    return path;
};
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
        templateUrl: "./tree_select/tree_select.html",
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

            var lastParentNode = null,
                lastNode = null;
            var invokeLater = null;
            scope.showTreeNode = function (event, parentNode, node) {
                event && event.stopPropagation();
                invokeLater && $timeout.cancel(invokeLater);
                var entityField = scope.treeConfig.entityField;
                if (lastParentNode && node && lastParentNode !== node &&
                    lastParentNode[entityField].level === node[entityField].level) {
                    lastParentNode[entityField].open = false;
                }

                if (parentNode) {
                    parentNode[entityField].open = true;
                }
                if (node) {
                    node[entityField].open = true;
                    resetPathInTreeLeaf(scope.tree, "magicId", node[entityField].magicId, function (nodeData) {
                        nodeData.open = true;
                    }, entityField, scope.treeConfig.childrenField);
                }

                lastParentNode = null;
                lastNode = null;
            };
            scope.hideTreeNode = function (event, parentNode, node) {
                event && event.stopPropagation();
                lastParentNode = parentNode;
                if (node) {
                    node[scope.treeConfig.entityField].open = false;
                    lastNode = node;
                }

                invokeLater && $timeout.cancel(invokeLater);
                invokeLater = $timeout(function () {
                    resetTree(scope.tree, function (nodeData) {
                        nodeData.open = false;
                    }, scope.treeConfig.entityField, scope.treeConfig.childrenField);
                }, 100);
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
    }
});