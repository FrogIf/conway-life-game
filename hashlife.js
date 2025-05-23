function hashlife(){
    const DEFAULT_STEP = 2;
    var step = DEFAULT_STEP;  // 快进跳代时的上限, 只有node.depth <= step时才会执行快进, 同时, 通过这个值可以计算出跳跃的代数 gen = 1 << (step - 2);
    var index = 2;
    function idGenerate(){ // 生成节点id
        return index++;
    }
    var emptyNodes = new Array(); // 没有存活节点的区域, index = depth
    var nodeCache = new Array();

    function searchNodeFromCache(node){
        if(node.depth - 1 < nodeCache.length){
            let nodeMap = nodeCache[node.depth - 1];
            let cc = nodeMap.get(node.ne._id);
            if(!cc){ return null; }
            cc = cc.get(node.nw._id);
            if(!cc){ return null; }
            cc = cc.get(node.se._id);
            if(!cc){ return null; }
            return cc.get(node.sw._id);
        }else{
            return null;
        }
    }

    function setNodeToCache(node){
        while(node.depth - 1 >= nodeCache.length){
            nodeCache.push(new Map());
        }

        let nodeMap = nodeCache[node.depth - 1];
        node._id = idGenerate();

        let up = nodeMap;
        let cc = nodeMap.get(node.ne._id);
        if(!cc){ cc = new Map(); up.set(node.ne._id, cc); }
        up = cc;
        cc = cc.get(node.nw._id);
        if(!cc){ cc = new Map(); up.set(node.nw._id, cc); }
        up = cc;
        cc = cc.get(node.se._id);
        if(!cc){ cc = new Map(); up.set(node.se._id, cc); }
        cc.set(node.sw._id, node);
    }

       /**
     * 垃圾收集与清理
     * 需要不定期执行垃圾清理, 否则内存会爆
     */
    function gc(){
        if(index < 5000000){ return; } // 小于500w不清理
        let preIndex = index;
        let start = Date.now();
        initCache();
        function refreshToCache(node){
            if(node.newNode){ return node.newNode; }

            if(node.depth > 1){
                let side = calculateSideLength(node.depth);
                let halfSide = side >> 1;
                let empty = createEmptyNode(halfSide);
                let ne = empty;
                let nw = empty;
                let se = empty;
                let sw = empty;
                if(node.ne.count > 0){ ne = refreshToCache(node.ne); }
                if(node.nw.count > 0){ nw = refreshToCache(node.nw); }
                if(node.se.count > 0){ se = refreshToCache(node.se); }
                if(node.sw.count > 0){ sw = refreshToCache(node.sw); }
                let newNode = buildNode({
                    depth: node.depth,
                    count: node.count,
                    ne: ne,
                    nw: nw,
                    se: se,
                    sw: sw
                });
                if(node.evolveCache){
                    newNode.evolveCache = node.evolveCache;
                    for(let [key, value] of node.evolveCache){
                        node.evolveCache.set(key, refreshToCache(value));
                    }
                }
                
                node.newNode = newNode;
                return newNode;
            }else{
                node.newNode = buildNode({ depth: 1, ne: node.ne, nw: node.nw, se: node.se, sw: node.sw });
                return node.newNode;
            }
        }
        root = refreshToCache(root);
        console.log(`gc duration : ${Date.now() - start}, before : ${preIndex}, after : ${index} `);
    }

    // 构建节点, 向缓存中添加节点, 计算节点的附加属性
    function buildNode(node){
        let cacheNode = searchNodeFromCache(node);
        if(cacheNode){
            node = cacheNode;
        }else{
            setNodeToCache(node);
            calculateChildrenCount(node);
        }
        return node;
    }

    function calculateChildrenCount(node){
        if(node.count != undefined) { return; }
        
        if(node.depth == 1){
            node.count = node.ne._id + node.nw._id + node.se._id + node.sw._id;
            return;
        }
        
        calculateChildrenCount(node.ne);
        calculateChildrenCount(node.nw);
        calculateChildrenCount(node.sw);
        calculateChildrenCount(node.se);

        node.count = node.ne.count + node.nw.count + node.se.count + node.sw.count;
    }

    const c0 = { depth: 0, _id: 0, ne: 0, nw: 0, se: 0, sw: 0 };
    const c1 = { depth: 0, _id: 1, ne: 1, nw: 1, se: 1, sw: 1 };

    function createEmptyNode(side){
        if(side < 2){ return c0; }
        side = nextPowerOfTwo(side); // 边长必须为2的幂次
        let depth = calculateDepth(side);
        if(depth < emptyNodes.length){
            return emptyNodes[depth];
        }else if(depth == emptyNodes.length){
            let emp = emptyNodes[depth - 1];
            let nn = buildNode({
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
        index = 2;
        if(nodeCache){
            for(let cc of nodeCache){
                cc.clear();
            }
        }else{
            nodeCache = new Array();
        }
        emptyNodes = new Array();
        emptyNodes.push(c0);
        buildNode({depth: 1, ne: c0, nw: c0, se: c0, sw: c0});
        buildNode({depth: 1, ne: c1, nw: c0, se: c0, sw: c0});
        buildNode({depth: 1, ne: c0, nw: c1, se: c0, sw: c0});
        buildNode({depth: 1, ne: c1, nw: c1, se: c0, sw: c0});
        buildNode({depth: 1, ne: c0, nw: c0, se: c1, sw: c0});
        buildNode({depth: 1, ne: c1, nw: c0, se: c1, sw: c0});
        buildNode({depth: 1, ne: c0, nw: c1, se: c1, sw: c0});
        buildNode({depth: 1, ne: c1, nw: c1, se: c1, sw: c0});
        buildNode({depth: 1, ne: c0, nw: c0, se: c0, sw: c1});
        buildNode({depth: 1, ne: c1, nw: c0, se: c0, sw: c1});
        buildNode({depth: 1, ne: c0, nw: c1, se: c0, sw: c1});
        buildNode({depth: 1, ne: c1, nw: c1, se: c0, sw: c1});
        buildNode({depth: 1, ne: c0, nw: c0, se: c1, sw: c1});
        buildNode({depth: 1, ne: c1, nw: c0, se: c1, sw: c1});
        buildNode({depth: 1, ne: c0, nw: c1, se: c1, sw: c1});
        buildNode({depth: 1, ne: c1, nw: c1, se: c1, sw: c1});
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

        let ne = buildNode({ depth: node.depth, ne: emptyNode, nw: emptyNode, se: emptyNode, sw: node.ne });
        let nw = buildNode({ depth: node.depth, ne: emptyNode, nw: emptyNode, se: node.nw, sw: emptyNode });
        let se = buildNode({ depth: node.depth, ne: emptyNode, nw: node.se, se: emptyNode, sw: emptyNode });
        let sw = buildNode({ depth: node.depth, ne: node.sw, nw: emptyNode, se: emptyNode, sw: emptyNode });

        return buildNode({ depth: node.depth + 1, ne: ne, nw: nw, se: se, sw: sw });
    }

    
    var root = createEmptyNode(4); // 初始状态只有四个点
    const hl = {};

    function evolve(node, fastForward, rule, genStep){ // 返回的是下一代的中心区域结果
        let result = null;
        let cacheKey = `${genStep}_${rule.key}`;
        if(node.evolveCache){
            result = node.evolveCache.get(cacheKey);
            if(result){
                return result;
            }
        }else{
            node.evolveCache = new Map();
        }

        if(node.depth == 2){  // 4 x 4
            let p0c = node.ne.nw._id + node.ne.ne._id + node.ne.se._id + node.se.ne._id + node.se.nw._id + node.sw.ne._id + node.nw.se._id + node.nw.ne._id;
            let p1c = node.nw.nw._id + node.nw.ne._id + node.nw.sw._id + node.ne.nw._id + node.ne.sw._id + node.sw.nw._id + node.sw.ne._id + node.se.nw._id;
            let p2c = node.ne.sw._id + node.ne.se._id + node.nw.se._id + node.sw.ne._id + node.sw.se._id + node.se.sw._id + node.se.se._id + node.se.ne._id;
            let p3c = node.nw.se._id + node.nw.sw._id + node.ne.sw._id + node.se.nw._id + node.se.sw._id + node.sw.nw._id + node.sw.sw._id + node.sw.se._id;

            // 节点存活计算
            result = buildNode({
                depth: 1,
                ne: (node.ne.sw._id == 1 ? (rule.S.includes(p0c) ? c1 : c0) : (rule.B.includes(p0c) ? c1 : c0)),
                nw: (node.nw.se._id == 1 ? (rule.S.includes(p1c) ? c1 : c0) : (rule.B.includes(p1c) ? c1 : c0)),
                se: (node.se.nw._id == 1 ? (rule.S.includes(p2c) ? c1 : c0) : (rule.B.includes(p2c) ? c1 : c0)),
                sw: (node.sw.ne._id == 1 ? (rule.S.includes(p3c) ? c1 : c0) : (rule.B.includes(p3c) ? c1 : c0))
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
            if(fastForward && node.depth <= genStep){ // 快进 (层级太高时, 不进行跳代, 防止程序卡顿)
                node1 = evolve(node.nw, fastForward, rule, genStep);
                node2 = evolve(buildNode({depth: cDepth, ne : node.ne.nw, nw : node.nw.ne, sw : node.nw.se, se : node.ne.sw }), fastForward, rule, genStep);
                node3 = evolve(node.ne, fastForward, rule, genStep);
                node4 = evolve(buildNode({depth: cDepth, ne : node.nw.se, nw : node.nw.sw, sw : node.sw.nw, se : node.sw.ne }), fastForward, rule, genStep);
                node5 = evolve(buildNode({depth: cDepth, ne : node.ne.sw, nw : node.nw.se, sw : node.sw.ne, se : node.se.nw }), fastForward, rule, genStep);
                node6 = evolve(buildNode({depth: cDepth, ne : node.ne.se, nw : node.ne.sw, sw : node.se.nw, se : node.se.ne }), fastForward, rule, genStep);
                node7 = evolve(node.sw, fastForward, rule, genStep);
                node8 = evolve(buildNode({depth: cDepth, ne : node.se.nw, nw : node.sw.ne, sw : node.sw.se, se : node.se.sw }), fastForward, rule, genStep);
                node9 = evolve(node.se, fastForward, rule, genStep);
            }else{
                let dd = node.depth - 2;
                node1 = buildNode({depth: dd, ne : node.nw.ne.sw, nw : node.nw.nw.se, sw : node.nw.sw.ne, se : node.nw.se.nw });
                node2 = buildNode({depth: dd, ne : node.ne.nw.sw, nw : node.nw.ne.se, sw : node.nw.se.ne, se : node.ne.sw.nw });
                node3 = buildNode({depth: dd, ne : node.ne.ne.sw, nw : node.ne.nw.se, sw : node.ne.sw.ne, se : node.ne.se.nw });
                node4 = buildNode({depth: dd, ne : node.nw.se.sw, nw : node.nw.sw.se, sw : node.sw.nw.ne, se : node.sw.ne.nw });
                node5 = buildNode({depth: dd, ne : node.ne.sw.sw, nw : node.nw.se.se, sw : node.sw.ne.ne, se : node.se.nw.nw });
                node6 = buildNode({depth: dd, ne : node.ne.se.sw, nw : node.ne.sw.se, sw : node.se.nw.ne, se : node.se.ne.nw });
                node7 = buildNode({depth: dd, ne : node.sw.ne.sw, nw : node.sw.nw.se, sw : node.sw.sw.ne, se : node.sw.se.nw });
                node8 = buildNode({depth: dd, ne : node.se.nw.sw, nw : node.sw.ne.se, sw : node.sw.se.ne, se : node.se.sw.nw });
                node9 = buildNode({depth: dd, ne : node.se.ne.sw, nw : node.se.nw.se, sw : node.se.sw.ne, se : node.se.se.nw });
            }
            result = buildNode({
                depth: cDepth,
                ne: evolve(buildNode({depth: cDepth, ne: node3, nw: node2, sw: node5, se: node6}), fastForward, rule, genStep),
                nw: evolve(buildNode({depth: cDepth, ne: node2, nw: node1, sw: node4, se: node5}), fastForward, rule, genStep),
                sw: evolve(buildNode({depth: cDepth, ne: node5, nw: node4, sw: node7, se: node8}), fastForward, rule, genStep),
                se: evolve(buildNode({depth: cDepth, ne: node6, nw: node5, sw: node8, se: node9}), fastForward, rule, genStep)
            });
        }
        node.evolveCache.set(cacheKey, result);
        return result;
    }

    /**
     *            ↑
     *            |
     *     3      |      2
     *            |
     * -----------+-------------->
     *            |
     *     1      |      0
     *            |
     *            |
     */
    function updatePointStatus(node, x, y, producer){
        let direction = (x < 0 ? 1 : 0) | ((y < 0 ? 1 : 0) << 1);
        if(node.depth == 1){
            if(direction == 0){  // se
                let m = producer(node.se._id);
                let cMark = m == 0 ? c0 : c1;
                return buildNode({ depth: 1, ne: node.ne, nw: node.nw, se: cMark, sw: node.sw });
            }else if(direction == 1){  // sw
                let m = producer(node.sw._id);
                let cMark = m == 0 ? c0 : c1;
                return buildNode({ depth: 1, ne: node.ne, nw: node.nw, se: node.se, sw: cMark });
            }else if(direction == 2){  // ne
                let m = producer(node.ne._id);
                let cMark = m == 0 ? c0 : c1;
                return buildNode({ depth: 1, ne: cMark, nw: node.nw, se: node.se, sw: node.sw });
            }else{  // nw
                let m = producer(node.nw._id);
                let cMark = m == 0 ? c0 : c1;
                return buildNode({ depth: 1, ne: node.ne, nw: cMark, se: node.se, sw: node.sw });
            }
        }else {
            let offset = calculateSideLength(node.depth) >> 2;
            if(direction == 0){  // se
                return buildNode({
                    depth: node.depth, ne: node.ne, nw: node.nw, se: updatePointStatus(node.se, x - offset, y - offset, producer), sw: node.sw
                });
            }else if(direction == 1){  // sw
                return buildNode({
                    depth: node.depth, ne: node.ne, nw: node.nw, se: node.se, sw: updatePointStatus(node.sw, x + offset, y - offset, producer)
                });
            }else if(direction == 2){  // ne
                return buildNode({
                    depth: node.depth, ne: updatePointStatus(node.ne, x - offset, y + offset, producer), nw: node.nw, se: node.se, sw: node.sw
                });
            }else{  // nw
                return buildNode({
                    depth: node.depth, ne: node.ne, nw: updatePointStatus(node.nw, x + offset, y + offset, producer), se: node.se, sw: node.sw
                });
            }
        }
    }

    /**
     * 获取指定节点状态
     */
    function getPointStatus(node, x, y){
        let direction = (x <= 0 ? 1 : 0) | ((y <= 0 ? 1 : 0) << 1);
        if(node.depth == 1){
            if(direction == 0){  // se
                return node.se._id;
            }else if(direction == 1){  // sw
                return node.sw._id;
            }else if(direction == 2){  // ne
                return node.ne._id;
            }else{  // nw
                return node.nw._id;
            }
        }else {
            let offset = calculateSideLength(node.depth) >> 2;
            if(direction == 0){  // se
                return getPointStatus(node.se, x - offset, y - offset);
            }else if(direction == 1){  // sw
                return getPointStatus(node.sw, x + offset, y - offset);
            }else if(direction == 2){  // ne
                return getPointStatus(node.ne, x - offset, y + offset);
            }else{  // nw
                return getPointStatus(node.nw, x + offset, y + offset);
            }
        }
    }

    function traverse(node, callback, centerX, centerY, interceptor = (x,y,d) => { return true; }){
        let d = node.depth;
        if(!interceptor(centerX, centerY, d)){ return; }  // 拦截器, 使得不再继续向深处遍历
        if(d == 1){
            if(node.ne._id == 1){ callback(centerX, centerY - 1); }
            if(node.nw._id == 1){ callback(centerX - 1, centerY - 1); }
            if(node.se._id == 1){ callback(centerX, centerY); }
            if(node.sw._id == 1){ callback(centerX - 1, centerY); }
        }else{
            let side = calculateSideLength(d);
            let offset = side >> 2;
            if(node.ne.count > 0){ traverse(node.ne, callback, centerX + offset, centerY - offset, interceptor); }
            if(node.nw.count > 0){ traverse(node.nw, callback, centerX - offset, centerY - offset, interceptor); }
            if(node.se.count > 0){ traverse(node.se, callback, centerX + offset, centerY + offset, interceptor); }
            if(node.sw.count > 0){ traverse(node.sw, callback, centerX - offset, centerY + offset, interceptor); }
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
        nodeChangeListener(root.count);
        gc();
    }

    // 节点变更监听
    var nodeChangeListener = (c) => {};

    /**
     * 添加存活点
     */
    hl.addPoint = function(x, y){
        modifyPointStatus(x, y, o => { return 1; });
    }

    /**
     * 批量添加点
     * points结构(必须是有序结构):
     * [
     *     {
     *          y: 0,
     *          xArr : [ 0, 1, 2, 3 ]
     *     },
     *     {
     *          y: 1,
     *          xArr : [ 1 ]
     *     }
     * ]
     */
    hl.drawPoints = function(points){
        if(points.length == 0){ return; }

        initCache();
        
        let minX = Number.MAX_SAFE_INTEGER;
        let minY = Number.MAX_SAFE_INTEGER;
        let maxX = Number.MIN_SAFE_INTEGER;
        let maxY = Number.MIN_SAFE_INTEGER;

        for(let line of points){
            let arr = new Array();
            for(let x of line.xArr){
                arr.push({
                    x: x,
                    v: 0
                });
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
            }
            line.xArr = arr;
            minY = Math.min(line.y, minY);
            maxY = Math.max(line.y, maxY);
        }

        let sideX = nextPowerOfTwo(maxX - minX + 1);
        let sideY = nextPowerOfTwo(maxY - minY + 1);
        let side = Math.max(sideX, sideY);
        maxX = minX + side - 1;
        maxY = minY + side - 1;

        let lineChecker = function(line, target){
            if(line.y == target){ return 0; }
            else if(line.y > target){ return 1; }
            else { return -1; }
        }
        let xChecker = function(xObj, target){
            if(xObj.x == target){ return 0; }
            else if(xObj.x > target){ return 1; }
            else { return -1; }
        }
        let checkAndDelCoor = function(x, y, points){
            let line = binSearch(y, lineChecker, points);
            if(line != null){
                let obj = binSearch(x, xChecker, line.xArr);
                if(obj != null){ 
                    obj.v = 1; // 标记为已绘制
                    return true;
                } 
            }
            return false;
        }
        let binSearch = function(target, checker, arr){
            let low = 0;
            let high = arr.length - 1;
            let mid = 0;
            while(low <= high){
                mid = low + ((high - low) >> 1);
                let c = checker(arr[mid], target);
                if(c == 0){  // 相等
                    return arr[mid];
                }else if(c > 0){  // 大于, 向下半区域搜索
                    high = mid - 1;
                }else{
                    low = mid + 1;
                }
            }
            return null;
        }

        function updatePointRegion(node, x, y, points, offsetX, offsetY){
            let direction = (x < 0 ? 1 : 0) | ((y < 0 ? 1 : 0) << 1);
            if(node.depth == 1){
                let ne = c0, se = c0, nw = c0, sw = c0;
                let xi = x + offsetX;
                let yi = y + offsetY;
                if(direction == 0){  // se
                    se = c1;
                    if(checkAndDelCoor(xi, yi - 1, points)){ ne = c1; }
                    if(checkAndDelCoor(xi - 1, yi - 1, points)){ nw = c1; }
                    if(checkAndDelCoor(xi - 1, yi, points)){ sw = c1; }
                }else if(direction == 1){  // sw
                    sw = c1;
                    if(checkAndDelCoor(xi + 1, yi - 1, points)){ ne = c1; }
                    if(checkAndDelCoor(xi, yi - 1, points)){ nw = c1; }
                    if(checkAndDelCoor(xi + 1, yi, points)){ se = c1; }
                }else if(direction == 2){  // ne
                    ne = c1;
                    if(checkAndDelCoor(xi - 1, yi, points)){ nw = c1; }
                    if(checkAndDelCoor(xi, yi + 1, points)){ se = c1; }
                    if(checkAndDelCoor(xi - 1, yi + 1, points)){ sw = c1; }
                }else{  // nw
                    nw = c1;
                    if(checkAndDelCoor(xi + 1, yi, points)){ ne = c1; }
                    if(checkAndDelCoor(xi + 1, yi + 1, points)){ se = c1; }
                    if(checkAndDelCoor(xi, yi + 1, points)){ sw = c1; }
                }
                return buildNode({
                    depth: 1,
                    ne: ne,
                    nw: nw,
                    se: se,
                    sw: sw
                });
            }else {
                let offset = calculateSideLength(node.depth) >> 2;
                if(direction == 0){  // se
                    return buildNode({
                        depth: node.depth, ne: node.ne, nw: node.nw, se: updatePointRegion(node.se, x - offset, y - offset, points, offsetX + offset, offsetY + offset), sw: node.sw
                    });
                }else if(direction == 1){  // sw
                    return buildNode({
                        depth: node.depth, ne: node.ne, nw: node.nw, se: node.se, sw: updatePointRegion(node.sw, x + offset, y - offset, points, offsetX - offset, offsetY + offset)
                    });
                }else if(direction == 2){  // ne
                    return buildNode({
                        depth: node.depth, ne: updatePointRegion(node.ne, x - offset, y + offset, points, offsetX + offset, offsetY - offset), nw: node.nw, se: node.se, sw: node.sw
                    });
                }else{  // nw
                    return buildNode({
                        depth: node.depth, ne: node.ne, nw: updatePointRegion(node.nw, x + offset, y + offset, points, offsetX - offset, offsetY - offset), se: node.se, sw: node.sw
                    });
                }
            }
        }

        let tree = createEmptyNode(side << 1);
        for(let line of points){
            let y = line.y;
            for(let x of line.xArr){
                if(x.v != 1){
                    tree = updatePointRegion(tree, x.x, y, points, 0, 0);
                }
            }
        }
        root = tree;
        nodeChangeListener(root.count);
        gc();
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
     * @param {规则表达式} 默认: B3/S23, B3表示死细胞周围如果恰有3个活细胞, 则下一代复活(Brith), S23表示如果一个活细胞周围需要有2, 3个活细胞, 下一代才会继续存活, 否则死亡
     */
    hl.nextGenerate = function(fastForward, ruleExpress){
        if(!ruleExpress){ ruleExpress = 'B3/S23'; }
        let rule = parseRuleExpress(ruleExpress);

        let genStep;
        if(!fastForward){
            genStep = DEFAULT_STEP;
        }else{
            genStep = step;
        }
        /*
         * 扩充后单边空白距离: a = (2 ^(x-1) - 2^(x-3)) = 2^(x-2) + 2^(x-3)
         * 演化后, 跳过的代数: b = 2^(x-2)
         * 生命游戏中的光速: 每代前进1步
         * a > b
         */
        while(
            (root.depth <= genStep) ||
            root.nw.count !== root.nw.se.se.count ||
            root.ne.count !== root.ne.sw.sw.count ||
            root.sw.count !== root.sw.ne.ne.count ||
            root.se.count !== root.se.nw.nw.count)
        {
            root = extendNode(root);
        }
        
        root = evolve(extendNode(root), fastForward, rule, genStep);
        nodeChangeListener(root.count);
        gc();
    }

    const ruleCache = new Map();

    function parseRuleExpress(ruleExpress){
        let rule = ruleCache.get(ruleExpress);
        if(rule){
            return rule;
        }
        let arr = ruleExpress.split('/');
        let bexp = arr[0];
        let sexp = arr[1];
        let bArr = new Array();
        for(let i = 1, len = bexp.length; i < len; i++){
            bArr.push(parseInt(bexp[i]));
        }
        let sArr = new Array();
        for(let i = 1, len = sexp.length; i < len; i++){
            sArr.push(parseInt(sexp[i]));
        }
        rule = {
            B: bArr,
            S: sArr,
            key: ruleExpress
        };
        ruleCache.set(ruleExpress, rule);
        return rule;
    }

    /**
     * 遍历点, 如果是存活状态, 会触发回调, 否则不会
     */
    hl.traverse = function(callback, interceptor){
        traverse(root, callback, 0, 0, interceptor??undefined);
    }

    /**
     * 清除画布
     */
    hl.clear = function(){
        root = createEmptyNode(4);
        nodeChangeListener(root.count);
        gc();
    }

    /**
     * 检查指定位置是存活还是死亡状态, 1 - 存活, 0 - 死亡
     */
    hl.checkStatus = function(x, y){
        return getPointStatus(root, x, y);
    }

    hl.getSideLength = function(){
        return calculateSideLength(root.depth);
    }

    hl.setStep = function(ss){
        if(ss < 2){ ss = 2; }  // 快进节点的范围: [2, 19]
        if(ss > 19){ ss = 19; }
        step = ss;
        return 1 << (step - 2);
    }

    hl.getSkipGeneration = function(){
        return 1 << (step - 2);
    }

    hl.getStep = function(){
        return step;
    }

    hl.setNodeChangeListener = function(callback){
        nodeChangeListener = callback;
    }

    hl.test = function(){
        console.log(nodeCache.length, index);
    }

    return hl;
}