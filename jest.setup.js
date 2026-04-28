// Learn more: https://github.com/testing-library/jest-dom
// import '@testing-library/jest-dom'

const { TextEncoder, TextDecoder } = require('util')

if (!global.TextEncoder) {
  global.TextEncoder = TextEncoder
}

if (!global.TextDecoder) {
  global.TextDecoder = TextDecoder
}
