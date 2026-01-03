#!/usr/bin/env node
const fs = require("fs");
const mkdirp = require("mkdirp");
const postcss = require("postcss");
const sass = require("sass");

const { homepage, version } = require("./package.json");


// See if printing minified css
const mode = process.argv[2] || "readable";
const isMinified = mode === "min";

async function buildCSS() {
  const sassResult = sass.compile("src/index.scss", {
    style: isMinified ? "compressed" : "expanded",
    sourceMap: true,
    loadPaths: ["node_modules", "src"],
  }); 

  const banner = `/*! os9.css v${version} - ${homepage} */\n`;
  const cssWithBanner = banner + sassResult.css;

  // 2) PostCSS on compiled CSS
  const processor = postcss()
    .use(require("postcss-inline-svg"))
    .use(require("postcss-css-variables"))
    .use(require("postcss-calc"))
    .use(require("postcss-copy")({ dest: "build", template: "[name].[ext]" }))

  if (isMinified) {
    processor.use(require("cssnano"));
  }

  const result = await processor.process(cssWithBanner, {
      from: "src/index.scss",
      to: "build/os9.css",
      map: {
        inline: false,
        prev: sassResult.sourceMap, // <--  chain sourcemaps
      },
  });

  mkdirp.sync("build");
  fs.writeFileSync("build/os9.css", result.css);
  if (result.map) fs.writeFileSync("build/os9.css.map", result.map.toString());
}

function build() {
  buildCSS().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}

module.exports = build;
build();
