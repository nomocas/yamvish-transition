/**  
 * @author Gilles Coomans <gilles.coomans@gmail.com> 
 *
 * yamvish transitions manager linked to container's (un)mounting mecanism (so only for dom output).
 * inspired from https://gist.github.com/ludder/4226288
 */
var y = require('yamvish');

// launch transitionIn on children
function childrenIn(sub) {
	if (sub.__yContainer__)
		sub.remount();
	else if (sub.transitionIn)
		sub.transitionIn();
}

// launch transitionOut on children
function childrenOut(sub) {
	return new Promise(function(resolve) {
		if (sub.__yContainer__)
			sub.unmount(true, function() {
				resolve(true);
			});
		else if (sub.transitionOut)
			sub.transitionOut(resolve);
		else
			resolve(true);
	});
}

// prepare container to manage children's transitions
function prepareContainer(container) {
	var timeout;
	container.transitionChildren = [];
	container.addWitness('transition');
	container.transitionIn = function(value) {
		this.closing = false;
		if (timeout)
			clearTimeout(timeout);
		timeout = null;
		this.transitionChildren.forEach(childrenIn);
	};
	container.transitionOut = function(done) {
		this.closing = true;
		if (timeout)
			clearTimeout(timeout);
		Promise.all(this.transitionChildren.map(childrenOut))
			.then(function() {
				if (!container.closing)
					return;
				container.closing = false;
				if (done) done(true);
			});
	};
	container.beforeUnmount(function(done) {
		this.transitionOut(done);
	});
	container.on('mounted', function() {
		if (timeout)
			clearTimeout(timeout);
		// wait a bit before launching animation just after mount (else sometimes it doesn't start)
		timeout = setTimeout(function() { container.transitionIn(); }, 15);
	});

	// for destruction
	container.binds = container.binds ||  [];
	container.binds.push(function() {
		container.transitionChildren = null;
	});
}

// prepare dom node to in and out animation
function prepareNode(el, args, opt) {
	if (!el)
		throw new Error('yamvish transition need dome node to apply animation !');
	var timeout;
	args.delay = args.delay || 5;
	args.delay = Math.max(args.delay, 5);
	if (opt.initStyles)
		opt.initStyles(el, opt, args);
	el.transitionIn = function(value) {
		el.closing = false;
		if (timeout)
			clearTimeout(timeout);
		timeout = setTimeout(function() {
			opt.open(el, value !== undefined ? value : args.max);
		}, args.delay);
	};
	el.transitionOut = function(done) {
		el.closing = true;
		if (timeout)
			clearTimeout(timeout);
		if (opt.close)
			timeout = opt.close(el, args.ms || 400, function() {
				el.closing = false;
				done(true);
			});
		else {
			el.closing = false;
			done(true);
		}
	};
}

// bind container mounting and transitions to parent's mounting mecanism
function bindTransitionToParent(container) {
	if (!container.transitionChildren)
		prepareContainer(container);
	if (container.parent) {
		if (!container.parent.transitionChildren)
			prepareContainer(container.parent);
		container.parent.transitionChildren.push(container);
	} else
		throw new Error('could not bind transition to parent container : no parent found');
	container.parentBinded = true;
}

// produce specific transition template handler
function transition(opt) {
	return function(args) {
		args = args || {};
		return this.dom(function(context, node, a, container) {
			if (!container.transitionChildren)
				prepareContainer(container);
			if (node.__yContainer__) {
				if (node === container) {
					if (!container.mounted)
						node.once('mount', function() {
							prepareNode(node.firstChild, args, opt);
							container.transitionChildren.push(node.firstChild);
						});
					else {
						prepareNode(node.firstChild, args, opt);
						container.transitionChildren.push(node.firstChild);
					}
				} else
					container.transitionChildren.push(node);
			} else {
				prepareNode(node, args, opt);
				container.transitionChildren.push(node);
			}
			if (container.mounted)
				node.transitionIn();
		});
	};
}

//___________________________________________________ transitions def

function initSlideStyles(el, opt, args) {
	// el.style.display = 'block';
	// el.style.overflow = 'hidden';
	el.style[opt.styleMax] = 0;
	el.style[opt.prop] = args.max;
	el.style.opacity = 0;
	el.style.transition = opt.transitionProp + ' ' + (args.ms ||  400) + 'ms ' + (args.ease || 'ease-in-out');
}

function initFadeStyles(el, opt, args) {
	// el.style.display = 'block';
	el.style.opacity = 0;
	el.style.transition = 'opacity ' + (args.ms ||  400) + 'ms ' + (args.ease || 'ease-in-out') + ' 0s';
}

module.exports = y.toAPI('transition', {
	/**
	 * bindTransitionToParent : bind current container transitions to parent container transition. 
	 * When parent is (un)mounted, current container will do the same.
	 * @return {[type]} [description]
	 */
	bindTransitionToParent: function() {
		return this.dom(function(context, node, args, container) {
			if (!container.parentBinded)
				bindTransitionToParent(container);
		});
	},
	// usage : template.use('transition:slide-up', { ms: 300, max: '100vh' })
	slideUp: transition({
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
	slideLeft: transition({
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
		initStyles: initFadeStyles
	}),
	// template.use('transition:fade-in', { ms: 300 })
	// no fade-out.
	fadeIn: transition({
		close: function(elem, ms, done) {
			elem.style.opacity = '0';
			if (done) done();
		},
		open: function(elem) {
			elem.style.opacity = '1';
		},
		initStyles: initFadeStyles
	})
});

y.Template.addAPI(module.exports);
