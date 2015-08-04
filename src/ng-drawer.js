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

.directive('ngDrawer',[

	'$document',
	'$interval',
	'ngDrawer', 

	function($document, $interval, ngDrawer){
		return {			

			transclude:		true,
			scope:			true,
			

			link: function(scope, element, attrs, ctrl, transclude){

				scope.drawn = false

				var container				= 	$document.find('body').eq(0),
					frame					=	element,
					shuttle					= 	angular.element('<div></div>'),
					last_scroll_pos 		= 	undefined,
					scroll_space			= 	undefined,
					available_space_left 	= 	0

				transclude(function(clone){
					shuttle.append(clone)
					element.append(shuttle)
				})

				frame.css({
					'overflow-x':			'scroll',
					'overflow-y':			'hidden',
				})

				shuttle.css({
					'position': 			'relative',
					'border-right-style':	'solid',
					'border-right-color':	'transparent',
					'width':				'0'
				})

				function frac2px(p){
					return available_space_left*p
				}

				function px2frac(p){
					return 	(p == 0 || available_space_left == 0)
							?	0
							:	p/available_space_left
				}

				function getMomentum(delta, distance, DOM){
					return ngDrawer.snappingFunctions['default'](delta, distance, DOM) //DOM -> this
				}


				scope.getDistance = function(){
					return px2frac(frame[0].scrollLeft)
				}

				function draw(){

					if(!scope.drawn) {

						scope.drawn = true

						available_space_left 	=  	frame[0].offsetLeft-container[0].offsetLeft
						tucked_width			=	frame[0].offsetWidth

						frame.css({
							'padding-left':			available_space_left+'px',
							'width':				'auto'
						})

						shuttle.css({
							'border-right-width':	available_space_left+tucked_width+'px'//frame[0].clientWidth-element[0].clientWidth+'px'
						})


						element.addClass('drawn')
					}

					$document.find('body').eq(0).one('mouseup touchend', snap)
					
				}


				//todo alles auf parent element verschieben,
				// momentum funktion auf this


				function snap() {

					var last_scroll_pos 		= 	frame[0].scrollLeft,
						distance				=	undefined,
						check_scrolling 		= 	$interval(updateScrolling, 5, false)

 
					function updateScrolling(){
						var scroll_pos			= 	frame[0].scrollLeft,					
							delta 				= 	(scroll_pos-last_scroll_pos),
							distance			=	distance == undefined ? scope.getDistance() : distance,
							momentum			=	getMomentum(delta, distance)

						last_scroll_pos = frame[0].scrollLeft

						frame[0].scrollLeft += momentum

						$document.find('body').eq(0).append('<span> M:'+momentum+' D:'+delta+' NPOS:'+last_scroll_pos+' POS:'+scroll_pos+' </span><br/> ')


						if([0,1].indexOf(distance) != -1 ){
							$interval.cancel(check_scrolling)
						 	if(distance == 0) tuck()
						}
					}

				}

				function tuck(){
				 	scope.drawn = false
				 	element.removeClass('drawn')

				 	frame.css({
				 		'padding-left':		'',
				 		'width':			''
				 	})

				 	shuttle.css({
				 		'border-right-width':		'0'
				 	})
					
				}

				element.on('mousedown touchstart', draw)
			
				scope.$on('$destroy', function(){
					$document.find('body').eq(0).off('mouseup touchend', snap)
				})

			}

		}
	}
])

