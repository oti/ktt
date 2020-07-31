import { showNext } from "./module/showNext";

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector(".next").addEventListener("click", showNext, false);
});
