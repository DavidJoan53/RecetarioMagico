import '@testing-library/jest-dom/vitest'

/**
 * jsdom has no layout, so this is missing rather than inert — calling it
 * throws, and a throw inside an effect takes the whole tree down, which looks
 * like the component rendering nothing.
 */
Element.prototype.scrollIntoView = () => {}
