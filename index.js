/**  
 * @author Gilles Coomans <gilles.coomans@gmail.com> 
 *
 * yamvish transitions manager linked to container mount and unmount mecanism (so only for dom output).
 * inspired from https://gist.github.com/ludder/4226288
 */
var y = require('yamvish');

function transition(opt) {
	return function(args) {
		args = args || {};
		args.delay = args.delay || 15;
		args.delay = Math.max(args.delay, 15);
		var timeout;
		return this.once('mounted', function(context, container) {
				var el = container.firstChild;
				if (opt.initStyles)
					opt.initStyles(el, opt, args);
				if (args.bindToParent)
					if (container.parent) {
						container.addWitness('subtransitioned child');
						container.parent._subtransitioned = container.parent._subtransitioned || [];
						container.parent._subtransitioned.push(container);
					} else
						throw new Error('could not bind transition to parent container : no parent found');
				container.transitionIn = function(value) {
					this.closing = false;
					if (timeout)
						clearTimeout(timeout);
					timeout = null;
					opt.open(el, value !== undefined ? value : args.max);
					if (this._subtransitioned) {
						this._subtransitioned.forEach(function(sub) {
							sub.remount();
						});
					}
				};
				if (opt.close) {
					container.transitionOut = function(done) {
						this.closing = true;
						if (timeout)
							clearTimeout(timeout);
						var promises = [],
							resolver;
						promises.push(new Promise(function(resolve) {
							resolver = resolve;
						}));
						timeout = opt.close(el, args.ms || 400, function() {
							resolver(true);
						});
						if (this._subtransitioned)
							this._subtransitioned.forEach(function(sub) {
								var p = new Promise(function(resolve) {
									sub.unmount(true, function() {
										resolve(true);
									});
								});
								promises.push(p);
							});
						Promise.all(promises).then(function() {
							if (!container.closing)
								return;
							container.closing = false;
							done();
						});
					};
					container.beforeUnmount(function(done) {
						this.transitionOut(done);
					});
				}
			})
			.on('mounted', function(context, container) {
				if (timeout)
					clearTimeout(timeout);
				// wait a bit before launching animation just after mount (else sometimes it doesn't start)
				timeout = setTimeout(function() { container.transitionIn(); }, args.delay);
			});
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
	// usage : template.use('transition:slide-up', { ms: 300, max: '100vh' })
	'slide-up': transition({
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
	'slide-left': transition({
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
	fade: transition({
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
	}),
	// template.use('transition:fade-in', { ms: 300 })
	// no fade-out.
	'fade-in': transition({
		open: function(elem) {
			elem.style.opacity = '1';
		},
		initStyles: function(el, opt, args) {
			el.style.display = 'block';
			el.style.opacity = 0;
			el.style.transition = 'opacity ' + (args.ms ||  400) + 'ms ' + (args.ease || 'ease-in-out') + ' 0s';
		}
	}),
	// template.use('transition:cut')
	// useful for cascading transition management.
	cut: transition({
		open: function(elem) {},
		close: function(elem, ms, done) {
			return setTimeout(function() {
				if (done) done();
			}, ms);
		}
	})
});
