mg.showUI(__html__);

mg.ui.postMessage([mg.themeColor,'setTheme']);
//console.log(mg.viewport.rulerVisible)
var rulerH = 0;
var UI = [300,660]
if (mg.viewport.rulerVisible == true){
    rulerH = 17;
}else{
    rulerH = 0;
}
mg.ui.resize(UI[0], UI[1]);
//mg.ui.moveTo(mg.viewport.positionOnDom.x + mg.viewport.positionOnDom.width  - UI[0],48 + rulerH);
mg.ui.moveTo(mg.viewport.positionOnDom.x + rulerH,48 + rulerH);
//插件自动吸附
mg.on('layoutchange',function(){
    if (mg.viewport.rulerVisible == true){
        rulerH = 17;
    }else{
        rulerH = 0;
    }
    mg.ui.resize(UI[0], UI[1]);
    //mg.ui.moveTo(mg.viewport.positionOnDom.x + mg.viewport.positionOnDom.width  - UI[0],48 + rulerH);
    mg.ui.moveTo(mg.viewport.positionOnDom.x + rulerH,48 + rulerH);
})




var tabInfo;
var importNum = 1,xx = 0,yy = 0,time = 0,ww = 0,hh = 0;
var find = [];
var cutMax = 4096;

mg.ui.onmessage = (message) => {

    
    const info = message[0]
    const type = message[1]

    //插件自动休眠
    if ( type == "sleep"){
        if (info == true){
            //console.log(type + ":" + info)
            mg.ui.resize(160, 100);
            //mg.ui.moveTo(mg.viewport.positionOnDom.x + mg.viewport.positionOnDom.width - 100,48 + rulerH)
            
        }else{
            mg.ui.resize(UI[0], UI[1]);
        }
        mg.ui.moveTo(mg.viewport.positionOnDom.x + rulerH,48 + rulerH);
    }
    //插件最大化
    if ( type == "big"){
        if (info){
            UI = [UI[0] * 2,UI[1] * 1.3]
            mg.ui.resize(UI[0], UI[1]);   
        } else {
            UI = [300,660]
            mg.ui.resize(UI[0], UI[1]);
        }
        if(tabInfo == 'tab-4'){
            var loading =  mg.notify("生成中，请稍后",{
            position:"bottom",
            isLoading: true,
            timeout: 6000,
            });
            setTimeout(() => {
                createrMap()
                loading.cancel()
            }, 100);
        }
    }
    //双击底部获取当前节点信息(开发用)
    if ( type == "getnode"){
        if (mg.document.currentPage.selection.length > 0){
            console.log("当前节点信息：")
            console.log(mg.document.currentPage.selection[0])
        } else {
            console.log(mg.document.currentPage.parent)
            console.log("未选中对象")
        }
    }
    //批量创建画板
    if (type == "createrframe") {
        console.log("创建画板：",info.length,"个");
        var a = mg.document.currentPage;
        var b = a.selection;
        var gap = 30;
        var maxW ,maxH ;
        var viewX = mg.viewport.center.x - ((mg.viewport.bound.width/2  - 300)* mg.viewport.zoom)/// mg.viewport.bound.width/2 + 300;
        var viewY = mg.viewport.center.y;
        var x = viewX;
        var y = viewY;
        var allH = [];
        var allW = [];
        var ws = [0];
        var hs = [0];
    
        //找出最宽最高的图，作为换行标准，并挑出KV单独排布
        for(var i = 0; i < info.length; i++){
            ws.push(info[i].w);
            hs.push(info[i].h);
        };
    
    
        var maxW = Math.max(...ws);
        var maxH = Math.max(...hs);
        console.log("最宽",maxW,";最高：",maxH);
    
        for(var i = 0; i < info.length; i++){
    
            if (info[i].name.toLowerCase().split("kv").length > 1 ) {
                console.log("含KV");
                var addframe = mg.createFrame()
                addframe.name = info[i].name + " " + info[i].w + "×" + info[i].h;        
                addframe.x = x;
                addframe.y = y;
                addframe.width = info[i].w;
                addframe.height = info[i].h;
                addframe.setPluginData('s',info[i].s)
                if ( b.length == 1){
                    if ( b[0].type == "COMPONENT" || b[0].type == "INSTANCE"){
                        var scale = addframe.height/ b[0].height;
                        addframe.appendChild(b[0].clone())
                        addframe.children[0].rescale(scale,{scaleCenter:'CENTER'});
                        addframe.children[0].constrainProportions = false;//关闭等比例
                        addframe.children[0].width = info[i].w;
                        addframe.children[0].height = info[i].h;
                        addframe.children[0].x = 0;
                        addframe.children[0].y = 0;  
                    }
                }
                y += info[i].h + gap
            }
        };
    
        //重新排序
        info.sort((a, b) => b.w - a.w);
        //移除KV，其余按纵横比排布
        for(var i = 0; i < info.length; i++){
            if(info[i].name.toLowerCase().split("kv").length  == 1){
                if ( info[i].w / info[i].h > 1){
                    allH.push(info[i].h);
                    var addframe = mg.createFrame()
                    addframe.name = info[i].name + " " + info[i].w + "×" + info[i].h;         
                    addframe.x = x;
                    addframe.y = y;
                    addframe.width = info[i].w;
                    addframe.height = info[i].h;
                    addframe.setPluginData('s',info[i].s);
                    if ((info[i].w == 1333 && info[i].h == 275 )|| info[i].name.split("按钮").length > 1){
                        addframe.fills = []
                    }
                    if ( b.length == 1){
                        if ( b[0].type == "COMPONENT" || b[0].type == "INSTANCE"){
                            var scale = addframe.height/ b[0].height;                        
                            addframe.appendChild(b[0].clone())
                            addframe.children[0].rescale(scale,{scaleCenter:'CENTER'});
                            addframe.children[0].constrainProportions = false;//关闭等比例
                            addframe.children[0].width = info[i].w;
                            addframe.children[0].height = info[i].h;
                            addframe.children[0].x = 0;
                            addframe.children[0].y = 0;  
                        }
                    }
    
                    //按换行标准换行
                    x = x + Number(info[i].w) + gap;
                    if (info[i + 1] !== undefined){
                        if (x + Number(info[i + 1].w) > maxW + viewX){
                            var maxHs = Number(Math.max(...allH));
                            x = viewX;
                            y +=  maxHs + gap;
                            var allH = []
                        };
                    }
                };
            };
            
        };
    
    
        x = maxW + gap + viewX;;
        y = viewY;
        //重新排序
        info.sort((a, b) => b.h - a.h);
        for(var i = 0; i < info.length; i++){
    
            
            if(info[i].name.toLowerCase().split("kv").length  == 1){
                if ( info[i].w / info[i].h < 1){
                    allW.push(info[i].w);
                    var addframe = mg.createFrame()
                    addframe.name = info[i].name + " " + info[i].w + "×" + info[i].h;        
                    addframe.x = x;
                    addframe.y = y;
                    addframe.width = info[i].w;
                    addframe.height = info[i].h;
                    addframe.setPluginData('s',info[i].s);
                    if ((info[i].w == 580 && info[i].h == 870 )|| info[i].name.split("弹窗").length > 1 ){
                        addframe.fills = []
                    }
                    if ( b.length == 1){
                        if ( b[0].type == "COMPONENT" || b[0].type == "INSTANCE"){
                            var scale = addframe.width/ b[0].width;
                            addframe.appendChild(b[0].clone())
                            addframe.children[0].rescale(scale,{scaleCenter:'CENTER'});
                            addframe.children[0].constrainProportions = false;//关闭等比例
                            addframe.children[0].width = info[i].w;
                            addframe.children[0].height = info[i].h;
                            addframe.children[0].x = 0;
                            addframe.children[0].y = 0;  
                        }
                    }
    
                    //按换行标准换行
                    y = y + Number(info[i].h) + gap;
                    if (info[i + 1] !== undefined){
                        if (y + Number(info[i + 1].h)> maxH + viewY){
                            var maxWs = Number(Math.max(...allW));
                            x += maxWs + gap;
                            y =  viewY;
                            var allW = []
                        };
                    }
                };
            };
           
        };
    
        x = maxW + gap + viewX;;
        y = maxH + gap + viewY;;
    
        for(var i = 0; i < info.length; i++){
    
            
            if(info[i].name.toLowerCase().split("kv").length  == 1){
                if ( info[i].w / info[i].h == 1){
                    allW.push(info[i].w);
                    var addframe = mg.createFrame()
                    addframe.name = info[i].name + " " + info[i].w + "×" + info[i].h;        
                    addframe.x = x;
                    addframe.y = y;
                    addframe.width = info[i].w;
                    addframe.height = info[i].h;
                    addframe.setPluginData('s',info[i].s)
                    addframe.fills = []
    
                    //按换行标准换行
                    y = y + Number(info[i].h) + gap;
                    if (y > maxH){
                        var maxWs = Number(Math.max(...allW));
                        x += maxWs + gap;
                        y = maxH + gap;
                        var allW = []
                    };
                };
            };
           
        };
    
    
    }
    //设置裁切最大尺寸
    if ( type == "cutMax"){
        cutMax = info * 1
        console.log("最大裁切尺寸：" + info + "px")
    }
    //导入图片
    if (type == 'createrImage'){
        
        var a = mg.document.currentPage;
        var b = a.selection;
        var viewX = mg.viewport.center.x - ((mg.viewport.bound.width/2  - 300)* mg.viewport.zoom)/// mg.viewport.bound.width/2 + 300;
        var viewY = mg.viewport.center.y;
        var x;
        var y;

        x = viewX;
        y = viewY;
        for ( i = 0; i < info.length; i++){
            //console.log(info[i])
            
            for (var ii = 0; ii < info[i][2][0].cuts.length; ii++){
                var img = new Uint8Array(info[i][2][0].cuts[0]);
                var pixels = mg.createRectangle()
                
                pixels.width = info[i][1][0].cutW
                pixels.height = info[i][1][0].cutH
                pixels.x = x
                pixels.y = y;
                fillTheSelection(pixels,img)
                y = y + pixels.height;
            }
            
        }

        
    }
    //生成栅格化
    if (type == 'pixel') {
        
        var a = mg.document.currentPage;
        var b = a.selection;
        console.log("原地栅格化：",info,"倍")
        
        if (b.some(item => item.type === 'SECTION' )){
            mg.notify("请将区域转为画板再重试",{
                position:"bottom",
                type:"error",
                isLoading: false,
                timeout: 3000,
                });
        } else {
        var loading =  mg.notify("生成中，请稍后",{
            position:"bottom",
            isLoading: true,
            timeout: 6000,
        });
        setTimeout(() =>{
            for (var i = 0; i < b.length; i++){
                intXY(b[i]);
                cutNode(a,b[i],info);
            }
            loading.cancel()
        },100)
    }
        
    }
    //覆盖栅格化
    if (type == 'pixelRe') {
        
        var a = mg.document.currentPage;
        var b = a.selection;
        console.log("原地栅格化：",info,"倍")

        var loading =  mg.notify("生成中，请稍后",{
            position:"bottom",
            isLoading: true,
            timeout: 6000,
        });
        setTimeout(() =>{
            for (var i = 0; i < b.length; i++){
                intXY(b[i]);
                cutNode(a,b[i],info);
                b[i].remove();  
            }
            loading.cancel()
        },100)
        
    }
    //导入大图
    if (type == "importNum"){
        importNum = info;
        xx = 0;
        yy = 0;
        time = 0;
        ww = 0;
        hh = 0;  
    }
    if (type == 'pixelIm'){
        var loading =  mg.notify("文件较大时会卡顿，请耐心等待",{
            position:"bottom",
            //isLoading: true,
            timeout: 2000,
        });
        //console.log(info[0])
        var a = mg.document.currentPage;
        var viewX = mg.viewport.center.x - ((mg.viewport.bound.width/2  - 300)* mg.viewport.zoom);/// mg.viewport.bound.width/2 + 300;
        var viewY = mg.viewport.center.y;
        var x = viewX + xx;
        var y = viewY + yy;
        for (var i = 0; i < info.length; i++){
            var pixels = mg.createRectangle()
            pixels.x = (x + info[i].x);
            pixels.y = (y + info[i].y);
            pixels.width = info[i].w;
            pixels.height = info[i].h;
            pixels.name = info[i].name;  
            fillTheSelection(pixels,info[i].img);
            if ( i == (info.length - 1 )){
                var index = a.children.length - info.length;
                var group = mg.group([a.children[index]]);
                group.name = info[i].name.split("-")[0];
                for ( var ii = 1; ii < info.length; ii ++){
                    a.children[index].appendChild( a.children[index + 1])
                    a.selection = [a.children[index]]
                }
                
            }
            
        }

        xx += info[0].w + 20
        time++
        if ( hh < info[0].h){
            hh = info[0].h
        }

        if ( time%4 == 0){
            xx = 0;
            yy += hh;
            hh = 0;
        }
            
    }

    //发送要恢复尺寸的图片的数据
    if (info == 'reSize'){
        console.log('reSize send')
        var a = mg.document.currentPage;
        var b = a.selection;
        var c = []
        for (var i = 0; i < b.length; i++){
            //console.log(b[i].fills[0].imageRef)
            var imgURL = 'https://mastergo.netease.com/mastergo-default/' + b[i].fills[0].imageRef;
            c.push({imgURL:imgURL,indexs:i})  
        }
         mg.ui.postMessage([c,'imgURLtoWH'],'*')
    }
    //克隆并重置图片宽高
    if( type == 'imgWH'){
        //console.log(info)
        var a = mg.document.currentPage;
        var b = a.selection;
        for (var i = 0; i < info.length; i++){
           b[i].width = info[i].width;
           b[i].height = info[i].height;
           //console.log(b[i])
           b[i].fills = [{
            type: "IMAGE",
            imageRef: b[i].fills[0].imageRef,
            ratio: b[i].fills[0].ratio,
            rotation: b[i].fills[0].rotation,
            scaleMode: "FILL",
            filters:b[i].fills[0].filters,
            isVisible: b[i].fills[0].isVisible,
            alpha: b[i].fills[0].alpha,
            blendMode: b[i].fills[0].blendMode,
            id: b[i].fills[0].id,
            name:b[i].fills[0].name
        }]
        }
    }
    //复用图片调整
    if ( info == 'fliters'){
        var a = mg.document.currentPage;
        var b = a.selection;
        var end = b.length - 1
        for (var i = 1; i < b.length; i++){
            b[i].fills = [
                {
                type: "IMAGE",
                scaleMode: "FILL",
                imageRef:b[end].fills[0].imageRef,
                filters:b[0].fills[0].filters
                },
            ];
        }
    }
    //准备添加杂色
    if ( info == 'addNoise'){
        console.log('addnoise')
        mg.ui.postMessage(['noise','noiseWH']);
    }
    //接收杂色图片
    if ( type == 'noiseURL'){
        
        var a = mg.document.currentPage;
        var b = a.selection;
        //console.log(info)
        var img = new Uint8Array(info);
        //console.log(img);
        var pixels = mg.createRectangle()
        fillTheSelection2(pixels,img)
        pixels.width = b[0].width
        pixels.height = b[0].height
        pixels.x = b[0].absoluteRenderBounds.x;
        pixels.y = b[0].absoluteRenderBounds.y;
        pixels.name = '杂色';
        pixels.blendMode = 'OVERLAY';
        //pixels.fills[0].ratio = 0.1;
        //pixels.effects = [{type: 'LAYER_BLUR', isVisible: true, radius: 0.25, blendMode: 'PASS_THROUGH'}];
        b[0].insertChild(b[0].children.length,pixels)
    }

    if ( info == 'textByLine'){
        console.log('按行拆分')
        var a = mg.document.currentPage;
        var b = a.selection;
        var lines = [];
        //var texts = mg.createText()
        for (var i = 0; i < b.length; i++){
            if (b[i].type == 'TEXT'){
                lines.push(b[i].characters.split('\n'));
            } else {
                mg.notify('所选对象非文本', {
                    type: "error",
                    position: "bottom",
                    timeout: 3000,
                    isLoading: false,
                  });
            }
        }
        for (var i = 0; i < b.length; i++){
            if (b[i].type == 'TEXT'){
                var parentnode = b[i].parent;
                var index = parentnode.children.findIndex(item => item === b[i]);
                var addframe = mg.createFrame();
                var x = b[i].absoluteRenderBounds.x;
                var y = b[i].absoluteRenderBounds.y - b[i].listStyles[0].end;
                addframe.width = b[i].width;
                addframe.height = b[i].height;
                addframe.x = x;
                addframe.y = y;
                addframe.fills = [];
                addframe.name = b[i].name[0] + b[i].name[1] + b[i].name[2] + b[i].name[3]+ b[i].name[4]+ b[i].name[5]+ b[i].name[6]+ b[i].name[7] +  '...' ;
                if (b[i].type == 'TEXT'){ 
                    //console.log(lines[0][0],lines.length)
                    for(var e = 0;e < lines[i].length;e++){
                        var texts = mg.createText()
                        texts.characters = lines[i][e]
                        texts.textStyles = b[i].textStyles[0]
                        texts.x = x;
                        texts.y = y;
                        y = y + b[i].textStyles[0].textStyle.lineHeightByPx
                        addframe.appendChild(texts)
                        if (lines[i][e] == ''){
                            texts.remove()
                        }
                    }
                }
                parentnode.insertChild(index + 1,addframe)
                b[i].isVisible = false;
            }
        }
        
    }
    //建立线性流程
    if ( info == 'buildFlow'){
        var a = mg.document.currentPage;
        var b = a.selection;
        var x,y;
        var x = b[0].absoluteRenderBounds.x
        if (b[0].type == 'TEXT'){
            var y = b[0].absoluteRenderBounds.y - b[0].listStyles[0].end;
        } else {
            var y = b[0].absoluteRenderBounds.y;
        }
        if (b.length > 1){
            var node1st = mg.createFrame();
            node1st.x = x;
            node1st.y = y;
            node1st.name = "总流程";
            node1st.fills =[];
            if ((b[1].x - b[0].x) >= (b[1].y - b[0].y)){
                //console.log(111)
                node1st.flexMode = 'HORIZONTAL';
                node1st.flexWrap = "NO_WRAP";
                node1st.crossAxisAlignItems = 'CENTER';
                for (var i = 0; i < b.length; i++){
                    var node3rd = b[i].clone()
                    var node2nd = mg.createFrame()
                    node2nd.flexMode = 'HORIZONTAL' ;
                    node2nd.flexWrap = "NO_WRAP"
                    node2nd.name = '子流程';
                    node2nd.fills =[];
                    node2nd.appendChild(node3rd)
                    node1st.appendChild(node2nd)
                    //b[i].remove()
                }
                if (b[0].width > b[1].width){
                    node1st.itemSpacing = b[0].width/2
                }else{
                    node1st.itemSpacing = b[1].width/2
                }
            }else{
                //console.log(222)
                node1st.flexMode = 'VERTICAL';
                node1st.crossAxisAlignItems = 'CENTER';
                for (var i = 0; i < b.length; i++){
                    var node3rd = b[i].clone()
                    var node2nd = mg.createFrame()
                    node2nd.flexMode = 'HORIZONTAL' ;
                    node2nd.flexWrap = "NO_WRAP"
                    node2nd.name = '子流程';
                    node2nd.fills =[];
                    node2nd.appendChild(node3rd)
                    node1st.appendChild(node2nd)
                    //b[i].remove()
                }
                if (b[0].width > b[1].width){
                    node1st.itemSpacing = b[1].height*2
                }else{
                    node1st.itemSpacing = b[0].height*2
                }
            }
            //console.log(node1st.itemSpacing,node1st.flexMode)
            var nodeline = mg.createConnector()
        }
    }
    //斜切工具
    if ( type == 'skewSet'){
        var a = mg.document.currentPage;
        var b = a.selection;
        
        
        for (var i = 0; i < b.length; i++){
            
            /*
            if( info[1] == 'skewW'){
                b[i].setPluginData('skewW',info[0]);
                var skewW = info[0];
                var skewH = b[i].getPluginData('skewH');
            }
            if( info[1] == 'skewH'){
                b[i].setPluginData('skewH',info[0]);
                var skewH = info[0];
                var skewW = b[i].getPluginData('skewW');
                
            }
            */

            b[i].setPluginData('skewInfo',JSON.stringify({x:info.x,y:info.y,w:info.w,h:info.h}))
            //console.log(b[i].getPluginData('skewInfo'))
            b[i].relativeTransform = [[info.w/100,Math.tan(info.x*(Math.PI/180)),b[i].x],[Math.tan(info.y*(Math.PI/180)),info.h/100,b[i].y],]
            
            //console.log(b[i].getPluginData('skewW'),b[i].getPluginData('skewH'))
        }
        
    }
    //等比缩放工具
    if ( type == 'scaleSelf'){
        var a = mg.document.currentPage;
        var b = a.selection;
        var center = {"TL":"TOPLEFT","TC":"TOP","TR":"TOPRIGHT","CL":"LEFT","CC":"CENTER","CR":"RIGHT","BL":"BOTTOMLEFT","BC":"BOTTOM","BR":"BOTTOMRIGHT",}
        var value;
        for (var i = 0; i < b.length; i++){
            if( info.type == "WH"){
                //console.log(value,center[info.center])
                value = info.value / 100
                b[i].rescale(value,{scaleCenter:center[info.center]})
            }
            if( info.type == "W"){
                value = info.value / b[i].width
                b[i].rescale(value,{scaleCenter:center[info.center]})
            }
            if( info.type == "H"){
                value = info.value / b[i].height
                b[i].rescale(value,{scaleCenter:center[info.center]})
            }
        }
    }
    //恢复默认命名
    if ( info == 'reName'){
        var a = mg.document.currentPage;
        var b = a.selection;
        for (var i = 0; i < b.length; i++){
            if (b[i].type == 'GROUP'){
                b[i].name = '组'
            }else if (b[i].type == 'FRAME') {
                b[i].name = '容器'
            }else if (b[i].type == 'TEXT') {
                b[i].name = ''
            }else{
                b[i].name = '矩形'
            }
        }
    }
    //监听tab切换
    if ( type == 'tabSet'){
        tabInfo = "tab-" + info 
        //console.log("tab-" + info)
        if(info == 2){
            var frameData = []
            var a = mg.document.currentPage;
            var b = a.selection;
            for (var i = 0; i < b.length; i++){
                if ( b[i].type == "FRAME" || b[i].type == "GROUP" || b[i].type == "COMPONENT" || b[i].type == "INSTANCE")
                if (b[i].fills == '' | b[i].bottomLeftRadius !== 0 | b[i].bottomRightRadius !== 0 | b[i].topLeftRadius !== 0 | b[i].topRightRadius !== 0) {
                    var types = "png";
                }else{
                    var types = "jpg";
                }
                if (b[i].getPluginData('s') !== ''){
                    frameData.push({name:b[i].name,s:b[i].getPluginData('s'),type:types});
                } else {
                    frameData.push({name:b[i].name,s:'',type:types});
                } 
            };
            mg.ui.postMessage([frameData,"frameExport"]);
            if (b.length !== 0){
                setTimeout(function(){
                    var imgData = [];
                    for (var i = 0; i < b.length; i++){
                        imgData.push( b[i].export({ format: 'PNG',constraint:{type:'SCALE',value:1} }) );
                    };
                    mg.ui.postMessage([imgData,"imgExport"]);
                },200)
            }
            
        }
    }
    //记录导出尺寸设置
    if ( type == 'exportSizeSet'){
        var a = mg.document.currentPage;
        var b = a.selection;
        b[info[1]].setPluginData('s',info[0])

    }
    //处理要导出的图片
    if ( info == 'exportImg'){
        /*
        var a = mg.document.currentPage;
        var b = a.selection;
        var imgData = []
        for (var i = 0; i < b.length; i++){
            imgData.push( b[i].export({ format: 'PNG',constraint:{type:'SCALE',value:1} }) );
        }
        mg.ui.postMessage([imgData,"imgExport"])
        //*/
    }
    //建立表格
    if ( type == 'creTable'){
        var a = mg.document.currentPage;
        var b = a.selection;
        var viewX = mg.viewport.center.x - ((mg.viewport.bound.width/2  - 300)* mg.viewport.zoom)/// mg.viewport.bound.width/2 + 300;
        var viewY = mg.viewport.center.y;
        var x = viewX;
        var y = viewY;
        var H = Number(info[0]);
        var L = Number(info[1]);
        if ( b.length < 2){
            if ( b.length == 1){
                var data = tableToData(b[0].characters,true)
                H = data[0].length;
                L = data.length;
                //console.log(H,L)
                x = b[0].x + b[0].width + 60;
                y = b[0].y;
            }
            var node1 = mg.createComponent();
            node1.x = x;
            node1.y = y;
            creTableSet(node1, "table-表头",true,true,"表头文案")//需添加表格属性的节点，命名，是否显示区分色，是否需要填充文案，需要填充的文案/克隆的节点
            var node2 = mg.createComponent();
            node2.x = node1.x;
            node2.y = node1.y + 60;
            creTableSet(node2, "table-数据",false,true,"数据文案")

            var list = mg.createFrame()
            list.name = "#列";
            list.layoutPositioning = "AUTO";
            list.flexGrow = 0;
            list.flexMode = "VERTICAL";
            list.flexWrap = "NO_WRAP";
            list.itemSpacing = 0;
            list.crossAxisSpacing = 0;
            list.paddingTop = 0;
            list.paddingBottom = 0;
            list.paddingLeft = 0;
            list.paddingRight= 0;
            list.fills = [];
            if ( H > 2){
                list.appendChild(node1.clone());
                for ( var e = 1; e < H; e++){
                    list.appendChild(node2.clone());
                }
            } else {
                list.appendChild(node1.clone());
                list.appendChild(node2.clone());
                list.appendChild(node2.clone());
                list.appendChild(node2.clone());
            }

            list.flexMode = "VERTICAL";
            list.mainAxisAlignItems = "FLEX_START";
            list.mainAxisSizingMode = "AUTO";
            list.crossAxisAlignContent = "AUTO";
            list.crossAxisAlignItems = "CENTER"; 
            list.crossAxisSizingMode = "AUTO";
            
            var table = mg.createFrame()
            table.x = x + 200;
            table.y = y;
            table.name = "#table";
            table.layoutPositioning = "AUTO";
            table.flexGrow = 0;
            table.flexMode = "HORIZONTAL";
            table.flexWrap = "NO_WRAP";
            table.itemSpacing = 0;
            table.mainAxisAlignItems = "FLEX_START";
            table.mainAxisSizingMode = "AUTO";
            table.crossAxisAlignItems = "FLEX_START"; 
            table.crossAxisSizingMode = "AUTO";
            table.crossAxisSpacing = 0;
            table.paddingTop = 0;
            table.paddingBottom = 0;
            table.paddingLeft = 0;
            table.paddingRight= 0;
            table.fills = [];
            if ( L > 0 ){
                table.appendChild(list);
                for ( var e = 1; e < L; e++){
                    table.appendChild(list.clone());
                }
            }else{
                table.appendChild(list);
                table.appendChild(list.clone());
                table.appendChild(list.clone());
            }

        }
        if ( b.length == 2){
            if ( b[0].name.split("表头").length !== 1 && b[1].name.split("数据").length !== 1 || b[1].name.split("表头").length !== 1 && b[0].name.split("数据").length !== 1){

                var list = mg.createFrame();
                list.name = "#列";
                list.fills = [];
                for ( var i = 0; i < b.length; i++){
                    if(b[i].type == "COMPONENT" || b[i].type == "INSTANCE"){
                        x = b[0].x;
                        y = b[0].y + 80;
                        if (b[i].name.split("表头").length !== 1){
                            list.insertChild(0,b[i].clone());
                        }
                        if (b[i].name.split("数据").length !== 1){
                            if( H > 0){
                                for ( var e = 0; e < H; e++){
                                    list.insertChild(e + 1,b[i].clone());
                                }
                            } else {
                                list.insertChild(1,b[i].clone());
                                list.insertChild(2,b[i].clone());
                                list.insertChild(3,b[i].clone());
                            }                
                        }    
                    } else{
                        x = b[0].x + 200;
                        y = b[0].y + 80;
                        if (b[i].name.split("表头").length !== 1){
                            var node1 = mg.createComponent();
                            node1.x = b[i].absoluteRenderBounds.x + 200;
                            node1.y = b[i].absoluteRenderBounds.y;
                            creTableSet(node1, "table-表头",true,false,b[i])
                            list.insertChild(0,node1.clone());
                        }
                        if (b[i].name.split("数据").length !== 1){
                            var node2 = mg.createComponent();
                            node2.x = b[i].absoluteRenderBounds.x + 200;
                            node2.y = b[i].absoluteRenderBounds.y;
                            creTableSet(node2, "table-数据",false,false,b[i])
                            //console.log(H)
                            if( H > 0){  
                                for ( var e = 0; e < H; e++){
                                    list.insertChild(e + 1,node2.clone());
                                }
                            } else {
                                list.insertChild(1,node2.clone());
                                list.insertChild(2,node2.clone());
                                list.insertChild(3,node2.clone());
                            }   
                        }
                    }
                }
                list.layoutPositioning = "AUTO";
                list.flexGrow = 0;
                list.flexMode = "VERTICAL";
                list.flexWrap = "NO_WRAP";
                list.itemSpacing = 0;
                list.crossAxisSpacing = 0;
                list.paddingTop = 0;
                list.paddingBottom = 0;
                list.paddingLeft = 0;
                list.paddingRight= 0;
                var table = mg.createFrame()
                table.x = x;
                table.y = y;
                table.name = "#table";
                table.layoutPositioning = "AUTO";
                table.flexGrow = 0;
                table.flexMode = "HORIZONTAL";
                table.flexWrap = "NO_WRAP";
                table.itemSpacing = 0;
                table.mainAxisAlignItems = "FLEX_START";
                table.mainAxisSizingMode = "AUTO";
                table.crossAxisAlignItems = "FLEX_START"; 
                table.crossAxisSizingMode = "AUTO";
                table.crossAxisSpacing = 0;
                table.paddingTop = 0;
                table.paddingBottom = 0;
                table.paddingLeft = 0;
                table.paddingRight= 0;
                table.fills = [];
                if ( L > 0){
                    table.appendChild(list);
                    for ( var e = 1; e < L; e++){
                        table.appendChild(list.clone());
                    }
                }else{
                    table.appendChild(list);
                    table.appendChild(list.clone());
                    table.appendChild(list.clone());
                }
            }
            /*
            if( b[0].name.split("#table").length !== 1 && b[1].type == "TEXT" || b[1].name.split("#table").length !== 1 && b[0].type == "TEXT" ){
                for ( var i = 0; i < b.length; i++){
                    if (b[i].type == "TEXT"){
                        var data = tableToData(b[i].characters)
                        console.log(data)
                    }
                }
            }
            */
            
        }
        if ( b.length == 3){
            var keyType = ['INSTANCE', 'INSTANCE', 'TEXT']
            var keyType2 = ['COMPONENT', 'COMPONENT', 'TEXT']
            var keyType3 = ['INSTANCE', 'COMPONENT', 'TEXT']
            var T = b.map(obj => obj.type);
            if ( T.every(element => keyType.includes(element)) || T.every(element => keyType2.includes(element)) || T.every(element => keyType3.includes(element)) ){
                //console.log(T)
            }
            
        }
    }
    //表格填充数据
    if ( type == 'reTable'){
        var a = mg.document.currentPage;
        var b = a.selection;
        if (b.length == 1 && b[0].name.split("#table").length !== 1 && b[0].children[0].name.split('数据流').length == 1){
            
            var data = tableToData(info.trim(),true) 
            var H = data[0].length - b[0].children[0].children.length;
            var L = data.length - b[0].children.length;
            addTable(b,H,L)
            
            for(var i = 0; i < b[0].children.length; i++){
                
                if (b[0].children[i].name.split('#列').length !== 1){
                    var c = b[0].children[i].children;
                    for (var ii = 0; ii < c.length; ii++){
                        //console.log(c[ii].name + ':' + data[i][ii])
                        var id = []
                        if ( c[ii].componentProperties.length >= 6){
                            for (var e = 5; e < c[ii].componentProperties.length; e++){//默认前五个是固定的组件属性：区分色、上右下左描边
                                if ( c[ii].componentProperties[e].name.split('字').length !== 1){
                                    //console.log("含字段" + ii)
                                    id.push( c[ii].componentProperties[e].id)//收集字段/文字属性ii
                                }
                            } 
                            var maxText = data[i][ii].split("|")
                            if (id.length == maxText.length){
                                //console.log(id.length + ":" + maxText)
                                for (var iii = 0; iii < id.length; iii++){
                                    c[ii].setProperties({[id[iii]]:maxText[iii]})//按顺序修改字段属性
                                }  
                            } else {
                                c[ii].setProperties({[id[0]]:data[i][ii]})
                            }
                            
                        }
                    }  
                }  
            } 
        }
        if (b.length == 1 && b[0].name.split("#table").length !== 1 && b[0].children[0].name.split('数据流').length !== 1){
            var data = tableToData(info.trim(),false)
                var H = 0;
                var L = data.length - b[0].children.length;
                addTable(b,H,L)
                for(var i = 0; i < b[0].children.length; i++){
                    for (var e = 0; e < b[0].children[i].componentProperties.length; e++){
                        //console.log(data[i][e],e)
                        if ( b[0].children[i].componentProperties[e].type == "TEXT"){
                            b[0].children[i].setProperties({[b[0].children[i].componentProperties[e].id]:data[i][e]})
                        }
                    }
                }
                   
        }
        if (b.length == 2){
            if (b[1].type == "TEXT" && b[0].children[0].name.split('数据流').length == 1 && b[0].name.split('#table').length !== 1){
                var data = tableToData(b[1].characters.trim(),true)
                var H = data[0].length - b[0].children[0].children.length;
                var L = data.length - b[0].children.length;
                addTable(b,H,L)
                
                for(var i = 0; i < b[0].children.length; i++){
                    
                    if (b[0].children[i].name.split('#列').length !== 1){
                        var c = b[0].children[i].children;
                        for (var ii = 0; ii < c.length; ii++){
                            //console.log(c[ii].name + ':' + data[i][ii])
                            var id = []
                            if ( c[ii].componentProperties.length >= 6){
                                for (var e = 5; e < c[ii].componentProperties.length; e++){//默认前五个是固定的组件属性：区分色、上右下左描边
                                    if ( c[ii].componentProperties[e].name.split('字').length !== 1){
                                        //console.log("含字段" + ii)
                                        id.push( c[ii].componentProperties[e].id)//收集字段/文字属性ii
                                    }
                                } 
                                var maxText = data[i][ii].split("|")
                                if (id.length == maxText.length){
                                    //console.log(id.length + ":" + maxText)
                                    for (var iii = 0; iii < id.length; iii++){
                                        c[ii].setProperties({[id[iii]]:maxText[iii]})//按顺序修改字段属性
                                    }  
                                } else {
                                    c[ii].setProperties({[id[0]]:data[i][ii]})
                                }
                                
                            }
                        }  
                    }  
                }   
            } 
            
            if (b[0].type == "TEXT" && b[1].children[1].name.split('数据流').length == 1 && b[1].name.split('#table').length !== 1){
                var data = tableToData(b[0].characters.trim(),true)
                var H = data[0].length - b[1].children[0].children.length;
                var L = data.length - b[1].children.length;
                addTable(b,H,L)
                
                for(var i = 0; i < b[1].children.length; i++){
                    
                    if (b[1].children[i].name.split('#列').length !== 1){
                        var c = b[1].children[i].children;
                        for (var ii = 0; ii < c.length; ii++){
                            //console.log(c[ii].name + ':' + data[i][ii])
                            var id = []
                            if ( c[ii].componentProperties.length >= 6){
                                for (var e = 5; e < c[ii].componentProperties.length; e++){//默认前五个是固定的组件属性：区分色、上右下左描边
                                    if ( c[ii].componentProperties[e].name.split('字').length !== 1){
                                        //console.log("含字段" + ii)
                                        id.push( c[ii].componentProperties[e].id)//收集字段/文字属性ii
                                    }
                                } 
                                var maxText = data[i][ii].split("|")
                                if (id.length == maxText.length){
                                    //console.log(id.length + ":" + maxText)
                                    for (var iii = 0; iii < id.length; iii++){
                                        c[ii].setProperties({[id[iii]]:maxText[iii]})//按顺序修改字段属性
                                    }  
                                } else {
                                    c[ii].setProperties({[id[0]]:data[i][ii]})
                                } 
                            }
                        }
                            
                    }    
                }
            }   

            if ( b[1].type == "TEXT" && b[0].children[0].name.split('数据流').length !== 1 && b[0].name.split('#table').length !== 1){
                var data = tableToData(b[1].characters.trim(),false)
                var H = 0;
                var L = data.length - b[0].children.length;
                addTable(b,H,L)
                for(var i = 0; i < b[0].children.length; i++){
                    for (var e = 0; e < b[0].children[i].componentProperties.length; e++){
                        //console.log(data[i][e],e)
                        if ( b[0].children[i].componentProperties[e].type == "TEXT"){
                            b[0].children[i].setProperties({[b[0].children[i].componentProperties[e].id]:data[i][e]})
                        }
                    }
                }
                        
            }

            if ( b[0].type == "TEXT" && b[1].children[1].name.split('数据流').length !== 1 && b[1].name.split('#table').length !== 1){
                var data = tableToData(b[0].characters.trim(),false)
                var H = 0;
                var L = data.length - b[1].children.length;
                addTable(b,H,L)
                for(var i = 0; i < b[1].children.length; i++){
                    for (var e = 0; e < b[1].children[i].componentProperties.length; e++){
                        //console.log(data[i][e],e)
                        if ( b[1].children[i].componentProperties[e].type == "TEXT"){
                            b[1].children[i].setProperties({[b[1].children[i].componentProperties[e].id]:data[i][e]})
                        }
                    }
                }
                        
            }
        }
    }
    //添加表格属性
    if ( type == 'asTable'){
        var a = mg.document.currentPage;
        var b = a.selection;
        for (var i = 0; i < b.length; i++){
            //var text = []

            if ( b[i].type == "COMPONENT"){
                if (  b[i].componentPropertyValues.length == 0){
                    if (b[b[i].children.length - 1].layoutPositioning !== "ABSOLUTE"){
                        b[i].itemReverseZIndex = true;
                        var colorLayer = mg.createRectangle();
                        cloneMain(colorLayer,b[i])
                        colorLayer.fills = [{type:"SOLID",color:{r:0.7,g:0.7,b:0.7,a:1,}}];   
                        var strokeTop = mg.createRectangle();
                        cloneMain(strokeTop,b[i]);
                        setStroke(strokeTop,"CENTER",[1,0,0,0]);
                        var strokeRight = mg.createRectangle();
                        cloneMain(strokeRight,b[i]);
                        setStroke(strokeRight,"CENTER",[0,1,0,0]);
                        var strokeBottom = mg.createRectangle();
                        cloneMain(strokeBottom,b[i]);
                        setStroke(strokeBottom,"CENTER",[0,0,1,0]);
                        var strokeLeft = mg.createRectangle();
                        cloneMain(strokeLeft,b[i]);
                        setStroke(strokeLeft,"CENTER",[0,0,0,1]);

                        var diffC = mg.group([colorLayer]);
                        var strokeT = mg.group([strokeTop]);
                        var strokeR = mg.group([strokeRight]);
                        var strokeB = mg.group([strokeBottom]);
                        var strokeL = mg.group([strokeLeft]);

                        if (b[i].children[0].characters == "表头文案" | b[i].characters == "表头"){
                            addAbsolute(b[i],diffC,"区分色",true)
                        } else {
                            addAbsolute(b[i],diffC,"区分色",false)
                        }
                        
                        addAbsolute(b[i],strokeT,"上描边",false)
                        addAbsolute(b[i],strokeR,"右描边",false)
                        addAbsolute(b[i],strokeB,"下描边",false)
                        addAbsolute(b[i],strokeL,"左描边",false)
                        b[i].itemReverseZIndex = false;
                    }
                }
                for ( var ii = 0; ii < b[i].children.length; ii++){
                    
                    if ( b[i].children[ii].type == "TEXT"){
                        b[i].children[ii].flexGrow = 1;
                        b[i].children[ii].textAutoResize = "HEIGHT"
                        //console.log(Object.keys(b[i].children[ii].componentPropertyReferences).length )
                        if (Object.keys(b[i].children[ii].componentPropertyReferences).length === 0){
                            //text.push([b[i].children[ii].characters,])
                            var addTextSet = b[i].addComponentProperty("字段1", "TEXT", b[i].children[ii].characters);
                            //console.log(addTextSet)
                            b[i].children[ii].componentPropertyReferences = {characters:addTextSet};
                            
                        }
                    }
                    if ( b[i].children[ii].layoutPositioning == "ABSOLUTE"){
                        b[i].children[ii].children[0].constraints = {
                            horizontal: "STARTANDEND",
                            vertical: "STARTANDEND"
                        }
                        //console.log(Object.keys(b[i].children[ii].componentPropertyReferences).length )
                        if (Object.keys(b[i].children[ii].componentPropertyReferences).length === 0){
                            var addLayerSet = b[i].addComponentProperty(b[i].children[ii].name,"BOOLEAN",false);
                            //console.log(addLayerSet)
                            b[i].children[ii].componentPropertyReferences = {isVisible:addLayerSet};
                        }
                    }
                }
            }
            if ( b[i].type == "TEXT"){
                var data = tableToData(b[i].characters,true)
                if ( data.length == 1 ){
                    //console.log(data[0])
                    var node = mg.createComponent();//b[i].clone()
                    node.x = b[i].absoluteRenderBounds.x + b[i].width * 1.5;
                    node.y = b[i].absoluteRenderBounds.y;
                    
                    node.layoutPositioning = "AUTO";
                    node.flexGrow = 0;
                    node.flexMode = "HORIZONTAL";
                    node.flexWrap = "NO_WRAP";
                    node.itemSpacing = 0;
                    node.mainAxisAlignItems = "CENTER";
                    node.mainAxisSizingMode = "FIXED";
                    node.crossAxisAlignItems = "CENTER"; 
                    node.crossAxisSizingMode = "FIXED";
                    node.crossAxisSpacing = 0;
                    node.paddingTop = 10;
                    node.paddingBottom = 10;
                    node.width = b[i].width * 2;
                    node.height = b[i].height + 20;
                    node.fills = [];
                    var colorLayer = mg.createRectangle();
                    cloneMain(colorLayer,node)
                    colorLayer.fills = [{type:"SOLID",color:{r:0.7,g:0.7,b:0.7,a:1,}}];   
                    var strokeTop = mg.createRectangle();
                    cloneMain(strokeTop,node);
                    setStroke(strokeTop,"CENTER",[1,0,0,0]);
                    var strokeRight = mg.createRectangle();
                    cloneMain(strokeRight,node);
                    setStroke(strokeRight,"CENTER",[0,1,0,0]);
                    var strokeBottom = mg.createRectangle();
                    cloneMain(strokeBottom,node);
                    setStroke(strokeBottom,"CENTER",[0,0,1,0]);
                    var strokeLeft = mg.createRectangle();
                    cloneMain(strokeLeft,node);
                    setStroke(strokeLeft,"CENTER",[0,0,0,1]);

                    var diffC = mg.group([colorLayer]);
                    var strokeT = mg.group([strokeTop]);
                    var strokeR = mg.group([strokeRight]);
                    var strokeB = mg.group([strokeBottom]);
                    var strokeL = mg.group([strokeLeft]);

                    if (b[i].characters == "表头文案" | b[i].characters == "表头"){
                        node.name = "table-表头";
                        addAbsolute(node,diffC,"区分色",true)
                    } else {
                        node.name = "table-数据";
                        addAbsolute(node,diffC,"区分色",false)
                    }
                    
                    addAbsolute(node,strokeT,"上描边",false)
                    addAbsolute(node,strokeR,"右描边",false)
                    addAbsolute(node,strokeB,"下描边",false)
                    addAbsolute(node,strokeL,"左描边",false)

                    var text = node.appendChild(b[i].clone())

                    for ( var ii = 0; ii < node.children.length; ii++){
                        if ( node.children[ii].type == "TEXT"){
                            node.children[ii].flexGrow = 1;
                            node.children[ii].textAutoResize = "HEIGHT";
                            if (Object.keys(node.children[ii].componentPropertyReferences).length === 0){
                                var addTextSet = node.addComponentProperty("字段1", "TEXT", node.children[ii].characters);
                                node.children[ii].componentPropertyReferences = {characters:addTextSet};
                            }
                        }
                        if (node.children[ii].layoutPositioning == "ABSOLUTE"){
                            node.children[ii].children[0].constraints = {
                                horizontal: "STARTANDEND",
                                vertical: "STARTANDEND"
                            }
                        }
                    }
                    
                }
            }
            
            
        }
    }
    //表格增减行列数
    if ( type == 'addTable'){
        //console.log(info)
        var a = mg.document.currentPage;
        var b = a.selection;
        var H = Number(info[0]);
        var L = Number(info[1]);
        addTable(b,H,L) 
    }
    //表格间隔区分色
    if ( type == "diffColorTable"){
        
        var a = mg.document.currentPage;
        var b = a.selection;
        for (var i = 0; i < b.length; i++){
            if ( b[i].name.split("#table").length !== 1){
                var c = b[i].children;
                if ( b[i].name.split("-横").length !== 1){
                    console.log('横向表格')
                    for ( var ii = 0; ii < c.length; ii++){
                        if (c[ii].name.split('#列').length !== 1){
                            var d = c[ii].children;
                            if ( (ii + 1) % 2 == 0){
                                for ( var iii = 0; iii < d.length; iii++){
                                    if ( d[iii].componentProperties[0].name !== "区分色"){
                                        mg.notify("请检查组件属性中“区分色”是否是第一个",{
                                            type: "error",
                                            position: "bottom",
                                            timeout: 6000,
                                            isLoading: false,
                                        });
                                    } else {
                                        d[iii].setProperties({[d[iii].componentProperties[0].id]:false})
                                    }
                                }
                            } else {
                                for ( var iii = 0; iii < d.length; iii++){
                                    if ( d[iii].componentProperties[0].name !== "区分色"){
                                        mg.notify("请检查组件属性中“区分色”是否是第一个",{
                                            type: "error",
                                            position: "bottom",
                                            timeout: 6000,
                                            isLoading: false,
                                        });
                                    } else {
                                        d[iii].setProperties({[d[iii].componentProperties[0].id]:true})
                                    }
                                }
                            }
                            
                        
                        }
                    }

                }else{
                    console.log('竖向表格')
                    for ( var ii = 0; ii < c.length; ii++){
                        if (c[ii].name.split('#列').length !== 1){
                            var d = c[ii].children;
                            for ( var iii = 1; iii < d.length; iii++){
                                if ( (iii + 1) % 2 !== 0 && d[iii].componentProperties[0].name !== "区分色"){
                                    mg.notify("请检查组件属性中“区分色”是否是第一个",{
                                        type: "error",
                                        position: "bottom",
                                        timeout: 6000,
                                        isLoading: false,
                                    });
                                }
                                if ( (iii + 1) % 2 !== 0 && d[iii].componentProperties[0].name == "区分色"){
                                    d[iii].setProperties({[d[iii].componentProperties[0].id]:true})
                                } else {
                                    d[iii].setProperties({[d[iii].componentProperties[0].id]:false})
                                }
                            }
                        
                        }
                    }
                }
            }
            
        }
    }
    //反转表格行列
    if ( type == "translateTable"){
        var a = mg.document.currentPage;
        var b = a.selection;
        var loading =  mg.notify("生成中，请稍后",{
            position:"bottom",
            isLoading: true,
            timeout: 6000,
            });

        setTimeout(() => {   
        for ( var i = 0; i < b.length; i++){
            
            if ( b[i].name.split("#table").length !== 1){
                var H = 0,L = 0;

                for ( var ii = 0; ii < b[i].children.length; ii++){

                    if ( b[i].children[ii].name.split("#列").length !== 1){
                        H++
                    }
                }

                if ( b[i].children[0].name.split("#列").length !== 1){
                    

                    for ( var ii = 0; ii < b[i].children[0].children.length; ii++){
                        L++
                    }
                } else {
                    L = 3
                }
                
                

                var table = b[i].parent.insertChild(0,b[i].clone());
                
                var c =  b[i].parent.children[0];
                if ( b[i].children[0].children[1].name.split("表头").length == 1){
                    c.name += "-横";
                } else {
                    c.name = b[i].name.split("-横")[0];
                }
                addTable([c],H - L,L - H);
                for ( var ii = 0; ii < L; ii++){
                    for ( var iii = 0; iii < H; iii++){
                        c.children[ii].children[0].remove();//删一个少一个
                    }
                }
                for ( var ii = 0; ii < H; ii++){
                    for ( var iii = 0; iii < L; iii++){
                        c.children[iii].appendChild(b[i].children[ii].children[iii].clone());
                    }
                    
                }
                
                b[i].remove()
                loading.cancel()
                a.selection = [c]
            }
        }
        },100);
        
    }
    //刷新小地图
    if ( type == "reMap"){
        var loading =  mg.notify("生成中，请稍后",{
            position:"bottom",
            isLoading: true,
            timeout: 6000,
            });
        setTimeout(() => {
            createrMap()
            loading.cancel()
        }, 100);
        
    }
    //接收是否已创建小地图
    if (type == "hasMap"){
        var a = mg.document.currentPage;
        var b = a.children;
        if(b[0].name == "创建快照"){
            b[0].remove()
        } else {
            for ( var i = 0; i < b.length; i++){
                if(b[i].name == "创建快照"){
                    b[i].remove()
                }
            }
        }
        
    }
    //接收是否已自动选中非画板对象，删除为非画板对象创建的临时画板
    if (type == "hasView"){
        console.log("backHasView")
        var a = mg.document.currentPage;
        var b = a.children;
        if(b[0].name == "临时选区"){
            b[0].remove()
        } else {
            for ( var i = 0; i < b.length; i++){
                if(b[i].name == "临时选区"){
                    b[i].remove()
                }
            }
        }
        
    }
    //移动视图
    if ( type == "reCenter"){
        //console.log(info.x,info.y)
        mg.viewport.center = {x:info.x + mg.viewport.positionOnDom.width/4,y:info.y + mg.viewport.positionOnDom.height/4 }
        //mg.viewport.zoom = 1
    }
    //移动视图+自动最大化
    if ( type == "reCenterAuto"){
        var a = mg.document.currentPage;
        var b = a.children;
        var X = b.map(obj => obj.absoluteRenderBounds.x);
        var Y = b.map(obj => obj.absoluteRenderBounds.y);
        var W = b.map(obj => obj.absoluteRenderBounds.width);
        var H = b.map(obj => obj.absoluteRenderBounds.height);
        var V = b.map(obj => obj.isVisible)
        for ( var i = 0; i < b.length; i++){
            if ( V[i] == true){
                if ( X[i] <= info.x && Y[i] <= info.y && (X[i] + W[i]) >= info.x && (Y[i] + H[i]) >= info.y){
                    if (!b[i].children){
                        //console.log(b[i])
                        a.selection = [b[i]]
                        //console.log(V[i])
                        mg.viewport.scrollAndZoomIntoView(a.selection)
                        if ( b[i].type !== "FRAME" || b[i].type !== "GROUP" || b[i].type !== "COMPONENT_SET" || b[i].type !== "COMPONENT" || b[i].type !== "INSTANCE"  ){
                            var textArea = mg.createFrame();
                            textArea.name = "临时选区"
                            textArea.fills = [];
                            cloneMain(textArea,b[i]);
                            a.insertChild(0,textArea);  
                            mg.ui.postMessage(["","hasView"]);
                            console.log('sendHasView')
                            mg.viewport.scrollAndZoomIntoView(a.children[0]);
                        }
                    } else {
                        a.selection = [b[i]]
                        mg.viewport.scrollAndZoomIntoView(a.selection)
                        var c = b[i].children;
                        console.log("目标区域有子图层")
                        X = c.map(obj => obj.absoluteRenderBounds.x);
                        Y = c.map(obj => obj.absoluteRenderBounds.y);
                        W = c.map(obj => obj.absoluteRenderBounds.width);
                        H = c.map(obj => obj.absoluteRenderBounds.height);
                        V = c.map(obj => obj.isVisible)
                        //console.log(X,Y,W,H,V)
                        for ( var ii = 0; ii < c.length; ii++){
                            if ( V[ii] == true){
                                if ( X[ii] <= info.x && Y[ii] <= info.y && (X[ii] + W[ii]) >= info.x && (Y[ii] + H[ii]) >= info.y){
                                    console.log("目标图层：" + c[ii].name)
                                    mg.viewport.scrollAndZoomIntoView([c[ii]])
                                    if ( c[ii].type !== "FRAME" || c[ii].type !== "GROUP" || c[ii].type !== "COMPONENT_SET" || c[ii].type !== "COMPONENT" || c[ii].type !== "INSTANCE"  ){
                                        var textArea = mg.createFrame();
                                        textArea.name = "临时选区"
                                        textArea.fills = [];
                                        cloneMain(textArea,c[ii]);
                                        a.insertChild(0,textArea);  
                                        mg.ui.postMessage(["","hasView"]);
                                        console.log('sendHasView')
                                        mg.viewport.scrollAndZoomIntoView(a.children[0]);
                                    }
                                }
                            }
                        }
                    }
                    
                } else {
                    a.selection = []
                    mg.viewport.center = {x:info.x,y:info.y}
                    mg.viewport.zoom = 0.6
                }
            }
        }
        
    }

    //拆分路径/*
    if ( info == "reSVG"){
        var a = mg.document.currentPage;
        var b = a.selection;
        if ( b[0].type == "PEN"){
            //var cutSVG = b[0].clone()//mg.createPen();
            //cutSVG.penPaths = [b[1].penPaths];
            //b[0].fills = b[1].fills;
            //cloneMain(cutSVG,b[0]);
            var paths = cutPath( b[0].penPaths.data)
            console.log("含闭合路径：" + cutPath( b[0].penPaths.data).length)
            for (var i = 0; i < paths.length; i++){
                var cutSVG = b[0].clone()
                cutSVG.penPaths = [{data:paths[i],windingRule:"Nonzero",}]
            }
        }
    }

    //提取色号
    if ( type == "getColor"){
        
        var a = mg.document.currentPage;
        var b = a.selection;
        for (var i = 0; i < b.length; i++){
            var color = fillsToRGBA(b[i].fills[0].color);
            var node = mg.createText();
            cloneMain(node,b[i]);
            node.characters = color;
            b[i].parent.appendChild(node)
            if (b[i].width > 2560 || b[i].height > 2560){
                setTextMain(node,0,color.length,36);
                node.y -= node.height + 10
            } else if ( b[i].width < 500 || b[i].height < 500 ) {
                setTextMain(node,0,color.length,12);
                node.y -= node.height + 2
            } else {
                setTextMain(node,0,color.length,22);
                node.y -= node.height + 4
            }  
        }
    }

    //建立伪描边{color:,size:,num:}
    if ( type == "setStyle-wmb"){
        var a = mg.document.currentPage;
        var b = a.selection;
        
        for (var i = 0; i < b.length; i++){
                creStyleWmb(info,b[i])
        }
    }
    if ( type == "reStyle-wmb"){
        var a = mg.document.currentPage;
        var b = a.selection;
        
        for (var i = 0; i < b.length; i++){
            if ( b[i].effects.length == 0){
                creStyleWmb(info,b[i])
            }else{
                var hex = mg.RGBAToHex((b[i].effects[0].color))
                var size = Math.max(b[i].effects[0].offset.x,b[i].effects[0].offset.y)
                var num = b[i].effects.length
                
                if(info[1] == "color"){
                    hex = info[0];
                }
                if(info[1] == "num"){
                    num = info[0];
                }
                if(info[1] == "size"){
                    size = info[0];
                }
                
                var newInfo = {color:hex,num:num,size:size}
                creStyleWmb(newInfo,b[i])
            }

        }
    }

    if ( info == 'pixelToEven'){
        var a = mg.document.currentPage;
        var b = a.selection;
        for (var i = 0; i < b.length; i++){
            intXY(b[i])
            evenWH(b[i])
        }
    }

    if ( info == 'pixelToInt'){
        var a = mg.document.currentPage;
        var b = a.selection;
        for (var i = 0; i < b.length; i++){
            intXY(b[i])
            intWH(b[i])
        }
    }

    if ( info == 'yuhua'){
        var a = mg.document.currentPage;
        var b = a.selection;
        for (var i = 0; i < b.length; i++){
            var group = mg.group([b[i]]);
            group.name = b[i].name;
            var min = Math.min(b[i].absoluteRenderBounds.width,b[i].absoluteRenderBounds.height);
            var yuhua = Math.ceil(0.044 * min + 6);//蒙版向内缩进值，模糊值则为yuhua*0.8
            //console.log(min,yuhua);
            var mask = mg.createRectangle();
            mask.x = b[i].absoluteRenderBounds.x + yuhua;
            mask.y = b[i].absoluteRenderBounds.y + yuhua;
            mask.width = b[i].absoluteRenderBounds.width - yuhua * 2;
            mask.height = b[i].absoluteRenderBounds.height - yuhua * 2;
            mask.effects = [{
                "type": "LAYER_BLUR",
                "isVisible": true,
                "radius": yuhua * 0.8,
                "blendMode": "PASS_THROUGH"
            }]
            group.insertChild(0,mask);
            var maskG = mg.group([b[i].parent.children[0]]);
            maskG.name = '羽化蒙版';
            maskG.isMask = true;
            maskG.isMaskOutline = false;
            b[i].parent.insertChild(0,b[i].clone());
            b[i].parent.children[0].effects = [{
                "type": "LAYER_BLUR",
                "isVisible": true,
                "radius": yuhua * 0.8,
                "blendMode": "PASS_THROUGH"
            }]
        }
    }

    if ( info == 'toFrameMore'){
        var a = mg.document.currentPage;
        var b = a.selection;
        for (var i = 0; i < b.length; i++){
            var index = b[i].parent.children.findIndex(item => item === b[i]);
            
            if(b[i].children.length !== undefined){
                var n = b[i].children.length
                if(b[i].children.length !== 1){                  
                    for(var e = 1; e < n; e++){
                        var newframe = mg.createFrame();
                        cloneMain(newframe,b[i]);
                        newframe.name = b[i].children[1].name;
                        newframe.appendChild(b[i].children[1]);
                        newframe.fills = [];
                        b[i].parent.insertChild((index + e),newframe)
                        if( e == n - 1){
                            var group = mg.group([b[i]]);
                            group.name = b[i].name;
                            for( var ee = 0; ee < n - 1; ee++){
                                group.appendChild(a.children[index + 1])
                            }
                            b[i].name = b[i].children[0].name;
                        }
                    }
                }
            }
        }
    }

    if ( info == 'toComponent'){
        var a = mg.document.currentPage;
        var b = a.selection;
        for (var i = 0; i < b.length; i++){
            if ( b[i].type !== 'COMPONENT'){
                var component = mg.createComponent();
                component.name = b[i].name;
                cloneMain(component,b[i]);
                component.fills = []
                b[i].parent.appendChild(component);
                if ( b[i].fills.length !== 0){
                    component.appendChild(b[i]);          
                } else {
                    for ( var ii = 0; ii < b[i].children.length; ii++){
                        component.appendChild(b[i].children[ii]);
                    } 
                    b[i].remove() 
                } 
            }
        }
    }

    if ( info == 'newComponent'){
        var a = mg.document.currentPage;
        var b = a.selection;
        for (var i = 0; i < b.length; i++){
            if ( b[i].type == 'COMPONENT'){
                var component = mg.createComponent();
                component.name = b[i].name + "拷贝";
                cloneMain(component,b[i]);
                component.fills = b[i].fills;
                for ( var ii = 0; ii < b[i].children.length; ii++){
                    component.appendChild(b[i].children[ii].clone());
                } 
                component.y += b[i].height + 20
            }
        }
    }

    if ( info == 'reXY'){
        
        var a = mg.document.currentPage;
        var b = a.selection;
        if ( b.length == 2){
            console.log("调换位置")
            var X1 = b[0].x,
            Y1 = b[0].y,
            X2 = b[1].x,
            Y2 = b[1].y,
            I1 = b[0].parent.children.findIndex(item => item === b[0]),
            I2 = b[1].parent.children.findIndex(item => item === b[1]),
            P1 = b[0].parent,
            P2 = b[1].parent;
            console.log(X1,Y1,X2,Y2)
            P1.insertChild(I1,b[1]);
            P2.insertChild(I2,b[0]); 
            b[0].x = X2;
            b[0].y = Y2;
            b[1].x = X1;
            b[1].y = Y1;
            //P1.insertChild(I1,b[1]);
            //P2.insertChild(I2,b[0]);     
            console.log(b[1].absoluteBoundingBox.x,b[1].absoluteBoundingBox.y,b[0].absoluteBoundingBox.x,b[0].absoluteBoundingBox.y)   
        }
    }

    if ( type == "searchToRe"){
        if(info.info !== ''){
            var a = mg.document.currentPage;
            var b = a.selection;
            if ( info.area == 'Page'){
                if ( info.type == 'Text'){
                    find = a.findAll((node) => node.type === 'TEXT' && node.isVisible == true && node.characters.split(info.info).length > 1);
                    //&& (node.parent.isVisible == true || node.parent.type == 'PAGE') && (node.parent.parent.isVisible == true || node.parent.parent.type == 'PAGE') && (node.parent.parent.parent.isVisible == true || node.parent.parent.parent.type == 'PAGE') && (node.parent.parent.parent.parent.isVisible == true || node.parent.parent.parent.parent.type == 'PAGE')
                    mg.ui.postMessage([find.length,'getFind'])
                    a.selection = [find[0]]
                }
            }

        }
    }

    if ( type == "rePick"){
        
        if(info[0] !== '' && info[1] !== ''){//[re,seaech]
            var a = mg.document.currentPage;
            var b = a.selection;
            for (var i = 0; i < b.length; i++){
                console.log(info)
                if (b[i].type == 'TEXT'){
                    var style = b[i].textStyles;
                    var text = b[i].characters.split(info[1])
                    b[i].characters = '';
                    for(var ii = 0; ii < text.length - 1; ii++){
                        b[i].characters += text[ii] + info[0]
                    }
                    
                    if(b[i].fillStyleId == ''){
                        for (var e = 0; e < style.length; e++){
                            //console.log(style[e].start,style[e].end,style[e].fills[0])
                            b[i].setRangeFills(style[e].start,style[e].end,[style[e].fills[0]])
                        }
                    }
                }
            }
        }
    }

    if ( type == "searchPick"){
        var a = mg.document.currentPage;
        var b = a.selection;
        if ( find.length > 0){
            if ( info == 'all'){
                console.log(find.length)
                a.selection = find.slice()
            } else {
                a.selection = [find[info - 1]]
            }
        }
    }

    if ( info == 'getStyle'){
        var style = mg.getLocalPaintStyles()
        console.log(style)
        var styles = [];
        var name = style.map(items => items.name)
        var color = style.map(items => mg.RGBAToHex(items.paints[0].color))
        for ( var i = 0; i < name.length; i++){
            //styles.push({name:name[i],color:color[i]})
            if ( i == name.length - 1){
                //console.log(styles)
                //mg.ui.postMessage([styles,'sendStyle'])
            }
        }
        
    }

    if ( type == "creStyleTable"){
        var page = mg.createPage()
        page.name = "附件/变量表格"
    }
}
  
