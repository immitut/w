import { $ } from "./common.mjs";

$(".temp_cur").addEventListener("dblclick", showScreenInfo);

function showScreenInfo() {
  const str = Object.keys(window).reduce((res, cur) => {
    if (["number"].includes(typeof window[cur])) {
      res += `${cur}: ${window[cur]},\n`;
    }
    return res;
  }, "");
  alert(str);
}
