/**
 * Store — Observer Pattern (Behavioral)
 *
 * Problem: `state` was a plain mutable object. Every function that changed
 * data had to remember to manually call `renderFeed()` afterwards. Any new
 * flow that forgot to do so left the UI stale.
 *
 * Solution: Store is the Subject. It holds state and notifies all subscribed
 * Observers automatically on every setState call. The UI only needs to
 * subscribe once; after that, it always reflects the current state.
 */
export class Store {
    #state
    #listeners = []

    constructor(initialState) {
        this.#state = { ...initialState }
    }

    getState() {
        return { ...this.#state }
    }

    setState(updater) {
        this.#state = { ...this.#state, ...updater(this.#state) }
        this.#listeners.forEach((listener) => listener(this.#state))
    }

    subscribe(listener) {
        this.#listeners.push(listener)
        return () => {
            this.#listeners = this.#listeners.filter((l) => l !== listener)
        }
    }
}