//初始化
send()


mg.on('currentpagechange',function(){
    if ( tabInfo == "tab-4"){
        createrMap()
    }
})



mg.on('selectionchange', function(){
    //console.log('所选对象发生变化')
    send()
})

function send(){
    var a = mg.document.currentPage;
    var b = a.selection;
    //var sidePage = true;
    if (b[0] !== undefined){
        
        if ( b[0].type == "FRAME" || b[0].type == "COMPONENT" || b[0].type == "INSTANCE" || b[0].type == "GROUP" ){
            if (b[0].name.split("table").length !== 1 || b[0].name.split("列").length !== 1 || b[0].name.split("表").length !== 1 || b[0].name.split("数据组").length !== 1){
                mg.ui.postMessage(['sidePage','changeUI']);
                mg.ui.postMessage(["table","toTool"])
            }
        } else if ( b[0].type == "RECTANGLE"  ) {
            if ( b.length == 1 && b[0].fills[0].type == "IMAGE"){
                mg.ui.postMessage(["image","toTool"])
            }     
        } else if ( b[0].type == "TEXT"  ){
            
            if ( b[1] == undefined){
                mg.ui.postMessage(['sidePage','changeUI']);
                mg.ui.postMessage(["text","toTool"])
            } else {
                if ( b[1].name.split("table").length !== 1){
                    mg.ui.postMessage(['sidePage','changeUI']);
                    mg.ui.postMessage(["table","toTool"])
                }
            }

        } else {
            mg.ui.postMessage([b[0].type,"toTool"])
        }
         
        if(b.length > 1){
            var effects = []
            for ( var i = 0; i < b.length; i++){
                
                if ( b[i].effects.length !== 0 ){
                    if ( b[i].effects[0].type == "DROP_SHADOW") {
                        effects.push([mg.RGBAToHex(b[i].effects[0].color).substring(0,7),b[i].effects.length,Math.max(b[i].effects[0].offset.x,b[i].effects[0].offset.y )] )  
                    }
                    if ( i == b.length - 1){
                        mg.ui.postMessage([effects,'wmbEffects'])
                        //console.log(effects)
                }
                }
                
            }
        }else{
            if ( b[0].effects.length !== 0 ){
                if ( b[0].effects[0].type == "DROP_SHADOW" ){
                    var effects = []
                    effects.push([mg.RGBAToHex(b[0].effects[0].color).substring(0,7),b[0].effects.length,Math.max(b[0].effects[0].offset.x,b[0].effects[0].offset.y )] )
                    mg.ui.postMessage([effects,'wmbEffects'])
                }
            }
        }

        if (b[0].getPluginData('skewInfo')){
            //console.log(JSON.parse(b[0].getPluginData('skewInfo')))
            mg.ui.postMessage([JSON.parse(b[0].getPluginData('skewInfo')),'skewData']);
            mg.ui.postMessage(["skew","toTool"])
        }else{
            mg.ui.postMessage([{x:0,y:0,w:100,h:100},'skewData']);
        }

        
        


        if (tabInfo == 'tab-2'){
            var frameData = []
            for (var i = 0; i < b.length; i++){
                if (b[i].fills == '' | b[i].bottomLeftRadius !== 0 | b[i].bottomRightRadius !== 0 | b[i].topLeftRadius !== 0 | b[i].topRightRadius !== 0) {
                    var type = "png"
                }else{
                    var type = "jpg"
                }
                if (b[i].getPluginData('s') !== ''){
                    frameData.push({name:b[i].name,s:b[i].getPluginData('s'),type:type})
                } else {
                    frameData.push({name:b[i].name,s:'',type:type})
                }  
            }
            mg.ui.postMessage([frameData,"frameExport"]) 
            setTimeout(function(){
                var imgData = [];
                for (var i = 0; i < b.length; i++){
                    imgData.push( b[i].export({ format: 'PNG',constraint:{type:'SCALE',value:1} }) );
                };
                mg.ui.postMessage([imgData,"imgExport"]);
            },200)
        }
            
           
        
        
    } else {
        mg.ui.postMessage([{x:0,y:0,w:100,h:100},'skewData']);
        mg.ui.postMessage(['noSidePage','changeUI']);
        mg.ui.postMessage([[],"frameExport"]) 
        mg.ui.postMessage([[["#000000",4,1]],'wmbEffects'])

    }

    
}

