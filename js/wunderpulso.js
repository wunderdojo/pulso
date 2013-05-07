/* extend jQuery to allow you to "pulso" chosen DOM elements */

(function( $ ){

  $.fn.wunderPulso = function(account) { 
    
  
/* pulso URL is hardcoded for now but perhaps should be entered via settings in Dashboard? -- would be more flexible that way if it changes */
  var url = "http://data.pulsoviral.com:5984/pulso_" + account + "/_design/front/_list/jsonp/txtsbydate_dos?format=json&amp;callback=?";
    
/* we're applying this function to elements selected by class so we want get one Pulso feed item for each matched element */
    
    var items = [];
    var limit = this.length;  
    var index = '';
    var results = '';
    var elements = $(this);    

    
  
/* get the data based on the account & limit. TO DO: find out if there are other parameters that should be made available as options */


      $.getJSON(url,
			{
			dataType:"script",
			limit: limit,
			reduce: "false",
			descending: "true"
			},

		function(data){ 

		$.each(data.rows, function(index, element) {
			element.service = element.value.pulso_family;
          switch(element.value.pulso_family){
				case "twitter":
				element.ava_image_sm = element.value.profile_image_url;
				element.ava_image_lg =  element.value.profile_image_url.replace("_normal","");
				element.from_name = "@" + element.value.from_user;
				element.txt = element.value.text;
				element.img = (element.value.pulso_pics === undefined) ? element.ava_image_lg : element.value.pulso_pics[0] ;
				break;
					
				case "instagram":
						element.ava_image_sm = element.value.caption.from.profile_picture;
						element.ava_image_lg = element.value.caption.from.profile_picture;
						element.from_name =  element.value.caption.from.full_name;
						element.txt = element.value.caption.text;
						element.img = (element.value.pulso_pics === undefined) ? element.ava_image_lg : element.value.pulso_pics[0] ;
						break;
              
				case "facebook":
						element.ava_image_sm = "http://graph.facebook.com/"+element.value.from.id+"/picture";
						element.ava_image_lg = "http://graph.facebook.com/"+element.value.from.id+"/picture?type=large";
						element.from_name = element.value.from.name;
						element.txt = "";
						if (element.value.name) element.txt+= element.value.name+" ";
						if (element.value.description) element.txt+=element.value.description+" ";
						if (element.value.message) element.txt+=element.value.message+" ";
						if (element.value.story) element.txt+=element.value.story+" ";
						switch(element.value.type){
							case "photo":
								//ya nada
								break;
							case "status":
								//ya nada
								break;
							case "link":
								element.img = (element.value.pulso_pics === undefined) ? element.ava_image_lg : element.value.pulso_pics[0] ;
								delete element.value.pulso_pics;
								break;
							case "video":
								delete element.value.pulso_pics;
								break;
							}
							element.img = (element.value.pulso_pics === undefined) ? element.ava_image_lg : element.value.pulso_pics[0] ;
							break;
				}//end of switch
          
              items[index] = element;
                return items;

				});/* end of $.each */
 
		/* we've got our pulso data, now loop through the dom elements and populate */
          elements.each(function(index){
		  console.log(items[index].from_name);
		    $(this).append("<p class='pulso-service'><i class='icon-"+items[index].service + "'></i></p>");
            $(this).append("<div><p class='pulso-image'><img width='158px' src='" + items[index].img +"'></p>");
			$(this).append("<p class='pulso-client'>" + items[index].from_name + "</p>");
			$(this).append("<p style='float:right;margin-bottom:-5px;'><i class='icon-external-link'></i><div style='clear:both'></div></p>");
			//$(this).append("<p class='pulso-content'>" + items[index].txt + "</p>");
			$(this).append("</div>");
          });
          
          
          
          
          
        });/* end of getJSON call */

    
 

	};/* end of custom function */
})( jQuery );