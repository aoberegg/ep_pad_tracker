
exports.documentReady = function(hooks, context, cb){

		var socket, loc = document.location, port = loc.port == "" ? (loc.protocol == "https:" ? 443
				: 80)
				: loc.port, url = loc.protocol + "//"
				+ loc.hostname + ":" + port + "/", pathComponents = location.pathname
				.split('/'),
		// Strip admin/plugins
		baseURL = pathComponents.slice(0,
				pathComponents.length - 2).join('/')
				+ '/', resource = baseURL.substring(1)
				+ "socket.io";

		// connect
		socket = io.connect(url, {resource : resource}).of("/pluginfw/admin/padtracker");
	var trackedPads = [];
	var padList = {
	  list: [],
	  sorted : false,
	  init: function()
	  {
	    this.list = [];
	    return this;
	  },
	  /**
	   * Returns all pads in alphabetical order as array.
	   */
	  getPads: function(){
	    if(!this.sorted){
	      this.list=this.list.sort();
	      this.sorted=true;
	    }
	    return this.list;
	  },
	  getPad: function(name){
	  	if(this.list.indexOf(name) == -1){
	  		return 0;
	  	}
	    return 1;
	  },
	  addPad: function(name)
	  {
	    if(this.list.indexOf(name) == -1){
	      this.list.push(name);
	      this.sorted=false;
	    }
	  },
	  removePad: function(name)
	  {
	    var index=this.list.indexOf(name);
	    if(index>-1){
	      this.list.splice(index,1);
	      this.sorted=false;
	    }
	  }
	};
	var search = function (pad_name) { 
		socket.emit("search", pad_name);
	};
	var searchTrackedPads = function(pad_name){
		socket.emit('search-tracked-pads', pad_name);
	};
	var searchAll = function(){
		socket.emit("search-all");
	};
	var saveTrackedPads = function(){
		socket.emit('save-track-pads', padList);
	}
	var reloadTrackedPads = function(){
		socket.emit('reload-tracked-pads');
	}
	var converter = function(UNIX_timestamp){
	 var a = new Date(UNIX_timestamp);
 	 var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
     var year = a.getFullYear();
     var month = months[a.getMonth()];
     var date = a.getDate();
     var hour = (( a.getHours() < 10) ? "0" : "") +  a.getHours();
     var min = ((a.getMinutes() < 10) ? "0" : "") + a.getMinutes();
     var sec = ((a.getSeconds() < 10) ? "0" : "") + a.getSeconds();
     var time = date+'. '+month+' '+year+' '+hour+':'+min+':'+sec ;
     return time;
   }
   var getTime = function(a){
 	 var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
     var year = a.getFullYear();
     var month = months[a.getMonth()];
     var date = a.getDate();
     var hour = (( a.getHours() < 10) ? "0" : "") +  a.getHours();
     var min = ((a.getMinutes() < 10) ? "0" : "") + a.getMinutes();
     var sec = ((a.getSeconds() < 10) ? "0" : "") + a.getSeconds();
     var time = date+'. '+month+' '+year+' '+hour+':'+min+':'+sec ;
     return time;
   }
   var sortByDateDesc = function(a,b){
		return b.date - a.date;
   }
   var sortByDateAsc = function(a,b){
		return a.date - b.date;
   }
   var sortByNameAsc = function(a,b){
		 var nameA=a.name.toLowerCase(), nameB=b.name.toLowerCase()
		 if (nameA < nameB) //sort string ascending
		  return -1
		 if (nameA > nameB)
		  return 1
		 return 0 //default return value (no sorting)
   }
   var sortByNameDesc = function(a,b){
   	     var nameA=a.name.toLowerCase(), nameB=b.name.toLowerCase()
		 if (nameA < nameB) //sort string desc
		  return 1
		 if (nameA > nameB)
		  return -1
		 return 0 //default return value (no sorting)
   }
   var sortByRevAsc = function(a,b){
   		return a.rev - b.rev;
   }
   var sortByRevDesc = function(a,b){
   		return b.rev - a.rev;
   }
   var showTrackedPads = function(pads, sortFunc){
		pads.sort(sortFunc);
		var widget = $('.tracked-results-div');
		var resultList =widget.find('.tracked-results');
		resultList.html("");
		for(i = 0; i < pads.length; i++){
			var row = widget.find('.template tr').clone();
			row.find(".name").html('<a href="../p/'+pads[i].name+'" class="padLink"">'+pads[i].name+'</a>');
			row.find(".revision").html(pads[i].rev);
			row.find(".lastEdited").html(converter(pads[i].date));
			row.find(".untrackButton").bind('click',function(e){
				var row = $(e.target).closest("tr")
        		var padName = row.find('.padLink').html();
				socket.emit("untrack-pad", padName);
			});
			resultList.append(row);
		}
		
	}
	
	function handlers(){

		$("#search-tracked-pad-name").unbind('keyup').bind('keyup', function(e){
			e.preventDefault();
			searchTrackedPads($("#search-tracked-pad-name").val());
		});
		$('#trackPadButton').unbind('click').bind('click', function(e){
			e.preventDefault(); 
			$("#trackPadBox").css('display', 'block');
			$("#fade").css('display', 'block');
			searchAll();
		});
		$('#saveButton').unbind('click').bind('click', function(e){
			e.preventDefault();
			saveTrackedPads();
			$("#trackPadBox").css('display', 'none');
			$("#fade").css('display', 'none');
		});
	    $('#cancelButton').unbind('click').bind('click', function(e){
			$("#trackPadBox").css('display', 'none');
			$("#fade").css('display', 'none');
		});
		
		$("#search-pad-name").unbind('keyup').keyup(function () {
         	search($("#search-pad-name").val());
    	});
    	$('.sort.up').unbind('click').click(function(e) {
    		var row = $(e.target).closest("th");
    		var re = /<a.+/
    		var text = row.html().toString().replace(re, '');
			if(text.toLowerCase() == 'pad name'){
      			showTrackedPads(trackedPads, sortByNameAsc)
      		}else if(text.toLowerCase() == 'revision'){
      			showTrackedPads(trackedPads, sortByRevAsc);
      		}else{
      			showTrackedPads(trackedPads, sortByDateAsc);
      		}
	    })
    	$('.sort.down').unbind('click').click(function(e) {
      		var row = $(e.target).closest("th");
    		var re = /<a.+/
    		var text = row.html().toString().replace(re, '');
      		if(text.toLowerCase() == 'pad name'){
      			showTrackedPads(trackedPads, sortByNameDesc);
      		}else if(text.toLowerCase() == 'revision'){
      			showTrackedPads(trackedPads, sortByRevDesc);
      		}else{
      			showTrackedPads(trackedPads, sortByDateDesc);
      		}

    	})


			
	}
	handlers();
	reloadTrackedPads();

	socket.on('search-result', function (pads) {
		if(pads == null){
			padList.init();
			resultList.html("");
			return;
		}
		var widget = $(".result-div");
		padList.init();
		var resultList=widget.find('.results');
		resultList.html("");
		pads.forEach(function(pad_name) {
		      var row = widget.find(".template tr").clone();
		      row.find(".name").html('<a href="../p/'+pad_name+'">'+pad_name+'</a>');
		      row.find(".padCheckbox").bind('click', function(event) {
					if(padList.getPad(pad_name)){
						padList.removePad(pad_name);
					}else
						padList.addPad(pad_name);					
			  });
		      resultList.append(row);
		});
	});
	socket.on('tracked-search-result', function(pads){
		trackedPads = pads;
		showTrackedPads(pads, sortByDateDesc);
	});
	socket.on('pad-removed', function(){
		reloadTrackedPads();
	});
	socket.on('pads-saved', function(){
		reloadTrackedPads();
	});
};