async function fillTheSelection(node,img) {
    const imageHandle = await mg.createImage(img);
    // 设置图片填充
    node.fills = [
        {
        type: "IMAGE",
        scaleMode: "FILL",
        imageRef: imageHandle.href, // 将 href 作为图片填充的 imageRef
        },
    ];
}

async function fillTheSelection2(node,img) {
    const imageHandle = await mg.createImage(img);
    // 设置图片填充
    node.fills = [
        {
        type: "IMAGE",
        imageRef: imageHandle.href, // 将 href 作为图片填充的 imageRef
        filters:{contrast: 0,exposure: 0,highlights: 0,hue: 0,saturation: -1,shadows: 0,temperature: 0,tint: 0},
        scaleMode:'TILE',
        //ratio:0.1,
        alpha:0.5,
        },
    ];
}

function tableToData(text,dataToList){
    if ( dataToList ){
        var h = text.split("\n");//[[文案\t文案\t文案],[文案\t文案\t文案]]
        var hs = [];//[[文案,文案,文案],[文案,文案,文案,]]
        var e = 0;
        for (var i = 0; i < h.length; i++){
            hs[e] = h[i].split("\t");
            e++
        }
        return hs[0].map((col, i) => hs.map(row => row[i]))
    } else {
        var h = text.split("\n");//[[文案\t文案\t文案],[文案\t文案\t文案]]
        var hs = [];//[[文案,文案,文案],[文案,文案,文案,]]
        var e = 0;
        for (var i = 0; i < h.length; i++){
            hs[e] = h[i].split("\t");
            e++
        }
        return hs
    }
    
}

