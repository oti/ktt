import { dialog } from "./module/dialog";
import { more } from "./module/more";

document.addEventListener("DOMContentLoaded", () => {
  const button = document.querySelector(".more");
  button && button.addEventListener("click", more, false);
  Array.from(document.querySelectorAll(".thumb")).forEach((button) =>
    button.addEventListener("click", dialog, false)
  );
});
