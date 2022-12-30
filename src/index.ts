import type { Plugin } from 'vite'
import type { GetModuleInfo, ManualChunksOption } from 'rollup'
import type { ResolverObject } from '@rollup/plugin-alias'

import { parse as parseImports } from 'es-module-lexer'
import MagicString from 'magic-string'
import alias from '@rollup/plugin-alias'
import { getManualChunks } from './utils'
import {
  bundleName,
  CHUNK_NAME_TAG,
  moduleDeps,
  chunkNameRE,
  appRootPathRE,
  userJSFilePathRE,
  appModuleIdChunkNamesMap,
  getFileName,
} from './share'
import { moduleImpoterMap } from './type.d'

const routeChunkNameRE = /(webpackC|c)hunkName:\s*["']([\w-/.]+)["']/
const nodeModuleRE = /node_modules\/((@[^/]+\/)?[^/]+)/g
const getNodeModulesName = (id: string) => {
  let name = ''
  let mached = null
  while ((mached = nodeModuleRE.exec(id))) {
    name = mached[1]
  }

  return name
}

// transform router content, eg:
// import(/* webpackChunkName: "detail" */ "@/detail/somepage.vue")
// trans to
// import("@/detail/somepage.vue?chunkName=detail")
// so we can get chunkName params in manuanlChunks
// also use chunkName: import(/* chunkName: "detail" */ "@/detail/somepage.vue")
export const manualChunksPlugin = function (): Plugin {
  const nodeModuleIdSets: Set<string> = new Set()
  const appModuleIdSets: Set<string> = new Set()
  let _resolveIdByAlias: ResolverObject

  return {
    name: 'manualNameChunksPlugin',
    apply: 'build',
    load(id) {
      if (id.includes('node_modules')) {
        nodeModuleIdSets.add(id)
      } else if (appRootPathRE.test(id)) {
        appModuleIdSets.add(id)
      }
      return null
    },

    buildEnd() {
      const appModuleIdMap = appModuleId2chunkNamesMap(
        appModuleIdSets,
        this.getModuleInfo
      )
      const nodeModuleIdMap = nodeModuleId2issuerMap(
        nodeModuleIdSets,
        this.getModuleInfo
      )
      moduleDeps.set(nodeModuleIdMap)
      appModuleIdChunkNamesMap.set(appModuleIdMap)
    },

    async transform(source, id) {
      const hasConfigRouteChunkName =
        userJSFilePathRE.test(id) && routeChunkNameRE.test(source)
      if (hasConfigRouteChunkName) {
        let str = new MagicString(source)
        const imports = parseImports(source)[0]
        for (let index = 0; index < imports.length; index++) {
          const {
            ss: sstart,
            se: send,
            s: start,
            e: end,
            n: rawValue,
          } = imports[index]
          const rawUrl = source.slice(sstart, send)
          const matched = routeChunkNameRE.exec(rawUrl)
          if (matched) {
            const chunkName = matched[2].replace(/\//g, '.')

            let resolvedId = rawValue
            if (_resolveIdByAlias) {
              const rid = await _resolveIdByAlias.resolveId.call(
                this,
                rawValue,
                id
              )
              if (rid) resolvedId = rid.id
            }
            const newContent = `"${resolvedId}?${CHUNK_NAME_TAG}=${chunkName}"`
            str = str.overwrite(start, end, newContent)
          }
        }
        return {
          code: str.toString(),
        }
      }
    },

    config(userConfig) {
      if (!userConfig.build) userConfig.build = {}
      if (!userConfig.build.rollupOptions) userConfig.build.rollupOptions = {}
      if (!userConfig.build.rollupOptions.output)
        userConfig.build.rollupOptions.output = {}

      const rollupOptions = userConfig.build.rollupOptions
      const output = rollupOptions.output
      if (Array.isArray(output)) {
        rollupOptions.output = output.map((item) => {
          item.manualChunks = getManualChunks(
            item.manualChunks as ManualChunksOption
          )
          return item
        })
      } else {
        Object.assign(userConfig.build.rollupOptions.output, {
          manualChunks: getManualChunks(
            output.manualChunks as ManualChunksOption
          ),
        })
      }

      const userAlias = userConfig.resolve && (userConfig.resolve.alias as any)
      if (userAlias)
        _resolveIdByAlias = alias({ entries: userAlias }) as ResolverObject
    },
  }
}

function appModuleId2chunkNamesMap(
  idSets: Set<string>,
  getModuleInfo: GetModuleInfo
) {
  const depMaps: moduleImpoterMap = {}
  for (const id of idSets) {
    if (depMaps[id]) continue

    const rootNames = getImportersChunkNames(id, getModuleInfo, depMaps)
    depMaps[id] = {
      chunkNames: rootNames,
    }
  }
  return depMaps
}

function getImportersChunkNames(
  id: string,
  getModuleInfo: GetModuleInfo,
  depMaps: moduleImpoterMap
): Set<string> {
  const ids = [id]
  const resSets = new Set<string>()
  for (const sid of ids) {
    const info = depMaps[sid]
    if (info) {
      info.chunkNames.forEach((item) => resSets.add(item))
    } else {
      const { isEntry, importers } = getModuleInfo(sid)
      if (isEntry) {
        resSets.add(bundleName.main)
      } else if (importers.length === 0) {
        const name = getDynamicModuleName(sid)
        depMaps[sid] = {
          chunkNames: new Set([name]),
        }
        resSets.add(name)
      } else {
        importers.forEach((item) => {
          if (ids.indexOf(item) === -1) {
            ids.push(item)
          }
        })
      }
    }
  }
  return resSets
}

const dynamicNameCache = new Map<string, number>()
function getDynamicModuleName(moduleId: string): string {
  const chunkNameRes = chunkNameRE.exec(moduleId)
  if (chunkNameRes) return chunkNameRes[1]

  const fileName = getFileName(moduleId)
  if (dynamicNameCache.has(fileName)) {
    const count = dynamicNameCache.get(fileName)
    dynamicNameCache.set(fileName, count + 1)
    return `${fileName}-${count}`
  }
  dynamicNameCache.set(fileName, 1)
  return fileName
}

function nodeModuleId2issuerMap(
  idSets: Set<string>,
  getModuleInfo: GetModuleInfo
) {
  // 获取每个id的祖先发起者
  const depMaps: moduleImpoterMap = {}
  for (const id of idSets) {
    if (!depMaps[id]) {
      const moduleName = getNodeModulesName(id)
      depMaps[id] = {
        chunkNames: new Set([moduleName]),
        name: moduleName,
      }
    }
    const { importedIds } = getModuleInfo(id)
    const depSets: Set<string> = new Set(importedIds)
    for (const importedId of depSets) {
      if (!depMaps[importedId]) {
        depMaps[importedId] = {
          chunkNames: new Set(),
          name: getNodeModulesName(importedId),
        }
      }
      ;[...depMaps[id].chunkNames].forEach((mid) =>
        depMaps[importedId].chunkNames.add(mid)
      )
      getModuleInfo(importedId).importedIds.forEach((mid: string) =>
        depSets.add(mid)
      )
    }
  }
  return depMaps
}