function cloneMain(newnode,oldnode){
    newnode.width = oldnode.width;
    newnode.height = oldnode.height;
    newnode.x = oldnode.absoluteRenderBounds.x;
    newnode.y = oldnode.absoluteRenderBounds.y;
}

function cloneKey(key,newnode,oldnode){
    for ( var i = 0; i < key.length; i++){
        newnode.key[i] = JSON.parse(JSON.stringify(oldnode.key[i]));
    }
}

function setStroke(node,align,trbl){
    node.fills = [];
    node.strokes = [{type:"SOLID",color:{r:0.5,g:0.5,b:0.5,a:1,}}];
    node.strokeTopWeight = trbl[0];
    node.strokeRightWeight = trbl[1];
    node.strokeBottomWeight = trbl[2];
    node.strokeLeftWeight = trbl[3];
    node.strokeAlign = align
}

function addAbsolute(parent,absoluteNode,names,view){
    parent.appendChild(absoluteNode);
    absoluteNode.name = names;
    absoluteNode.layoutPositioning = "ABSOLUTE";
    absoluteNode.x = 0;
    absoluteNode.y = 0;
    var addLayerSet = parent.addComponentProperty(names,"BOOLEAN",view);
    absoluteNode.componentPropertyReferences = {isVisible:addLayerSet};
}

