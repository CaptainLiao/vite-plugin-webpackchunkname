import { basename, extname } from 'path'
import { moduleImpoterMap } from './type.d'
import { normalizePath } from '@rollup/pluginutils'

const APP_ROOT_PATH = normalizePath(process.cwd())
export const appRootPathRE = new RegExp(APP_ROOT_PATH, 'i')
export const userJSFilePathRE = new RegExp(
  APP_ROOT_PATH + '/(?!node_modules).*\\.[tj]s$',
  'i'
)
export const CHUNK_NAME_TAG = 'chunkName'
export const chunkNameRE = /\?chunkName=([\w-.]*)/
export const bundleName = {
  main: 'common',
  vendor: 'vendor',
}

export const getFileName = (filePath: string) => {
  return basename(filePath, extname(filePath))
}

let __moduleDeps: moduleImpoterMap = null
export const moduleDeps = {
  get(id: string) {
    return __moduleDeps[id]
  },
  set(v: moduleImpoterMap) {
    __moduleDeps = v
  },
}

let __appDepMap: moduleImpoterMap = null
export const appModuleIdChunkNamesMap = {
  get(id: string) {
    return __appDepMap[id]
  },
  set(v: moduleImpoterMap) {
    __appDepMap = v
  },
}
