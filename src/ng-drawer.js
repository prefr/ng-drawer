"use strict";

angular.module('ngDrawer', [])

/**
 * @ngdoc service
 * @name ngDrawer.service:ngDrawerProvider
 * @description 
 * Use this provider to set default behavior for {@link ngDrawer.service:ngDrawer ngDrawer directives}.
 * 
 */

 
.provider('ngDrawer', function(){

	/**
	* @ngdoc service
	* @name ngDrawer.service:ngDrawer
	* @link ngDrawer.service:ngDrawerProvider
	* @description Object containing all general ngDrawer configuration. There's only snapping functions as of now.
	*/


	var ngDrawer		=	{
								/**
								 * @ngdoc property
								 * @name ngDrawer.service:ngDrawer#snappingFunctions 
								 * @propertyOf ngDrawer.service:ngDrawer
								 * @returns {obj}  List of snapping functions (name => fn). Always contains default snapping function.
								 *                 Add additional snapping functions via {@link ngDrawer.service:ngDrawerProvider#addSnappingFunction ngDrawerProvider#addSnappingFunction}.
								 */
								'snappingFunctions' : {}
							}


	/**
	* @ngdoc method
	* @name ngDrawer.service:ngDrawerProvider#config
	* @methodOf ngDrawer.service:ngDrawerProvider
	* @description 
	* Extends drawer config with provided custom config object. Doesn't do anything yet.
	* @param {obj} custom_config  plain object
	*/
   
	this.config = function(custom_config){
		angular.extend(ngDrawer, custom_config)
		return this
	}

	/**
	* @ngdoc method
	* @name ngDrawer.service:ngDrawerProvider#addSnappingFunction
	* @methodOf ngDrawer.service:ngDrawerProvider
	* @description
	* Adds a snapping function to the drawer config, that may be used with any drawer by referencing its name. 
	* 
	* @param {string} 	name 	The name of the snapping function. Use this when configuring a drawer directive.
	* @param {function} fn 		The snapping function(delta, distance) takes two parameters. delta is the amount of pixels the drawer has been pulled out during the last 15ms.
	*                         	distance is how far the drawer has been pulled out altogether(percentage).
	*                      	 
	*/

	this.addSnappingFunction = function(name, fn){
		ngDrawer.snappingFunctions[name] = fn
		return this
	}

	this.$get = function(){
		return ngDrawer
	}


	this.addSnappingFunction('default', 
		function (delta, distance){
			var dir = 0

			if(Math.abs(delta)>=10){	//swipe
				dir = 	delta > 0
						?	 1
						:	-1

			}else{						//touchend
				dir	=	distance > 0.5
						?	 1
						:	-1
			}
			
			return	(Math.abs(delta)+4)*dir
		}
	)

})

/**
 * @ngdoc directive
 * @name ngDrawer.directive:ngDrawer
 * @scope
 * @restrict EA
 * @element 
 * @function
 *
 * @description
 * 
 * **Note:** Elements needs positioning, either manual or via .ng-drawer-mounting.
 * @param {string|json} ngDrawer If a string is provided it will be interpreted as the side where the drawer is mounted to. 
 *                               If it is anything different from 'left' it will be treated as 'right'. <br/>
 *                               <br/>
 *                               An object passed as json should have some the follwing properties:
 *                               <pre>
 *                               	{
 *                               		drawFrom: 'left' // default is 'right'
 *                               	}
 *                               </pre>
 */

