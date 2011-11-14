/**
 * @author Andrew Dodson
 * @since Nov 2011
 */
 
function save(s,a){
	// save the model everytime it changes
	if(a){
		localStorage.setItem(s, ko.toJSON(a));
	}
	var r = localStorage.getItem(s);
	return r ? JSON.parse(r) : false;
};

/**
 * The image model
 */
var image = function(o){
	this.farm = o.farm;
	this.id = o.id;
	this.server = o.server;
	this.secret = o.secret;
	this.showpreview = function(e){
		model.preview(this);
	};
	this.action = function(e){
		if(model.favourites.indexOf(this)>=0){
			model.favourites.remove(this);
		}
		else{
			model.favourites.push(this);
		}

		save('favourites', model.favourites);
	};
};


/**
 * The App model
 */
var model = {

	searchresults : ko.observableArray([]),

	favourites : ko.observableArray(),

	page : 1,

	query : ko.observable(false),
	
	preview : ko.observable(false),
	
	hidepreview : function(){
		this.preview(false);
	},
	
	submit : function(el){
		$("input",el).val();
		this.search($("input",el).val());
		return false;
	},

	// Search the flickr API
	search : function(query){

		log("QUERY", query||this.query());

		if((query&&(typeof(query)==='string')&&(query!==this.query()))||query===""){
			this.query(query);
			this.searchresults.remove(function(){return true;});
			this.page = 1;
		}

		// abandon?
		if(!this.query() || this.query().length === 0){
			this.searchresults.remove(function(){return true;});
			return;
		}

		var qs = {
			api_key : '1aea6bd8c6fe81f5c688ed7195691448',
			method : 'flickr.photos.search',
			text : this.query(),
			format : 'json',
			page : this.page || 1,
			per_page : 100,
		};

		var view = this;

		$.getJSON('http://api.flickr.com/services/rest/?jsoncallback=?', qs, function(r){
			$.each(r.photos.photo, function(i,o){
				o.tick = false;
				model.searchresults.push(new image(o));
			});
		});
		
		this.page++;
		return false;
	}	
};

ko.applyBindings(model);

// restore state

$.each(save('favourites')||[],function(i,o){
	model.favourites.push(new image(o));
});


function log() {
	if (typeof(console) === 'undefined'||typeof(console.log) === 'undefined') return;
	if (typeof console.log === 'function') {
		console.log.apply(console, arguments); // FF, CHROME, Webkit
	}
	else{
		console.log(Array.prototype.slice.call(arguments)); // IE
	}
}


// Hack, windows scroll isn't being fired in backbone
// Lets trigger it
$(window).bind('scroll', function(e){
	if(e.target&&(document.body.scrollHeight===(e.target.body.scrollTop+window.innerHeight))){
		$('body').trigger("scroll");
	}
});
