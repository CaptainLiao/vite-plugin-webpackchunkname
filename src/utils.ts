import { GetManualChunk, ManualChunksOption } from 'rollup'
import { manualChunksConfig } from './manualChunksConfig'

/**
 * Call user defined functions that may be defined
 * at `build.rollupOptions.output` before calling
 * `manualChunksConfig`.
 */
export function getManualChunks(
  initialManualChunks: ManualChunksOption | undefined
): GetManualChunk {
  const userDefinedManualChunks =
    typeof initialManualChunks === 'function' ? initialManualChunks : undefined
  return (id: string, opts) => {
    if (userDefinedManualChunks) {
      const result = userDefinedManualChunks(id, opts)
      if (result) {
        return result
      }
    }
    return manualChunksConfig(id, opts)
  }
}
