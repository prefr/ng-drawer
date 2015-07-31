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
			

			link: function(scope, element, attrs, ngChest, transclude){

				scope.drawn = false

				var container				= 	$document.find('body').eq(0),
					content					= 	angular.element('<div></div>'),
					last_scroll_pos 		= 	undefined,
					scroll_space			= 	undefined,
					available_space_left 	= 	0

				transclude(function(clone){
					content.append(clone)
					element.append(content)
				})

				element.parent().css({
					'overflow-x':		'scroll',
					'overflow-y':		'hidden',
				})


				content.css({'position': 'relative'})


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
					return px2frac(element.parent()[0].scrollLeft)
				}

				function draw(){

					if(!scope.drawn) {

						scope.drawn = true

						available_space_left 	=  	element.parent()[0].offsetLeft-container[0].offsetLeft

						element.parent().css({
							'padding-left':		available_space_left+'px'
						})

						content.css({
							'margin-right':		element.parent()[0].clientWidth-element[0].clientWidth+'px'
						})


						element.addClass('drawn')
					}

					$document.find('body').eq(0).one('mouseup touchend', snap)
					
				}


				function snap() {

					var last_scroll_pos 		= 	element.parent()[0].scrollLeft,
						distance				=	undefined,
						check_scrolling 		= 	$interval(updateScrolling, 5, false)

 
					function updateScrolling(){
						var scroll_pos			= 	element.parent()[0].scrollLeft,					
							delta 				= 	(scroll_pos-last_scroll_pos),
							distance			=	distance == undefined ? scope.getDistance() : distance,
							momentum			=	getMomentum(delta, distance)

						last_scroll_pos = element.parent()[0].scrollLeft

						element.parent()[0].scrollLeft += momentum

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

				 	element.parent().css({
				 		'padding-left':		''
				 	})

				 	content.css({
				 		'margin-right':	''
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

