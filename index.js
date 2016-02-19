/**  
 * @author Gilles Coomans <gilles.coomans@gmail.com> 
 *
 * yamvish Container css3 transition manager.
 * inspired from https://gist.github.com/ludder/4226288
 */
var y = require('yamvish');

function cssTransition(opt) {
	return function(args) {
		var timeout;
		return this.once('mounted', function(context, container) {
				var el = container.firstChild;
				opt.initStyles(el, opt, args);
				container.transitionIn = function(value) {
					this.closing = false;
					if (timeout)
						clearTimeout(timeout);
					timeout = null;
					opt.open(el, value !== undefined ? value : args.max);
				};
				container.transitionOut = function(done) {
					this.closing = true;
					if (timeout)
						clearTimeout(timeout);
					timeout = opt.close(el, args.ms, function() {
						container.closing = false;
						done();
					});
				};
				container.beforeUnmount(function(done) {
					this.transitionOut(done);
				});
			})
			.on('mounted', function(context, container) {
				if (timeout)
					clearTimeout(timeout);
				// wait a bit before launching animation just after mount (else sometimes it doesn't start)
				timeout = setTimeout(function() { container.transitionIn(); }, 15);
			})
	}
};

function initSlideStyles(el, opt, args) {
	el.style.overflow = 'hidden';
	el.style[opt.styleMax] = 0;
	el.style[opt.prop] = args.max;
	el.style.display = 'block';
	el.style.opacity = 0;
	el.style.transition = opt.transitionProp + ' ' + (args.ms ||  400) + 'ms ' + (args.ease || 'ease-in-out');
}

y.toAPI('transition', {
	// template.use('transition:slide-up', { ms: 300, max: '100vh' })
	'slide-up': cssTransition({
		prop: 'height',
		transitionProp: 'max-height',
		styleMax: 'maxHeight',
		close: function(elem, ms, done) {
			elem.style.maxHeight = '0';
			return setTimeout(function() {
				elem.style.opacity = '0';
				if (done) done();
			}, ms);
		},
		open: function(elem, max) {
			elem.style.maxHeight = max;
			elem.style.opacity = '1';
		},
		initStyles: initSlideStyles
	}),
	// template.use('transition:slide-left', { ms: 300, max: '100vw' })
	'slide-left': cssTransition({
		prop: 'width',
		transitionProp: 'max-width',
		styleMax: 'maxWidth',
		close: function(elem, ms, done) {
			elem.style.maxWidth = '0';
			return setTimeout(function() {
				elem.style.opacity = '0';
				if (done) done();
			}, ms);
		},
		open: function(elem, max) {
			elem.style.maxWidth = max;
			elem.style.opacity = '1';
		},
		initStyles: initSlideStyles
	}),
	// template.use('transition:fade', { ms: 300 })
	fade: cssTransition({
		close: function(elem, ms, done) {
			elem.style.opacity = '0';
			return setTimeout(function() {
				elem.style.opacity = '0';
				if (done) done();
			}, ms);
		},
		open: function(elem) {
			elem.style.opacity = '1';
		},
		initStyles: function(el, opt, args) {
			el.style.display = 'block';
			el.style.opacity = 0;
			el.style.transition = 'opacity ' + (args.ms ||  400) + 'ms ' + (args.ease || 'ease-in-out') + ' 0s';
		}
	})
});
