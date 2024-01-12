## Update
@1.0.0 for vite5.

@0.2.4 for vite4 or lower.

## Features

Use `webpackChunkName` config in vite project as well as `webpack` do.

**Not support third party packages**. [see vitejs #8824](https://github.com/vitejs/vite/pull/8824)

✨✨✨ Star the plugin if it useful for u.💖

## Install

Install the package from npm (or yarn, or pnpm).

```bash
npm install --save-dev vite-plugin-webpackchunkname
```

### *Basic usage*

Add it to `vite.config.ts`

```ts
// vite.config.ts
import { manualChunksPlugin } from 'vite-plugin-webpackchunkname'
// Other dependencies...

export default defineConfig({
  plugins: [
    manualChunksPlugin(),
  ]
})
```

then add `webpackChunkName` comments to the import:
````js
import(/* webpackChunkName: "detail" */ "@/detail/somepage.vue")
````

### *Use unplugin-vue-components*
must add `include` option. see(https://github.com/CaptainLiao/vite-plugin-webpackchunkname/issues/18) eg:
````js
import Components from 'unplugin-vue-components/vite';
...
  plugins: [
    Components({
      // other params
      include: [/\.vue$/, /\.vue\?/]
    }),
  ],
...
````

### *Support for user defined manual chunks*

Since this plugin extends and overrides the usage of `build.rollupOptions.output.manualChunks`.  The way to apply your own manual chunks must be done using the callback (rather than the string array) in a way similar to the example below:

```
 /* build.rollupOptions.output.manualChunks */
    manualChunks: (
      id: string
    ) => {
      if (id.indexOf("node_modules/lodash/") !== -1) {
        return "lodash";
      }
    },
```

## License

Copyright [CaptainLiao](https://github.com/CaptainLiao)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. 
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
