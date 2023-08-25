import IORedis from "ioredis";
import { Config } from "~/Config"
import { NotionRepository, RedisRepository } from "~/Repository"

const { SHOW_FRIENDLY_ERROR_STACK, NO_DELAY, DB } = Config.Redis;
const { KEY, PAGE, IMAGE_PROP_ID } = Config.Notion

type PagesItems = {
    object: string;
    type: string;
    id: string;
    files: [
        {
            name: string;
            type: string;
            file: {
                url: string;
                expiryTime: string;
            }
        }
    ]
}

export const SetNotionImagesToRedis = async() => {
    const notionRepo = new NotionRepository(KEY)
    const propertyItems = await notionRepo.getPagePropertyItems(PAGE, IMAGE_PROP_ID) as PagesItems

    const redis = new IORedis({
        showFriendlyErrorStack: SHOW_FRIENDLY_ERROR_STACK,
        noDelay: NO_DELAY,
        db: DB.IMAGE,
    })

    if (propertyItems?.files?.length > 0) {
        for (let index = 0; index < propertyItems.files.length; index++) {
            await redis.set(propertyItems.files[index].name, `"${propertyItems.files[index].file.url}"`)
        }
    }
}