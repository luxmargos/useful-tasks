import debug from "debug";
import { TAG_DEBUG, TAG_INFO, TAG_WARN } from "./task_data";

export const logw = debug(TAG_WARN);
export const logi = debug(TAG_INFO);
export const logv = debug(TAG_DEBUG);