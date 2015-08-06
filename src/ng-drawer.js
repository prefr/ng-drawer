"use strict";

angular.module('ngDrawer', [])


.provider('ngDrawer', function(){

	var ngDrawerConfig		=	{
									'snappingFunctions' : {}
								}


		this.config = function(custom_config){
			angular.extend(ngDrawerConfig, custom_config)
			return this
		}

		this.addSnappingFunction = function(name, fn){
			ngDrawerConfig.snappingFunctions[name] = fn
			return this
		}

		this.$get = function(){
			return ngDrawerConfig
		}

	
		this.addSnappingFunction('default', 
			function (delta, distance, scrollWidth){
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
 * **Note:** Elements needs positioning, either manual or via ng-drawer-mounting
 *
 * @example
   <example module="ngDrawer">
     <file name="index.html">
         <article ng-drawer="right">
         	Pull me
         </article>
     </file>
   </example>
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

				scope.drawn = false

				var container				= 	$document.find('body').eq(0),
					frame					=	element,
					shuttle					= 	angular.element('<div></div>'),
					last_scroll_pos 		= 	undefined,
					scroll_space			= 	undefined,
					available_space		 	= 	0,
					draw_from				=	attrs.ngDrawer 	== 'left' ? 'left' 	: 'right',
					draw_to					=	draw_from 		== 'left' ? 'right' : 'left'

				transclude(function(clone){
					shuttle.append(clone)
					element.append(shuttle)
				})

				frame.css({
					'overflow-x':					'scroll',
					'overflow-y':					'hidden',
					'display':						'block',
					'direction':					draw_to == 'left'
													?	'ltr'
													:	'rtl'
				})

				shuttle
				.css({
					'position': 					'relative',					
					'width':						'0'
				})
				.css('border-'+draw_from+'-style',	'solid')
				.css('border-'+draw_from+'-color',	'transparent')
					


				function frac2px(p){
					return available_space*p
				}

				function px2frac(p){					
					return 	(p == 0 || available_space == 0)
							?	0
							:	p/available_space
				}

				function getMomentum(delta, distance, DOM){
					return ngDrawer.snappingFunctions['default'](delta, distance, DOM) //DOM -> this
				}


				scope.getDistance = function(){					
					return 	px2frac(
								draw_to == 'left'
								?	frame[0].scrollLeft
								:	frame[0].scrollRight
							)
				}

				function draw(){
					if(!scope.drawn) {

						scope.drawn = true

						var tucked_width	=	frame[0].offsetWidth

						available_space 	=  	container[0].offsetWidth-tucked_width		

						console.log(available_space)				

						frame
						.css('width',						tucked_width)
						.css('padding-'+draw_to,			available_space+'px')

						shuttle
						.css('width',	available_space+tucked_width+'px')						


						element.addClass('drawn')
					}

					$document.find('body').eq(0).one('mouseup touchend', snap)
					
				}


				function snap() {

					var last_scroll_pos 		= 	draw_to == 'left'
													?	frame[0].scrollLeft
													:	frame[0].scrollRight,
						distance				=	undefined,
						check_scrolling 		= 	$interval(updateScrolling, 15, false)

 
					function updateScrolling(){
						var scroll_pos			= 	draw_to == 'left'
													?	frame[0].scrollLeft
													:	frame[0].scrollRight,					
							delta 				= 	(scroll_pos-last_scroll_pos),
							distance			=	distance == undefined ? scope.getDistance() : distance,
							momentum			=	getMomentum(delta, distance)						

						last_scroll_pos = 	draw_to == 'left'
											?	frame[0].scrollLeft
											:	frame[0].scrollRight,

						draw_to == 'left'
						?	frame[0].scrollLeft 	+= momentum
						:	frame[0].scrollRight 	+= momentum


						if([0,1].indexOf(distance) != -1 && delta == 0){
							$interval.cancel(check_scrolling)
						 	if(distance == 0) tuck()
						}
					}

				}

				function tuck(){
				 	scope.drawn = false
				 	element.removeClass('drawn')

				 	frame
				 	.css('padding-'+draw_to,			'')
				 	.css('width',						'')

				 	shuttle
				 	.css('border-'+draw_from+'-width',	'0')
					
				}

				element.on('mousedown touchstart', draw)
			
				scope.$on('$destroy', function(){
					$document.find('body').eq(0).off('mouseup touchend', snap)
				})

			}

		}
	}
])
