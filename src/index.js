export class Store {
  constructor(){
    this.currentAction = null
    this.currentActionHandled = false
  }

  register(dispatcher){ this.dispatcher = dispatcher
    this.id = dispatcher.register(this, (action, payload) => this.matchAction(action, payload) )
    return this
  }

  isHandled(){ return this.currentActionHandled === true }
  unhandled(){ this.currentActionHandled = false }
  handled(){ this.currentActionHandled = true }

  matchAction(action, payload){ if(this.isHandled()){ return }
    this.currentAction = action
    let func = this["handle" + action.replace(/(?:^|[:\-_])(\w)/g, (i, c) =>  c ? c.toUpperCase () : "")]
    if(func){ func.bind(this)(payload) }
    this.currentAction = null
  }

  await(stores){ this.dispatcher.await(stores.map( s => s.id )) }

  dispatch(action, payload){ this.dispatcher.dispatch(action, payload) }

  isPending(){ return this.currentAction !== null }

  listen(callback){ listeners.push(callback) }
}

export class Dispatcher {

  constructor(){
    this.registrations = {}
    this.currentId     = 0
    this.dispatching   = false
    this.dispatchBuffer = []
    this.currentAction = {type: null, payload: null}
  }

  nextId(){ return (this.currentId += 1).toString() }

  isDispatching(){ return this.dispatching === true }

  register(store, callback){
    let id = this.nextId()
    this.registrations[id] = {store, callback}

    return id
  }

  unregister(id){
    if(this.registrations[id]){
      delete this.registrations[id]
      return true
    } else {
      throw Error(`No registration found for id "${id}"`)
    }
  }

  dispatch(actionType, payload){
    let action = {type: actionType, payload: payload}
    if(this.isDispatching()){ return this.dispatchBuffer.push(action) }

    this.dispatching = true
    this.currentAction = action
    try {
      for(let id in this.registrations){ this.registrations[id].store.unhandled() }
      for(let id in this.registrations){
        let {store, callback} = this.registrations[id]
        this.invoke(store, callback, actionType, payload)
      }
    } finally {
      this.dispatching = false
      let action = this.dispatchBuffer.pop()
      if(action){ this.dispatch(action.type, action.payload) }
    }
  }

  invoke(store, callback, actionType, payload){
    callback(actionType, payload)
    store.handled()
  }

  await(ids){
    let {type, payload} = this.currentAction
    ids.forEach( id => {
      let reg = this.registrations[id]
      if(!reg){ throw Error(`No registration found for id "${id}"`) }
      let {store, callback} = reg
      if(store.isPending()){ throw Error(`circular dependency detected while awaiting "${id}"`) }

      if(!store.isHandled()) {
        this.invoke(store, callback, type, payload)
      }
    })
  }
}
