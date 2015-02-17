(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
        this.listeners[ev].forEach(function (_ref) {
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

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvY2hyaXMvV29ya3NwYWNlL3BsYXlncm91bmQvcGhsdXgvc3JjL3BobHV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7O0lDQWEsS0FBSyxXQUFMLEtBQUs7QUFDTCxXQURBLEtBQUs7MEJBQUwsS0FBSzs7QUFFZCxRQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQTtBQUN6QixRQUFJLENBQUMsb0JBQW9CLEdBQUcsS0FBSyxDQUFBO0FBQ2pDLFFBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFBO0FBQ25CLFFBQUksQ0FBQyxlQUFlLEdBQUcsQ0FBQyxDQUFBO0dBQ3pCOzt1QkFOVSxLQUFLO0FBUWhCLFlBQVE7YUFBQSxrQkFBQyxVQUFVLEVBQUM7O0FBQUUsWUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUE7QUFDaEQsWUFBSSxDQUFDLEVBQUUsR0FBRyxVQUFVLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxVQUFDLE1BQU0sRUFBRSxPQUFPO2lCQUFLLE1BQUssV0FBVyxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUM7U0FBQSxDQUFFLENBQUE7QUFDNUYsZUFBTyxJQUFJLENBQUE7T0FDWjs7OztBQUVELGFBQVM7YUFBQSxxQkFBRTtBQUFFLGVBQU8sSUFBSSxDQUFDLG9CQUFvQixLQUFLLElBQUksQ0FBQTtPQUFFOzs7O0FBQ3hELGFBQVM7YUFBQSxxQkFBRTtBQUFFLFlBQUksQ0FBQyxvQkFBb0IsR0FBRyxLQUFLLENBQUE7T0FBRTs7OztBQUNoRCxXQUFPO2FBQUEsbUJBQUU7QUFBRSxZQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFBO09BQUU7Ozs7QUFFN0MsZUFBVzthQUFBLHFCQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUM7QUFBRSxZQUFHLElBQUksQ0FBQyxTQUFTLEVBQUUsRUFBQztB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QUcsQ0FBZixRQUFRO0FBQ3BCLGNBQUcsS0FBSyxDQUFDLFNBQVMsRUFBRSxFQUFDO0FBQUUsa0JBQU0sS0FBSyxvREFBaUQsRUFBRSxRQUFJLENBQUE7V0FBRTs7QUFFM0YsY0FBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsRUFBRTtBQUNyQixrQkFBSyxNQUFNLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUE7V0FDNUM7U0FDRixDQUFDLENBQUE7T0FDSDs7Ozs7O1NBbEVVLFVBQVU7O0FBb0V2QixJQUFHLE9BQU8sTUFBTSxBQUFDLEtBQUssUUFBUSxFQUFDO0FBQUUsUUFBTSxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUE7Q0FBRSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJleHBvcnQgY2xhc3MgU3RvcmUge1xuICBjb25zdHJ1Y3Rvcigpe1xuICAgIHRoaXMuY3VycmVudEFjdGlvbiA9IG51bGxcbiAgICB0aGlzLmN1cnJlbnRBY3Rpb25IYW5kbGVkID0gZmFsc2VcbiAgICB0aGlzLmxpc3RlbmVycyA9IHt9XG4gICAgdGhpcy5jdXJyZW50TGlzdGVuSWQgPSAwXG4gIH1cblxuICByZWdpc3RlcihkaXNwYXRjaGVyKXsgdGhpcy5kaXNwYXRjaGVyID0gZGlzcGF0Y2hlclxuICAgIHRoaXMuaWQgPSBkaXNwYXRjaGVyLnJlZ2lzdGVyKHRoaXMsIChhY3Rpb24sIHBheWxvYWQpID0+IHRoaXMubWF0Y2hBY3Rpb24oYWN0aW9uLCBwYXlsb2FkKSApXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIGlzSGFuZGxlZCgpeyByZXR1cm4gdGhpcy5jdXJyZW50QWN0aW9uSGFuZGxlZCA9PT0gdHJ1ZSB9XG4gIHVuaGFuZGxlZCgpeyB0aGlzLmN1cnJlbnRBY3Rpb25IYW5kbGVkID0gZmFsc2UgfVxuICBoYW5kbGVkKCl7IHRoaXMuY3VycmVudEFjdGlvbkhhbmRsZWQgPSB0cnVlIH1cblxuICBtYXRjaEFjdGlvbihhY3Rpb24sIHBheWxvYWQpeyBpZih0aGlzLmlzSGFuZGxlZCgpKXsgcmV0dXJuIH1cbiAgICB0aGlzLmN1cnJlbnRBY3Rpb24gPSBhY3Rpb25cbiAgICBsZXQgZnVuYyA9IHRoaXNbXCJoYW5kbGVcIiArIGFjdGlvbi5yZXBsYWNlKC8oPzpefFs6XFwtX10pKFxcdykvZywgKGksIGMpID0+ICBjID8gYy50b1VwcGVyQ2FzZSAoKSA6IFwiXCIpXVxuICAgIGlmKGZ1bmMpeyBmdW5jLmJpbmQodGhpcykocGF5bG9hZCkgfVxuICAgIHRoaXMuY3VycmVudEFjdGlvbiA9IG51bGxcbiAgfVxuXG4gIGF3YWl0KHN0b3Jlcyl7IHRoaXMuZGlzcGF0Y2hlci5hd2FpdChzdG9yZXMubWFwKCBzID0+IHMuaWQgKSkgfVxuXG4gIGRpc3BhdGNoKGFjdGlvbiwgcGF5bG9hZCl7IHRoaXMuZGlzcGF0Y2hlci5kaXNwYXRjaChhY3Rpb24sIHBheWxvYWQpIH1cblxuICBpc1BlbmRpbmcoKXsgcmV0dXJuIHRoaXMuY3VycmVudEFjdGlvbiAhPT0gbnVsbCB9XG5cbiAgb24oZXYsIGNvbnRleHQsIGNhbGxiYWNrKXtcbiAgICBpZighY29udGV4dC5fX2xpc3RlbklkKXsgY29udGV4dC5fX2xpc3RlbklkID0gKHRoaXMuY3VycmVudExpc3RlbklkICs9IDEpLnRvU3RyaW5nKCkgfVxuICAgIGlmKCF0aGlzLmxpc3RlbmVyc1tldl0peyB0aGlzLmxpc3RlbmVyc1tldl0gPSBbXSB9XG4gICAgdGhpcy5saXN0ZW5lcnNbZXZdLnB1c2goe2NhbGxiYWNrOiBjYWxsYmFjaywgaWQ6IGNvbnRleHQuX19saXN0ZW5JZH0pXG4gIH1cbiAgb2ZmKGV2LCBjb250ZXh0KXtcbiAgICB0aGlzLmxpc3RlbmVyc1tldl0gPSB0aGlzLmxpc3RlbmVyc1tldl0uZmlsdGVyKCAoe2NiLCBpZH0pID0+IGlkICE9IGNvbnRleHQuX19saXN0ZW5JZCApXG4gIH1cbiAgZW1pdChldil7IHRoaXMubGlzdGVuZXJzW2V2XS5mb3JFYWNoKCAoe2NhbGxiYWNrLCBpZH0pID0+IGNhbGxiYWNrKCkgKSB9XG59XG5cbmV4cG9ydCBjbGFzcyBEaXNwYXRjaGVyIHtcblxuICBjb25zdHJ1Y3Rvcigpe1xuICAgIHRoaXMucmVnaXN0cmF0aW9ucyA9IHt9XG4gICAgdGhpcy5jdXJyZW50SWQgICAgID0gMFxuICAgIHRoaXMuZGlzcGF0Y2hpbmcgICA9IGZhbHNlXG4gICAgdGhpcy5kaXNwYXRjaEJ1ZmZlciA9IFtdXG4gICAgdGhpcy5jdXJyZW50QWN0aW9uID0ge3R5cGU6IG51bGwsIHBheWxvYWQ6IG51bGx9XG4gIH1cblxuICBuZXh0SWQoKXsgcmV0dXJuICh0aGlzLmN1cnJlbnRJZCArPSAxKS50b1N0cmluZygpIH1cblxuICBpc0Rpc3BhdGNoaW5nKCl7IHJldHVybiB0aGlzLmRpc3BhdGNoaW5nID09PSB0cnVlIH1cblxuICByZWdpc3RlcihzdG9yZSwgY2FsbGJhY2spe1xuICAgIGxldCBpZCA9IHRoaXMubmV4dElkKClcbiAgICB0aGlzLnJlZ2lzdHJhdGlvbnNbaWRdID0ge3N0b3JlLCBjYWxsYmFja31cblxuICAgIHJldHVybiBpZFxuICB9XG5cbiAgdW5yZWdpc3RlcihpZCl7XG4gICAgaWYodGhpcy5yZWdpc3RyYXRpb25zW2lkXSl7XG4gICAgICBkZWxldGUgdGhpcy5yZWdpc3RyYXRpb25zW2lkXVxuICAgICAgcmV0dXJuIHRydWVcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgRXJyb3IoYE5vIHJlZ2lzdHJhdGlvbiBmb3VuZCBmb3IgaWQgXCIke2lkfVwiYClcbiAgICB9XG4gIH1cblxuICBkaXNwYXRjaChhY3Rpb25UeXBlLCBwYXlsb2FkKXtcbiAgICBsZXQgYWN0aW9uID0ge3R5cGU6IGFjdGlvblR5cGUsIHBheWxvYWQ6IHBheWxvYWR9XG4gICAgaWYodGhpcy5pc0Rpc3BhdGNoaW5nKCkpeyByZXR1cm4gdGhpcy5kaXNwYXRjaEJ1ZmZlci5wdXNoKGFjdGlvbikgfVxuXG4gICAgdGhpcy5kaXNwYXRjaGluZyA9IHRydWVcbiAgICB0aGlzLmN1cnJlbnRBY3Rpb24gPSBhY3Rpb25cbiAgICB0cnkge1xuICAgICAgZm9yKGxldCBpZCBpbiB0aGlzLnJlZ2lzdHJhdGlvbnMpeyB0aGlzLnJlZ2lzdHJhdGlvbnNbaWRdLnN0b3JlLnVuaGFuZGxlZCgpIH1cbiAgICAgIGZvcihsZXQgaWQgaW4gdGhpcy5yZWdpc3RyYXRpb25zKXtcbiAgICAgICAgbGV0IHtzdG9yZSwgY2FsbGJhY2t9ID0gdGhpcy5yZWdpc3RyYXRpb25zW2lkXVxuICAgICAgICB0aGlzLmludm9rZShzdG9yZSwgY2FsbGJhY2ssIGFjdGlvblR5cGUsIHBheWxvYWQpXG4gICAgICB9XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHRoaXMuZGlzcGF0Y2hpbmcgPSBmYWxzZVxuICAgICAgbGV0IGFjdGlvbiA9IHRoaXMuZGlzcGF0Y2hCdWZmZXIucG9wKClcbiAgICAgIGlmKGFjdGlvbil7IHRoaXMuZGlzcGF0Y2goYWN0aW9uLnR5cGUsIGFjdGlvbi5wYXlsb2FkKSB9XG4gICAgfVxuICB9XG5cbiAgaW52b2tlKHN0b3JlLCBjYWxsYmFjaywgYWN0aW9uVHlwZSwgcGF5bG9hZCl7XG4gICAgY2FsbGJhY2soYWN0aW9uVHlwZSwgcGF5bG9hZClcbiAgICBzdG9yZS5oYW5kbGVkKClcbiAgfVxuXG4gIGF3YWl0KGlkcyl7XG4gICAgbGV0IHt0eXBlLCBwYXlsb2FkfSA9IHRoaXMuY3VycmVudEFjdGlvblxuICAgIGlkcy5mb3JFYWNoKCBpZCA9PiB7XG4gICAgICBsZXQgcmVnID0gdGhpcy5yZWdpc3RyYXRpb25zW2lkXVxuICAgICAgaWYoIXJlZyl7IHRocm93IEVycm9yKGBObyByZWdpc3RyYXRpb24gZm91bmQgZm9yIGlkIFwiJHtpZH1cImApIH1cbiAgICAgIGxldCB7c3RvcmUsIGNhbGxiYWNrfSA9IHJlZ1xuICAgICAgaWYoc3RvcmUuaXNQZW5kaW5nKCkpeyB0aHJvdyBFcnJvcihgY2lyY3VsYXIgZGVwZW5kZW5jeSBkZXRlY3RlZCB3aGlsZSBhd2FpdGluZyBcIiR7aWR9XCJgKSB9XG5cbiAgICAgIGlmKCFzdG9yZS5pc0hhbmRsZWQoKSkge1xuICAgICAgICB0aGlzLmludm9rZShzdG9yZSwgY2FsbGJhY2ssIHR5cGUsIHBheWxvYWQpXG4gICAgICB9XG4gICAgfSlcbiAgfVxufVxuaWYodHlwZW9mKHdpbmRvdykgPT09IFwib2JqZWN0XCIpeyB3aW5kb3cuUGhsdXggPSBleHBvcnRzIH1cbiJdfQ==