function creTableSet(node,name,view,needText,textOrClone,){
    node.name = name;
    node.layoutPositioning = "AUTO";
    node.flexGrow = 0;
    node.flexMode = "HORIZONTAL";
    node.flexWrap = "NO_WRAP";
    node.itemSpacing = 0;
    node.mainAxisAlignItems = "CENTER";
    node.mainAxisSizingMode = "FIXED";
    node.crossAxisAlignItems = "CENTER"; 
    node.crossAxisSizingMode = "FIXED";
    node.crossAxisSpacing = 0;
    node.paddingTop = 10;
    node.paddingBottom = 10;
    node.width = 176;
    node.height = 52;
    node.fills = [];
    var colorLayer = mg.createRectangle();
    cloneMain(colorLayer,node)
    colorLayer.fills = [{type:"SOLID",color:{r:0.7,g:0.7,b:0.7,a:1,}}];   
    var strokeTop = mg.createRectangle();
    cloneMain(strokeTop,node);
    setStroke(strokeTop,"CENTER",[1,0,0,0]);
    var strokeRight = mg.createRectangle();
    cloneMain(strokeRight,node);
    setStroke(strokeRight,"CENTER",[0,1,0,0]);
    var strokeBottom = mg.createRectangle();
    cloneMain(strokeBottom,node);
    setStroke(strokeBottom,"CENTER",[0,0,1,0]);
    var strokeLeft = mg.createRectangle();
    cloneMain(strokeLeft,node);
    setStroke(strokeLeft,"CENTER",[0,0,0,1]);

    var diffC = mg.group([colorLayer]);
    var strokeT = mg.group([strokeTop]);
    var strokeR = mg.group([strokeRight]);
    var strokeB = mg.group([strokeBottom]);
    var strokeL = mg.group([strokeLeft]);


    addAbsolute(node,diffC,"区分色",view)
    addAbsolute(node,strokeT,"上描边",false)
    addAbsolute(node,strokeR,"右描边",false)
    addAbsolute(node,strokeB,"下描边",false)
    addAbsolute(node,strokeL,"左描边",false)

    if (needText == true){
        node.appendChild(mg.createText())

        for ( var ii = 0; ii < node.children.length; ii++){
            if ( node.children[ii].type == "TEXT"){
                node.children[ii].flexGrow = 1;
                node.children[ii].textAutoResize = "HEIGHT";
                if (Object.keys(node.children[ii].componentPropertyReferences).length === 0){
                    var addTextSet = node.addComponentProperty("字段1", "TEXT", node.children[ii].characters);
                    node.children[ii].componentPropertyReferences = {characters:addTextSet};
                    node.children[ii].characters = textOrClone;
                    node.children[ii].textAlignHorizontal = "CENTER";
                    setTextMain(node.children[ii],0,textOrClone.length,22);
                }
            }
            if (node.children[ii].layoutPositioning == "ABSOLUTE"){
                node.children[ii].children[0].constraints = {
                    horizontal: "STARTANDEND",
                    vertical: "STARTANDEND"
                }
            }
        }
        node.crossAxisAlignItems = "FLEX_START"; 
        setTimeout(() => {
            node.crossAxisAlignItems = "CENTER"; 
        },50)
    }else{
        node.appendChild(textOrClone.clone())
    }

    
            
}

