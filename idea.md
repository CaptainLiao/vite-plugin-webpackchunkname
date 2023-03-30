## 背景

通过配置`rollup manualChunks`选项，实现`webpack`的`webpackChunkName`功能。

## 解决方案

在`rollup`中，为不同的模块指定相同的**chunkName**，就能将对应的内容编译到同一个包中。我们要做的就是，

首先在编译过程中，要转化`webpackChunkName`配置的名称到模块`id`中；

其次在编译结束时，要得到单个模块**被哪些模块引用**的信息；

最后在生成文件时，使用上述信息指定模块的`chunkName`。

### 转化路由中的 `webpackChunkName` 配置

这一步在插件`transform`方法中实现。例如路由文件内有如下内容：

```js
const routes = [
  {
    path: '/detail/somepage',
    component: () => import(/* webpackChunkName: "detail" */ '@/detail/somepage.vue'),
  },
]
```

经过插件转化后，得到：

```js
const routes = [
  {
    path: '/detail/somepage',
    component: () => import('@/detail/somepage.vue?chunkName=detail'),
  },
]
```

### 生成模块被引用信息

对于每个模块，要找到所有引用这个模块的模块名。即：

```
module/a -> module/b -> module/c
module/a -> module/d
```

显然，模块 a 被三个模块直接或间接依赖。最终我们可以得到如下数据：

```js
{
  "module/a": {chunkNames: ["c", "d"]},
  "module/b": {chunkNames: ["c"]},
  "module/c": {chunkNames: ["c"]},
  "module/d": {chunkNames: ["d"]},
}
```

_其中，`chunkNames`保存的值`c` 、`d`既为模块名字，也是最后生成文件的包名。_

想要长效缓存，对于`node_modules`和用户工作空间的代码，有不同的生成策略。具体可见`nodeModuleId2issuerMap`和`appModuleId2chunkNamesMap`函数。最后我们得到的数据如下：

```js
const nodeModuleId2issuerMap = {
  "E:/projects/hangban/webapp/node_modules/crypto-js/core.js": {chunkNames: ["crypto-js"]},
  "E:/projects/hangban/webapp/node_modules/crypto-js/enc-base64.js": {chunkNames: ["crypto-js"]},
  "E:/projects/hangban/webapp/node_modules/crypto-js/enc-base64url.js": {chunkNames: ["crypto-js"]},
  ......
  "E:/projects/hangban/webapp/node_modules/echarts/lib/chart/bar.js": {chunkNames: ["echarts"]},
  "E:/projects/hangban/webapp/node_modules/echarts/lib/chart/bar/BarView.js": {chunkNames: ["echarts"]},
  "E:/projects/hangban/webapp/node_modules/echarts/lib/chart/bar/helper.js": {chunkNames: ["echarts"]},
  ......
}
const appModuleId2chunkNamesMap = {
  "e:/projects/hangban/webapp/index.html": {chunkNames: ["main"]}
  "e:/projects/hangban/webapp/src/boot/uid.ts": {chunkNames: ["main"]},
  "e:/projects/hangban/webapp/src/projects/login/pages/bcm.vue?chunkName=login-bcm": {chunkNames: ["login-bcm"]},
  "e:/projects/hangban/webapp/src/projects/login/pages/nbcb.vue?chunkName=login-nbcb": {chunkNames: ["login-nbcb"]},
  "e:/projects/hangban/webapp/src/projects/login/pages/service.ts": {chunkNames: ["login-nbcb", "login-bcm"]},
  ......
}
```

### 文件生成 `manualChunksConfig.ts`

为了长效缓存、减少包之间的耦合，制定了如下文件包生成策略（靠前优先）：

1. 从入口文件引入的三方模块，打包成 vendor
2. 路由带有 webpackChunkName 的，按给定的名称打包
3. 文件有且只有一次引用（入口文件或动态引入），按 rollup 默认逻辑
4. 文件多次引用
   1. 如果是 node_modules 模块
      1. 若被单个包名引用，打入对应的包中
      2. 否则打入主包
   2. 如果是用户模块按照 getAppModuleChunkName 中的逻辑打包，即
      1. 如果被主包引用，打入主包
      2. 如果被单个包引用，打入对应的包中
      3. 如果被 2 个包引用，打入共享包中
      4. 其他情况，打入主包
