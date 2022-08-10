import { getManualChunks } from '../src/utils'
import * as manualChunksConfig from '../src/manualChunksConfig'

const mockManualChunksConfig = jest.spyOn(
  manualChunksConfig,
  'manualChunksConfig'
)
mockManualChunksConfig.mockReturnValue('bar-yeah')

describe('getManualChunks', () => {
  test('function is called', () => {
    const userDefinedFunc = jest.fn()
    userDefinedFunc.mockReturnValue('foo-yeah')
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
