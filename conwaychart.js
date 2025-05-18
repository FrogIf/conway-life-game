class ConwayChart {
  // 初始构造器
  constructor(dom, pointProduce, pointConsume, mousePositionConsume) {
    this.wrapDom = dom;
    var wrapDomStyle = getComputedStyle(dom);
    this.width = parseInt(wrapDomStyle.width, 10);
    this.height = parseInt(wrapDomStyle.height, 10);

    // 创建canvas画布
    this.El = document.createElement('canvas');
    this.El.height = this.height;
    this.El.width = this.width;
    this.ctx = this.El.getContext('2d');
    dom.appendChild(this.El);
    
    this.pointProduce = pointProduce;  // 点提供者(conway的点非常多, 所以需要外部提供特殊结构来存储)
    this.pointConsume = pointConsume;  // 点消费者, 画布上添加点之后, 触发
    this.mousePositionConsume = mousePositionConsume; // 鼠标的x,y位置信息消费者
    this.scale = 1; // 默认缩放值: 1
    this.maxScale = 3; // 最大缩放值
    this.minScale = 0.00001; // 最小缩放值
    this.step = 0.05;   // 缩放率
    this.offsetX = 0;  // 画布X轴偏移值
    this.offsetY = 0;  // 画布Y轴偏移值
    this.blockWidth = 10; // 方块宽度
    this.editable = false; // 是否可以鼠标点击编辑
    this.selectable = false;  // 是否可以框选
    this.styleMark = 0;
    this.style = {
      pointColor: { r: 0, g: 0, b: 0 },
      gridLineColor: { r: 204, g: 204, b: 204 },
      backgroundColor: { r: 255, g: 255, b: 255 },
      selectColor: { r: 204, g: 255, b: 204 }
    };
    this.El.style.backgroundColor = this.style.backgroundColor;
    this.selectRange = {  // 框选范围
      ax: 0,
      bx: 0,
      ay: 0,
      by: 0
    };

    this.imageData = this.ctx.createImageData(this.El.width, this.El.height);
    this.imageDataBuffer = new Int32Array(this.imageData.data.buffer);
    this.drawBackground();

    this.preChartStatus = {  // 记录图像状态, 用来判断是否有变化需要重绘
      scale: this.scale,
      offsetX: this.offsetX,
      offsetY: this.offsetY
    };

    // 添加鼠标作为位置监听
    this.El.addEventListener('mousemove', this.mousePositionListener, false);
    
    // 添加滚轮判断事件
  	this.addScaleFunc();

    // 添加拖拽事件
    this.addDragFunc();

    // 添加点击事件
    this.addClick();

    // 尺寸大小自适应
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        this.width = Math.round(entry.contentRect.width);
        this.height = Math.round(entry.contentRect.height);
        this.render();
      }
    });
    resizeObserver.observe(dom);
  }

  switchStyle(){
    if(this.styleMark == 1){
      this.styleMark = 0;
      this.style = {
        pointColor: { r: 0, g: 0, b: 0 },
        gridLineColor: { r: 204, g: 204, b: 204 },
        backgroundColor: { r: 255, g: 255, b: 255 },
        selectColor: { r: 204, g: 255, b: 204 }
      };
    }else{
      this.styleMark = 1;
      this.style = {
        pointColor: { r: 255, g: 255, b: 255 },
        gridLineColor: { r: 0, g: 0, b: 0 },
        backgroundColor: { r: 0, g: 0, b: 0 },
        selectColor: { r: 77, g: 77, b: 77 }
      };
    }
    this.El.style.backgroundColor = this.style.backgroundColor;
    this.render();
  }

  addClick(){
    this.El.addEventListener('click', this.clickPoint);
  }

  disableEdit(){ this.editable = false; }
  enableEdit(){ this.editable = true; }
  isEditable(){ return this.editable; }
  disableSelect(){ this.selectable = false; }
  enableSelect(){ this.selectable = true; }
  isSelectable(){ return this.selectable; }

  // 鼠标点击位置转换为真实坐标
  mousePosConvertToCoordinate(mouseX, mouseY){
    let rect = this.El.getBoundingClientRect();
    mouseX = mouseX - rect.left; // 获取鼠标点击的 X 坐标
    mouseY = mouseY - rect.top; // 获取鼠标点击的 Y 坐标

    let x = Math.floor((mouseX - this.offsetX) / this.scale / this.blockWidth);
    let y = Math.floor((mouseY - this.offsetY) / this.scale / this.blockWidth);
    return [x, y];
  }

  clickPoint = (event) => {
    if(this.editable){
      let coor = this.mousePosConvertToCoordinate(event.clientX, event.clientY);

      this.pointConsume(coor[0], coor[1]);
      this.render();
    }
  }
  
  // 缩放: 判断时机注册移除MouseWhell事件
  addScaleFunc() {
    this.El.addEventListener('mouseenter', this.addMouseWhell);
    this.El.addEventListener('mouseleave', this.removeMouseWhell);
  }

  // 添加 mousewhell 事件
  addMouseWhell = () => {
    document.addEventListener('mousewheel', this.scrollFunc, {passive: false});
  }

  // 移除mousewhell 事件
  removeMouseWhell = () => {
    document.removeEventListener('mousewheel', this.scrollFunc, {passive: false});
  }

  // 缩放
  scrollFunc = (e) => {
    // 阻止默认事件(缩放时外部容器禁止滚动)
    e.preventDefault();

    if(e.wheelDelta){
      var x = e.offsetX - this.offsetX;
      var y = e.offsetY - this.offsetY;

      var offsetX = Math.round((x / this.scale) * this.step);
      var offsetY = Math.round((y / this.scale) * this.step);

      if(e.wheelDelta > 0){
        this.offsetX -= this.scale >= this.maxScale ? 0 : offsetX;
        this.offsetY -= this.scale >= this.maxScale ? 0 : offsetY;

        this.scale += this.step;
      } else {
        this.offsetX += this.scale <= this.minScale ? 0 : offsetX;
        this.offsetY += this.scale <= this.minScale ? 0 : offsetY;

        this.scale -= this.step;
      }
      
      this.scale = Math.min(this.maxScale, Math.max(this.scale, this.minScale));

      this.render();
    }
  }
  
  // 拖拽，判断时机注册移除 拖拽 功能
  addDragFunc() {
    this.El.addEventListener('mousedown', this.addMouseMove);
    document.addEventListener('mouseup', this.removeMouseMove);
  }

  // 鼠标移动: 获取保存当前点击坐标
  addMouseMove = (e) => {
    if(this.selectable){ // 框选
      let coor = this.mousePosConvertToCoordinate(e.clientX, e.clientY);
      this.selectRange.ax = coor[0];
      this.selectRange.ay = coor[1];
      this.El.addEventListener('mousemove', this.renderSelectRange, false);
    }else if(this.editable){
      this.El.addEventListener('mousemove', this.addOverPoint, false);
    }else{
      this.targetX = e.offsetX;
      this.targetY = e.offsetY;

      this.mousedownOriginX = this.offsetX;
      this.mousedownOriginY = this.offsetY;
      this.El.addEventListener('mousemove', this.moveCanvasFunc, false);
    }
  }

  mousePositionListener = (e) => {
    if(this.mousePositionConsume){
      let p = this.mousePosConvertToCoordinate(e.clientX, e.clientY);
      this.mousePositionConsume(p[0], p[1]);
    }
  }

  // 移除鼠标移动事件
  removeMouseMove = () => {
    this.El.removeEventListener('mousemove', this.moveCanvasFunc, false);
    this.El.removeEventListener('mousemove', this.addOverPoint, false);
    this.El.removeEventListener('mousemove', this.renderSelectRange, false);
  }

  // 鼠标划过后, 添加点
  addOverPoint = (event) => {
    let coor = this.mousePosConvertToCoordinate(event.clientX, event.clientY);
    this.pointConsume(coor[0], coor[1]);
    this.render();
  }

  // 绘制选择区域
  renderSelectRange = (e) => {
    let coor = this.mousePosConvertToCoordinate(e.clientX, e.clientY);
    this.selectRange.bx = coor[0];
    this.selectRange.by = coor[1];

    this.render();
  }

  // 移动画布
  moveCanvasFunc = (e) => {
    this.offsetX = Math.round(this.mousedownOriginX + (e.offsetX - this.targetX));
    this.offsetY = Math.round(this.mousedownOriginY + (e.offsetY - this.targetY));
    
    this.render();
  }

    // 判断图像状态是否有变化
    isChartStatusChange(){
      if(this.preChartStatus.scale != this.scale || this.preChartStatus.offsetX != this.offsetX || this.preChartStatus.offsetY != this.offsetY){
        this.preChartStatus.scale = this.scale;
        this.preChartStatus.offsetX = this.offsetX;
        this.preChartStatus.offsetY = this.offsetY;
        return true;
      }
      return false;
    }

  // 渲染
  render() {
    this.El.width = this.width;
    this.El.height = this.height;
    
    const self = this;
    function animate(){
      self.drawBackground();  // 绘制背景

      let offsetX = Math.round(self.offsetX);
      let offsetY = Math.round(self.offsetY);
      let blockWidth = self.blockWidth * self.scale;

      self.drawSelectRange(offsetX, offsetY, blockWidth);  // 绘制选区
  
      let range = self.getViewRange();
      // 绘制点
      self.pointProduce((x, y) => {
        if(x >= range.minX && x <= range.maxX && y >= range.minY && y <= range.maxY){
          let xi = x * blockWidth + offsetX;
          let yi = y * blockWidth + offsetY;
          if(xi <= self.width && yi <= self.height){
            self.drawBlock(Math.round(xi), Math.round(yi), blockWidth);
          }
        }
      });

      if(blockWidth > 5){
        let x = Math.ceil((0 - offsetX) / blockWidth);
        let y = Math.ceil((0 - offsetY) / blockWidth);
        let xi = x * blockWidth + offsetX;
        let yi = y * blockWidth + offsetY;
        // 绘制网格
        self.drawGrid(xi, yi, blockWidth);
      }
  
      // 渲染
      self.ctx.putImageData(self.imageData, 0, 0);

      if(self.isChartStatusChange()){
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }

  // 绘制背景
  drawBackground(){
    var bgColor = this.style.backgroundColor.r | this.style.backgroundColor.g << 8 | this.style.backgroundColor.b << 16 | 0xFF << 24;
    var count = Math.round(this.width * this.height);
    for(var i = 0; i < count; i++)
    {
      this.imageDataBuffer[i] = bgColor;
    }
  }

  // 绘制框选区域
  drawSelectRange(offsetX, offsetY, unit){
    let selectRange = this.getSelectedRange();
    if(!selectRange){ return; }
    let xEdge = selectRange.bx - selectRange.ax;
    let yEdge = selectRange.by - selectRange.ay;
    if(xEdge == 0 || yEdge == 0){
      return;
    }

    let range = this.getViewRange();
    let startX = Math.max(selectRange.ax, range.minX);
    let startY = Math.max(selectRange.ay, range.minY);
    let endX = Math.min(selectRange.bx, range.maxX);
    let endY = Math.min(selectRange.by, range.maxY);
    if(endY - startY <= 0 || endX - startX <= 0){
      return;
    }

    let startXi = Math.round(startX * unit + offsetX);
    let startYi = Math.round(startY * unit + offsetY);
    let width = Math.round((endX + 1) * unit + offsetX) - startXi;
    let height = Math.round((endY + 1) * unit + offsetY) - startYi;
    let start = startYi * this.width + startXi;
    let skipRows = Math.round(this.width);
    let color = this.style.selectColor.r | this.style.selectColor.g << 8 | this.style.selectColor.b << 16 | 0xFF << 24;
    for(let i = 0; i < height; i++){
      for(let j = 0; j < width; j++){
        this.imageDataBuffer[start + j] = color;
      }
      start += skipRows;
    }
  }

  // 绘制网格
  drawGrid(decimalStartX, decimalStartY, unit){
    let lineColor = this.style.gridLineColor.r | this.style.gridLineColor.g << 8 | this.style.gridLineColor.b << 16 | 0xFF << 24;
    let colCount = Math.ceil(this.width / unit);
    let rowCount = Math.ceil(this.height / unit);
    
    // 绘制垂直线
    for (let c = 0; c <= colCount; c++) {
      let xx = Math.round(c * unit + decimalStartX);
      if(xx > this.width){ continue; }
      for(let r = 0; r < this.height; r++){
        this.imageDataBuffer[this.width * r + xx] = lineColor;
      }
    }
  
    // 绘制水平线
    for (let r = 0; r <= rowCount; r++) {
        let yy = Math.round(r * unit + decimalStartY);
        if(yy > this.height){ continue; }
        for(let w = 0; w < this.width; w++){
          this.imageDataBuffer[this.width * yy + w] = lineColor;
        }
    }
  }

  // 绘制块
  drawBlock(x, y, unit) {
    let enhance = this.calculateEnhance();
    let blockWidth = Math.max(Math.round(unit * enhance), 1);

    let width = blockWidth, height = blockWidth;
    if(x < 0){ width += x; x = 0; }  // 裁切左边界
    if(y < 0){ height += y; y = 0; }  // 裁切上边界
    if(x + width > this.width){ width = this.width - x; } // 裁切右边界
    if(y + height > this.height){ height = this.height - y; } // 裁切下边界

    width = Math.round(width);
    height = Math.round(height);
    if(width <= 0 || height <= 0){ return; }
    let start = Math.round(x + y * this.width);

    let skipRows = Math.round(this.width);
    let color = this.style.pointColor.r | this.style.pointColor.g << 8 | this.style.pointColor.b << 16 | 0xFF << 24;
    for(let i = 0; i < height; i++){
      for(let j = 0; j < width; j++){
        this.imageDataBuffer[start + j] = color;
      }
      start += skipRows;
    }
  }

  calculateEnhance(){
    let enhance = 1;
    if(this.scale <= 0.00002){  // 使得scale <= 0.00002时, block的scale始终接近0.007
      enhance = Math.floor(0.007 / this.scale);
    } else if(this.scale <= 0.0001){  // 使得 0.00002 < scale <= 0.0001 时, block的scale由0.007逐渐增长至0.03
      enhance = this.enhanceTransition(0.00002, 0.0001, 0.007, 0.03);
    } else if(this.scale <= 0.02){   // 使得 0.0001 < scale <= 0.02 时, block的scale由0.03逐渐增长至0.1
      enhance = this.enhanceTransition(0.0001, 0.02, 0.03, 0.1);
    } else if(this.scale <= 0.1){  // 使得 0.01 < scale <= 0.1时, block的scale始终接近是0.1
      enhance = Math.floor(0.1 / this.scale);
    }
    return enhance;
  }

  enhanceTransition(startRange, endRange, minBlockScale, maxBlockScale){
    return Math.floor((minBlockScale + (this.scale - startRange) / (endRange - startRange) * (maxBlockScale - minBlockScale)) / this.scale);
  }

  // 获取画布的可视坐标范围
  getViewRange(){
    let xOffset = this.offsetX / this.scale;
    let yOffset = this.offsetY / this.scale;
    let hh = this.height / this.scale;
    let ww = this.width / this.scale;

    return {
      minX: Math.floor((0 - xOffset)/this.blockWidth),
      maxX: Math.ceil((ww - xOffset)/this.blockWidth),
      minY: Math.floor((0 - yOffset)/this.blockWidth),
      maxY: Math.ceil((hh - yOffset)/this.blockWidth)
    };
  }

  getSelectedRange(){
    let xEdge = this.selectRange.ax - this.selectRange.bx;
    let yEdge = this.selectRange.ay - this.selectRange.by;
    if(xEdge == 0 || yEdge == 0){
      return null;
    }
    return {
      ax: Math.min(this.selectRange.ax, this.selectRange.bx),
      ay: Math.min(this.selectRange.ay, this.selectRange.by),
      bx: Math.max(this.selectRange.ax, this.selectRange.bx),
      by: Math.max(this.selectRange.ay, this.selectRange.by)
    };
  }

  moveSelectedRange(xOffset, yOffset){
    this.selectRange.ax += xOffset;
    this.selectRange.bx += xOffset;
    this.selectRange.ay += yOffset;
    this.selectRange.by += yOffset;
    this.render();
  }

  cancelSelectRange(){
    this.selectRange = {
      ax: 0,
      bx: 0,
      ay: 0,
      by: 0
    };
    this.render();
  }

  // 画布大小自适应
  fitCanvas(){
    // return;
    // 如果选择区域不空, 对选择区域进行自适应
    let xEdge = Math.abs(this.selectRange.ax - this.selectRange.bx);
    let yEdge = Math.abs(this.selectRange.ay - this.selectRange.by);
    if(xEdge > 0 && yEdge > 0){
      let x = Math.min(this.selectRange.ax, this.selectRange.bx);
      let y = Math.min(this.selectRange.ay, this.selectRange.by);

      let ww = (xEdge + 1) * this.blockWidth;
      let hh = (yEdge + 1) * this.blockWidth;
      let scale = Math.min(this.height / hh, this.width / ww);
      this.scale = Math.min(Math.max(scale, this.minScale), this.maxScale);

      this.offsetX = Math.round((0 - x) * this.blockWidth * this.scale);
      this.offsetY = Math.round((0 - y) * this.blockWidth * this.scale);
      this.render();
      return;
    }

    // 计算图形的重心
    let sumX = 0;
    let sumY = 0;
    let count = 0;

    let minX, minY, maxX, maxY;

    this.pointProduce((x, y) => {
      if(minX == null){ minX = x; }
      else{ minX = Math.min(minX, x); }

      if(minY == null){ minY = y; }
      else{ minY = Math.min(minY, y); }
      
      if(maxX == null){ maxX = x; }
      else{ maxX = Math.max(maxX, x); }

      if(maxY == null){ maxY = y; }
      else{ maxY = Math.max(maxY, y); }

      sumX += x;
      sumY += y;
      count++;
    });

    if(count > 0){
      let midX = sumX / count;
      let midY = sumY / count;
      
      let ww = Math.max(midX - minX, maxX - midX) * 2 * this.blockWidth;
      let hh = Math.max(midY - minY, maxY - midY) * 2 * this.blockWidth;
      let scale = Math.min(this.height / hh, this.width / ww);
      this.scale = Math.min(Math.max(scale, this.minScale), this.maxScale);

      this.offsetX = Math.round(this.width / 2 - midX * this.blockWidth * this.scale);
      this.offsetY = Math.round(this.height / 2 - midY * this.blockWidth * this.scale);

      this.render();
    }else{
      this.scale = 1;
      this.offsetX = 1;
      this.offsetY = 1;
      this.render();
    }
  }

  // 放大
  zoomIn(){
    this.zoom(this.scale / 10);
  }

  // 缩小
  zoomOut(){
    this.zoom(-(this.scale / 10));
  }

  // 缩放
  zoom(scaleOffset){
    let oldScale = this.scale;
    let scale = this.scale + scaleOffset;
    this.scale = Math.min(this.maxScale, Math.max(scale, this.minScale));

    var x = this.width / 2 - this.offsetX;
    var y = this.height / 2 - this.offsetY;
    
    let step = this.scale - oldScale;
    var offsetX = Math.round((x / oldScale) * step);
    var offsetY = Math.round((y / oldScale) * step);

    this.offsetX -= offsetX;
    this.offsetY -= offsetY;

    this.render();
  }
}