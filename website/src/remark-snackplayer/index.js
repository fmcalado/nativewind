/* eslint-disable -- disable all rules */
/**
 * Sections of the source code are licensed under the MIT license found in the
 * LICENSE file in the directory of this source tree. Copyright (c) Facebook, Inc. and its affiliates.
 */

"use strict";
const visit = require("unist-util-visit-parents");
const u = require("unist-builder");
const dedent = require("dedent");

const parseParams = (paramString = "") => {
  const params = Object.fromEntries(new URLSearchParams(paramString));

  if (!params.platform) {
    params.platform = "web";
  }

  return params;
};

const processNode = (node, parent) => {
  return new Promise(async (resolve, reject) => {
    try {
      const params = parseParams(node.meta);

      // Gather necessary Params
      const name = params.name ? decodeURIComponent(params.name) : "Example";
      const description = params.description
        ? decodeURIComponent(params.description)
        : "Example usage";
      const sampleCode = node.value;
      const code = `import React from 'react';
import withExpoSnack from 'nativewind/expo-snack';

${sampleCode}

// This demo is using a external compiler that will only work in Expo Snacks.
// You may see flashes of unstyled content, this will not occur under normal use!
// Please see the documentation to setup your application
export default withExpoSnack(App);
`;

      const platform = params.platform || "web";
      const supportedPlatforms = params.supportedPlatforms || "ios,android,web";
      const theme = params.theme || "light";
      const preview = params.preview || "true";
      const loading = params.loading || "lazy";
      const dependencies =
        params.dependencies || "react,react-native,nativewind@latest";

      const files = {
        "App.tsx": {
          type: "CODE",
          contents: code,
        },
        "demo-use-only.tsx": {
          type: "CODE",
          contents: `
`,
        },
      };

      // Generate Node for SnackPlayer
      // See https://github.com/expo/snack/blob/main/docs/embedding-snacks.md
      // data-snack-code="${encodedSampleCode}"
      const snackPlayerDiv = u("html", {
        value: dedent`
          <div
            class="snack-player"
            data-snack-name="${name}"
            data-snack-description="${description}"
            data-snack-dependencies="${dependencies}"
            data-snack-platform="${platform}"
            data-snack-supported-platforms="${supportedPlatforms}"
            data-snack-theme="${theme}"
            data-snack-preview="${preview}"
            data-snack-loading="${loading}"
            data-snack-files="${encodeURIComponent(JSON.stringify(files))}"
          ></div>
          `,
      });

      // Replace code block with SnackPlayer Node
      const index = parent[0].children.indexOf(node);
      parent[0].children.splice(index, 1, snackPlayerDiv);
    } catch (e) {
      return reject(e);
    }
    resolve();
  });
};

const SnackPlayer = () => {
  return (tree) =>
    new Promise(async (resolve, reject) => {
      const nodesToProcess = [];
      // Parse all CodeBlocks
      visit(tree, "code", (node, parent) => {
        // Add SnackPlayer CodeBlocks to processing queue
        if (node.lang == "SnackPlayer") {
          nodesToProcess.push(processNode(node, parent));
        }
      });

      // Wait for all promises to be resolved
      Promise.all(nodesToProcess).then(resolve()).catch(reject());
    });
};

module.exports = SnackPlayer;