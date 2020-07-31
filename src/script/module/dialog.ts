import dialogPolyfill from "dialog-polyfill";

export const dialog = ({ target }) => {
  const selector = `#${target.dataset.dialog}`;
  const dialog = document.querySelector(selector) as HTMLDialogElement;
  dialogPolyfill.registerDialog(dialog);
  dialog.showModal();
  dialog.querySelector(".close").addEventListener(
    "click",
    () => {
      dialog.close();
    },
    false
  );
};
