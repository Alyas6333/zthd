$(function(){

    /*基础控件开始
    * 用于业务层底层支持
    * */

     //全局服务组件
    function baseServer(options){
        var ServerConfig = {
            "url":"",
            "type":"get",
            "dataType":"json",
            "data":null,
            "benforefn":function(){},
            "successfn":function(){}
        }
        $.extend(ServerConfig,options)
        $.ajax({
            url: ServerConfig.url,
            type: ServerConfig.type,
            dataType:ServerConfig.dataType,
            data: ServerConfig.data,
            "beforeSend":function(){
                ServerConfig.benforefn()
            },
            success:function(data){
                    ServerConfig.successfn(data)
            }
        })
    }

    //全局html加载组件
    function baseloadhtml(options){
        var ServerConfig = {
            "url":"",
            "type":"get",
            "dataType":"html",
            "data":null,
            "benforefn":function(){},
            "loaddom":""
        }
        $.extend(ServerConfig,options)
        $.ajax({
            url: ServerConfig.url,
            type: ServerConfig.type,
            dataType:ServerConfig.dataType,
            data: ServerConfig.data,
            "beforeSend":function(){
                ServerConfig.benforefn()
            },
            success:function(data){
               $(ServerConfig.loaddom).html(data)
            }
        })
    }

    //全局模板数据加载函数
    function baseloadtemp(options){
        var ServerConfig = {
            "url":"",
            "type":"get",
            "dataType":"json",
            "data":null,
            "benforefn":function(){},
            "loaddom":"",
            "srcdom":""
        }
        $.extend(ServerConfig,options)
        $.ajax({
            url: ServerConfig.url,
            type: ServerConfig.type,
            dataType:ServerConfig.dataType,
            data: ServerConfig.data,
            "beforeSend":function(){
                ServerConfig.benforefn()
            },
            success:function(data){
                var html = template(ServerConfig.srcdom, data);
                $(ServerConfig.loaddom).html(html)
            }
        })
    }

    //跨页面缓存机制
    var Crosspagekeyname = {}

    //父级页面datagrid数

    var parentsdatanum = 0

    /*上层业务组件
    * 用于对象的业务线开发
    * */

    /*网格接口开始*/

    //dataGrid配置缓存
    var dataGridconfig = [];

    //dataGrid队列增加操作
    function adddataGridQueue(options){
      for(var i=0; i<options.length;i++){
          dataGridconfig.push(options[i])
      }
    }

    //dataGrid队列删除操作
    function deletedataGridQueue(){
        dataGridconfig = [];
    }

    //返回对应datagrid的配置
    function getdataGridnameSpace(eventtarget){
        var nameSpace = $(eventtarget).parents(".DataGrid").attr("data-dataGrid");
        var reconfig = {};
        $.each(dataGridconfig,function(index,value){
            if(value.dataGridname===nameSpace){
                reconfig = value;
            }
        })
        return reconfig;
    }

    //获取事件触发源
    function geteventtarget(event){
        var event = event?event:window.event;
        var targetobj = event.srcElement||event.target;
        return targetobj
    }

    //返回事件源父级空间
    function geteventparent(childobj){
        return $(childobj).parents(".DataGrid");
    }

    //业务逻辑分发函数
    function wrokinittabledata(datagridoption){
        adddataGridQueue(datagridoption)  //dataGrid入栈操作
        wrokloadtabledata(datagridoption) //网格填充函数
    }

    //数据网格填充函数
    function wrokloadtabledata(options,ability){
        if(ability){
            baseServer({
                "url":options.getlist,
                "successfn":function(data){
                    var html = template(options.datslisrc, data);
                    $(options.dalistwrap).html(html)
                    datatablechose()
                }
            })
        }
        else if($.type(options)==="array"){  //新增网格应该被加载
            $.each(options,function(index,value){
                baseServer({
                    "url":value.getlist,
                    "successfn":function(data){
                        var html = template(value.datslisrc, data);
                        $(value.dalistwrap).html(html)
                        loading("yes")
                        datatablechose()
                    }
                })
            })
        }
        else{ //控制分页
            console.log(options)
            baseServer({
                "url":options.config.getlist,
                "data":{"pagelength":options.pagelength,"pagenum":options.pagenum},
                "successfn":function(data){
                    var html = template(options.config.datslisrc, data);
                    $(options.config.dalistwrap).html(html)
                    datatablechose()
                }
            })
        }
    }

    //数据网格选择控制
    function datatablechose(){
        $("#index_all_wrap .g_tale-data-content tr").unbind("click")
        $("#index_all_wrap .g_tale-data-content tr").bind("click",function(){
            if($(this).hasClass("choseactive")){
                $(this).removeClass("choseactive")
                $(this).find("input").removeAttr("checked")
            }else{
                $(this).addClass("choseactive")
                $(this).find("input").prop("checked",'true')
            }
        })
    }

    //刷新业务逻辑控制
    function dataTablereLoad(event){
        var obj = geteventtarget(event)
        var config = getdataGridnameSpace(obj)
        wrokloadtabledata(config,"laod")
    }

    //查看业务逻辑
    function dataTablereShow(event){
        var obj = geteventtarget(event)
        var config = getdataGridnameSpace(obj)
        var parent = geteventparent(obj)
        var choseobj = cheackdatalist(config,parent); //传入对应事件源父级配置
        var g_options_keyname =config.keyname;
        if(jQuery.type(choseobj) === "null"){
            mask({"yesnomask":"no","title":"警告","content":"<div class='g_warn'>必须选中一行数据^_^</div>","width":"200px","height":"100px"})
        }
        else if(jQuery.type(choseobj) === "array"){
            mask({"yesnomask":"no","title":"警告","content":"<div class='g_warn'>查看只能选中一行数据^_^</div>","width":"200px","height":"100px"})
        }else{
            var ajaxdata = {};
            ajaxdata[g_options_keyname] = choseobj;
            baseServer({
                "url":config.seachlist,
                "data":ajaxdata,
                "successfn":function(data){
                    var html = template(config.datalistedit,data);
                    var winWidth = config.winWidth;
                    var winHeight = config.winHeight;
                    mask({"yesnomask":"no","title":"查看","content":html,"width":winWidth,"height":winHeight})
                    var i = 0;
                    $(".g_show_input input").on("focus",function(){
                        if(i==1) return;
                        else{
                            $(".g_show_input").removeClass("g_show_input")
                            $(".g_mask_title").html("编辑");
                            $(".g_mask_wrap-footer").append("<div class='g_button g_button-right'><a href='#' onclick=javascript:dataTableSave(event,config)>保存</a>")
                            i++
                        }
                    })
                }
            })
        }
    }

    //增加业务逻辑控制
    function dataTableAdd(event){
        var obj = geteventtarget(event)
        var config = getdataGridnameSpace(obj)
        var html = $(config.dateshowadd).html();
        var winWidth =config.winWidth;
        var winHeight =config.winHeight;
        mask({"yesnomask":"no","title":"编辑","content":html,"width":winWidth,"height":winHeight,"footerbutton":"<div class='g_button g_button-right'><a href='#' onclick=javascript:dataTableSave(event,config)>保存</a>"})
    }

    //删除业务逻辑控制
    function dataTableDelete(event){
        var obj = geteventtarget(event)
        var config = getdataGridnameSpace(obj)
        var parent = geteventparent(obj)
        var choseobj = cheackdatalist(config,parent); //传入对应事件源父级配置
        if(jQuery.type(choseobj) === "null"){
            mask({"yesnomask":"no","title":"警告","content":"<div class='g_warn'>请先选中一行^_^</div>","width":"200px","height":"100px"})
        }else if(jQuery.type(choseobj) === "array"){
            var arraydata = {};
            var g_options_keyname =config.keyname;
            arraydata[g_options_keyname] = choseobj
            mask({
                "yesnomask":"no",
                "title":"严重警告",
                "content":"<div class='g_warn'>确定要删除"+choseobj.length+"条数据？？？</div>",
                "width":"200px",
                "height":"100px",
                "footerbutton":"<div class='g_button g_button-left g_sys-btn'>确定</div>",
                "callback":function(){
                    baseServer({
                        "url":config.delelist,
                        "data":arraydata,
                        "type":"post",
                        "success":function(){
                             //可能存在状态码
                            wrokloadtabledata()
                        }
                    })
                }
            })
        }else{
            var arraydata = {};
            var g_options_keyname =config.keyname;
            arraydata[g_options_keyname] = choseobj
            mask({
                "yesnomask":"no",
                "title":"警告",
                "content":"<div class='g_warn g_sys-btn'>确定要删除该数据？？？</div>",
                "width":"200px",
                "height":"100px",
                "footerbutton":"<div class='g_button g_button-left g_sys-btn'>确定</div>",
                "callback":function(){
                    baseServer({
                        "url":config.delelist,
                        "data":arraydata,
                        "type":"post",
                        "success":function(){
                            //可能存在状态码
                            wrokloadtabledata()
                        }
                    })
                }
            })
        }
    }

    //编辑业务逻辑
    function dataTableEdit(){
        var obj = geteventtarget(event)
        var config = getdataGridnameSpace(obj)
        var parent = geteventparent(obj)
        var choseobj = cheackdatalist(config,parent); //传入对应事件源父级配置
        var g_options_keyname =config.keyname;
        if(jQuery.type(choseobj) === "null"){
            mask({"yesnomask":"no","title":"警告","content":"<div class='g_warn'>必须选中一行数据编辑^_^</div>","width":"200px","height":"100px"})
        }
        else if(jQuery.type(choseobj) === "array"){
            mask({"yesnomask":"no","title":"警告","content":"<div class='g_warn'>编辑只能选中一行数据^_^</div>","width":"200px","height":"100px"})
        }else{
            var ajaxdata = {};
            ajaxdata[g_options_keyname] = choseobj;
            var winWidth = config.winWidth;
            var winHeight =config.winHeight;
            baseServer({
                "url":config.seachlist,
                "data":ajaxdata,
                "successfn":function(data){
                    var html = template(config.datalistedit,data);
                    mask({"yesnomask":"no","title":"编辑","content":html,"width":winWidth,"height":winHeight,"footerbutton":"<div class='g_button g_button-right'><a href='#' onclick=javascript:dataTableSave(event,config)>保存</a>"})
                    $(".g_show_input").removeClass("g_show_input")
                }
            })
        }
    }

    //保存业务逻辑
    function dataTableSave(event,config){
        var event = event?event:window.event;
        var targetobj = event.srcElement||event.target;
        var bigdiv = $(targetobj).parents(".g_mask_wrap-footer").prev(); //弹窗content
        var tablefrom = bigdiv.find(".g_submit_input");//所有表单
        var bigtable = bigdiv.find("table");
        var g_options_keyname =config.keyname;
        var dataloadwrap = {};
        dataloadwrap[g_options_keyname] = bigtable.data(g_options_keyname);
        tablefrom.map(function(index,n){
            var keyname = $(n).attr("name");
            var keyvalue = $(n).val();
            dataloadwrap[keyname] = keyvalue;
        })
        baseServer({
            "url":config.savelist,
            "data":dataloadwrap,
            "type":"post",
            "successfn":function(data){
                wrokloadtabledata()
            }
        })
    }

    //数据网格选中状态逻辑检测
    function cheackdatalist(config,parent){
        var wrapdatebig = parent.find(config.dalistwrap)
        var cheackbox = $(wrapdatebig).find("input:checked")
        if(cheackbox.length===0){
            return null
        }else if(cheackbox.length==1){
            return cheackbox.parents("tr").data(config.keyname)
        }else{
            var cheackboxArray = [];
            cheackbox.map(function(index,n){
                cheackboxArray.push($(n).parents("tr").data(config.keyname))
            })
            return cheackboxArray
        }
    }

    //分页逻辑
    function basesubpage(event,bigwrap){
        var targetobj = geteventtarget(event);
        var config =  getdataGridnameSpace(targetobj)
        var thistaget = $(bigwrap).find(".pagenumber");
        var btn = $(targetobj)
        /*页面上下翻页*/
        if(btn.hasClass("g_page-subpage")){
            //上一页
            if(btn.hasClass("prv")){
                thistaget.map(function(index,n){
                    var temptext = Number($(n).text());
                    $(n).html(temptext-1)
                })
                var nownum = Number($(bigwrap).find(".active").text())
                $(bigwrap).attr("data-number",nownum)
                var pagelength = Number($(bigwrap).siblings("div").eq(0).attr("data-pageNumber"))
                wrokloadtabledata({
                    "pagelength":pagelength,
                    "pagenum":nownum,
                    "config":config
                })

            }else{
                thistaget.map(function(index,n){
                    var temptext = Number($(n).text());
                    $(n).html(temptext+1)
                })
                var nownum = Number($(bigwrap).find(".active").text())
                $(bigwrap).attr("data-number",nownum)
                var pagelength = Number($(bigwrap).siblings("div").eq(0).attr("data-pageNumber"))
                wrokloadtabledata({
                    "pagelength":pagelength,
                    "pagenum":nownum,
                    "config":config
                })

            }
        }
        else if(btn.hasClass("pagenumber")){   /*页码翻页*/
            thistaget.removeClass("active")
            var numberpage = Number(btn.text());
            btn.addClass("active");
            $(bigwrap).attr("data-number",numberpage)
            var pagelength = Number($(bigwrap).siblings("div").eq(0).attr("data-pageNumber"))
            wrokloadtabledata({
                "pagelength":pagelength,
                "pagenum":numberpage,
                "config":config
            })
        }
    }

    //每页显示条数逻辑
    function basesubpagenumberchrol(event,bigobj){
        var targetobj = geteventtarget(event);
        var config =  getdataGridnameSpace(targetobj)
        var $targetobj = $(targetobj)
        if($targetobj.hasClass("g_page_show")){
            $targetobj.siblings("ul").toggle(400)
        }else{
            var $bigobj =  $(bigobj)
            var chosenumber = Number($targetobj.attr("data-pageNumber"))
            var html = $targetobj.html()
            $bigobj.attr("data-pageNumber",chosenumber);
            $bigobj.find("span").html(html)
            $bigobj.find("ul").toggle(400)
            var pagenum = Number($bigobj.prev().attr("data-number"))
            wrokloadtabledata({
                "pagelength":chosenumber,
                "pagenum":pagenum,
                "config":config
            })
        }
    }

    /*网格接口结束*/

    /*弹窗业务逻辑???*/
    function mask(options){
        var maskconfig = {
            "width":"400px",
            "height":"300px",
            "yesnomask":"yes",
            "title":"",
            "content":"",
            "footerbutton":"",
            "callback":function(){}
        }
        $.extend(maskconfig,options);
        if(maskconfig.yesnomask=="yes"){
            var maskwrap = "<div class='g_mask'><div class='g_mask_opacity'></div><div class='g_mask_wrap' style=width:"+maskconfig.width+";height:"+maskconfig.height+">"; //请在末尾加上</div>
            var masktitle = "<div class='g_mask_temp_re'><div class='g_mask_wrap-header'><h6 class='g_mask_title'>"+maskconfig.title+"</h6><span class='glyphicon glyphicon-remove' onclick=javascript:baseclosewin()></span></div>";
            var maskcontent = "<div class='g_mask_wrap-content'>"+maskconfig.content+"</div>";
            var footer = "<div class='g_mask_wrap-footer'><div class='g_button g_button-right'><a href='#' onclick=javascript:baseclosewin()>关闭</a></div>";
            footer+=maskconfig.footerbutton+"</div>";
            var endstr = maskwrap+masktitle+maskcontent+footer+"</div></div></div>"
            $("body").append(endstr)
            $(".g_sys-btn").on("click",function(){
                maskconfig.callback()
            })
        }else{
            var maskwrap = "<div class='g_mask_wrap' style=width:"+maskconfig.width+";height:"+maskconfig.height+">"; //请在末尾加上</div>
            var masktitle = "<div class='g_mask_temp_re'><div class='g_mask_wrap-header'><h6 class='g_mask_title'>"+maskconfig.title+"</h6><span class='glyphicon glyphicon-remove' onclick=javascript:baseclosewin()></span></div>";
            var maskcontent = "<div class='g_mask_wrap-content'>"+maskconfig.content+"</div>";
            var footer = "<div class='g_mask_wrap-footer'><div class='g_button g_button-right'><a href='#' onclick=javascript:baseclosewin()>关闭</a></div>";
            footer+=maskconfig.footerbutton+"</div>";
            var endstr = maskwrap+masktitle+maskcontent+footer+"</div></div>"
            $("body").append(endstr)
            $(".g_sys-btn").on("click",function(){
                maskconfig.callback()
            })
        }
    }

    //关闭窗口??
    function baseclosewin(){
        if($(this).parents(".g_mask_wrap")){
            $(".g_mask_wrap").fadeOut(400).remove()
        }else{
            $(".g_mask").fadeOut(400).remove()
        }
    }

    //提供window全局窗口???
    function openwinurl(options){
        var maskconfig = {
            "width":"400px",
            "height":"300px",
            "yesnomask":"yes",
            "title":"",
            "content":"",
            "url":"",
            "callback":function(){}
        }
        $.extend(maskconfig,options)
        baseServer({
            "url":maskconfig.url,
            "dataType":"html",
            "successfn":function(data){
                var maskwrap = "<div class='g_mask_wrap' style=width:"+maskconfig.width+";height:"+maskconfig.height+">"; //请在末尾加上</div>
                var masktitle = "<div class='g_mask_temp_re' style='overflow: auto'><div class='g_mask_wrap-header'><h6 class='g_mask_title'>"+maskconfig.title+"</h6><span class='glyphicon glyphicon-remove' onclick=javascript:baseclosewin()></span></div>";
                var maskcontent = "<div class='g_mask_wrap-content'>"+data+"</div>";
                var footer = "<div class='g_mask_wrap-footer'><div class='g_button g_button-right'><a href='#' onclick=javascript:baseclosewin()>关闭</a></div>";
                footer+="</div>";
                var endstr = maskwrap+masktitle+maskcontent+footer+"</div></div>"
                $("body").append(endstr)
                $(".g_sys-btn").on("click",function(){
                    maskconfig.callback()
                })
            }
        })

    }

    //全选单选控制???
    function allchose(event,objtarget){
        var event = event?event:window.event;
        var target = event.srcElement||event.target;
        if($(target).hasClass("chosecheack")){
            $(target).removeClass("chosecheack");
            $("#g_data_wrap tr").trigger("click")
        }else{
            $(target).addClass("chosecheack");
            $("#g_data_wrap tr").trigger("click")
        }
    }

    //新增标签页面全局控制
    function dataaddtab(event,options){
        var obj = geteventtarget(event)
        var config = getdataGridnameSpace(obj)
        var parent = geteventparent(obj)
        var choseobj = cheackdatalist(config,parent); //传入对应事件源父级配置
        if(jQuery.type(choseobj) === "null"){
            mask({"yesnomask":"no","title":"警告","content":"<div class='g_warn'>必须选中一行数据^_^</div>","width":"200px","height":"100px"})
        }
        else if(jQuery.type(choseobj) === "array"){
            mask({"yesnomask":"no","title":"警告","content":"<div class='g_warn'>只能选中一行数据^_^</div>","width":"200px","height":"100px"})
        }else{
            var g_options_keyname =config.keyname;
            Crosspagekeyname[g_options_keyname] = choseobj
            baseServer({
                "url":options.url,
                "dataType":"html",
                "benforefn":function(){
                    $(".xiongtab").fadeOut(400)
                },
                "successfn":function(data){
                    $("#index_all_wrap").append(data)
                }
            })
        }
    }

    //通过上层窗口的键值获取加载页面
    function wrokinittabledatakeynameload(options){
        alonepagecontrol(options)
        baseServer({
            "url":alonepagewindow[alonepagelen-1]["g_option_config"].getlist,
            "data":Crosspagekeyname,
            "successfn":function(data){
                var html = template(alonepagewindow[alonepagelen-1]["g_option_config"].datslisrc, data);
                $(alonepagewindow[alonepagelen-1]["g_option_config"].dalistwrap).html(html)
                loading("yes")
                datatablechose()
            }
        })
    }

    //返回按钮控制
    function returnbtn(event){
        var event = event?event:window.event;
        var targetobj = event.srcElement||event.target;
        $(targetobj).parents(".xiongtab").fadeOut(400).remove();
        $(".xiongtab").fadeIn(400)
        alonepagewindow.length = 1;
        alonepagelen = 1
    }

    /*面板删除控制*/
    function panldelete(event){
        var event = event?event:window.event;
        var targetobj = event.srcElement||event.target;
         $(targetobj).parents(".g_show_moble_data").animate({"opacity":0},400,function(){
           $(this).remove()
        })
    }

    /*面板缩小*/
    function panlscale(event){
        var event = event?event:window.event;
        var targetobj = event.srcElement||event.target;
        $(targetobj).parent(".g_show_moble_data-title").siblings().toggle(400)

    }

    /*面板tab改变*/
    function paneltablechange(event,options){
        var event = event?event:window.event;
        var targetobj = event.srcElement||event.target;
        $(targetobj).siblings().removeClass("active");
        $(targetobj).addClass("active")
        baseServer({
            "url":options.url,
            "dataType":"html",
            "successfn":function(data){
                $(options.wrap).html(data)
            }
        })
    }

    /*loading全局函数*/
    function loading(){
        if(arguments.length<1){
            $("body").append("<img src='static/img/sys/public/loading.gif' alt='加载中.....' class='g_g_g_loading'/>")
        }else{
            $(".g_g_g_loading").remove()
        }
    }

    /*全局缓存键值*/
    function callbackkeyname(){
        return Crosspagekeyname[0];
    }

    window.wrokinittabledata = wrokinittabledata;
    window.dataTablereLoad =dataTablereLoad;
    window.dataTableDelete = dataTableDelete;
    window.baseclosewin = baseclosewin;
    window.basesubpage = basesubpage;
    window.basesubpagenumberchrol = basesubpagenumberchrol;
    window.dataTablereShow = dataTablereShow;
    window.dataTableSave = dataTableSave;
    window.dataTableEdit = dataTableEdit;
    window.dataTableAdd = dataTableAdd;
    window.openwinurl = openwinurl;
    window.allchose = allchose;
    window.dataaddtab = dataaddtab;
    window.wrokinittabledatakeynameload = wrokinittabledatakeynameload;
    window.returnbtn = returnbtn;
    window.panldelete = panldelete;
    window.panlscale  = panlscale;
    window.paneltablechange = paneltablechange;
    window.callbackkeyname = callbackkeyname;
    window.baseloadhtml = baseloadhtml;
    window.baseloadtemp = baseloadtemp
 })