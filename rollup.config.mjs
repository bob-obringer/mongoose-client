import { defineConfig } from 'rollup';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import { swc } from 'rollup-plugin-swc3';
import dts from 'rollup-plugin-dts';

// wild way to enable require for .mjs files
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { peerDependencies = {} } = require("./package.json");

export default [
  defineConfig({
    input: './src/index.ts',
    output: [
      {
        dir: 'dist',
        format: 'esm',
        chunkFileNames: 'index.esm.js',
        entryFileNames: 'index.esm.js',
        inlineDynamicImports: true
      }
    ],
    plugins: [
      swc({
        include: /\.[jt]sx?$/,
        exclude: /node_modules/,
        tsconfig: 'tsconfig.json',
        sourceMaps: true,
        minify: true,
        jsc: {
          parser: {
            syntax: "typescript",
          },
          externalHelpers: true,
          target: "es2021",
          minify: {
            compress: true,
            mangle: false
          },
          transform: {
            react: {
              useBuiltins: true,
              development: false,
              runtime: 'automatic'
            }
          }
        }
      }),
      resolve({
        mainFields: ['module', 'main'],
        browser: true,
        preferBuiltins: false
      }),
      commonjs({
        include: /\/node_modules\//
      })
    ],
    external: [...Object.keys(peerDependencies)]
  }),
  {
    input: './src/index.ts',
    output: [{ file: 'dist/index.d.ts',  format: 'es', inlineDynamicImports: true }],
    plugins: [dts({compilerOptions: {
      preserveSymlinks: false
    }})],
  }
];