async function setTextMain(node,star,end,fontSize){
    await mg.listAvailableFontsAsync()

    await mg.loadFontAsync({
        "family": "Source Han Sans CN",
        "style": "Regular"
    })
    node.setRangeFontName(star,end,{"family": "Source Han Sans CN","style": "Regular"});
    node.setRangeFontSize(star,end,fontSize);
}

function addTable(b,H,L){
    for (var i = 0; i < b.length; i++){
            
        if (b[i].name.split('#table').length !== 1){
            if (b[i].children.length >= 1 ){
                if ( L > 0){
                    for( var e = 0; e < L; e++){
                        //console.log()
                        var lists = b[i].children[0]
                        b[i].appendChild(lists.clone());
                    }
                } else if ( L < 0 ){
                    if (b[i].children.length > 1 ){
                        for( var e = 0; e < L * -1; e++){
                            //console.log()
                            var length = b[i].children.length - 1 ;
                            b[i].children[length].remove()
                        }
                    }
                }
            }
            for(var ii = 0; ii < b[i].children.length; ii++){ 
                if (b[i].children[ii].name.split('#列').length !== 1){
                    if (b[i].children[ii].children.length >= 2 ){
                        var data = b[i].children[ii].children[b[i].children[ii].children.length - 1]
                        if ( H > 0){
                            for( var e = 0; e < H; e++){
                                //console.log()
                                var list = b[i].children[ii];
                                var length = list.children.length - 1 ;
                                list.appendChild(data.clone());
                            }  
                        } else if ( H < 0 ){
                            if( b[i].children[ii].children.length > 2 ){
                                for( var e = 0; e < H * -1; e++){
                                    //console.log()
                                    var list = b[i].children[ii];
                                    var length = list.children.length - 1 ;
                                    list.children[length].remove()
                                }
                            }
                            
                        }   
                    }                        
                }
                
            }
        }
        
    }
}

 async function createrMap(){
    var a = mg.document.currentPage;
    var b = a.children;
    var inView = getInView(b)
    
    var pageInView = mg.createFrame()
    a.insertChild(0,pageInView)
    pageInView.x = inView.x;
    pageInView.y = inView.y;
    pageInView.name = "创建快照";
    pageInView.fills = [];
    for ( i = 0; i < b.length; i++){
        if ( b[i].isVisible == true && b[i].type !== "SECTION"){
            pageInView.appendChild(b[i].clone())
        } else {
            if ( b[i].type == "SECTION" && b[i].isVisible == true){
                var c = b[i].children;
                var sect = mg.createFrame()
                    sect.fills = b[i].fills;
                    cloneMain(sect,b[i])
                    pageInView.appendChild(sect);
                for ( ii = 0; ii < c.length; ii++){
                    if (c[ii].isVisible == true){
                        pageInView.appendChild(c[ii].clone());
                    }
                }
            }
        }
    }
    pageInView.clipsContent = false;
    
    if(inView.w > inView.h){
        var pageView = new Uint8Array(pageInView.export({ format: 'PNG',constraint:{type:'WIDTH',value:"2048"}}))
    } else {
        var pageView = new Uint8Array(pageInView.export({ format: 'PNG',constraint:{type:'HEIGHT',value:"2048"}}))
    }  
    //console.log(inView)
    await mg.ui.postMessage([{w:inView.w,h:inView.h,x:inView.x,y:inView.y,view:pageView,bg:mg.RGBAToHex(a.bgColor)},"createrMap"])
    pageInView.isVisible = false;
    //console.log(mg.document.currentPage.selection[0])//.selection[0]

}