.directive('ngDrawer',[

	'$document',
	'$interval',
	'ngDrawer', 

	function($document, $interval, ngDrawer){
		return {			

			transclude:		true,
			scope:			true,
			restrict:		'EA',
			

			link: function(scope, element, attrs, ctrl, transclude){

				//scope variables:
				scope.drawn 	= false	//not tucked, user is drawing
				scope.snapped 	= false //not tucked, user is not drawing, drawer is fully drawn


				//scope functions:
				//[...]





				//Configuration

				var default_config	=	{
											// The boundry_obj determines how far you draw the drawer
											boundryObj	:	$document.find('body').eq(0),
											// Where the drawer ist mounted: 'left' or 'right'
											drawFrom	:	'right',
										},

					manual_config	=	scope.$eval(attrs.ngDrawer) || attrs.ngDrawer,
					config			=	{}

			
				// ng-drawer = "left"
				if(typeof manual_config == 'string'){
					config.drawFrom =	manual_config == 'left'
										?	'left' 
										:	'right'
				}
				// ng-drawer = "{...}"
				else{
					config = manual_config
				}

				config = angular.extend(default_config, config)
				







				var frame					=	element,
					shuttle					= 	angular.element('<div></div>'),
					content_full_width		=	undefined,
					from_right				=	config.drawFrom == 'right'


				function resetScrollPos(){
					frame[0].scrollLeft = 	from_right
											?	0
											:	frame[0].scrollWidth
				}

				function setup(){

					//wrap the content with an extra layer: the shuttle 
					transclude(scope, function(clone){
						shuttle.append(clone)
						frame.append(shuttle)
					})

					//the frame's overflow must be set to 'scroll', 
					//otherwise the first tap will not initiate a scroll, 
					//even if we add scrolling right after the tap:
					frame.css({
						'overflow-x':					'scroll',
						'overflow-y':					'hidden',
						'display':						'block',
						'position':						'relative',
						'direction':					'ltr'
					})

					//To figure out the width of the content, we have to make the shuttle scrollable for a sec...
					shuttle
					.css('overflow-x', 					'scroll')

					// ... capture the width ...
					content_full_width = shuttle[0].scrollWidth

					//... and make it unscrollable again, among others things:
					shuttle
					.css({
						'position': 					'relative',
						'width':						content_full_width+'px',	
						'overflow-x':					'hidden',
						'overflow-y':					'hidden',
						'direction':					from_right ? 'ltr' : 'rtl'
					})			

					//Whenever the directive is rendered reset the scroll position.
					//If we dont do this it may end up tucked and scrolled (because of scroll momentum), 
					//leaving only the wrong part of the content visible:
					resetScrollPos()

					element.on('mousedown touchstart', draw)
				}

			

				var	available_space		 	= 	0,
					content_full_width		=	undefined,	// the width the content needs ro be fully displayed
					content_tucked_width	=	undefined,	// how much is visble of the content when tucked
					last_scroll_pos 		= 	undefined,
					to_str					=	from_right ? 'left' : 'right'



				function frac2px(p){
					return available_space*p
				}

				function px2frac(p){		
					return 	(p == 0 || available_space == 0)
							?	0
							:	p/available_space
				}

				function getMomentum(delta, distance){
					return ngDrawer.snappingFunctions['default'].apply(element, [delta, distance])
				}


				scope.getDistance = function(){					
					return 	from_right 
							?	  px2frac(frame[0].scrollLeft)
							:	1-px2frac(frame[0].scrollLeft)
							
				}

				function draw(){

					scope.snapped = false
					$document.find('body').eq(0).one('mouseup touchend', snap)

					// dont do anything if the drawer is already drawn:
					if(scope.drawn) return null

					scope.drawn = true
					element.triggerHandler('draw')


					//before we change anything, check how wide the content extends into the view:
					content_tucked_width	=	frame[0].offsetWidth
					//check how mach space is available to pull the drawer out;
					available_space 		=  	config.boundryObj[0].offsetWidth-content_tucked_width



					//extend the frame to the boundry
					frame
					.css('width',					config.boundryObj[0].offsetWidth+'px')

					//extend the shuttle to the boundry
					shuttle
					.css('width',					config.boundryObj[0].offsetWidth+'px')
					//add an invisble  border to that side of the drawer we want to pull it towards,
					//thus scrolling pnly the border out, when drawing.  
					.css('border-'+to_str+'-width',	available_space+'px')
					.css('border-'+to_str+'-style',	'solid')
					.css('border-'+to_str+'-color',	'transparent')

					//make sure that when starting to pull the drawer out, it is fully tucked:
					resetScrollPos()

					element.addClass('drawn')
					
					scope.$digest()
				}


				function snap() {
					//When this function is called the user has stopped touching the display.
					//Still the scroll position can change due to the scroll momentum.

					//store recent scroll pos and start interval: 
					var last_scroll_pos 		= 	frame[0].scrollLeft,	
						distance				=	scope.getDistance(),	//how far has the drawer been pulled out? (0-100%)
						check_scrolling 		= 	$interval(updateScrolling, 15, false)

 
					//interval function:
					function updateScrolling(){

						//At the first call of this function, scroll_pos can be different from last_scroll_pos:
						//delta stores how far the scroll momentum alone carried the shuttle in the last 15 milliseconds.

						var delta 				= 	frame[0].scrollLeft-last_scroll_pos,
													//positive delta_normalized: pulled out 
													//negative delta_normalized: pushed in
							delta_normalized	=	from_right ? delta : -delta,	
							distance			= 	scope.getDistance(),
							momentum_normalized	=	getMomentum(delta_normalized, distance),
							momentum			= 	from_right ? momentum_normalized : -momentum_normalized

						//momentum stores how far we should scroll in the next 15 milliseconds in addition to the 'natural' browser scroll momentum.
						//the 'natural' browser scroll momentum will diminish quickly, but will show up in the first few calls of this function,
						//thus delta will be different from last turn's momentum 

						last_scroll_pos 		= 	frame[0].scrollLeft
						frame[0].scrollLeft 	+= 	momentum

						//$document.find('body').append('<div>'+frame[0].scrollLeft+','+delta+','+distance+'</div>')


						//keep scrolling until the drawer is fully pulled out or fully tucked:
						if(
								[0,1].indexOf(distance) != -1	//hit on of the boundries
							&& 	delta == 0						//has not scrolled for 15 millisconds, 
																//thus 'natural' browser momentum should also be 0
						){
							$interval.cancel(check_scrolling)
							distance == 0 
							?	tuck()
							:	(scope.snapped = true && element.triggerHandler('snap'))
						}
					}

				}

				function tuck(){
					scope.drawn = false
					element.removeClass('drawn')
					element.triggerHandler('tuck')

					//return drawer to its original state:
					frame
					.css('width',						'')

					shuttle
					.css('width',						content_full_width+'px')
					.css('border-'+to_str+'-width',		'0px')
					.css('border-'+to_str+'-style',		'none')
					.css('border-'+to_str+'-color',		'transparent')

					resetScrollPos()					
				}


				setup()

			},

			controller:function(){}

		}
	}
])



