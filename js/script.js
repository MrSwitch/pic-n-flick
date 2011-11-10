/**
 * @author Andrew Dodson
 * @since Nov 2011
 */
(function(){

	
	/**
	 * The storage Model, myCollection
	 */
	/**
	 * Operations performed on an item of the search result
	 */
	window.Picture = Backbone.Model.extend({

		defaults: function(){
			return {
				tick:  false,
				url:''
			};
	    },

		toggle : function(){
			this.save({tick: !this.get("tick")});
		}
	});
	
	
	/**
	 * Operations performed on the list of search items
	 */
	window.PictureList = Backbone.Collection.extend({
		
		model : Picture,
		
		localStorage : new Store("pic.me")

	});
	


	
	/**
	 * View Model for Picture Images
	 */
	window.AppView = Backbone.View.extend({
	
		el: $("body"),
		
		tagname : 'li',

		// Cache the template function for a single item.
		template: _.template($('#searchresults').html()),

		// The DOM events specific to an item.
		events: {
			"click img" : "preview",
			"click article" : "hidepreview",
			"click ul.results li span.action" : "toggleTick",
			"click footer ul li span.action" : "remove",
			"submit form"	: "searchOnSubmit",
			"scroll"		: "bodyScroll"
		},

		// The PictureView listens for changes to its model, re-rendering.
		initialize: function() {
			this.input    = this.$("form input");
			this.page 	  = 1; // pagination
			this.query    = this.input.val(); //  stores the last query

			 _.bindAll(this, 'render','appendItem', 'toggleTick'); // every function that uses 'this' as the current object should be in here

			// Create our personal collection
			this.collection = new PictureList();
			this.collection.bind('add',   this.render, this);
			this.collection.bind('remove',   this.render, this);
			
			this.collection.bind('reset', this.render, this); 
			this.collection.fetch();
		},
		
		// AddMyOne
		render: function(){
			log("Render all");
			var appendItem = this.appendItem;
			$('footer ul').empty();
			_(this.collection.models).each(function(item){ // in case collection is not empty
				appendItem(item);
			}, this);
			return this;
		},

		hidepreview : function(t){
			log("remove previewing");
			$('article').removeClass("show").empty();
		},

		preview : function(t){
			if($('article img').length===0){
				log("show previewing");
				var $li = ($(t.target).data('id')?$(t.target):$(t.target).parent()),
					data = $li.data();
				$('article').addClass("show").html(_.template($('#preview').html(),data)).data(data);
			}
		},
		
		remove : function(t){
			var $li = ($(t.target).data('id')?$(t.target):$(t.target).parent()),
				data = $li.data();

			if(this.collection.get(data.id)){
				this.collection.get(data.id).destroy();
			}
		},

		appendItem : function(pic){
			$(this.template(pic.toJSON())).data(pic.toJSON()).appendTo('footer ul');
		},

		// AddMyOne
		removeMyOne : function(){},

		// 
		toggleTick : function(t){

			var $li = ($(t.target).data('id')?$(t.target):$(t.target).parent()),
				data = $li.data();

			if(!this.collection.get(data.id)){
				$li.addClass("tick");
				log('collection.create');
				this.collection.create(data);
			}
			else{
				$li.removeClass("tick");
				log('collection.get.destroy');
				this.collection.get(data.id).destroy();
			}
		},

		// Body scroll
		// We might need to get more results
		bodyScroll : function(e) {
			// HIT THE BOTTOM
			this.searchOnSubmit();
		},
		
	
		// If you hit return in the main input field, and there is text to save,
		// create new **Todo** model persisting it to *localStorage*.
		searchOnSubmit : function(e) {

			$('body').addClass('results');
			
			if(this.input.val().length>1){
				$("body > ul").empty();
				this.query = this.input.val();
				this.page = 1;
			}
			
			// abandon?
			if(this.query.length === 0){
				return;
			}
		
			var qs = {
				api_key : '1aea6bd8c6fe81f5c688ed7195691448',
				method : 'flickr.photos.search',
				text : this.query,
				format : 'json',
				page : this.page || 1,
				per_page : 75,
			};
			
			var view = this;

			log("Loading " + $.param(qs));
			$.getJSON('http://api.flickr.com/services/rest/?jsoncallback=?', qs, function(r){
				_.each(r.photos.photo, function(o){
					o.tick = false;
					$(view.template(o)).data(o).appendTo("body > ul");
				});
			});
			
			this.page++;

			this.input.val('');
			return false;
		}
	
		
	});


	// Finally, we kick things off by creating the **App**.
	window.App = new AppView;
	

	// Hack, windows scroll isn't being fired in backbone
	// Lets trigger it
	$(window).bind('scroll', function(e){
		if(e.target&&(document.body.scrollHeight===(e.target.body.scrollTop+window.innerHeight))){
			$('body').trigger("scroll");
		}
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

})();