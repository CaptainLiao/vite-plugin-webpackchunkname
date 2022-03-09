type IMPORTERS = string[] // 引用这个模块(key值)的所有模块名组成的数组

export type moduleImpoterMap = {
  [moduleId: string]: {
    name?: string
    chunkNames: Set<string>
  }
}
