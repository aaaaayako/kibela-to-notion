import { ReplacePaths, Tag, UploadImages, SetNotionImagesToRedis } from "./Bootstrap";
import { Config } from "./Config";
import { provideOptions } from "./Provider/MainProvider";

const { REPLACE_PATHS, REPLACE_COMMENT, CHECK_REPLACE_PATHS, TAG_NOTES, UPLOAD_IMAGES, SET_NOTION_IMAGES_FOR_REDIS } = Config.Mode;

(async () => {
  const mode = provideOptions();
  switch (mode) {
    case REPLACE_PATHS: {
      await ReplacePaths();
      break;
    }
    case CHECK_REPLACE_PATHS: {
      await ReplacePaths(true);
      break;
    }
    case REPLACE_COMMENT: {
      await ReplacePaths(false, true);
      break;
    }
    case TAG_NOTES: {
      await Tag();
      break;
    }
    case UPLOAD_IMAGES: {
      await UploadImages();
      break;
    }
    case SET_NOTION_IMAGES_FOR_REDIS: {
      await SetNotionImagesToRedis();
      break;
    }
    default:
      break;
  }
  process.exit();
})();