function getInView(b){
    var X = b.map(obj => obj.absoluteRenderBounds.x);
    var Y = b.map(obj => obj.absoluteRenderBounds.y);
    var W = b.map(obj => obj.absoluteRenderBounds.width);
    var H = b.map(obj => obj.absoluteRenderBounds.height);
    var V = b.map(obj => obj.isVisible)
    //console.log(X,Y,W,H,V)
    var minX = Infinity;
    for ( var i = 0; i < X.length; i++){
        if ( minX > X[i] && V[i] == true){
            minX = X[i];
        }
    }
    var minY = Infinity;
    for ( var i = 0; i < Y.length; i++){
        if ( minY > Y[i] && V[i] == true){
            minY = Y[i];
        }
    }
    var maxX = -Infinity;
    for ( var i = 0; i < X.length; i++){
        if ( maxX < X[i] + W[i] && V[i] == true){
            maxX = X[i] + W[i];
        }
    }
    var maxY = -Infinity;
    for ( var i = 0; i < Y.length; i++){
        if ( maxY < Y[i] + H[i] && V[i] == true){
            maxY = Y[i] + H[i];
        }
    }
    var w = maxX - minX;
    var h = maxY - minY;
    var x = minX;
    var y = minY;
    //console.log(w,h,x,y,)
    return {w:w,h:h,x:x,y:y}

}

