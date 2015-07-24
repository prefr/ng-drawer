angular.module('ngDrawer', [])

.directive('ngDrawer',[

	'$document',

	function($document){
		return {			

			transclude:		true,
			scope:			true,
			template:		'<div ng-transclude></div>',

			link: function(scope, element, attrs, ngChest, transclude){

				scope.drawn = false


				var content 	= undefined,
					wrapper		= element.find('div').eq(0).css({'display':	'block'}),
					container 	= $document.find('body').eq(0)


				container.css({'overflow-x':'hidden'})

				function draw(){			

					if(scope.drawn) return null

					var available_space_left 	=  	element.parent()[0].offsetLeft-container[0].offsetLeft,
						tucked_width			=	element[0].offsetWidth	
						tucked_height			=	element[0].offsetHeight	


					element.css({
						'width':		available_space_left+tucked_width+'px',
						'margin-left':	-available_space_left+'px'						
					})

					wrapper.css({
						'padding-left':		available_space_left+'px',
						'padding-right':	available_space_left+tucked_width+'px'
					})

					element
					.addClass('drawn')

					scope.drawn = true
					
				}

				function tuck(){
				 	scope.drawn = false
				 	element.removeClass('drawn')

				 	element.css({
				 		'width':			'',
				 		'margin-left':		''
				 	})

				 	wrapper.css({
				 		'padding-left':		'',
				 		'padding-right':	''
				 	})
					
				}

				element.on('mousedown touchstart', draw)

				$document.find('body').eq(0).on('mouseup touchend', tuck)

				scope.$on('$destroy', function(){
					$document.find('body').eq(0).off('mouseup touchend', tuck)
				})

/*

				
					drawable_body 		= angular.element('<div></div>')

				element.append(drawable_body)							



				var	wrapper_tucked	=	{
											'position':			'absolute',
											'display':			'inline-block',
											'width':			'auto',
											'left':				'100%',
											'right':			'auto',											
											'direction':		'ltr',
											'overflow-x':		'visible',													
											'padding-left':		'0px',
										},
					wrapper_drawn 	= 	{
											'display':			'inline-block',											
											'left':				'0px',
											'right':			'0px',
											'overflow-x':		'scroll',
											'padding-left':		'3em'							
										},
					body_tucked		=	{
											'display':			'inline-block',																						
											'padding-left':		'0px',	
											'padding-right':	'0px',
											'margin-left':		'-3em',
											'max-width':		'3em',
											'overflow':			'hidden'
										}	
					body_drawn		=	{
											'display':			'inline-block',											
											'padding-left':		'100%',
											'padding-right':	'100%',
										}

				element.css(wrapper_tucked)
				drawable_body.css(body_tucked)


				



				element.on('mousedown', draw)

				angular.element('body').on('mouseup', tuck)


				scope.$on('$destroy', function(){
					angular.element('body').off('mouseup', tuck)
				})

			*/
			}

		}
	}
])

