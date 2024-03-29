/* 
 * CraftMap
 * author: Marcin Dziewulski
 * web: http://www.jscraft.net
 * email: info@jscraft.net
 * license: http://www.jscraft.net/licensing.html
 */

(function($){
    $.fn.craftmap = function(options) {
		var D = {
			cookies: false,
			fullscreen: false,
			container: {
				name: 'imgContent'
			},
			image: {
				width: 1475,
				height: 1200,
				name: 'imgMap'
			},
			map: {
				position: 'center'
			},
			marker: {
				name: 'marker',
				center: true,
				popup: true,
				popup_name: 'popup',
				onClick: function(marker, popup){},
				onClose: function(marker, popup){}
			},
			controls: {
				init: true,
				name: 'controls',
				onClick: function(marker){}
			},
			preloader: {
				init: true,
				name: 'preloader',
				onLoad: function(img, dimensions){}
			},
			mouse:{
				scroll: true,
				},
			/* wunderdojo edit */
			popups:{
				target:false
				},
			footer:{
				height:0
				},
			ratio: '1'
		}; // default settings
		
		var S = $.extend(true, D, options); 
		//console.log(S);
        return this.each(function(){
	
			var M = $(this),
				IMG = M.find('.'+S.image.name),
				P = {
					init: function(){
						
						if (S.fullscreen) {
							this.fullscreen.init();
							this.fullscreen.resize();
						}
						//console.log(M, IMG);
						this._container.init();
						this._globals.init();
						if (S.preloader.init) this.preloader.init();
						this.map.init();
						this.marker.init();
						if (S.controls.init) this.controls.init();
					},
					sizer: function(){
					//wunderdojo change image size here based on window size
							var width = S.image.width;
							var	height = S.image.height;
							var imaxheight = M.height();
								S.ratio = imaxheight / height;
								height = height * S.ratio;
								width = width * S.ratio
							//console.log(width, height);
							return({'width':width, 'height': height});
					},
					_container: {
						init: function(){
							P._container.css();
							P._container.wrap();
						},
						css: function(){
							var	max = {
									width: '100%',
									height: '100%'
								};
							IMG.css(max);
			
							var css = {
								position: 'relative', 
								overflow: 'hidden', 
								//cursor: 'move'
							}
							M.css(css);
						},
						//now we have a div set to the size of the window with overflow hidden
						wrap: function(){
							var specs = P.sizer();
							//console.log(specs);
							var css = {
								zIndex: '1', 
								position: 'absolute',
								//change this to scaled image width and height - height should match wundermap height
								//width will probably be wider
								width: specs.width,
								height: specs.height
							}
							//console.log(M);
							M.wrapInner($('<div />').addClass(S.container.name).css(css));
							//console.log(S.container.name);
						}
					},
					_globals: {
						init: function(){
							C = M.find('.'+S.container.name),
							MARKER = C.find('.'+S.marker.name),
							md = false, mx = 0, my = 0, ex = 0, ey = 0, delta = 0, mv = [], interval = 0,
							D = {
								w: M.width(),
								h: M.height()
							},
							I = {
								w: C.width(),
								h: C.height()
							}
							if (S.controls.init){
								CONTROLS = $('.'+S.controls.name).find('a');
							}
						}
					},
					_mouse: {
						get: function(e){
							var x = e.pageX,
								y = e.pageY; 
							return {'x': x, 'y': y}
						},
						update: function(e){
							var mouse = P._mouse.get(e),
								x = mouse.x,
								y = mouse.y,
								movex = x-mx,
								movey = y-my,
								top = ey+movey,
								left = ex+movex,
								check = P.map.position.check(left, top),
								css = {
									top: check.y,
									left: check.x
								}
							C.css(css);
							if (S.cookies){
								P.cookies.create('position', check.x + ',' + check.y, 7);
							}
						},
						decelerate: function(e){
							var l = mv.length, timer = 0;
							if (l){
								var tc = 20;
								interval = setInterval(function(){
									var	position = C.position(), left = position.left, top = position.top,
										remain = (tc-timer)/tc,
										last = l-1,
										xd = (mv[last].x-mv[0].x)/l,
										yd = (mv[last].y-mv[0].y)/l,
										vx = xd*remain,
										vy = yd*remain,
										coords = P.map.position.check(vx+left, vy+top),
										css = {
											left: coords.x,
											top: coords.y
										};
									C.css(css);	
									++timer;
									if (timer == tc){
										clearInterval(interval);
										timer = 0;
									}
								}, 40);	
							}
						},
						wheel: {
							init: function(e){
							
								M.handle = function(e){
									//e.preventDefault();
									if (!e) {
										e = window.event;
									}
									if (e.wheelDelta) {
										delta = e.wheelDelta/120;
										if (window.opera) {
											delta = -delta;
										}
									} else if (e.detail) {
										delta = -e.detail/3;
									}
								}
								if (window.addEventListener){
									window.addEventListener('DOMMouseScroll', M.handle, false);
								}	
								window.onmousewheel = document.onmousewheel = M.handle;
							},
							remove: function(){
								if (window.removeEventListener){
									window.removeEventListener('DOMMouseScroll', M.handle, false);
								}
								window.onmousewheel = document.onmousewheel = null;
							}
						}
					},
					fullscreen: {
						init: function(){
							var win = $(window), w = win.width(), h = (win.height() - S.footer.height),
								css = {
									width: w,
									height: h
								}
							M.css(css);
							/* wunderdojo */
							var specs = P.sizer();
							var ncss = {
								width: specs.width,
								height: specs.height
							}
							$('.'+S.container.name).css(ncss);
							$('.imgMap').css(ncss);
						},
						resize: function(){
							$(window).resize(function(){
								P.fullscreen.init();
								P.marker.update();
								D = {
									w: M.width(),
									h: M.height()
								}
							});
						}
					},
			
					preloader: {
						init: function(){
							var img = new Image(),
								src = IMG.attr('src');
							P.preloader.create();
							$(img).addClass(S.image.name).attr('src', src).load(function(){
								var t = $(this),
									css = {
										width: this.width,
										height: this.height
									}
								t.css(css);
								IMG.remove();
								P.preloader.remove();
								S.preloader.onLoad.call(this, t, css);
							}).appendTo(C);
						},
						create: function(){
							var css = {
								position: 'absolute', 
								zIndex: '10', 
								top: '0', 
								left: '0', 
								width: '100%', 
								height: '100%'
							}
							M.append($('<div />').addClass(S.preloader.name).css(css));
						},
						remove: function(){
							M.find('.'+S.preloader.name).fadeOut(400, function(){
								var t = $(this);
								t.remove();
							});
						}
					}, //end of preloader
					map: {
						init: function(){
							P.map.position.set();
							P.map.move();
						},
						position: {
							set: function(){
								if (S.cookies){
									if (typeof P.cookies.read('position') != 'null') {
										var position = P.cookies.read('position').split(','), 
											x = position[0], 
											y = position[1];
									} else {
										var x = (D.w-I.w)/2, 
											y = (D.h-I.h)/2;
									}
								} else {
									var position = S.map.position;
									switch (position){
										case 'center':
											var x = (D.w-I.w)/2,
												y = (D.h-I.h)/2;
											break;
										case 'top_left':
											var x = 0,
												y = 0;
											break;
										case 'top_right':
											var x = D.w-I.w,
												y = 0;
											break;
										case 'bottom_left':
											var x = 0,
												y = D.h-I.h;
											break;
										case 'bottom_right':
											var x = D.w-I.w,
												y = D.h-I.h;
											break;
										default:
											var coords = position.split(' '),
												x = -(coords[0]),
												y = -(coords[1]),
												coords = P.map.position.check(x, y),
												x = coords.x,
												y = coords.y;
									}	
								}
								var css = { top: y, left: x }
								C.css(css);
							},
							check: function(x, y){
								if (y < (D.h-I.h)){
									y = D.h-I.h;
								} else if (y > 0){
									y = 0;
								}
								
								if (x < (D.w-I.w)){
									x = D.w-I.w;
								} else if (x>0){
									x = 0;
								}
								return {'x': x, 'y': y}
							}
						},
						move: function(){
							
						}
					},
					_zoom: {
						init: function(e){}
					},
					marker: {
						init: function(){
							P.marker.set();
							P.marker.open();
							P.marker.close();
						},
						set: function(){
							MARKER.each(function(){
								var t = $(this), position = t.attr('data-coords').split(',');
									x = parseInt(position[0]), y = parseInt(position[1]);
									// wunderdojo scale plotted dimensions
									x = x * S.ratio;
									y = y * S.ratio;
									css = {
										position: 'absolute',
										top: y,
										left: x
									}
								t.css(css);
							}).wrapInner($('<div />').addClass(S.marker.name+'Content').hide());
						},
						update: function(){
						//get rid of prior markers
							MARKER.each(function(){
								var t = $(this), position = t.attr('data-coords').split(',');
									x = parseInt(position[0]), y = parseInt(position[1]);
									// wunderdojo scale plotted dimensions
									x = x * S.ratio;
									y = y * S.ratio;
									css = {
										position: 'absolute',
										top: y,
										left: x
									}
								t.css(css);
							});
						},
						open: function(){
							MARKER.on('click', function(){
								var t = $(this);
								var id = t.attr('id'), marker = S.marker, w = t.width(), h = t.height(),
									position = t.position(), x = position.left, y = position.top,
									html = t.find('.'+marker.name+'Content').html();
								
								if (marker.popup){
								/* wunderdojo edits */
								if(S.popups.target){
								$('#'+S.popups.target).hide().html(html).fadeIn(1000);
								}
								else{
									$('.'+marker.popup_name).remove();
									var css = {
										position:'absolute', 
										zIndex:'3'
									}
									t.after(
										$('<div />').addClass(marker.popup_name+' '+id).css(css).html(html).append(
											$('<a />').addClass('close')
										)
									);
								}	
									var POPUP = t.next('.'+marker.popup_name), 
										pw = POPUP.innerWidth(), 
										ph = POPUP.innerHeight(),
										x0 = 0, y0 = 0;
									
									if (x-pw < 0){
										x0 = x;
									} else if (x+pw/2 > I.w){
										x0 = x-pw+w;
									} else {
										x0 = x-(pw/2-w/2);
									}
									
									if (y-ph < 0){
										y0 = y+h+h/1.5;
									} else {
										y0 = y-ph-h/1.5;
									}
									
									if (x-pw < 0 && y-ph < 0){
										x0 = x+w*2;
										y0 = y-h/2;
									} else if (y-ph < 0 && x+pw/2 > I.w){
										x0 = x-pw-w/2;
										y0 = y-h/2;
									} else if (y+ph > I.h && x+pw/2 > I.w){
										x0 = x-pw+w;
										y0 = y-ph-h/2;
									} else if (y+ph > I.h && x-pw < 0){
										x0 = x;
										y0 = y-ph-h/2;
									}
									
									var	css = {
											left: x0,
											top: y0
										}
									POPUP.css(css);
								}
								P.controls.active.set(id);
								marker.onClick.call(this, t, POPUP); 
								return false;
							});
						},
						close: function(){
							C.find('.close').live('click', function(){
								var t = $(this), popup = t.parents('.'+S.marker.popup_name), marker = popup.prev('.'+S.marker.name);
								popup.remove();
								P.controls.active.remove();
								S.marker.onClose.call(this, marker, popup);
								return false;
							});
						}
					},
					controls: {
						init: function(){
							P.controls.set();
						},
						set: function(){
							CONTROLS.click(function(){
								var t = $(this), rel = t.attr('rel');
								div = C.find('.'+ S.marker.name).filter('#'+rel);
								div.trigger('click');
								S.controls.onClick.call(this, div);
								return false;
							});
						},
						active: {
							set: function(id){
								if (S.controls.init){
									CONTROLS.removeClass('active').filter(function(){
										return this.rel == id;
									}).addClass('active');
								}
							},
							remove: function(){
								if (S.controls.init) {
									CONTROLS.removeClass('active');
								}
							}
						}
					}
				}
			P.init();
        });
    };
}(jQuery));