/**
 * @ngdoc directive
 * @name ngDrawer.directive:ngDraw
 * @restrict A
 * @element 
 * @requires ngDrawer.directive:ngDrawer
 *
 * @description
 *
 * This directives allows you to execute custom behavior, when an ngDrawer is started to be drawn.
 *
 * @param {expression}	ngDraw  Execute <emph>expression</emph> when drawer is drawn.
 */


.directive('ngDraw',[

	function(){
		return {			
			restrict:		'A',
			require:		'ngDrawer',
			

			link: function(scope, element, attrs){
				element.on('draw', function(event){
					scope.$eval(attrs.ngDraw, {'$event' : event})
				})
			}

		}
	}
])



/**
 * @ngdoc directive
 * @name ngDrawer.directive:ngSnap
 * @restrict A
 * @element 
 * @requires ngDrawer.directive:ngDrawer
 *
 * @description
 *
 * This directives allows you to execute custom behavior, when an ngDrawer is snapped, i.e. fully drawn.
 *
 * @param {expression}	ngSnap  Execute <emph>expression</emph> when drawer is fully drawn and snapped.
 *
 */


.directive('ngSnap',[

	function(){
		return {			
			restrict:		'A',
			require:		'ngDrawer',
			

			link: function(scope, element, attrs){
					element.on('snap', function(event){
						scope.$eval(attrs.ngSnap, {'$event' : event})
					})
			}

		}
	}
])



/**
 * @ngdoc directive
 * @name ngDrawer.directive:ngTuck
 * @restrict A
 * @element 
 * @requires ngDrawer.directive:ngDrawer
 *
 * @description
 *
 * This directives allows you to execute custom behavior, when an ngDrawer is tucked.
 *
 * @param {expression}	ngTuck  Execute <emph>expression</emph> when drawer is tucked.
 */


.directive('ngTuck',[

	function(){
		return {			
			restrict:		'A',
			require:		'ngDrawer',
			

			link: function(scope, element, attrs){
					element.on('tuck', function(event){
						scope.$eval(attrs.ngTuck, {'$event' : event})
					})
			}

		}
	}
])



