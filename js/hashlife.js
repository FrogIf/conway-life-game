function hashlife(){
    var index = 0;
    function idGenerate(){ // 生成节点id
        return index++;
    }

    const nodeCache = new Array(); // 二维数组, 第一个维度表示深度, 第二个维度存储节点Map
    const emptyNodes = new Array(); // 没有存活节点的区域, index = depth

    function getKey(node){
        return node.ne._id +"_" + node.nw._id + "_" + node.se._id + "_" + node.sw._id;
    }

    function searchNodeFromCache(node){
        if(node.depth - 1 < nodeCache.length){
            let nodeMap = nodeCache[node.depth - 1];
            return nodeMap.get(getKey(node));
        }else{
            return null;
        }
    }

    /*
     * 计算节点的中"最近"距离, 如果没有存活点, 则距离是边长
     * r: 右边距离存活点的最近距离
     * l: 左边距离存活点的最近距离
     * t: 顶部距离存活点的最近距离
     * b: 底部距离存活点的最近距离
     */
    function calculateNodeLiveEdge(node){
        if(node.l != undefined) { return; }

        if(node.depth == 1){
            let v = 1 - (node.nw._id | node.sw._id);
            node.l = v == 0 ? 0 : (2 - (node.ne._id | node.se._id));

            v = 1 - (node.se._id | node.ne._id);
            node.r = v == 0 ? 0 : (2 - (node.nw._id | node.sw._id));
            
            v = 1 - (node.ne._id | node.nw.nw._id);
            node.t = v == 0 ? 0 : (2 - (node.se._id | node.sw._id));

            v = 1 - (node.se._id | node.sw._id);
            node.b = v == 0 ? 0 : (2 - (node.ne._id | node.nw._id));
            return;
        }
        
        calculateNodeLiveEdge(node.ne);
        calculateNodeLiveEdge(node.nw);
        calculateNodeLiveEdge(node.sw);
        calculateNodeLiveEdge(node.se);

        let halfSide = calculateSideLength(node.depth - 1);
        let a = Math.min(node.nw.l, node.sw.l);
        node.l = a == halfSide ? (halfSide + Math.min(node.ne.l, node.se.l)) : a;

        a = Math.min(node.se.r, node.ne.r);
        node.r = a == halfSide ? (halfSide + Math.min(node.nw.r, node.sw.r)) : a;
        
        a = Math.min(node.ne.t, node.nw.t);
        node.t = a == halfSide ? (halfSide + Math.min(node.se.t, node.sw.t)) : a;

        a = Math.min(node.se.b, node.sw.b);
        node.b = a == halfSide ? (halfSide + Math.min(node.ne.b, node.nw.b)) : a;
    }

    // 向缓存中添加节点
    function addToCache(node){
        let cacheNode = searchNodeFromCache(node);
        if(cacheNode){ return cacheNode; }

        let k = getKey(node);
        while(node.depth - 1 >= nodeCache.length){
            nodeCache.push(new Map());
        }

        let nodeMap = nodeCache[node.depth - 1];
        node._id = idGenerate();
        calculateNodeLiveEdge(node);
        nodeMap.set(k, node);
        return node;
    }

    const c0 = { depth: 0, _id: 0, ne: 0, nw: 0, se: 0, sw: 0 };
    const c1 = { depth: 0, _id: 1, ne: 1, nw: 1, se: 1, sw: 1 };
    emptyNodes.push(c0);

    function createEmptyNode(side){
        if(side < 2){ return c0; }
        side = nextPowerOfTwo(side); // 边长必须为2的幂次
        let depth = calculateDepth(side);
        if(depth < emptyNodes.length){
            return emptyNodes[depth];
        }else if(depth == emptyNodes.length){
            let emp = emptyNodes[depth - 1];
            let nn = addToCache({
                depth: depth, ne: emp, nw: emp, se: emp, sw: emp
            });
            emptyNodes.push(nn);
            return nn;
        }else{
            for(let d = emptyNodes.length; d <= depth; d++){
                createEmptyNode(calculateSideLength(d));
            }
            return emptyNodes[depth];
        }
    }

    function initCache(){
        let firstMap = new Map();
        nodeCache.push(firstMap);
        addToCache({depth: 1, ne: c0, nw: c0, se: c0, sw: c0});
        addToCache({depth: 1, ne: c1, nw: c0, se: c0, sw: c0});
        addToCache({depth: 1, ne: c0, nw: c1, se: c0, sw: c0});
        addToCache({depth: 1, ne: c1, nw: c1, se: c0, sw: c0});
        addToCache({depth: 1, ne: c0, nw: c0, se: c1, sw: c0});
        addToCache({depth: 1, ne: c1, nw: c0, se: c1, sw: c0});
        addToCache({depth: 1, ne: c0, nw: c1, se: c1, sw: c0});
        addToCache({depth: 1, ne: c1, nw: c1, se: c1, sw: c0});
        addToCache({depth: 1, ne: c0, nw: c0, se: c0, sw: c1});
        addToCache({depth: 1, ne: c1, nw: c0, se: c0, sw: c1});
        addToCache({depth: 1, ne: c0, nw: c1, se: c0, sw: c1});
        addToCache({depth: 1, ne: c1, nw: c1, se: c0, sw: c1});
        addToCache({depth: 1, ne: c0, nw: c0, se: c1, sw: c1});
        addToCache({depth: 1, ne: c1, nw: c0, se: c1, sw: c1});
        addToCache({depth: 1, ne: c0, nw: c1, se: c1, sw: c1});
        addToCache({depth: 1, ne: c1, nw: c1, se: c1, sw: c1});
    }
    initCache();

    /**
     * 比一个数大的最小2的幂
     */
    function nextPowerOfTwo(n) {
        if (n <= 0) return 1; // 如果 n <= 0，直接返回 1
        n--; // 减去 1
        n |= n >> 1;
        n |= n >> 2;
        n |= n >> 4;
        n |= n >> 8;
        n |= n >> 16;
        n++; // 加上 1
        return n;
    }

    // 根据边长计算节点深度
    function calculateDepth(side){
        if (side <= 0 || (side & (side - 1)) !== 0) return NaN; // 确保 n 是 2 的幂次
        let x = -1;
        while (side > 0) {
            side >>= 1; // 右移一位
            x++;
        }
        return x;
    }

    /**
     * 根据深度计算区域的边长
     */
    function calculateSideLength(depth){
        return 1 << depth;
    }

    /**
     * 扩充节点面积, 库充后边长newSide = side * 2 
     * @param {*} node 节点
     */
    function extendNode(node){
        let side = calculateSideLength(node.ne.depth)
        let emptyNode = createEmptyNode(side);

        let ne = addToCache({ depth: node.depth, ne: emptyNode, nw: emptyNode, se: emptyNode, sw: node.ne });
        let nw = addToCache({ depth: node.depth, ne: emptyNode, nw: emptyNode, se: node.nw, sw: emptyNode });
        let se = addToCache({ depth: node.depth, ne: emptyNode, nw: node.se, se: emptyNode, sw: emptyNode });
        let sw = addToCache({ depth: node.depth, ne: node.sw, nw: emptyNode, se: emptyNode, sw: emptyNode });

        return addToCache({ depth: node.depth + 1, ne: ne, nw: nw, se: se, sw: sw });
    }

    
    var root = createEmptyNode(4); // 初始状态只有四个点
    const hl = {};

    function evolve(node, fastForward){ // 返回的是下一代的中心区域结果
        let result = fastForward ? node.ffEvolveResult : node.evolveResult;
        if(result){ return result; }

        if(node.depth == 2){  // 4 x 4
            let p0c = node.ne.nw._id + node.ne.ne._id + node.ne.se._id + node.se.ne._id + node.se.nw._id + node.sw.ne._id + node.nw.se._id + node.nw.ne._id;
            let p1c = node.nw.nw._id + node.nw.ne._id + node.nw.sw._id + node.ne.nw._id + node.ne.sw._id + node.sw.nw._id + node.sw.ne._id + node.se.nw._id;
            let p2c = node.ne.sw._id + node.ne.se._id + node.nw.se._id + node.sw.ne._id + node.sw.se._id + node.se.sw._id + node.se.se._id + node.se.ne._id;
            let p3c = node.nw.se._id + node.nw.sw._id + node.ne.sw._id + node.se.nw._id + node.se.sw._id + node.sw.nw._id + node.sw.sw._id + node.sw.se._id;
            result = addToCache({
                depth: 1,
                ne: (node.ne.sw._id == 1 ? ((p0c == 2 || p0c == 3) ? c1 : c0) : (p0c == 3 ? c1 : c0)),
                nw: (node.nw.se._id == 1 ? ((p1c == 2 || p1c == 3) ? c1 : c0) : (p1c == 3 ? c1 : c0)),
                se: (node.se.nw._id == 1 ? ((p2c == 2 || p2c == 3) ? c1 : c0) : (p2c == 3 ? c1 : c0)),
                sw: (node.sw.ne._id == 1 ? ((p3c == 2 || p3c == 3) ? c1 : c0) : (p3c == 3 ? c1 : c0))
            });
        }else{
            /**
             *  1 | 2 | 3
             * -----------
             *  4 | 5 | 6
             * -----------
             *  7 | 8 | 9
             */
            let node1, node2, node3, node4, node5, node6, node7, node8, node9;
            let cDepth = node.depth - 1;
            if(fastForward){ // 快进
                node1 = evolve(node.nw);
                node2 = evolve(addToCache({depth: cDepth, ne : node.ne.nw, nw : node.nw.ne, sw : node.nw.se, se : node.ne.sw }));
                node3 = evolve(node.ne);
                node4 = evolve(addToCache({depth: cDepth, ne : node.nw.se, nw : node.nw.sw, sw : node.sw.nw, se : node.sw.ne }));
                node5 = evolve(addToCache({depth: cDepth, ne : node.ne.sw, nw : node.nw.se, sw : node.sw.ne, se : node.se.nw }));
                node6 = evolve(addToCache({depth: cDepth, ne : node.ne.se, nw : node.ne.sw, sw : node.se.nw, se : node.se.ne }));
                node7 = evolve(node.sw);
                node8 = evolve(addToCache({depth: cDepth, ne : node.se.nw, nw : node.sw.ne, sw : node.sw.se, se : node.se.sw }));
                node9 = evolve(node.se);
            }else{
                let dd = node.depth - 2;
                node1 = addToCache({depth: dd, ne : node.nw.ne.sw, nw : node.nw.nw.se, sw : node.nw.sw.ne, se : node.nw.se.nw });
                node2 = addToCache({depth: dd, ne : node.ne.nw.sw, nw : node.nw.ne.se, sw : node.nw.se.ne, se : node.ne.sw.nw });
                node3 = addToCache({depth: dd, ne : node.ne.ne.sw, nw : node.ne.nw.se, sw : node.ne.sw.ne, se : node.ne.se.nw });
                node4 = addToCache({depth: dd, ne : node.nw.se.sw, nw : node.nw.sw.se, sw : node.sw.nw.ne, se : node.sw.ne.nw });
                node5 = addToCache({depth: dd, ne : node.ne.sw.sw, nw : node.nw.se.se, sw : node.sw.ne.ne, se : node.se.nw.nw });
                node6 = addToCache({depth: dd, ne : node.ne.se.sw, nw : node.ne.sw.se, sw : node.se.nw.ne, se : node.se.ne.nw });
                node7 = addToCache({depth: dd, ne : node.sw.ne.sw, nw : node.sw.nw.se, sw : node.sw.sw.ne, se : node.sw.se.nw });
                node8 = addToCache({depth: dd, ne : node.se.nw.sw, nw : node.sw.ne.se, sw : node.sw.se.ne, se : node.se.sw.nw });
                node9 = addToCache({depth: dd, ne : node.se.ne.sw, nw : node.se.nw.se, sw : node.se.sw.ne, se : node.se.se.nw });
            }
            result = addToCache({
                depth: cDepth,
                ne: evolve(addToCache({depth: cDepth, ne: node3, nw: node2, sw: node5, se: node6})),
                nw: evolve(addToCache({depth: cDepth, ne: node2, nw: node1, sw: node4, se: node5})),
                sw: evolve(addToCache({depth: cDepth, ne: node5, nw: node4, sw: node7, se: node8})),
                se: evolve(addToCache({depth: cDepth, ne: node6, nw: node5, sw: node8, se: node9}))
            });
        }
        if(fastForward){
            node.ffEvolveResult = result;
        }else{
            node.evolveResult = result;
        }
        return result;
    }

    /**
     *            ↑
     *            |
     *     1      |      0
     *            |
     * -----------+-------------->
     *            |
     *     3      |      2
     *            |
     *            |
     */
    function updatePointStatus(node, x, y, producer){
        let direction = (x < 0 ? 1 : 0) | ((y < 0 ? 1 : 0) << 1);
        if(node.depth == 1){
            if(direction == 0){
                let m = producer(node.ne._id);
                let cMark = m == 0 ? c0 : c1;
                return addToCache({ depth: 1, ne: cMark, nw: node.nw, se: node.se, sw: node.sw });
            }else if(direction == 1){
                let m = producer(node.nw._id);
                let cMark = m == 0 ? c0 : c1;
                return addToCache({ depth: 1, ne: node.ne, nw: cMark, se: node.se, sw: node.sw });
            }else if(direction == 2){
                let m = producer(node.se._id);
                let cMark = m == 0 ? c0 : c1;
                return addToCache({ depth: 1, ne: node.ne, nw: node.nw, se: cMark, sw: node.sw });
            }else{
                let m = producer(node.sw._id);
                let cMark = m == 0 ? c0 : c1;
                return addToCache({ depth: 1, ne: node.ne, nw: node.nw, se: node.se, sw: cMark });
            }
        }else {
            let offset = calculateSideLength(node.depth) >> 2;
            if(direction == 0){
                return addToCache({
                    depth: node.depth, ne: updatePointStatus(node.ne, x - offset, y - offset, producer), nw: node.nw, se: node.se, sw: node.sw
                });
            }else if(direction == 1){
                return addToCache({
                    depth: node.depth, ne: node.ne, nw: updatePointStatus(node.nw, x + offset, y - offset, producer), se: node.se, sw: node.sw
                });
            }else if(direction == 2){
                return addToCache({
                    depth: node.depth, ne: node.ne, nw: node.nw, se: updatePointStatus(node.se, x - offset, y + offset, producer), sw: node.sw
                });
            }else{
                return addToCache({
                    depth: node.depth, ne: node.ne, nw: node.nw, se: node.se, sw: updatePointStatus(node.sw, x + offset, y + offset, producer)
                });
            }
        }
    }

    /**
     * 获取指定节点状态
     */
    function getPointStatus(node, x, y){
        let direction = (x < 0 ? 1 : 0) | ((y < 0 ? 1 : 0) << 1);
        if(node.depth == 1){
            if(direction == 0){
                return node.ne._id;
            }else if(direction == 1){
                return node.nw._id;
            }else if(direction == 2){
                return node.se._id;
            }else{
                return node.sw._id;
            }
        }else {
            let offset = calculateSideLength(node.depth) >> 2;
            if(direction == 0){
                return getPointStatus(node.ne, x - offset, y - offset);
            }else if(direction == 1){
                return getPointStatus(node.nw, x + offset, y - offset);
            }else if(direction == 2){
                return getPointStatus(node.se, x - offset, y + offset);
            }else{
                return getPointStatus(node.sw, x + offset, y + offset);
            }
        }
    }

    function traverse(node, callback, centerX, centerY){
        if(node.depth == 1){
            if(node.ne._id == 1){ callback(centerX, centerY); }
            if(node.nw._id == 1){ callback(centerX - 1, centerY); }
            if(node.se._id == 1){ callback(centerX, centerY - 1); }
            if(node.sw._id == 1){ callback(centerX - 1, centerY - 1); }
        }else{
            let side = calculateSideLength(node.depth);
            let halfSide = side >> 1;
            let offset = side >> 2;
            if(halfSide != node.ne.l){ traverse(node.ne, callback, centerX + offset, centerY + offset); }
            if(halfSide != node.nw.l){ traverse(node.nw, callback, centerX - offset, centerY + offset); }
            if(halfSide != node.se.l){ traverse(node.se, callback, centerX + offset, centerY - offset); }
            if(halfSide != node.sw.l){ traverse(node.sw, callback, centerX - offset, centerY - offset); }
        }
    }

    function modifyPointStatus(x, y, producer){
        let sideX = nextPowerOfTwo(Math.abs(x) * 2) + 1;
        let sideY = nextPowerOfTwo(Math.abs(y) * 2) + 1;
        let side = Math.max(sideX, sideY);
        let rootSide = calculateSideLength(root.depth);

        if(side > rootSide){ // 说明该点不存在, 即状态为0
            let m = producer(0);
            if(m == 0){ return; }
        }

        while(side > rootSide){ // 需要扩充区域大小
            root = extendNode(root);
            rootSide = calculateSideLength(root.depth);
        }
        root = updatePointStatus(root, x, y, producer);
    }

    /**
     * 添加存活点
     */
    hl.addPoint = function(x, y){
        modifyPointStatus(x, y, o => { return 1; });
    }

    /**
     * 移除指定点
     */
    hl.removePoint = function(x, y){
        modifyPointStatus(x, y, o => { return 0; });
    }

    /**
     * 反转节点状态, 并返回反转后的状态
     */
    hl.invertStatus = function(x, y){
        let oldStatus = 0;
        modifyPointStatus(x, y, o => { 
            oldStatus = o;
            return 1 - o; 
        });
        return 1 - oldStatus;
    }

    /**
     * 向下一代进行演化
     * @param {是否快进} fastForward 
     */
    hl.nextGenerate = function(fastForward){
        // 1. 区域扩展, 生命游戏中的光速是, 1步一格
        // 2. 获取存活最大值
        if(fastForward){

        }else{
            if(root.l == 0 || root.r == 0 || root.t == 0 || root.b == 4){
                root = extendNode(root);
            }
        }
        root = evolve(extendNode(root), fastForward);
    }

    /**
     * 遍历点, 如果是存活状态, 会触发回调, 否则不会
     */
    hl.traverse = function(callback){
        traverse(root, callback, 0, 0);
    }

    /**
     * 清除画布
     */
    hl.clear = function(){
        root = createEmptyNode(4);
    }

    /**
     * 检查指定位置是存活还是死亡状态
     */
    hl.checkStatus = function(x, y){
        return getPointStatus(root, x, y);
    }

    hl.getSideLength = function(){
        return calculateSideLength(root.depth);
    }

    hl.test = function(){
        root = extendNode(root);
        console.log(root);
        // console.log(nodeCache);
    }

    return hl;
}