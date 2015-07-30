$(function(){
    $(".nav-list").on("click","span",function(){
        var targetcanth = $(this).find("i")
        if(targetcanth.hasClass("glyphicon-plus")){
            targetcanth.removeClass("glyphicon-plus")
            targetcanth.addClass(" glyphicon-minus")
        }else{
            targetcanth.removeClass("glyphicon-minus")
            targetcanth.addClass("glyphicon-plus")
        }
        $(this).siblings("ul").toggle(400)
    })

    $(".slide_index_left").on("click",function(){
        var content = $(".index_all_content")
        var navcanth = $(".index_left_nav");
        if(navcanth.hasClass("hide_slide")){
            navcanth.animate({"left":"0px"},50,function(){
                navcanth.removeClass("hide_slide");
            })
            navcanth.css("display","block")
            content.addClass("slide_content_hide")
        }else{
            navcanth.animate({"left":"-184px"},50,function(){
                navcanth.addClass("hide_slide")
                navcanth.css("display","none")
                content.removeClass("slide_content_hide")
            })
        }
    })

    $(".index_user_contorl").on("click",function(){
            $(".user_ontrol").toggle(400)
    })
})