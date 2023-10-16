import * as readline from "readline";
import { Config } from "~/Config";
import { MarkdownRepository, RedisRepository } from "~/Repository";

interface PathsReplacerResult {
  notesPath: string;
  totalAmount: number;
  successCount: number;
}

export class PathsReplacer {
  #successCount = 0;
  #result: PathsReplacerResult = {
    notesPath: this.markdownRepo.getNotesPath(),
    totalAmount: 0,
    successCount: 0,
  };
  constructor(
    private markdownRepo: MarkdownRepository,
    private redisRepo: RedisRepository
  ) {}
  async run(isOnlyCheckDuplicate: boolean = false) {
    // マークダウンの読み込み
    const allNotesPath = this.markdownRepo.getAllNotes();
    this.#result.totalAmount = allNotesPath.length;

    let duplicateFileNames = [];

    for (const paths of allNotesPath) {
      const { name, fullPath } = paths;

      let duplicateFlg = false;

      console.log({ name, fullPath });
      const readStream = this.markdownRepo.createReadFileStream({
        path: fullPath,
        encoding: Config.Markdown.ENCODING,
      });
      const writeStream = this.markdownRepo.createWriteFileStream({
        path: name,
        encoding: Config.Markdown.ENCODING,
      });

      const rl = readline.createInterface({
        input: readStream,
        output: writeStream,
      });

      const REGEXP_SRC = /..\/attachments\/([0-9]+)\.([a-zA-Z0-9]+)/;
      const REGEXP_LINK = /!\[(.*?)\]\((.*?)\)/;

      const foundAndReplace= async(line: string) => {
        console.log('found')
        const foundSRC = line.match(REGEXP_SRC);
        const foundLink = line.match(REGEXP_LINK);
        if (foundSRC) {
          const [src, fileName, mineType] = foundSRC;
          const fileURL = await this.redisRepo.getKey(
            `${fileName}.${mineType}`
          );
          console.log({ name, paths, line, src, fileName, fileURL });
          if (!fileURL) {
            throw new Error(
              `${fileName}.${mineType} is not found on local Redis db: #0`
            );
          }
          line = line.replace(src, fileURL);
        }
        if (foundLink) {
          line = line.slice(1);
          console.log({ line, foundLink });
        }
      }

      for await (let line of rl) {
        if (isOnlyCheckDuplicate) {
          let iteration = 0;
          while (line.match(REGEXP_SRC)) {
            line = line.replace(REGEXP_SRC, 'replaced');
            iteration++;
            if (!duplicateFlg && iteration === 2) {
              duplicateFileNames.push(name);
              duplicateFlg = true
            }
          }
        } else {
          while (line.match(REGEXP_SRC)) {
            const foundSRC = line.match(REGEXP_SRC);
            if (foundSRC) {
              const [src, fileName, mineType] = foundSRC;
              const fileURL = await this.redisRepo.getKey(
                `${fileName}.${mineType}`
              );
              console.log({ name, paths, line, src, fileName, fileURL });
              if (!fileURL) {
                throw new Error(
                  `${fileName}.${mineType} is not found on local Redis db: #0`
                );
              }
              line = line.replace(src, fileURL);
            }
          }
          const foundLink = line.match(REGEXP_LINK);
          if (foundLink) {
            line = line.slice(1);
            console.log({ line, foundLink });
          }
          writeStream.write(`${line}\n`);
        }
      }
      writeStream.end();
      this.#successCount++;
    }
    this.#result.successCount = this.#successCount;
    console.log({ successCount: this.#successCount });
    if (isOnlyCheckDuplicate) {
      console.log({ duplicateFileNames });
    }
    return this.#result;
  }
}
