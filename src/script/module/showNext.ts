// 次の template を表示する
export const showNext = ({ target }) => {
  // 対象の template を取得する。
  const $template = document.querySelector(".Past") as HTMLTemplateElement;

  // 表示する template があれば、さらにその次の template を表示するためのボタンを取得する。
  // ただし template はあってもボタンは存在しない場合がある。
  const $button =
    $template &&
    ($template.content.querySelector(".next") as HTMLButtonElement);

  // ボタンにイベントハンドラを設定する
  if ($button) $button.addEventListener("click", showNext, false);

  // template 要素を包含要素の末尾に挿入し、元の自分を削除する。
  $template.parentNode.insertBefore($template.content, $template);
  $template.parentNode.removeChild($template);

  // ボタンを隠す
  target.hidden = true;
};
