import { getManualChunks } from '../src/index'
import * as manualChunksConfig from '../src/manualChunksConfig'

const mockManualChunksConfig = jest.spyOn(
  manualChunksConfig,
  'manualChunksConfig'
)
mockManualChunksConfig.mockReturnValue('some value')

describe('getManualChunks', () => {
  test('function is called', () => {
    const userDefinedFunc = jest.fn()
    const manualChunks = getManualChunks(userDefinedFunc)
    manualChunks('foo', {} as any)
    expect(userDefinedFunc).toBeCalled()
  })
  test('manualChunksConfig is called', () => {
    const manualChunks = getManualChunks(undefined)
    manualChunks('bar', {} as any)
    expect(mockManualChunksConfig).toBeCalled()
  })
})
