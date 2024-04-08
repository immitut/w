import { $ } from "./common.mjs";

$(".temp_cur").addEventListener("dblclick", showScreenInfo);
$(".version").addEventListener("dblclick", showDevInfo);

function showDevInfo() {
  const str = Object.keys(localStorage).reduce((res, key) => {
    const data = localStorage.getItem(key);
    res += `[${key}]: ${data},\n`;
    return res;
  }, "");
  _display(str);
}

function showScreenInfo() {
  const str = Object.keys(window).reduce((res, cur) => {
    if (["number"].includes(typeof window[cur])) {
      res += `[${cur}]: ${window[cur]},\n`;
    }
    return res;
  }, "");
  _display(str);
}

function _display(content) {
  alert(content);
}