function cutPath(d) {
    var paths = d.split("Z").filter(segment => segment.trim())
    for (var i = 0; i < paths.length; i++){
        paths[i] += "Z"
        if ( i == paths.length - 1){
            var pathData = paths;
            return pathData;
        }
    }    
}

function fillsToRGBA(obj){
    if ( obj.a !== 1){
        var r = Math.ceil(obj.r.toFixed(2) * 255)
        var g = Math.ceil(obj.g.toFixed(2) * 255)
        var b = Math.ceil(obj.b.toFixed(2) * 255)
        var a = obj.a.toFixed(1)
        return "rgba(" + r + "," + g + "," + b + "," + a + ")"
    } else {
        return mg.RGBAToHex(obj).split('FF')[0]
    }

}

function creCutArea(info){//{w:,h:,x:,y:,s:}
    var W = info.w,H = info.h;//图片宽高
    var Ws = info.w,Hs = info.h;//非尾部部分的裁剪宽高
    var lastWs = info.w,lastHs = info.h;//尾部的裁剪宽高
    var X = info.x,Y = info.y;//裁切区坐标
    var cutW = 1,cutH = 1;//纵横裁剪数量
    var cuts = [];//从左到右，从上到小的裁切区域集
    var tips;
    //切割方案
    if (W  * info.s <= cutMax && H  * info.s <= cutMax){//4K以内，正常生成
        cuts = [{w:W,h:H,x:info.x,y:info.y,s:1}]
        return cuts;
    } else {//多行列宫格
        cutW = Math.ceil((W  * info.s)/cutMax)
        cutH = Math.ceil((H  * info.s)/cutMax)
        if ( W%cutW == 0){ //宽度刚好等分
            Ws = W/cutW
            lastWs = Ws
            
        } else { //有小数点
            Ws = Math.ceil(W/cutW) //向上取整，最后一截短一些
            lastWs = W - (Ws*(cutW - 1))           
        }
        if ( H%cutH == 0){ //长度刚好等分
            Hs = H/cutH
            lastHs = Hs
            tips = "高被整除"
        } else { //有小数点
            Hs = Math.ceil(H/cutH) //向上取整，最后一截短一些
            lastHs = H - (Hs*(cutH - 1))
            tips = "高不能整除，剩余：" + lastHs
        }

        // 拆分图像数据
        for (var i = 0; i < (cutW * cutH); i++) {

            if ((i + 1)%cutW == 0 && i !== (cutW * cutH) - 1 && i !== 0){
                cuts.push({w:lastWs,h:Hs,x:X,y:Y,});
                Y = Y + Hs;
                X = info.x;
            } else if (i == (cutW * cutH) - 1){
                cuts.push({w:lastWs,h:lastHs,x:X,y:Y,t:tips});
            } else {
                if ( i > (cutW * (cutH - 1)) - 1){
                    cuts.push({w:Ws,h:lastHs,x:X,y:Y});
                } else {
                    cuts.push({w:Ws,h:Hs,x:X,y:Y});
                }
                
                if ( cutW == 1 ){
                    X = info.x;
                    Y = Y + Hs;
                } else {
                    X = X + Ws;
                }
                
            }
            
        }
        return cuts;
    }
    
}

function cutNode(a,node,scale){
    
    var c = creCutArea({w:node.absoluteRenderBounds.width,h:node.absoluteRenderBounds.height,x:node.absoluteRenderBounds.x,y:node.absoluteRenderBounds.y,s:scale,});
    var index = node.parent.children.findIndex(item => item === node);
    //console.log(c[c.length - 1].t)
    
    for ( var ii = 0; ii < c.length; ii++){
        
        /*
        if ( node.type == 'SECTION'){
            var frame = mg.createFrame();
            cloneMain(frame,node);
            //var key = ['fills','cornerRadius','strokes',]//'strokeAlign','strokeStyle','strokeWeight',
            //cloneKey(key,frame,node);
            frame.fills = []
            frame.name = node.name + '转换';
            var group = mg.group([frame]);
            group.appendChild(cutArea);
        } else {
            var group = mg.group([node]);
            group.appendChild(cutArea);
        }
        */
        
        var cutArea = mg.createSlice()
        cutArea.width = c[ii].w;
        cutArea.height = c[ii].h;
        cutArea.x = c[ii].x;
        cutArea.y = c[ii].y;
        var group = mg.group([node]);
            group.appendChild(cutArea);
        var cutImg = mg.createRectangle()
        var img = new Uint8Array(cutArea.export({ format: 'PNG',constraint:{type:'SCALE',value:scale}}))
        if ( c.length > 1 ){
            cutImg.name = node.name + "-" + (ii + 1);
        } else {
            cutImg.name = node.name + " @" + scale + "x";
        }
        cloneMain(cutImg,cutArea);
        fillTheSelection(cutImg,img);
        group.appendChild(cutImg);
        cutArea.remove();
        if (group.parent !== a){
            a.selection = [group.parent]
            a.selection[0].insertChild((index + 1),a.selection[0].children[index].children[0])
            a.selection[0].insertChild((index + 2),a.selection[0].children[index].children[0])  
            if ( c.length > 1 && ii == (c.length - 1)){
                var imgGroup = mg.group([a.selection[0].children[index + 1]]);
                imgGroup.name = node.name + " @" + scale + "x"
                for (var e = 1; e < c.length; e++){
                    imgGroup.appendChild(a.selection[0].children[index + 2])
                }
            }
        } else {
            console.log("无容器包裹")
            a.insertChild((index + 1),a.children[index].children[0])
            a.insertChild((index + 2),a.children[index].children[0])
            if ( c.length > 1 && ii == (c.length - 1)){
                var imgGroup = mg.group([a.children[index + 1]]);
                imgGroup.name = node.name + " @" + scale + "x"
                for (var e = 1; e < c.length; e++){
                    imgGroup.appendChild(a.children[index + 2])
                }
            }
        }
    }
        
}

function intXY(node){
    node.x = Math.ceil(node.x)
    node.y = Math.ceil(node.y)
}

function intWH(node){
    if (node.type !== 'GROUP'){
        node.width = Math.ceil(node.width)
        node.height = Math.ceil(node.height)
    }
    
}


function evenWH(node){
    if (node.type !== 'GROUP'){
        var w = Math.ceil(node.width)
        var h = Math.ceil(node.height)
        if (w%2 !== 0){
            w = w - 1
        }
        if (h%2 !== 0){
            h = h - 1
        }
        node.width = w
        node.height = h
    }
}

function creStyleWmb(info,node) {
    
            if( info.num == 4 || info.num !== 8 || info.num !== 12){
                
                node.effects =[
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": info.size,
                            "y": 0
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": 0,
                            "y": info.size
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": info.size * -1,
                            "y": 0
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": 0,
                            "y": info.size * -1
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                ]
            }
            if( info.num == 8){
                node.effects =[
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": info.size,
                            "y": 0
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": 0,
                            "y": info.size
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": info.size * -1,
                            "y": 0
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": 0,
                            "y": info.size * -1
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": info.size * -1,
                            "y": info.size * -1
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": info.size,
                            "y": info.size
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": info.size * -1,
                            "y": info.size
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": info.size,
                            "y": info.size * -1
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                ]
            }
            if( info.num == 12){
                node.effects =[
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": info.size,
                            "y": 0
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": 0,
                            "y": info.size
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": info.size * -1,
                            "y": 0
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": 0,
                            "y": info.size * -1
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": info.size * -1 * 0.5,
                            "y": info.size * -1 * 0.75
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": info.size * 0.5,
                            "y": info.size * 0.75
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": info.size * -1 * 0.5,
                            "y": info.size * 0.75
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": info.size * 0.5,
                            "y": info.size * -1 * 0.75
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": info.size * -1 * 0.75,
                            "y": info.size * -1 * 0.5
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": info.size * 0.75,
                            "y": info.size * 0.5
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": info.size * -1 * 0.75,
                            "y": info.size * 0.5
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                    {
                        "type": "DROP_SHADOW",
                        "isVisible": true,
                        "offset": {
                            "x": info.size * 0.75,
                            "y": info.size * -1 * 0.5
                        },
                        "radius": 0,
                        "color":mg.hexToRGBA(info.color),
                        "blendMode": "PASS_THROUGH",
                        "spread": 0
                    },
                ]
            }
            
}