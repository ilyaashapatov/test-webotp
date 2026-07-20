import Bowser from "bowser"

export const bowserInstance = Bowser.getParser(window.navigator.userAgent)
