/**  
 * @author Gilles Coomans <gilles.coomans@gmail.com> 
 *
 * yamvish Container css3 transition manager.
 * inspired from https://gist.github.com/ludder/4226288
 */
var y = require('yamvish');

function slideDown(elem, maxHeight) {
	elem.style.maxHeight = maxHeight;
	elem.style.opacity = '1';
}

function slideUp(elem, ms, done) {
	elem.style.maxHeight = '0';
	return setTimeout(function() {
		elem.style.opacity = '0';
		if (done)
			done();
	}, ms);
}
//___________________________________________

function slideRight(elem, max) {
	elem.style.maxWidth = max;
	elem.style.opacity = '1';
}

function slideLeft(elem, ms, done) {
	elem.style.maxWidth = '0';
	return setTimeout(function() {
		elem.style.opacity = '0';
		if (done)
			done();
	}, ms);
}
//___________________________________________

function fadeIn(elem) {
	elem.style.opacity = '1';
}

function fadeOut(elem, ms, done) {
	elem.style.opacity = '0';
	return setTimeout(function() {
		elem.style.opacity = '0';
		if (done)
			done();
	}, ms);
}

//___________________________________________

function cssTransition(opt) {
	return function(args) {
		args = y.utils.copy(args);
		args.ms = args.ms || 400;
		args.ease = args.ease || 'ease-in-out';
		args.timeout = null;
		return this.once('mounted', function(container) {
				var el = container.firstChild;
				opt.initStyles(el, opt, args);
				container.transitionIn = function(value) {
					this.closing = false;
					if (args.timeout)
						clearTimeout(args.timeout);
					opt.open(el, value !== undefined ? value : args.max);
				};
				container.transitionOut = function(done) {
					this.closing = true;
					if (args.timeout)
						clearTimeout(args.timeout);
					args.timeout = opt.close(el, args.ms, function() {
						container.closing = false;
						done();
					});
				};
			})
			.on('mounted', function(container) {
				if (args.timeout)
					clearTimeout(args.timeout);
				args.timeout = setTimeout(function() { container.transitionIn(); }, 15);
			})
			.dom(function(context, container) {
				container.beforeUnmount(function(done) {
					container.transitionOut(done);
				});
			});
	}
};

function initSlideStyles(el, opt, args) {
	el.style.overflow = 'hidden';
	el.style[opt.styleMax] = 0;
	el.style[opt.prop] = args.max;
	el.style.display = 'block';
	el.style.opacity = 0;
	el.style.transition = opt.transitionProp + ' ' + args.ms + 'ms ' + args.ease;
}

y.toAPI('transition', {
	//	template.use('transition:slideUp', { ms: 300, max: '100vh' })
	slideUp: cssTransition({
		prop: 'height',
		transitionProp: 'max-height',
		styleMax: 'maxHeight',
		close: slideUp,
		open: slideDown,
		initStyles: initSlideStyles
	}),
	//	template.use('transition:slideLeft', { ms: 300, max: '100vw' })
	slideLeft: cssTransition({
		prop: 'width',
		transitionProp: 'max-width',
		styleMax: 'maxWidth',
		close: slideLeft,
		open: slideRight,
		initStyles: initSlideStyles
	}),
	// template.use('transition:fade', { ms: 300 })
	fade: cssTransition({
		close: fadeOut,
		open: fadeIn,
		initStyles: function(el, opt, args) {
			el.style.display = 'block';
			el.style.opacity = 0;
			el.style.transition = 'opacity ' + args.ms + 'ms ' + args.ease + ' 0s';
		}
	})
});
