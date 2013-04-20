var path = require('path');
var eejs = require('ep_etherpad-lite/node/eejs');
var padManager = require('ep_etherpad-lite/node/db/PadManager');
var secManager = require('ep_etherpad-lite/node/db/SecurityManager');
var db = require('ep_etherpad-lite/node/db/DB').db;
var ERR = require("ep_etherpad-lite/node_modules/async-stacktrace");
var groupManager = require('ep_etherpad-lite/node/db/GroupManager');


exports.expressCreateServer = function(hook_name, args, cb) {


	args.app.get('/admin/padtracker', function(req, res) {

		var render_args = {
			errors : []
		};
		res.send(eejs.require("ep_pad_tracker/templates/admin/pad_tracker.ejs",
				render_args));
	});
};

exports.eejsBlock_adminMenu = function(hook_name, args, cb) {
	  var hasAdminUrlPrefix = (args.content.indexOf('<a href="admin/') != -1)
	    , hasOneDirDown = (args.content.indexOf('<a href="../') != -1)
	    , hasTwoDirDown = (args.content.indexOf('<a href="../../') != -1)
	    , urlPrefix = hasAdminUrlPrefix ? "admin/" : hasTwoDirDown ? "../../" : hasOneDirDown ? "../" : ""
	  ;

	  args.content = args.content + '<li><a href="'+ urlPrefix +'padtracker">Pad Tracker</a> </li>';
	  return cb();
};


exports.socketio = function (hook_name, args, cb) { 
	io = args.io.of("/pluginfw/admin/padtracker");
	  
	  io.on('connection', function (socket) {	  	 
	    if (!socket.handshake.session.user || !socket.handshake.session.user.is_admin) return;
	    	socket.on("search-all", function(){
	    		    
	    		padManager.listAllPads(function(t, pads){	    			
					var untrackedPads = [];
	    		    pads.padIDs.forEach(function(pad){
	    		    	db.get('trackPad:'+pad, function(err,value){
							if(value == "" || value == null)
	    		    			untrackedPads.push(pad);
	    		    	});
	    		    });
	    			socket.emit("search-result", untrackedPads);
	    			
	    		});
	    	});
	    	
	    	socket.on("search", function (pad_name) {
	    		db.findKeys('pad:*'+pad_name+'*', '*:*:*',function(err, value){
	    			if(err)
    				{
				      socket.emit('search-result', null);
				    }else
				    {
				    	if(value == null)
				    		socket.emit('search-result', null);
				    	var untrackedPads = [];
						value.forEach(function(pada){
						   var re = /pad:/;
						   var pad =  pada.toString().replace(re, '');
				           db.get('trackPad:'+pad, function(err,value){
							if(value == "" || value == null)
	    		    			untrackedPads.push(pad);
	    		    		});
				        });
				      socket.emit('search-result', untrackedPads);
				    }  	
	    		});
	    	});
	    	socket.on("search-tracked-pads", function(pad_name){
	    		db.findKeys('trackPad:*'+pad_name+'*', '*:*:*',function(err, value){
	    			if(err)
    				{
				      socket.emit('tracked-search-result', null);
				      return;
				    }else
				    {
				    	if(value == null){
				    		socket.emit("tracked-search-result", null);
				    		return;
				    	}
				    	var trackedPads = [];
						value.forEach(function(pada){
	    		    		var re = /trackPad:/;
						   	var pad =  pada.toString().replace(re, '');
							padObject = {};
							if(pad == ''){
								return true;
							}
    		    			padManager.getPad(pad, function(err, padObj){
    		    				padObject.name = pad;
    		    				padObject.rev = padObj.getHeadRevisionNumber();
    		    				padObj.getLastEdit(function(err, value){
    		    					padObject.date = value;
    		    				});    		    				
    		    			});
    		    			trackedPads.push(padObject);
	    		    	});
	    		    	console.log(trackedPads);
	    				socket.emit("tracked-search-result", trackedPads);
	    			} 		
	    		});
	    	});
	    	
	    	socket.on("save-track-pads",function(padList){
	    		padList.list.forEach(function(pad_name){
	    			db.set("trackPad:"+pad_name, {pad_name: pad_name},function(){
	    				
	    			});	
	    		});
	    		socket.emit("pads-saved");
	    		
	    	});
	    	
	    	socket.on("reload-tracked-pads", function(){
	    		// get all normal pads
	    		padManager.listAllPads(function(t, pads){	    			
					var trackedPads = [];
	    		    pads.padIDs.forEach(function(pad){
	    		    	db.get('trackPad:'+pad, function(err,value){
							if(value != "" && value != null){
								padObject = {};
	    		    			padManager.getPad(value.pad_name, function(err, padObj){
	    		    				padObject.name = value.pad_name;
	    		    				padObject.rev = padObj.getHeadRevisionNumber();
	    		    				padObj.getLastEdit(function(err, value){
	    		    					padObject.date = value;
	    		    				});    		    				
	    		    			});
	    		    			trackedPads.push(padObject);
	    		    		}
	    		    	});
	    		    });
	    			socket.emit("tracked-search-result", trackedPads);
	    		});
	    	});

	    	socket.on("untrack-pad", function(padName){
	    		db.remove('trackPad:'+padName, null, function(){
	    			socket.emit("pad-removed");
	    		});
	    	});
	  }); 
};
