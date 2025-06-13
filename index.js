import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

export function compressFile(subFilePath) {
  const readStream = fs.createReadStream(subFilePath);
  const writeStream = fs.createWriteStream(`${subFilePath}.gz`);
  const gzip = zlib.createGzip();
  readStream.pipe(gzip).pipe(writeStream);
}

export default function compressFilePlugin(options) {
  let config;

  return {
    name: 'vite-plugin-compress-file',

    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },

    closeBundle(err) {
      if (err) {
        console.log(err);
        return;
      }

      let { root, outDir, exclude = ['.DS_Store', '.gitkeep'] } = options || {};
      root = root || config?.inlineConfig?.root || config?.root || process.cwd();
      outDir = config?.inlineConfig?.build.outDir || config?.build.outDir || 'dist';
      const distDir = path.resolve(root, outDir);

      function loopFindFile(parentPath) {
        if (!fs.existsSync(parentPath)) {
          return;
        }
        const parentStat = fs.statSync(parentPath);
        if (!parentStat.isDirectory()) {
          return;
        }

        for (let subFile of fs.readdirSync(parentPath)) {
          const subFilePath = path.resolve(parentPath, subFile);
          if (!fs.existsSync(subFilePath)) {
            continue;
          }
          const stat = fs.statSync(subFilePath);
          if (stat.isFile()) {
            if (exclude.includes(subFile)) {
              continue;
            }
            compressFile(subFilePath);
          } else if (stat.isDirectory()) {
            loopFindFile(subFilePath);
          }
        }
      }

      loopFindFile(distDir);
    },
  };
}
