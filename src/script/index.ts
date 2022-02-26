import { more } from "./module/more";

document.addEventListener("DOMContentLoaded", () => {
  const $button = document.querySelector(".more") as HTMLButtonElement;
  $button && $button.addEventListener("click", more, false);
});
