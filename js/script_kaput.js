/**
 * @author Andrew Dodson
 * @since Nov 2011
 */

$(function(){

	/**
	 * Storage
	 */
	Backbone.sync = function(method, model, options){ 
		log(model);
		options.success();
	}

	/**
	 * Operations performed on an item of the search result
	 */
	window.Picture = Backbone.Model.extend({

		defaults: function(){
			return {
				tick:  false,
				mine:  false
			};
	    },

		toggle : function(){
			this.save({tick: !this.get("tick")});
		}
	});

	/**
	 * Operations performed on an item of the search result
	 */
	window.myPicture = Backbone.Model.extend({

		defaults: function(){
			return {
				tick:  false
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
		
		model : Picture	

	});
	
	/**
	 * Operations performed on the list of search items
	 */
	window.myPictureList = Backbone.Collection.extend({
		
		model : myPicture	

	});


	/**
	 * View Model for Picture Images
	 */
	window.PictureView = Backbone.View.extend({
	
	
		//... is a list tag.
		tagName:  "li",
		
		// Cache the template function for a single item.
		template: _.template($('#searchresults').html()),

		// The DOM events specific to an item.
		events: {
			"click img"              : "toggleTick"
		},
		
		// The PictureView listens for changes to its model, re-rendering.
		initialize: function() {
			this.model.bind('change', this.render, this);
			this.model.bind('destroy', this.remove, this);
			this.model.bind('remove', this.remove, this);
		},
		
		// Re-render the contents of the todo item.
		render: function() {
			$(this.el).html(this.template(this.model.toJSON()));
			return this;
		},
		// Toggle the `"done"` state of the model.
		toggleTick: function(){
			this.model.toggle();
		},

		// Remove this view from the DOM.
		remove: function(){
			log("remove", this.el);
			$(this.el).remove();
		},
		
		// Remove the item, destroy the model.
		clear: function() {
			this.model.destroy();
		}
	});

	/**
	 * View Model for Picture Images
	 */
	window.myPictureView = Backbone.View.extend({

		//... is a list tag.
		tagName:  "li",
		
		// Cache the template function for a single item.
		template: _.template($('#searchresults').html()),

		// The DOM events specific to an item.
		events: {
			"click img"              : "toggleTick"
		},
		
		// The PictureView listens for changes to its model, re-rendering.
		initialize: function() {
			this.model.bind('change', this.render, this);
			this.model.bind('destroy', this.remove, this);
			this.model.bind('remove', this.remove, this);
		},
		
		// Re-render the contents of the todo item.
		render: function() {
			$(this.el).html(this.template(this.model.toJSON()));
//			this.setText();
			return this;
		},
		
		// Toggle the `"done"` state of the model.
		toggleTick: function(){
			this.model.toggle();
		},

		// Remove this view from the DOM.
		remove: function(){
			log("remove", this.el);
			$(this.el).remove();
		},
		
		// Remove the item, destroy the model.
		clear: function() {
			this.model.destroy();
		}
	});
	
	// The Application
	// ---------------
	
	// Our overall **AppView** is the top-level piece of UI.
	window.AppView = Backbone.View.extend({
	
		// Instead of generating a new element, bind to the existing skeleton of
		// the App already present in the HTML.
		el: $("body"),

		// Delegated events for creating new items, and clearing completed ones.
		events: {
			"submit form":  "searchOnSubmit",
			"scroll":  "bodyScroll"
		},
		
		// At initialization we bind to the relevant events on the `Todos`
		// collection, when items are added or changed. Kick things off by
		// loading any preexisting todos that might be saved in *localStorage*.
		initialize: function() {
			this.input    = this.$("form input");
			this.page 	  = 1; // pagination
			this.query    = this.input.val(); //  stores the last query


			 _.bindAll(this, 'render', 'addOne', 'toggleResultList', 'removeMyOne'); // every function that uses 'this' as the current object should be in here


			// Create our global collection of **Picture**.
			this.searchCollection = new PictureList();
			this.searchCollection.bind('add',   this.addOne, this);
			this.searchCollection.bind('change', this.toggleResultList, this);

			// Create our personal collection
			this.myCollection = new myPictureList();
			this.myCollection.bind('add',   this.addMyOne, this);
			this.myCollection.bind('remove',   this.removeMyOne, this);
		},
		
		// Re-rendering the App just means refreshing the statistics -- the rest
		// of the app doesn't change.
		render: function() {
		},
		
		// Add a single todo item to the list by creating a view for it, and
		// appending its element to the `<ul>`.
		addOne: function(todo) {
			var view = new PictureView({model: todo});
			this.$("> ul").append(view.render().el);
		},

		addMyOne: function(todo) {
			var view = new myPictureView({model: todo});
			this.$("footer ul").append(view.render().el);
		},

		removeMyOne: function(todo) {
			log("remove");
		},

		toggleResultList: function(pic){

			if(pic.get("tick")){
				// add a new element to our saved items
				this.myCollection.create(pic);
			}
			else{
				this.myCollection.remove([pic]);
			}
		},
		
		// Add all items in the **Todos** collection at once.
		addAll: function() {
			this.searchCollection.each(this.addOne);
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
				per_page : 5,
			};
			
			var searchCollection = this.searchCollection;

			log("Loading " + $.param(qs));
			$.getJSON('http://api.flickr.com/services/rest/?jsoncallback=?', qs, function(r){
				_.each(r.photos.photo, function(r){
					searchCollection.create( r );
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
});



/**
1. Can't bind events to the Window
2. Views cannot be reused, whilst they can be bound to several different collection and models, view events are trigger on all instances should anyone of those models change.... and not just the instance which i expected.

 */