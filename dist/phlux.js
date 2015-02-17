(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define(factory);
	else if(typeof exports === 'object')
		exports["Phlux"] = factory();
	else
		root["Phlux"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

	var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

	var Store = exports.Store = (function () {
	  function Store() {
	    _classCallCheck(this, Store);

	    this.currentAction = null;
	    this.currentActionHandled = false;
	    this.listeners = {};
	    this.currentListenId = 0;
	  }

	  _prototypeProperties(Store, null, {
	    register: {
	      value: function register(dispatcher) {
	        var _this = this;
	        this.dispatcher = dispatcher;
	        this.id = dispatcher.register(this, function (action, payload) {
	          return _this.matchAction(action, payload);
	        });
	        return this;
	      },
	      writable: true,
	      configurable: true
	    },
	    isHandled: {
	      value: function isHandled() {
	        return this.currentActionHandled === true;
	      },
	      writable: true,
	      configurable: true
	    },
	    unhandled: {
	      value: function unhandled() {
	        this.currentActionHandled = false;
	      },
	      writable: true,
	      configurable: true
	    },
	    handled: {
	      value: function handled() {
	        this.currentActionHandled = true;
	      },
	      writable: true,
	      configurable: true
	    },
	    matchAction: {
	      value: function matchAction(action, payload) {
	        if (this.isHandled()) {
	          return;
	        }
	        this.currentAction = action;
	        var func = this["handle" + action.replace(/(?:^|[:\-_])(\w)/g, function (i, c) {
	          return c ? c.toUpperCase() : "";
	        })];
	        if (func) {
	          func.bind(this)(payload);
	        }
	        this.currentAction = null;
	      },
	      writable: true,
	      configurable: true
	    },
	    await: {
	      value: function await(stores) {
	        this.dispatcher.await(stores.map(function (s) {
	          return s.id;
	        }));
	      },
	      writable: true,
	      configurable: true
	    },
	    dispatch: {
	      value: function dispatch(action, payload) {
	        this.dispatcher.dispatch(action, payload);
	      },
	      writable: true,
	      configurable: true
	    },
	    isPending: {
	      value: function isPending() {
	        return this.currentAction !== null;
	      },
	      writable: true,
	      configurable: true
	    },
	    on: {
	      value: function on(ev, context, callback) {
	        if (!context.__listenId) {
	          context.__listenId = (this.currentListenId += 1).toString();
	        }
	        if (!this.listeners[ev]) {
	          this.listeners[ev] = [];
	        }
	        this.listeners[ev].push({ callback: callback, id: context.__listenId });
	      },
	      writable: true,
	      configurable: true
	    },
	    off: {
	      value: function off(ev, context) {
	        this.listeners[ev] = this.listeners[ev].filter(function (_ref) {
	          var cb = _ref.cb;
	          var id = _ref.id;
	          return id != context.__listenId;
	        });
	      },
	      writable: true,
	      configurable: true
	    },
	    emit: {
	      value: function emit(ev) {
	        (this.listeners[ev] || []).forEach(function (_ref) {
	          var callback = _ref.callback;
	          var id = _ref.id;
	          return callback();
	        });
	      },
	      writable: true,
	      configurable: true
	    }
	  });

	  return Store;
	})();
	var Dispatcher = exports.Dispatcher = (function () {
	  function Dispatcher() {
	    _classCallCheck(this, Dispatcher);

	    this.registrations = {};
	    this.currentId = 0;
	    this.dispatching = false;
	    this.dispatchBuffer = [];
	    this.currentAction = { type: null, payload: null };
	  }

	  _prototypeProperties(Dispatcher, null, {
	    nextId: {
	      value: function nextId() {
	        return (this.currentId += 1).toString();
	      },
	      writable: true,
	      configurable: true
	    },
	    isDispatching: {
	      value: function isDispatching() {
	        return this.dispatching === true;
	      },
	      writable: true,
	      configurable: true
	    },
	    register: {
	      value: function register(store, callback) {
	        var id = this.nextId();
	        this.registrations[id] = { store: store, callback: callback };

	        return id;
	      },
	      writable: true,
	      configurable: true
	    },
	    unregister: {
	      value: function unregister(id) {
	        if (this.registrations[id]) {
	          delete this.registrations[id];
	          return true;
	        } else {
	          throw Error("No registration found for id \"" + id + "\"");
	        }
	      },
	      writable: true,
	      configurable: true
	    },
	    dispatch: {
	      value: function dispatch(actionType, payload) {
	        var action = { type: actionType, payload: payload };
	        if (this.isDispatching()) {
	          return this.dispatchBuffer.push(action);
	        }

	        this.dispatching = true;
	        this.currentAction = action;
	        try {
	          for (var id in this.registrations) {
	            this.registrations[id].store.unhandled();
	          }
	          for (var id in this.registrations) {
	            var _registrations$id = this.registrations[id];
	            var store = _registrations$id.store;
	            var callback = _registrations$id.callback;
	            this.invoke(store, callback, actionType, payload);
	          }
	        } finally {
	          this.dispatching = false;
	          var _action = this.dispatchBuffer.pop();
	          if (_action) {
	            this.dispatch(_action.type, _action.payload);
	          }
	        }
	      },
	      writable: true,
	      configurable: true
	    },
	    invoke: {
	      value: function invoke(store, callback, actionType, payload) {
	        callback(actionType, payload);
	        store.handled();
	      },
	      writable: true,
	      configurable: true
	    },
	    await: {
	      value: function await(ids) {
	        var _this = this;
	        var _currentAction = this.currentAction;
	        var type = _currentAction.type;
	        var payload = _currentAction.payload;
	        ids.forEach(function (id) {
	          var reg = _this.registrations[id];
	          if (!reg) {
	            throw Error("No registration found for id \"" + id + "\"");
	          }
	          var store = reg.store;
	          var callback = reg.callback;
	          if (store.isPending()) {
	            throw Error("circular dependency detected while awaiting \"" + id + "\"");
	          }

	          if (!store.isHandled()) {
	            _this.invoke(store, callback, type, payload);
	          }
	        });
	      },
	      writable: true,
	      configurable: true
	    }
	  });

	  return Dispatcher;
	})();
	if (typeof window === "object") {
	  window.Phlux = exports;
	}
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

/***/ }
/******/ ])
});
