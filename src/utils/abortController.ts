export class SbolAbortController {
    private abortController: AbortController

    public init() {
        this.abortController = 'AbortController' in window
            ? new AbortController()
            : undefined
    }

    public abort() {
        if (this.abortController) {
            this.abortController.abort()
        }
    }

    public signal() {
        return this.abortController ? this.abortController.signal : undefined
    }
}