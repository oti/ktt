import { showNext } from "./module/showNext";
import { showDialog } from "./module/showDialog";

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector(".next").addEventListener("click", showNext, false);
  Array.from(document.querySelectorAll(".thumb")).forEach((button) =>
    button.addEventListener("click", showDialog, false)
  );
});
