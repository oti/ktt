import { showDialog } from "./module/showDialog";
import { more } from "./module/more";

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector(".next").addEventListener("click", more, false);
  Array.from(document.querySelectorAll(".thumb")).forEach((button) =>
    button.addEventListener("click", showDialog, false)
  );
});
