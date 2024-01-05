import type { GetModuleInfo } from 'rollup'
import {
  bundleName,
  chunkNameRE,
  appRootPathRE,
  moduleDeps,
  appModuleIdChunkNamesMap,
} from './share'

const cssLangs = `\\.(css|less|sass|scss|styl|stylus|pcss|postcss)($|\\?)`
const cssLangRE = new RegExp(cssLangs)
const isCSSRequest = (request: string): boolean => cssLangRE.test(request)

const __moduleInVenderMap = new Map<string, boolean>()

// rollup 把入口文件打包成index-[hash].js，名字 index.html 保持一致
// 此文件【不export】任何变量，所以即使部分内容发生变化，也能保证多数包能够被长效缓存
/**
 * 打包策略（靠前优先）：
 * 1. 从入口文件引入的三方包，打包成 vendor
 * 2. 路由带有 webpackChunkName 的，按给定的名称打包
 * 3. 文件有且只有一次引用，按 rollup 默认逻辑
 * 4. 文件多次引用
 *  4.1 如果是 node_modules 模块，按包名打包
 *  4.2 如果是用户模块按照 getAppModuleChunkName 中的逻辑打包
 */

export function manualChunksConfig(
  id: string,
  opts: { getModuleInfo: GetModuleInfo }
) {
  const { getModuleInfo } = opts
  const cacheIdMap = new Map<string, boolean>()
  const nodeModuleInfo = moduleDeps.get(id)
  const isNodeModules = !!nodeModuleInfo

  // vite 用的模块，譬如：__vite-browser-external，plugin-vue:export-helper 等
  const isInternalModule = !appRootPathRE.test(id)
  const isThirdPackageImportByEntry =
    isNodeModules &&
    !isCSSRequest(id) &&
    staticImportedByEntry(id, getModuleInfo, cacheIdMap)
  if (isThirdPackageImportByEntry || isInternalModule) {
    if (nodeModuleInfo && !__moduleInVenderMap.has(nodeModuleInfo.name)) {
      __moduleInVenderMap.set(nodeModuleInfo.name, true)
    }
    return bundleName.vendor
  }

  const matchedChunkName = chunkNameRE.exec(id)
  if (matchedChunkName) {
    return formatChunkName(matchedChunkName[1])
  }

  const { importers } = getModuleInfo(id)
  if (importers.length < 2) {
    return void 0
  }

  //importers 大于 1 就存在chunk之间的引用

  // 处理node_modules中的依赖
  if (nodeModuleInfo) {
    const rootModule = [...nodeModuleInfo.chunkNames]
    let chunkName = rootModule[0]
    if (rootModule.length >= 2) {
      chunkName = nodeModuleInfo.name
    }
    if (__moduleInVenderMap.has(chunkName)) {
      chunkName = bundleName.vendor
    }
    return chunkName || bundleName.main
  }

  const appModuleInfo = appModuleIdChunkNamesMap.get(id)
  if (appModuleInfo) {
    const chunkNames = [...appModuleInfo.chunkNames].filter(Boolean)
    const name = getAppModuleChunkName(chunkNames)
    return formatChunkName(name)
  }
}

function getAppModuleChunkName(chunkNames: string[]) {
  if (chunkNames.indexOf(bundleName.main) >= 0) {
    return bundleName.main
  }

  const names = chunkNames.filter((i: string) => i !== bundleName.main)
  switch (names.length) {
    case 1:
      return names[0]
    case 2:
      return assembleChunkName(names)
    default:
      return bundleName.main
  }
}

function assembleChunkName(names: string[]) {
  const [c1, c2] = names.sort((a, b) => (a > b ? 1 : a < b ? -1 : 0))
  return `shared/${c1}/${c2}`
}

function formatChunkName(name: string) {
  return name.replace(/\./g, '/')
}

function staticImportedByEntry(
  id: string,
  getModuleInfo: GetModuleInfo,
  cache: Map<string, boolean>,
  importStack: string[] = []
): boolean {
  if (cache.has(id)) {
    return cache.get(id) as boolean
  }
  if (importStack.includes(id)) {
    // circular deps!
    cache.set(id, false)
    return false
  }
  const mod = getModuleInfo(id)
  if (!mod) {
    cache.set(id, false)
    return false
  }

  if (mod.isEntry) {
    cache.set(id, true)
    return true
  }
  const someImporterIs = mod.importers.some((importer) =>
    staticImportedByEntry(
      importer,
      getModuleInfo,
      cache,
      importStack.concat(id)
    )
  )
  cache.set(id, someImporterIs)
  return someImporterIs
}
