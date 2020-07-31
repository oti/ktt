export const showDialog = ({ target }) => {
  const selector = `#${target.dataset.dialog}`;
  const dialog = document.querySelector(selector) as HTMLDialogElement;
  dialog.showModal();
  dialog.querySelector(".close").addEventListener(
    "click",
    () => {
      dialog.close();
    },
    false
  );
};
