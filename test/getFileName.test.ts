import { getFileName } from '../src/share'

describe('getFileName.ts', () => {
  test('get file name', () => {
    expect(getFileName('/test/getFileName.test.ts')).toBe('getFileName.test')
  })
})
