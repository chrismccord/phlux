import {Dispatcher, Store} from "../../src/index"
import {assert} from "chai"


describe("Dispatcher", () => {

  it("handles registrations as Store callbacks with nested dispatches", () => {
    let dispatcher = new Dispatcher()
    var store1Called = false
    var store2Called = false
    var nestedDispatchCalled = 0
    var actionSequence = []

    class Store1 extends Store {
      matchAction(action, payload){
        actionSequence.push({action, name: "Store1"})
        super.matchAction(action, payload)
      }
      handleSomeAction(payload){ store1Called = true }
      handleSomeOtherAction(){ nestedDispatchCalled++ }
    }
    let store1 = (new Store1()).register(dispatcher)

    class Store2 extends Store {
      matchAction(action, payload){
        actionSequence.push({action, name: "Store2"})
        super.matchAction(action, payload)
      }
      handleSomeAction(payload){
        this.dispatch("some:other:action", {some: "payload"})
        store2Called = true
      }
      handleSomeOtherAction(){ nestedDispatchCalled++ }
    }
    let store2 = (new Store2()).register(dispatcher)

    dispatcher.dispatch("some:action", {some: "payload"})

    assert(store1Called)
    assert(store2Called)
    assert.equal(2, nestedDispatchCalled)

    assert.deepEqual(
     [{action: 'some:action', name: 'Store1'},
      {action: 'some:action', name: 'Store2'},
      {action: 'some:other:action', name: 'Store1'},
      {action: 'some:other:action', name: 'Store2'}], actionSequence)
  })

  it("awaits stores", () => {
    let dispatcher = new Dispatcher()
    var actionSequence = []
    class Store1 extends Store {
      handleNewMsg(payload){
        this.await([store2])
        actionSequence.push("store1")
      }
      handleTriggerNotFound(){ this.await([{}]) }
    }

    class Store2 extends Store {
      handleNewMsg(payload){
        actionSequence.push("store2")
      }
      handleTriggerCircular(payload){ this.await([store3]) }
    }

    class Store3 extends Store {
      handleNewMsg(payload){
        actionSequence.push("store3")
      }
      handleTriggerCircular(payload){ this.await([store2]) }
    }

    class Store4 extends Store {
      handleNewMsg(payload){
        this.await([store3])
        actionSequence.push("store4")
      }
    }
    let store1 = (new Store1).register(dispatcher)
    let store2 = (new Store2).register(dispatcher)

    dispatcher.dispatch("new:msg", {name: "Chris"})
    assert.deepEqual(["store2", "store1"], actionSequence)

    let store3 = (new Store3).register(dispatcher)
    let store4 = (new Store4).register(dispatcher)

    actionSequence = []
    dispatcher.dispatch("new:msg", {name: "Chris"})

    assert.deepEqual(["store2", "store1", "store3", "store4"], actionSequence)

    // ===============
    // errors
    // ===============

    assert.throw(() => {
      dispatcher.dispatch("trigger:circular", {})
    }, /circular dependency detected/)

    assert.throw(() => {
      dispatcher.dispatch("trigger-not-found", {})
    }, /No registration found/)

    assert(dispatcher.unregister(store1.id))
    assert.throw(() => {
      dispatcher.unregister(store1.id)
    }, /No registration found/)
  })
})
